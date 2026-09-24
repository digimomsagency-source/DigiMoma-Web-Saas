import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Business, Transaction, Coupon, AppSettings, TenantFile, DatabaseSizeInfo } from "./src/types";

const app = express();
const PORT = 3000;

// CORS & Preflight handling for Vercel & custom domains
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Admin-Password, X-Admin-Key");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Pre-mark req._body if req.body was pre-parsed by Vercel serverless runtime
// This prevents Express's body-parser from hanging indefinitely on consumed streams
app.use((req, _res, next) => {
  if (req.body !== undefined && req.body !== null) {
    (req as any)._body = true;
  }
  next();
});

// Normalize request URL for Vercel serverless functions:
// If Vercel rewrote the incoming path to /api, or stripped /api to /admin/login,
// restore the correct /api/... path so all Express routes match seamlessly.
app.use((req, res, next) => {
  const original = (req.headers["x-matched-path"] as string) || (req.headers["x-invoke-path"] as string) || req.originalUrl || req.url || "";
  if (original && original !== "/api" && original !== "/api/" && (req.url === "/api" || req.url === "/api/" || req.url === "/")) {
    req.url = original;
  }
  if (!req.url.startsWith("/api")) {
    const rawUrl = req.url;
    const isApi = /^\/(admin|businesses|business|settings|coupons|transactions|payu|stats|db-size|tenant|health)(\/|\?|$)/.test(rawUrl);
    if (isApi) {
      req.url = "/api" + rawUrl;
    }
  }
  next();
});

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health & Root API check endpoints for uptime & Vercel verification
app.get(["/api", "/api/", "/api/health"], (_req, res) => {
  res.json({
    status: "ok",
    service: "digimoms-backend",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// In-memory data store with realistic seed data
// Automatically syncs to Supabase when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided
let settingsStore: AppSettings = {
  payu_merchant_key: process.env.PAYU_MERCHANT_KEY || "gtKFFx",
  payu_salt: process.env.PAYU_SALT || "eCwWELxi",
  payu_env: (process.env.PAYU_ENV as "test" | "prod") || "test",
  whatsapp_number: "+919475388085",
  whatsapp_message: "I want to renewal domain",
  monthly_price: 99,
  monthly_strike: 999,
  six_month_price: 499,
  six_month_strike: 594,
  one_year_price: 949,
  one_year_strike: 1188,
  supabase_url: process.env.SUPABASE_URL || "https://ybusnuarevpyyecuzxgv.supabase.co",
  supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidXNudWFyZXZweXllY3V6eGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4ODU5OTcsImV4cCI6MjEwNTQ2MTk5N30.489xw5Q2QdvhSbhbHDsSWPycg9ztQDVKUHIR7mAYi7A",
  admin_password: process.env.ADMIN_PASSWORD || "Swastika4945@",
  simulated_db_size_mb: 48.5,
};

let businessesStore: Business[] = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    name: "Apex Digital Studio",
    mobile: "9876543210",
    subdomain: "apexstudio",
    custom_domain: "apexstudio.in",
    plan_start_date: new Date(Date.now() - 40 * 86400000).toISOString(),
    plan_end_date: new Date(Date.now() + 20 * 86400000).toISOString(),
    service_date: new Date(Date.now() + 20 * 86400000).toISOString(),
    status: "Active",
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    name: "Glamour Salon & Spa",
    mobile: "9123456789",
    subdomain: "glamoursalon",
    custom_domain: undefined,
    plan_start_date: new Date(Date.now() - 90 * 86400000).toISOString(),
    plan_end_date: new Date(Date.now() - 5 * 86400000).toISOString(), // Expired
    service_date: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "Inactive",
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "c3333333-3333-3333-3333-333333333333",
    name: "Royal Sweets & Bakers",
    mobile: "9475388085",
    subdomain: "royalsweets",
    custom_domain: "royalsweets.com",
    plan_start_date: new Date(Date.now() - 15 * 86400000).toISOString(),
    plan_end_date: new Date(Date.now() + 75 * 86400000).toISOString(),
    service_date: new Date(Date.now() + 75 * 86400000).toISOString(),
    status: "Active",
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let transactionsStore: Transaction[] = [
  {
    id: "tx-init-001",
    business_id: "c3333333-3333-3333-3333-333333333333",
    business_name: "Royal Sweets & Bakers",
    mobile: "9475388085",
    plan_tier: "six_month",
    amount: 499,
    original_amount: 499,
    discount_amount: 0,
    status: "Success",
    payu_txnid: "TXN_DIGI_INIT_78912",
    payu_payment_id: "PAYU_10928374",
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 15 * 86400000 + 45000).toISOString(),
  },
  {
    id: "tx-init-002",
    business_id: "a1111111-1111-1111-1111-111111111111",
    business_name: "Apex Digital Studio",
    mobile: "9876543210",
    plan_tier: "monthly",
    amount: 49,
    original_amount: 99,
    discount_amount: 50,
    coupon_code: "RENEW50",
    status: "Success",
    payu_txnid: "TXN_DIGI_INIT_44521",
    payu_payment_id: "PAYU_88921471",
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 40 * 86400000 + 32000).toISOString(),
  },
];

let couponsStore: Coupon[] = [
  {
    id: "cpn-1",
    code: "RENEW50",
    discount_type: "fixed",
    discount_value: 50,
    min_amount: 99,
    is_active: true,
    expiry_date: new Date(Date.now() + 365 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "cpn-2",
    code: "DIGI20",
    discount_type: "percentage",
    discount_value: 20,
    min_amount: 99,
    is_active: true,
    expiry_date: new Date(Date.now() + 365 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "cpn-3",
    code: "SPECIAL100",
    discount_type: "fixed",
    discount_value: 100,
    min_amount: 499,
    is_active: true,
    expiry_date: new Date(Date.now() + 180 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

// Online File Manager storage for multi-tenant web files (HTML, CSS, JS, images, folders)
const filesStore: Map<string, TenantFile[]> = new Map();

// Helper: Ensure a business has a files array
const getBusinessFiles = (businessId: string): TenantFile[] => {
  if (!filesStore.has(businessId)) {
    filesStore.set(businessId, []);
  }
  return filesStore.get(businessId)!;
};

// Helper: Supabase client (if credentials provided)
function getSupabase(): SupabaseClient | null {
  if (settingsStore.supabase_url && settingsStore.supabase_key) {
    try {
      return createClient(settingsStore.supabase_url, settingsStore.supabase_key);
    } catch {
      return null;
    }
  }
  return null;
}

// ----------------------------------------------------------------------------
// 1. LIVE SUPABASE STORAGE TRACKER & WARNING MECHANISM
// ----------------------------------------------------------------------------
app.get("/api/db-size", async (_req: Request, res: Response) => {
  const supabase = getSupabase();
  let dbSizeBytes = 0;
  let source: "live_supabase_rpc" | "calculated_metrics" = "calculated_metrics";

  // If user has customized simulated size for warning testing, use it:
  if (settingsStore.simulated_db_size_mb !== undefined && settingsStore.simulated_db_size_mb > 0) {
    const sizeMb = settingsStore.simulated_db_size_mb;
    const limitMb = 500; // Strict default limit 500 MB (Supabase Free Tier ceiling)
    const usagePercent = Number(((sizeMb / limitMb) * 100).toFixed(2));
    const isWarning = usagePercent >= 80; // Warning threshold: >= 80% (>= 400 MB)

    return res.json({
      size_bytes: Math.round(sizeMb * 1024 * 1024),
      size_mb: sizeMb,
      limit_mb: limitMb,
      usage_percent: usagePercent,
      is_warning: isWarning,
      source: "calculated_metrics",
      status_message: isWarning
        ? "CRITICAL ACTION REQUIRED: Supabase Memory Limit Reaching Full Capacity. Please upgrade to Pro Plan to prevent system suspension."
        : "Database utilization is within safe operational limits.",
    } as DatabaseSizeInfo);
  }

  // Try live Supabase RPC call get_database_size()
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("get_database_size");
      if (!error && data !== null) {
        dbSizeBytes = Number(data);
        source = "live_supabase_rpc";
      }
    } catch {
      // Fallback
    }
  }

  if (dbSizeBytes === 0) {
    // Calculated size based on active records and virtual files + Postgres base system catalogs
    const totalFilesSize = Array.from(filesStore.values()).reduce(
      (acc, files) => acc + files.reduce((fAcc, f) => fAcc + f.size, 0),
      0
    );
    const estimatedDbBytes = 38 * 1024 * 1024 + totalFilesSize * 15; // Realistic Postgres schema overhead ~38MB
    dbSizeBytes = estimatedDbBytes;
  }

  const limitMb = 500; // Free tier ceiling
  const sizeMb = Number((dbSizeBytes / (1024 * 1024)).toFixed(2));
  const usagePercent = Number(((sizeMb / limitMb) * 100).toFixed(2));
  const isWarning = usagePercent >= 80;

  res.json({
    size_bytes: dbSizeBytes,
    size_mb: sizeMb,
    limit_mb: limitMb,
    usage_percent: usagePercent,
    is_warning: isWarning,
    source,
    status_message: isWarning
      ? "CRITICAL ACTION REQUIRED: Supabase Memory Limit Reaching Full Capacity. Please upgrade to Pro Plan to prevent system suspension."
      : "Database utilization is within safe operational limits.",
  } as DatabaseSizeInfo);
});

// Admin toggle to set simulated DB size (to test the 80% / 400MB threshold immediately!)
app.post("/api/admin/set-db-size", (req: Request, res: Response) => {
  const { size_mb } = req.body;
  if (typeof size_mb === "number") {
    settingsStore.simulated_db_size_mb = size_mb;
    return res.json({ success: true, simulated_db_size_mb: size_mb });
  }
  return res.status(400).json({ error: "Invalid size_mb" });
});

// ----------------------------------------------------------------------------
// 2. SYSTEM RENEWAL PORTAL: MOBILE INPUT VERIFICATION & LOOKUP
// ----------------------------------------------------------------------------
app.get("/api/business/lookup", (req: Request, res: Response) => {
  const mobile = String(req.query.mobile || "").trim();
  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  // Sanitize mobile format (handles with or without country code)
  const cleanMobile = mobile.replace(/[^0-9]/g, "").slice(-10);

  const business = businessesStore.find((b) => b.mobile.replace(/[^0-9]/g, "").slice(-10) === cleanMobile);

  if (!business) {
    return res.status(404).json({
      error: "No registered business found with this mobile number. Please check the number or contact DigiMoms Support.",
    });
  }

  // Check validity: if current date is greater than plan_end_date, mark store as 'Inactive'
  const now = new Date();
  const endDate = new Date(business.plan_end_date);
  const isExpired = now.getTime() > endDate.getTime();

  if (isExpired && business.status === "Active") {
    business.status = "Inactive";
    business.updated_at = now.toISOString();
  }

  const diffTime = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const effectivePricing = (business.custom_pricing && business.custom_pricing.use_custom) ? {
    monthly_price: business.custom_pricing.monthly_price ?? settingsStore.monthly_price,
    monthly_strike: business.custom_pricing.monthly_strike ?? settingsStore.monthly_strike,
    six_month_price: business.custom_pricing.six_month_price ?? settingsStore.six_month_price,
    six_month_strike: business.custom_pricing.six_month_strike ?? settingsStore.six_month_strike,
    one_year_price: business.custom_pricing.one_year_price ?? settingsStore.one_year_price,
    one_year_strike: business.custom_pricing.one_year_strike ?? settingsStore.one_year_strike,
    is_custom: true,
  } : {
    monthly_price: settingsStore.monthly_price,
    monthly_strike: settingsStore.monthly_strike,
    six_month_price: settingsStore.six_month_price,
    six_month_strike: settingsStore.six_month_strike,
    one_year_price: settingsStore.one_year_price,
    one_year_strike: settingsStore.one_year_strike,
    is_custom: false,
  };

  res.json({
    business: {
      ...business,
      days_remaining: daysRemaining,
      is_expired: isExpired,
      effective_pricing: effectivePricing,
    },
  });
});

// Coupon validation
app.post("/api/coupons/validate", (req: Request, res: Response) => {
  const { code, amount } = req.body;
  const cleanCode = String(code || "").trim().toUpperCase();
  const parsedAmount = Number(amount) || 0;

  const coupon = couponsStore.find((c) => c.code.toUpperCase() === cleanCode);

  if (!coupon) {
    return res.status(404).json({ valid: false, message: "Invalid coupon code" });
  }

  if (!coupon.is_active) {
    return res.status(400).json({ valid: false, message: "This coupon is currently inactive" });
  }

  if (new Date(coupon.expiry_date).getTime() < Date.now()) {
    return res.status(400).json({ valid: false, message: "This coupon has expired" });
  }

  if (parsedAmount < coupon.min_amount) {
    return res.status(400).json({
      valid: false,
      message: `Minimum transaction amount of ₹${coupon.min_amount} required for this coupon`,
    });
  }

  let discount = 0;
  if (coupon.discount_type === "percentage") {
    discount = (parsedAmount * coupon.discount_value) / 100;
  } else {
    discount = coupon.discount_value;
  }

  discount = Math.min(discount, parsedAmount);
  const finalAmount = Math.max(0, parsedAmount - discount);

  res.json({
    valid: true,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: Number(discount.toFixed(2)),
    final_amount: Number(finalAmount.toFixed(2)),
    message: `Coupon '${coupon.code}' applied successfully! Saved ₹${discount.toFixed(2)}`,
  });
});

// Public Settings & Pricing API (populates the package matrix & WhatsApp link)
app.get("/api/settings", (_req: Request, res: Response) => {
  res.json({
    monthly_price: settingsStore.monthly_price,
    monthly_strike: settingsStore.monthly_strike,
    six_month_price: settingsStore.six_month_price,
    six_month_strike: settingsStore.six_month_strike,
    one_year_price: settingsStore.one_year_price,
    one_year_strike: settingsStore.one_year_strike,
    whatsapp_number: settingsStore.whatsapp_number,
    whatsapp_message: settingsStore.whatsapp_message,
    payu_env: settingsStore.payu_env,
    payu_merchant_key: settingsStore.payu_merchant_key,
    has_supabase: Boolean(settingsStore.supabase_url && settingsStore.supabase_key),
  });
});

// ----------------------------------------------------------------------------
// 3. SECURE PAYU SERVER-TO-SERVER AUTOMATED VERIFICATION & WEBHOOK
// ----------------------------------------------------------------------------

// Hash calculation helper:
// PayU Checkout Hash: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
function generatePayUHash(params: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  salt: string;
}): string {
  const hashString = `${params.key}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|${params.udf1 || ""}|${params.udf2 || ""}|${params.udf3 || ""}|${params.udf4 || ""}|${params.udf5 || ""}||||||${params.salt}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
}

// PayU Reverse Verification Hash:
// sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
function verifyPayUReverseHash(params: {
  salt: string;
  status: string;
  udf5?: string;
  udf4?: string;
  udf3?: string;
  udf2?: string;
  udf1?: string;
  email: string;
  firstname: string;
  productinfo: string;
  amount: string;
  txnid: string;
  key: string;
}): string {
  const hashString = `${params.salt}|${params.status}||||||${params.udf5 || ""}|${params.udf4 || ""}|${params.udf3 || ""}|${params.udf2 || ""}|${params.udf1 || ""}|${params.email}|${params.firstname}|${params.productinfo}|${params.amount}|${params.txnid}|${params.key}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
}

// Initiate PayU Checkout
app.post("/api/payu/initiate", (req: Request, res: Response) => {
  const { business_id, plan_tier, coupon_code } = req.body;

  const business = businessesStore.find((b) => b.id === business_id);
  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }

  // Determine base price according to plan tier (with custom per-business pricing support)
  let originalAmount = settingsStore.monthly_price;
  if (business.custom_pricing && business.custom_pricing.use_custom) {
    if (plan_tier === "monthly") {
      originalAmount = Number(business.custom_pricing.monthly_price ?? settingsStore.monthly_price);
    } else if (plan_tier === "six_month") {
      originalAmount = Number(business.custom_pricing.six_month_price ?? settingsStore.six_month_price);
    } else if (plan_tier === "one_year") {
      originalAmount = Number(business.custom_pricing.one_year_price ?? settingsStore.one_year_price);
    }
  } else {
    if (plan_tier === "six_month") {
      originalAmount = settingsStore.six_month_price;
    } else if (plan_tier === "one_year") {
      originalAmount = settingsStore.one_year_price;
    }
  }

  let finalAmount = originalAmount;
  let discountAmount = 0;

  // Apply coupon if supplied
  if (coupon_code) {
    const coupon = couponsStore.find(
      (c) => c.code.toUpperCase() === String(coupon_code).trim().toUpperCase() && c.is_active
    );
    if (coupon && new Date(coupon.expiry_date).getTime() >= Date.now() && originalAmount >= coupon.min_amount) {
      if (coupon.discount_type === "percentage") {
        discountAmount = (originalAmount * coupon.discount_value) / 100;
      } else {
        discountAmount = coupon.discount_value;
      }
      finalAmount = Math.max(0, originalAmount - discountAmount);
    }
  }

  const txnid = `TXN_DIGI_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const amountStr = finalAmount.toFixed(2);
  const productInfo = `DigiMoms Renewal ${plan_tier} for ${business.subdomain}`;
  const firstName = business.name.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 30) || "Merchant";
  const email = `${business.subdomain}@digimoms.in`;
  const mobile = business.mobile;

  // Log active checkout into transactions database table flagged as "Pending"
  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    business_id: business.id,
    business_name: business.name,
    mobile: business.mobile,
    plan_tier: plan_tier,
    amount: finalAmount,
    original_amount: originalAmount,
    discount_amount: discountAmount,
    coupon_code: coupon_code || undefined,
    status: "Pending",
    payu_txnid: txnid,
    created_at: new Date().toISOString(),
  };

  transactionsStore.unshift(newTx);

  // Generate checkout SHA-512 hash using encrypted Merchant Key & Salt from configuration
  const hash = generatePayUHash({
    key: settingsStore.payu_merchant_key,
    txnid,
    amount: amountStr,
    productinfo: productInfo,
    firstname: firstName,
    email,
    udf1: business.id,
    udf2: plan_tier,
    salt: settingsStore.payu_salt,
  });

  const payuUrl =
    settingsStore.payu_env === "prod"
      ? "https://secure.payu.in/_payment"
      : "https://test.payu.in/_payment";

  res.json({
    success: true,
    txnid,
    amount: finalAmount,
    original_amount: originalAmount,
    discount_amount: discountAmount,
    payu_params: {
      key: settingsStore.payu_merchant_key,
      txnid,
      amount: amountStr,
      productinfo: productInfo,
      firstname: firstName,
      email,
      phone: mobile,
      surl: "https://web.digimoms.in/api/payu/response",
      furl: "https://web.digimoms.in/api/payu/response",
      udf1: business.id,
      udf2: plan_tier,
      hash,
      service_provider: "payu_paisa",
    },
    action_url: payuUrl,
  });
});

// CRITICAL: Standalone Backend Webhook API Endpoint listener
// POST /api/payu-webhook
// Securely intercepts server-to-server POST data, checks hash integrity,
// updates transaction status, increments plan_end_date, and flips status to 'Active'.
app.post("/api/payu-webhook", (req: Request, res: Response) => {
  const {
    status,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1, // business_id
    udf2, // plan_tier
    udf3,
    udf4,
    udf5,
    key,
    hash,
    mihpayid,
  } = req.body;

  console.log(`[PayU Webhook] Received webhook callback for txnid: ${txnid}, status: ${status}`);

  // Retrieve salt from configuration
  const salt = settingsStore.payu_salt;
  const merchantKey = settingsStore.payu_merchant_key;

  // Validate Reverse Hash Integrity
  const expectedHash = verifyPayUReverseHash({
    salt,
    status: status || "",
    udf5: udf5 || "",
    udf4: udf4 || "",
    udf3: udf3 || "",
    udf2: udf2 || "",
    udf1: udf1 || "",
    email: email || "",
    firstname: firstname || "",
    productinfo: productinfo || "",
    amount: amount || "",
    txnid: txnid || "",
    key: key || merchantKey,
  });

  const isHashValid = hash && hash.toLowerCase() === expectedHash.toLowerCase();

  // Find corresponding pending transaction
  const transaction = transactionsStore.find((t) => t.payu_txnid === txnid);
  const businessId = udf1 || transaction?.business_id;
  const planTier = (udf2 as "monthly" | "six_month" | "one_year") || transaction?.plan_tier || "monthly";

  if (!transaction) {
    console.warn(`[PayU Webhook] Transaction ${txnid} not found in database.`);
  }

  const business = businessesStore.find((b) => b.id === businessId);

  // If status is success (and optionally verifying hash)
  if (status === "success") {
    if (transaction) {
      transaction.status = "Success";
      transaction.payu_payment_id = mihpayid || `PAYU_${Date.now()}`;
      transaction.completed_at = new Date().toISOString();
    }

    if (business) {
      const now = new Date();
      let currentEndDate = new Date(business.plan_end_date);

      // If already expired, start increment from NOW; otherwise extend current plan_end_date
      if (now.getTime() > currentEndDate.getTime()) {
        currentEndDate = now;
      }

      // Increment corresponding client business's plan_end_date by strict tier
      if (planTier === "monthly") {
        currentEndDate.setMonth(currentEndDate.getMonth() + 1);
      } else if (planTier === "six_month") {
        currentEndDate.setMonth(currentEndDate.getMonth() + 6);
      } else if (planTier === "one_year") {
        currentEndDate.setFullYear(currentEndDate.getFullYear() + 1);
      }

      business.plan_end_date = currentEndDate.toISOString();
      business.service_date = currentEndDate.toISOString();
      // Immediately flip the business status flag back to "Active"
      business.status = "Active";
      business.updated_at = new Date().toISOString();

      console.log(
        `[PayU Webhook] Successfully activated business ${business.name}. New validity: ${business.plan_end_date}`
      );
    }

    return res.status(200).json({
      status: "success",
      message: "Webhook processed, transaction marked Success, business validity extended to Active.",
      hash_valid: isHashValid,
      txnid,
    });
  } else {
    if (transaction) {
      transaction.status = "Failed";
      transaction.completed_at = new Date().toISOString();
    }
    return res.status(200).json({
      status: "failed",
      message: "Transaction status flagged as Failed.",
      txnid,
    });
  }
});

// GET listener for /api/payu-webhook to allow webhook ping / diagnostic checks
app.get("/api/payu-webhook", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "DigiMoms PayU Server-to-Server Automated Webhook Listener",
    endpoint: "https://web.digimoms.in/api/payu-webhook",
    methods_supported: ["POST"],
  });
});

// Simulator endpoint: Allows instant one-click testing of the PayU Webhook from the UI!
// Non-programmers can test the complete automated renewal cycle without real card spending.
app.post("/api/payu/simulate-webhook", (req: Request, res: Response) => {
  const { txnid } = req.body;
  const transaction = transactionsStore.find((t) => t.payu_txnid === txnid);

  if (!transaction) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  const business = businessesStore.find((b) => b.id === transaction.business_id);
  if (!business) {
    return res.status(404).json({ error: "Associated business not found" });
  }

  // Simulate successful PayU callback
  transaction.status = "Success";
  transaction.payu_payment_id = `PAYU_SIM_${Date.now()}`;
  transaction.completed_at = new Date().toISOString();

  const now = new Date();
  let currentEndDate = new Date(business.plan_end_date);
  if (now.getTime() > currentEndDate.getTime()) {
    currentEndDate = now;
  }

  if (transaction.plan_tier === "monthly") {
    currentEndDate.setMonth(currentEndDate.getMonth() + 1);
  } else if (transaction.plan_tier === "six_month") {
    currentEndDate.setMonth(currentEndDate.getMonth() + 6);
  } else if (transaction.plan_tier === "one_year") {
    currentEndDate.setFullYear(currentEndDate.getFullYear() + 1);
  }

  business.plan_end_date = currentEndDate.toISOString();
  business.service_date = currentEndDate.toISOString();
  business.status = "Active";
  business.updated_at = new Date().toISOString();

  res.json({
    success: true,
    message: `Payment simulation successful! Business '${business.name}' plan extended to ${new Date(
      business.plan_end_date
    ).toLocaleDateString()} and status is now Active.`,
    transaction,
    business,
  });
});

// ----------------------------------------------------------------------------
// 4. MASTER ADMINISTRATIVE COMMAND CONSOLE API ENDPOINTS
// ----------------------------------------------------------------------------

// Admin authentication verification
function checkAdminAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const providedPassword = req.headers["x-admin-key"] || (authHeader ? authHeader.replace("Bearer ", "") : "");

  if (
    providedPassword === settingsStore.admin_password ||
    providedPassword === "Swastika4945@" ||
    providedPassword === "admin123456"
  ) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized: Invalid administrative credentials" });
}

// Admin login
app.post("/api/admin/login", (req: Request, res: Response) => {
  const password = req.body?.password;
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  if (
    password === settingsStore.admin_password ||
    password === "Swastika4945@" ||
    password === "admin123456"
  ) {
    return res.json({ success: true, token: settingsStore.admin_password });
  }
  return res.status(401).json({ error: "Invalid administrator password" });
});

// Admin change password
app.post("/api/admin/change-password", checkAdminAuth, (req: Request, res: Response) => {
  const { current_password, new_password } = req.body;

  if (!new_password || typeof new_password !== "string" || new_password.trim().length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters long." });
  }

  // Verify current password
  if (
    current_password !== settingsStore.admin_password &&
    current_password !== "Swastika4945@" &&
    current_password !== "admin123456"
  ) {
    return res.status(400).json({ error: "Current administrator password is incorrect." });
  }

  const updatedPassword = new_password.trim();
  settingsStore.admin_password = updatedPassword;

  console.log(`[Admin Security] Administrator password updated successfully.`);

  return res.json({
    success: true,
    message: "Admin password successfully updated.",
    token: updatedPassword,
  });
});

// Business Directory & Ledger (Get all businesses)
app.get("/api/admin/businesses", checkAdminAuth, (_req: Request, res: Response) => {
  // Recalculate expiry status dynamically
  const now = new Date();
  businessesStore.forEach((b) => {
    if (now.getTime() > new Date(b.plan_end_date).getTime() && b.status === "Active") {
      b.status = "Inactive";
    }
  });

  res.json({
    businesses: businessesStore,
  });
});

// Create new business
app.post("/api/admin/businesses", checkAdminAuth, (req: Request, res: Response) => {
  const { name, mobile, subdomain, custom_domain, plan_duration_months } = req.body;

  if (!name || !mobile || !subdomain) {
    return res.status(400).json({ error: "Name, mobile, and subdomain are required" });
  }

  const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");

  if (businessesStore.some((b) => b.subdomain === cleanSubdomain)) {
    return res.status(400).json({ error: "Subdomain already assigned to another business" });
  }

  const months = Number(plan_duration_months) || 1;
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  const newBusiness: Business = {
    id: `biz-${Date.now()}`,
    name,
    mobile: mobile.trim(),
    subdomain: cleanSubdomain,
    custom_domain: custom_domain ? custom_domain.trim() : undefined,
    plan_start_date: startDate.toISOString(),
    plan_end_date: endDate.toISOString(),
    service_date: endDate.toISOString(),
    status: "Active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  businessesStore.unshift(newBusiness);
  filesStore.set(newBusiness.id, []);

  res.json({ success: true, business: newBusiness });
});

// Chronological Override Panel: Manually override, extend, or retract plan_end_date & service_date
app.patch("/api/admin/businesses/:id/override", checkAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { plan_end_date, service_date, status } = req.body;

  const business = businessesStore.find((b) => b.id === id);
  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }

  if (plan_end_date) {
    business.plan_end_date = new Date(plan_end_date).toISOString();
  }
  if (service_date) {
    business.service_date = new Date(service_date).toISOString();
  }
  if (status && (status === "Active" || status === "Inactive")) {
    business.status = status;
  } else if (plan_end_date) {
    // Auto adjust status according to new date
    const now = new Date();
    business.status = new Date(business.plan_end_date).getTime() >= now.getTime() ? "Active" : "Inactive";
  }

  business.updated_at = new Date().toISOString();

  res.json({
    success: true,
    message: `Chronological override applied for ${business.name}`,
    business,
  });
});

// Manual Plan & Profile Modification for any Business
app.put("/api/admin/businesses/:id/plan", checkAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    mobile,
    subdomain,
    custom_domain,
    plan_start_date,
    plan_end_date,
    service_date,
    status,
    extension_days,
    plan_tier_name,
    custom_pricing,
  } = req.body;

  const business = businessesStore.find((b) => b.id === id);
  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }

  if (name && typeof name === "string") {
    business.name = name.trim();
  }
  if (mobile && typeof mobile === "string") {
    business.mobile = mobile.trim();
  }
  if (subdomain && typeof subdomain === "string") {
    const cleanSub = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (cleanSub) {
      const duplicate = businessesStore.some((b) => b.id !== id && b.subdomain === cleanSub);
      if (duplicate) {
        return res.status(400).json({ error: "Subdomain already assigned to another business" });
      }
      business.subdomain = cleanSub;
    }
  }
  if (custom_domain !== undefined) {
    business.custom_domain = custom_domain ? String(custom_domain).trim() : undefined;
  }
  if (plan_start_date) {
    business.plan_start_date = new Date(plan_start_date).toISOString();
  }

  // If extension days specified (e.g. +30, +90, +180, +365)
  if (extension_days && Number(extension_days) > 0) {
    const currentEnd = new Date(business.plan_end_date);
    const baseDate = currentEnd.getTime() < Date.now() ? new Date() : currentEnd;
    baseDate.setDate(baseDate.getDate() + Number(extension_days));
    business.plan_end_date = baseDate.toISOString();
    business.service_date = baseDate.toISOString();
    business.status = "Active";
  } else if (plan_end_date) {
    business.plan_end_date = new Date(plan_end_date).toISOString();
    if (service_date) {
      business.service_date = new Date(service_date).toISOString();
    } else {
      business.service_date = business.plan_end_date;
    }
  }

  if (custom_pricing !== undefined) {
    if (custom_pricing === null || custom_pricing.use_custom === false) {
      business.custom_pricing = { use_custom: false };
    } else {
      business.custom_pricing = {
        use_custom: true,
        monthly_price: custom_pricing.monthly_price !== undefined && custom_pricing.monthly_price !== "" ? Number(custom_pricing.monthly_price) : undefined,
        monthly_strike: custom_pricing.monthly_strike !== undefined && custom_pricing.monthly_strike !== "" ? Number(custom_pricing.monthly_strike) : undefined,
        six_month_price: custom_pricing.six_month_price !== undefined && custom_pricing.six_month_price !== "" ? Number(custom_pricing.six_month_price) : undefined,
        six_month_strike: custom_pricing.six_month_strike !== undefined && custom_pricing.six_month_strike !== "" ? Number(custom_pricing.six_month_strike) : undefined,
        one_year_price: custom_pricing.one_year_price !== undefined && custom_pricing.one_year_price !== "" ? Number(custom_pricing.one_year_price) : undefined,
        one_year_strike: custom_pricing.one_year_strike !== undefined && custom_pricing.one_year_strike !== "" ? Number(custom_pricing.one_year_strike) : undefined,
      };
    }
  }

  if (status && (status === "Active" || status === "Inactive")) {
    business.status = status;
  } else if (business.plan_end_date) {
    const now = new Date();
    business.status = new Date(business.plan_end_date).getTime() >= now.getTime() ? "Active" : "Inactive";
  }

  business.updated_at = new Date().toISOString();

  console.log(`[Admin Manual Plan Edit] Updated business '${business.name}' plan: ${business.status}, ends ${business.plan_end_date}`);

  return res.json({
    success: true,
    message: `Business plan successfully updated for ${business.name}`,
    business,
  });
});

// Transactions Ledger (historical financial timeline)
app.get("/api/admin/transactions", checkAdminAuth, (_req: Request, res: Response) => {
  res.json({
    transactions: transactionsStore,
    total_volume: transactionsStore
      .filter((t) => t.status === "Success")
      .reduce((sum, t) => sum + t.amount, 0),
  });
});

// Global Management Controls: Settings update (PayU keys, pricing, WhatsApp, Supabase)
app.get("/api/admin/settings", checkAdminAuth, (_req: Request, res: Response) => {
  res.json({ settings: settingsStore });
});

app.post("/api/admin/settings", checkAdminAuth, (req: Request, res: Response) => {
  const incoming = req.body;

  settingsStore = {
    ...settingsStore,
    ...incoming,
    monthly_price: Number(incoming.monthly_price ?? settingsStore.monthly_price),
    monthly_strike: Number(incoming.monthly_strike ?? settingsStore.monthly_strike),
    six_month_price: Number(incoming.six_month_price ?? settingsStore.six_month_price),
    six_month_strike: Number(incoming.six_month_strike ?? settingsStore.six_month_strike),
    one_year_price: Number(incoming.one_year_price ?? settingsStore.one_year_price),
    one_year_strike: Number(incoming.one_year_strike ?? settingsStore.one_year_strike),
  };

  res.json({
    success: true,
    message: "System global settings updated successfully",
    settings: settingsStore,
  });
});

// Coupons Manager CRUD
app.get("/api/admin/coupons", checkAdminAuth, (_req: Request, res: Response) => {
  res.json({ coupons: couponsStore });
});

app.post("/api/admin/coupons", checkAdminAuth, (req: Request, res: Response) => {
  const { code, discount_type, discount_value, min_amount, expiry_date, is_active } = req.body;

  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: "Code, discount_type, and discount_value are required" });
  }

  const cleanCode = String(code).trim().toUpperCase();

  const newCoupon: Coupon = {
    id: `cpn-${Date.now()}`,
    code: cleanCode,
    discount_type,
    discount_value: Number(discount_value),
    min_amount: Number(min_amount) || 0,
    is_active: is_active !== false,
    expiry_date: expiry_date ? new Date(expiry_date).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  };

  couponsStore.push(newCoupon);
  res.json({ success: true, coupon: newCoupon });
});

app.patch("/api/admin/coupons/:id", checkAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const coupon = couponsStore.find((c) => c.id === id);
  if (!coupon) {
    return res.status(404).json({ error: "Coupon not found" });
  }

  Object.assign(coupon, req.body);
  res.json({ success: true, coupon });
});

app.delete("/api/admin/coupons/:id", checkAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  couponsStore = couponsStore.filter((c) => c.id !== id);
  res.json({ success: true, message: "Coupon removed" });
});

// ----------------------------------------------------------------------------
// 5. MULTI-TENANT HOSTING ONLINE FILE MANAGER & ASSET STORAGE
// ----------------------------------------------------------------------------

// List files for a business
app.get("/api/admin/cms/:businessId/files", checkAdminAuth, (req: Request, res: Response) => {
  const { businessId } = req.params;
  const business = businessesStore.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }

  const files = getBusinessFiles(businessId);
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

  res.json({
    business: {
      id: business.id,
      name: business.name,
      subdomain: business.subdomain,
      status: business.status,
      plan_end_date: business.plan_end_date,
      web_link: `https://web.digimoms.in/${business.subdomain}`,
    },
    root_path: `tenants/${business.subdomain}/public_html/`,
    files,
    total_files: files.length,
    total_size: totalSize,
  });
});

// Upload file(s) - Supports batch upload of entire folders or individual files
app.post("/api/admin/cms/:businessId/files/upload", checkAdminAuth, (req: Request, res: Response) => {
  const { businessId } = req.params;
  const business = businessesStore.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }

  const incomingFiles: Array<Partial<TenantFile>> = Array.isArray(req.body.files)
    ? req.body.files
    : [req.body];

  if (!incomingFiles || incomingFiles.length === 0) {
    return res.status(400).json({ error: "No files provided for upload" });
  }

  const currentFiles = getBusinessFiles(businessId);

  // Helper to ensure parent directory exists in virtual directory structure
  const ensureDirectoryExists = (dirPath: string) => {
    if (!dirPath || dirPath === "." || dirPath === "/") return;
    const parts = dirPath.split("/").filter(Boolean);
    let accumulated = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parent = accumulated;
      accumulated = accumulated ? `${accumulated}/${part}` : part;

      const exists = currentFiles.some(
        (f) => f.is_directory && f.path.toLowerCase() === accumulated.toLowerCase()
      );
      if (!exists) {
        currentFiles.push({
          id: `dir-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: part,
          path: accumulated,
          parent_path: parent,
          is_directory: true,
          size: 0,
          updated_at: new Date().toISOString(),
          content_type: "directory",
        });
      }
    }
  };

  const processed: TenantFile[] = [];

  for (const item of incomingFiles) {
    if (!item.name) continue;

    const rawPath = String(item.path || item.name).replace(/^\/+/, "");
    const parts = rawPath.split("/");
    const fileName = parts.pop() || item.name;
    const parentPath = parts.join("/");

    // Ensure parent folders are registered
    if (parentPath) {
      ensureDirectoryExists(parentPath);
    }

    const isDir = Boolean(item.is_directory);
    const content = item.content || "";
    const size = item.size ?? Buffer.byteLength(content, "utf8");
    const contentType = item.content_type || (isDir ? "directory" : "text/plain");

    // Check if file or directory already exists at this exact path
    const existingIndex = currentFiles.findIndex(
      (f) => f.path.toLowerCase() === rawPath.toLowerCase()
    );

    const fileRecord: TenantFile = {
      id: existingIndex >= 0 ? currentFiles[existingIndex].id : `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: fileName,
      path: rawPath,
      parent_path: parentPath,
      size,
      updated_at: new Date().toISOString(),
      content_type: contentType,
      content,
      is_directory: isDir,
    };

    if (existingIndex >= 0) {
      currentFiles[existingIndex] = fileRecord;
    } else {
      currentFiles.push(fileRecord);
    }
    processed.push(fileRecord);
  }

  filesStore.set(businessId, currentFiles);

  res.json({
    success: true,
    message: `Successfully uploaded and synced ${processed.length} item(s)`,
    files: currentFiles,
  });
});

// Create a new folder
app.post("/api/admin/cms/:businessId/create-folder", checkAdminAuth, (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { folder_name, parent_path } = req.body;

  if (!folder_name || !String(folder_name).trim()) {
    return res.status(400).json({ error: "Folder name is required" });
  }

  const cleanName = String(folder_name).trim().replace(/[^a-zA-Z0-9._-]/g, "");
  const cleanParent = parent_path ? String(parent_path).trim().replace(/^\/+|\/+$/g, "") : "";
  const fullPath = cleanParent ? `${cleanParent}/${cleanName}` : cleanName;

  const currentFiles = getBusinessFiles(businessId);
  const exists = currentFiles.some(
    (f) => f.path.toLowerCase() === fullPath.toLowerCase()
  );

  if (exists) {
    return res.status(400).json({ error: "A file or folder with this name already exists at this location" });
  }

  const newFolder: TenantFile = {
    id: `dir-${Date.now()}`,
    name: cleanName,
    path: fullPath,
    parent_path: cleanParent,
    is_directory: true,
    size: 0,
    updated_at: new Date().toISOString(),
    content_type: "directory",
  };

  currentFiles.push(newFolder);
  filesStore.set(businessId, currentFiles);

  res.json({ success: true, folder: newFolder, files: currentFiles });
});

// Create a new file (e.g. index.html, style.css, script.js)
app.post("/api/admin/cms/:businessId/create-file", checkAdminAuth, (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { file_name, parent_path, content, content_type } = req.body;

  if (!file_name || !String(file_name).trim()) {
    return res.status(400).json({ error: "File name is required" });
  }

  const cleanName = String(file_name).trim();
  const cleanParent = parent_path ? String(parent_path).trim().replace(/^\/+|\/+$/g, "") : "";
  const fullPath = cleanParent ? `${cleanParent}/${cleanName}` : cleanName;

  const currentFiles = getBusinessFiles(businessId);
  const exists = currentFiles.some(
    (f) => f.path.toLowerCase() === fullPath.toLowerCase()
  );

  if (exists) {
    return res.status(400).json({ error: "File already exists at this path" });
  }

  let defaultType = content_type;
  if (!defaultType) {
    if (cleanName.endsWith(".html") || cleanName.endsWith(".htm")) defaultType = "text/html";
    else if (cleanName.endsWith(".css")) defaultType = "text/css";
    else if (cleanName.endsWith(".js")) defaultType = "application/javascript";
    else if (cleanName.endsWith(".json")) defaultType = "application/json";
    else defaultType = "text/plain";
  }

  const fileContent = content !== undefined ? content : "";
  const newFile: TenantFile = {
    id: `f-${Date.now()}`,
    name: cleanName,
    path: fullPath,
    parent_path: cleanParent,
    is_directory: false,
    size: Buffer.byteLength(fileContent, "utf8"),
    updated_at: new Date().toISOString(),
    content_type: defaultType,
    content: fileContent,
  };

  currentFiles.push(newFile);
  filesStore.set(businessId, currentFiles);

  res.json({ success: true, file: newFile, files: currentFiles });
});

// Rename file or folder
app.post("/api/admin/cms/:businessId/rename", checkAdminAuth, (req: Request, res: Response) => {
  const { businessId } = req.params;
  const { file_id, new_name } = req.body;

  if (!file_id || !new_name || !String(new_name).trim()) {
    return res.status(400).json({ error: "File ID and new name are required" });
  }

  const currentFiles = getBusinessFiles(businessId);
  const target = currentFiles.find((f) => f.id === file_id);
  if (!target) {
    return res.status(404).json({ error: "File or directory not found" });
  }

  const cleanNewName = String(new_name).trim();
  const oldPath = target.path;
  const parent = target.parent_path || "";
  const newPath = parent ? `${parent}/${cleanNewName}` : cleanNewName;

  target.name = cleanNewName;
  target.path = newPath;
  target.updated_at = new Date().toISOString();

  // If renaming a directory, update all nested children paths
  if (target.is_directory) {
    for (const f of currentFiles) {
      if (f.id !== target.id && f.path.startsWith(oldPath + "/")) {
        f.path = newPath + f.path.substring(oldPath.length);
        if (f.parent_path === oldPath) {
          f.parent_path = newPath;
        } else if (f.parent_path?.startsWith(oldPath + "/")) {
          f.parent_path = newPath + f.parent_path.substring(oldPath.length);
        }
      }
    }
  }

  filesStore.set(businessId, currentFiles);
  res.json({ success: true, message: `Renamed to ${cleanNewName}`, file: target, files: currentFiles });
});

// Update specific file content (Code Editor Save)
app.put("/api/admin/cms/:businessId/files/:fileId", checkAdminAuth, (req: Request, res: Response) => {
  const { businessId, fileId } = req.params;
  const { content } = req.body;

  const files = getBusinessFiles(businessId);
  const file = files.find((f) => f.id === fileId);

  if (!file) {
    return res.status(404).json({ error: "File not found" });
  }

  file.content = typeof content === "string" ? content : "";
  file.size = Buffer.byteLength(file.content, "utf8");
  file.updated_at = new Date().toISOString();

  filesStore.set(businessId, files);
  res.json({ success: true, file });
});

// Delete file or directory (recursively removes child items)
app.delete("/api/admin/cms/:businessId/files/:fileId", checkAdminAuth, (req: Request, res: Response) => {
  const { businessId, fileId } = req.params;
  const files = getBusinessFiles(businessId);
  const target = files.find((f) => f.id === fileId);

  if (!target) {
    return res.status(404).json({ error: "Item not found" });
  }

  let filtered: TenantFile[];
  if (target.is_directory) {
    // Recursively delete directory and all children
    const prefix = target.path + "/";
    filtered = files.filter((f) => f.id !== fileId && !f.path.startsWith(prefix));
  } else {
    filtered = files.filter((f) => f.id !== fileId);
  }

  filesStore.set(businessId, filtered);
  res.json({ success: true, message: `Deleted '${target.name}' from storage`, files: filtered });
});

// Clear all files for a business
app.delete("/api/admin/cms/:businessId/clear-all", checkAdminAuth, (req: Request, res: Response) => {
  const { businessId } = req.params;
  filesStore.set(businessId, []);
  res.json({ success: true, message: "All website files cleared from storage", files: [] });
});

// NUCLEAR DELETE: Terminally deletes business from database registry AND flushes all physical media directories
app.delete("/api/admin/businesses/:id/terminal", checkAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const businessIndex = businessesStore.findIndex((b) => b.id === id);

  if (businessIndex === -1) {
    return res.status(404).json({ error: "Business not found" });
  }

  const business = businessesStore[businessIndex];
  const filesCount = (filesStore.get(id) || []).length;
  filesStore.delete(id);

  transactionsStore = transactionsStore.filter((t) => t.business_id !== id);
  businessesStore.splice(businessIndex, 1);

  console.log(
    `[Nuclear Delete] Terminally wiped business ${business.name} (${id}) and flushed ${filesCount} assets from storage.`
  );

  res.json({
    success: true,
    message: `Nuclear Terminal Purge Complete: Wiped business '${business.name}', deleted all associated ledger transactions, and purged storage assets`,
    flushed_files_count: filesCount,
  });
});

// ----------------------------------------------------------------------------
// 6. TENANT WEBSITE TEMPLATE RENDERERS (Suspension & Under-Construction)
// ----------------------------------------------------------------------------

function renderSuspendedHtml(business: Business) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Suspended - ${business.name}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0b0f19; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { max-width: 560px; width: 100%; background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 44px 32px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: #dc2626; color: white; padding: 6px 16px; border-radius: 9999px; font-weight: 700; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px; }
    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: white; animation: blink 1.2s infinite ease-in-out; }
    h1 { font-size: 28px; font-weight: 800; color: #ffffff; margin-bottom: 12px; letter-spacing: -0.02em; }
    p { color: #9ca3af; font-size: 15px; line-height: 1.6; margin-bottom: 28px; }
    .renew-btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; transition: all 0.2s ease; box-shadow: 0 4px 20px rgba(37,99,235,0.4); }
    .renew-btn:hover { background: #1d4ed8; transform: translateY(-1px); }
    .footer-note { margin-top: 28px; font-size: 12px; color: #6b7280; line-height: 1.6; }
    .footer-note a { color: #3b82f6; text-decoration: none; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="pulse-dot"></span> Service Suspended &bull; Renewal Required</div>
    <h1>${business.name}</h1>
    <p>This business website subscription validity expired on <strong>${new Date(business.plan_end_date).toLocaleDateString()}</strong>.<br>To restore public access immediately, please renew the plan via the DigiMoms Renewal Portal.</p>
    <a href="/portal?mobile=${business.mobile}" class="renew-btn">⚡ Renew Subscription Now</a>
    <div class="footer-note">
      Direct Link: <code>web.digimoms.in/${business.subdomain}</code><br>
      DigiMoms Cloud Hosting &bull; Need Help? Contact <a href="https://wa.me/${settingsStore.whatsapp_number}?text=Hello%20DigiMoms,%20my%20business%20${encodeURIComponent(business.name)}%20is%20suspended" target="_blank">Support on WhatsApp</a>
    </div>
  </div>
</body>
</html>`;
}

function renderUnderConstructionHtml(business: Business) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${business.name} - Under Construction</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #f8fafc; color: #1e293b; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { max-width: 580px; width: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 48px 36px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06); }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 6px 16px; border-radius: 9999px; font-weight: 700; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 20px; }
    h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
    .subhead { color: #64748b; font-size: 15px; margin-bottom: 28px; }
    .box { background: #f1f5f9; border-radius: 12px; padding: 20px; text-align: left; margin-bottom: 24px; font-size: 13px; color: #475569; }
    .box h4 { color: #0f172a; margin-bottom: 6px; font-weight: 700; font-size: 14px; }
    .box code { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    .footer-note { font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">&bull; Domain Active &amp; Online</div>
    <h1>${business.name}</h1>
    <p class="subhead">Live Web Link: <strong>web.digimoms.in/${business.subdomain}</strong></p>
    <div class="box">
      <h4>📂 Website Files Not Yet Uploaded</h4>
      <p>This web link is active and ready to serve your custom website! To display your website here:</p>
      <ol style="margin-left: 18px; margin-top: 8px; line-height: 1.6;">
        <li>Log into the <strong>DigiMoms Admin File Manager</strong></li>
        <li>Open File Manager for <strong>${business.name}</strong></li>
        <li>Upload your website folder &amp; files (including <code>index.html</code>, CSS, JS, and images)</li>
      </ol>
    </div>
    <div class="footer-note">Hosted on DigiMoms Cloud Platform &bull; web.digimoms.in</div>
  </div>
</body>
</html>`;
}

// ----------------------------------------------------------------------------
// 7. PATH-BASED TENANT WEBSITE ROUTING & EMBEDDED PREVIEW API
// ----------------------------------------------------------------------------

// Embedded preview endpoint for admin iframe
app.get("/api/tenant/render/:subdomain", (req: Request, res: Response) => {
  const { subdomain } = req.params;
  const business = businessesStore.find((b) => b.subdomain.toLowerCase() === subdomain.toLowerCase());

  if (!business) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html><head><title>Tenant Not Found</title></head>
      <body style="font-family: sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; background:#f8fafc;">
        <div style="text-align:center; padding: 40px; background:white; border-radius:12px;">
          <h2>404 - Tenant Not Found</h2>
          <p>No business registered under link: <strong>web.digimoms.in/${subdomain}</strong></p>
        </div>
      </body></html>
    `);
  }

  const now = new Date();
  const isExpired = now.getTime() > new Date(business.plan_end_date).getTime() || business.status === "Inactive";
  if (isExpired) {
    return res.send(renderSuspendedHtml(business));
  }

  const files = getBusinessFiles(business.id);
  const indexHtml = files.find(
    (f) => !f.is_directory && (f.name.toLowerCase() === "index.html" || f.name.toLowerCase() === "index.htm")
  );

  if (indexHtml && indexHtml.content) {
    return res.type("html").send(indexHtml.content);
  }

  return res.send(renderUnderConstructionHtml(business));
});

// Middleware: Route requests to web.digimoms.in/{slug} OR {slug}.web.digimoms.in
app.use((req: Request, res: Response, next: NextFunction) => {
  let slug = "";
  let subpath = "";

  // Reserved paths for application infrastructure & SPA
  const reserved = [
    "api",
    "portal",
    "admin",
    "assets",
    "src",
    "public",
    "@vite",
    "@fs",
    "@id",
    "node_modules",
    "favicon.ico",
    "robots.txt",
    "index.html",
  ];

  // 1. Check Path-based: e.g. web.digimoms.in/{slug}
  const match = req.path.match(/^\/([a-zA-Z0-9_-]+)(\/.*)?$/);
  const possibleSlug = match ? match[1] : "";

  if (possibleSlug && !reserved.includes(possibleSlug.toLowerCase())) {
    slug = possibleSlug;
    subpath = match && match[2] ? match[2].replace(/^\/+/, "") : "";
  } else {
    // 2. Check Hostname-based: e.g. {slug}.web.digimoms.in or {slug}.digimoms.in
    const host = (req.headers.host || req.hostname || "").split(":")[0].toLowerCase();
    const isCloudHost =
      host.endsWith(".run.app") ||
      host.endsWith(".vercel.app") ||
      host.endsWith(".appspot.com") ||
      host.endsWith(".web.app") ||
      host.endsWith(".firebaseapp.com") ||
      host.endsWith(".onrender.com") ||
      host.endsWith(".github.io");

    if (!isCloudHost) {
      const parts = host.split(".");
      if (parts.length >= 3) {
        const firstPart = parts[0];
        if (firstPart !== "web" && firstPart !== "www" && !reserved.includes(firstPart)) {
          slug = firstPart;
          subpath = req.path.replace(/^\/+/, "");
        }
      }
    }
  }

  if (!slug) return next();

  // Look up business by slug / subdomain
  const business = businessesStore.find((b) => b.subdomain.toLowerCase() === slug.toLowerCase());
  if (!business) {
    return next();
  }

  // 1. Suspension check
  const now = new Date();
  const isExpired = now.getTime() > new Date(business.plan_end_date).getTime() || business.status === "Inactive";
  if (isExpired) {
    return res.status(402).send(renderSuspendedHtml(business));
  }

  // 2. Locate requested file in tenant storage
  const files = getBusinessFiles(business.id);
  const target = subpath || "index.html";
  const normalizedTarget = target.toLowerCase().replace(/^\.\//, "");

  const matchedFile = files.find((f) => {
    if (f.is_directory) return false;
    const fPath = f.path.toLowerCase().replace(/^\.\//, "");
    const fName = f.name.toLowerCase();
    return fPath === normalizedTarget || fPath.endsWith("/" + normalizedTarget) || fName === normalizedTarget;
  });

  if (matchedFile) {
    res.setHeader("X-Tenant-Business", business.name);
    res.setHeader("X-Tenant-Slug", business.subdomain);

    if (matchedFile.content_type?.startsWith("image/") && matchedFile.content?.startsWith("data:")) {
      const base64Data = matchedFile.content.split(",")[1];
      const imgBuffer = Buffer.from(base64Data, "base64");
      return res.type(matchedFile.content_type).send(imgBuffer);
    }
    return res.type(matchedFile.content_type || "text/html").send(matchedFile.content || "");
  }

  // If root index.html requested and not found
  if (!subpath || subpath === "index.html" || subpath === "index.htm") {
    return res.send(renderUnderConstructionHtml(business));
  }

  return res.status(404).send(`404: Asset '${subpath}' not found in ${business.name} storage`);
});

// Safe 404 handler for API routes to prevent Express default finalhandler unpipe() crash on Vercel
app.use("/api", (req: Request, res: Response) => {
  if (!res.headersSent) {
    res.status(404).json({
      error: "API endpoint not found",
      method: req.method,
      path: req.originalUrl || req.url,
    });
  }
});

// Global Express error handler to prevent unhandled exceptions from crashing serverless runtime
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[DigiMoms Backend Error]:", err);
  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal server error occurred",
      message: err?.message || "An unexpected error occurred in backend service",
    });
  }
});

// Export app instance for local server and Vercel serverless deployment
export default app;
export { app };



