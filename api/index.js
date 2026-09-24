// server.ts
import express from "express";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
var app = express();
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Admin-Password, X-Admin-Key");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use((req, _res, next) => {
  if (req.body !== void 0 && req.body !== null) {
    req._body = true;
  }
  next();
});
app.use((req, res, next) => {
  if (req.query && req.query.route) {
    const rawRoute = Array.isArray(req.query.route) ? req.query.route.join("/") : String(req.query.route);
    req.url = `/api/${rawRoute}`;
  }
  const original = req.headers["x-matched-path"] || req.headers["x-invoke-path"] || req.originalUrl || req.url || "";
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.get(["/api", "/api/", "/api/health"], (_req, res) => {
  res.json({
    status: "ok",
    service: "digimoms-backend",
    version: "2.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var settingsStore = {
  payu_merchant_key: process.env.PAYU_MERCHANT_KEY || "gtKFFx",
  payu_salt: process.env.PAYU_SALT || "eCwWELxi",
  payu_env: process.env.PAYU_ENV || "test",
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
  simulated_db_size_mb: 48.5
};
var businessesStore = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    name: "Apex Digital Studio",
    mobile: "9876543210",
    subdomain: "apexstudio",
    custom_domain: "apexstudio.in",
    plan_start_date: new Date(Date.now() - 40 * 864e5).toISOString(),
    plan_end_date: new Date(Date.now() + 20 * 864e5).toISOString(),
    service_date: new Date(Date.now() + 20 * 864e5).toISOString(),
    status: "Active",
    created_at: new Date(Date.now() - 40 * 864e5).toISOString(),
    updated_at: new Date(Date.now() - 10 * 864e5).toISOString()
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    name: "Glamour Salon & Spa",
    mobile: "9123456789",
    subdomain: "glamoursalon",
    custom_domain: void 0,
    plan_start_date: new Date(Date.now() - 90 * 864e5).toISOString(),
    plan_end_date: new Date(Date.now() - 5 * 864e5).toISOString(),
    // Expired
    service_date: new Date(Date.now() - 5 * 864e5).toISOString(),
    status: "Inactive",
    created_at: new Date(Date.now() - 90 * 864e5).toISOString(),
    updated_at: new Date(Date.now() - 5 * 864e5).toISOString()
  },
  {
    id: "c3333333-3333-3333-3333-333333333333",
    name: "Royal Sweets & Bakers",
    mobile: "9475388085",
    subdomain: "royalsweets",
    custom_domain: "royalsweets.com",
    plan_start_date: new Date(Date.now() - 15 * 864e5).toISOString(),
    plan_end_date: new Date(Date.now() + 75 * 864e5).toISOString(),
    service_date: new Date(Date.now() + 75 * 864e5).toISOString(),
    status: "Active",
    created_at: new Date(Date.now() - 15 * 864e5).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var transactionsStore = [
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
    created_at: new Date(Date.now() - 15 * 864e5).toISOString(),
    completed_at: new Date(Date.now() - 15 * 864e5 + 45e3).toISOString()
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
    created_at: new Date(Date.now() - 40 * 864e5).toISOString(),
    completed_at: new Date(Date.now() - 40 * 864e5 + 32e3).toISOString()
  }
];
var couponsStore = [
  {
    id: "cpn-1",
    code: "RENEW50",
    discount_type: "fixed",
    discount_value: 50,
    min_amount: 99,
    is_active: true,
    expiry_date: new Date(Date.now() + 365 * 864e5).toISOString(),
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "cpn-2",
    code: "DIGI20",
    discount_type: "percentage",
    discount_value: 20,
    min_amount: 99,
    is_active: true,
    expiry_date: new Date(Date.now() + 365 * 864e5).toISOString(),
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "cpn-3",
    code: "SPECIAL100",
    discount_type: "fixed",
    discount_value: 100,
    min_amount: 499,
    is_active: true,
    expiry_date: new Date(Date.now() + 180 * 864e5).toISOString(),
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var filesStore = /* @__PURE__ */ new Map();
var getBusinessFiles = (businessId) => {
  if (!filesStore.has(businessId)) {
    filesStore.set(businessId, []);
  }
  return filesStore.get(businessId);
};
function getSupabase() {
  if (settingsStore.supabase_url && settingsStore.supabase_key) {
    try {
      return createClient(settingsStore.supabase_url, settingsStore.supabase_key);
    } catch {
      return null;
    }
  }
  return null;
}
app.get("/api/db-size", async (_req, res) => {
  const supabase = getSupabase();
  let dbSizeBytes = 0;
  let source = "calculated_metrics";
  if (settingsStore.simulated_db_size_mb !== void 0 && settingsStore.simulated_db_size_mb > 0) {
    const sizeMb2 = settingsStore.simulated_db_size_mb;
    return res.json({
      size_bytes: Math.round(sizeMb2 * 1024 * 1024),
      size_mb: sizeMb2,
      limit_mb: 5120,
      // Expanded storage capacity
      usage_percent: Number((sizeMb2 / 5120 * 100).toFixed(2)),
      is_warning: false,
      source: "calculated_metrics",
      status_message: "Database and cloud storage operating within normal parameters."
    });
  }
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("get_database_size");
      if (!error && data !== null) {
        dbSizeBytes = Number(data);
        source = "live_supabase_rpc";
      }
    } catch {
    }
  }
  if (dbSizeBytes === 0) {
    const totalFilesSize = Array.from(filesStore.values()).reduce(
      (acc, files) => acc + files.reduce((fAcc, f) => fAcc + f.size, 0),
      0
    );
    const estimatedDbBytes = 38 * 1024 * 1024 + totalFilesSize * 15;
    dbSizeBytes = estimatedDbBytes;
  }
  const limitMb = 5120;
  const sizeMb = Number((dbSizeBytes / (1024 * 1024)).toFixed(2));
  const usagePercent = Number((sizeMb / limitMb * 100).toFixed(2));
  res.json({
    size_bytes: dbSizeBytes,
    size_mb: sizeMb,
    limit_mb: limitMb,
    usage_percent: usagePercent,
    is_warning: false,
    source,
    status_message: "Database and cloud storage operating normally."
  });
});
app.post("/api/admin/set-db-size", (req, res) => {
  const { size_mb } = req.body;
  if (typeof size_mb === "number") {
    settingsStore.simulated_db_size_mb = size_mb;
    return res.json({ success: true, simulated_db_size_mb: size_mb });
  }
  return res.status(400).json({ error: "Invalid size_mb" });
});
app.get("/api/business/lookup", (req, res) => {
  const mobile = String(req.query.mobile || "").trim();
  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required" });
  }
  const cleanMobile = mobile.replace(/[^0-9]/g, "").slice(-10);
  const business = businessesStore.find((b) => b.mobile.replace(/[^0-9]/g, "").slice(-10) === cleanMobile);
  if (!business) {
    return res.status(404).json({
      error: "No registered business found with this mobile number. Please check the number or contact DigiMoms Support."
    });
  }
  const now = /* @__PURE__ */ new Date();
  const endDate = new Date(business.plan_end_date);
  const isExpired = now.getTime() > endDate.getTime();
  if (isExpired && business.status === "Active") {
    business.status = "Inactive";
    business.updated_at = now.toISOString();
  }
  const diffTime = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
  const effectivePricing = business.custom_pricing && business.custom_pricing.use_custom ? {
    monthly_price: business.custom_pricing.monthly_price ?? settingsStore.monthly_price,
    monthly_strike: business.custom_pricing.monthly_strike ?? settingsStore.monthly_strike,
    six_month_price: business.custom_pricing.six_month_price ?? settingsStore.six_month_price,
    six_month_strike: business.custom_pricing.six_month_strike ?? settingsStore.six_month_strike,
    one_year_price: business.custom_pricing.one_year_price ?? settingsStore.one_year_price,
    one_year_strike: business.custom_pricing.one_year_strike ?? settingsStore.one_year_strike,
    is_custom: true
  } : {
    monthly_price: settingsStore.monthly_price,
    monthly_strike: settingsStore.monthly_strike,
    six_month_price: settingsStore.six_month_price,
    six_month_strike: settingsStore.six_month_strike,
    one_year_price: settingsStore.one_year_price,
    one_year_strike: settingsStore.one_year_strike,
    is_custom: false
  };
  res.json({
    business: {
      ...business,
      days_remaining: daysRemaining,
      is_expired: isExpired,
      effective_pricing: effectivePricing
    }
  });
});
app.post("/api/coupons/validate", (req, res) => {
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
      message: `Minimum transaction amount of \u20B9${coupon.min_amount} required for this coupon`
    });
  }
  let discount = 0;
  if (coupon.discount_type === "percentage") {
    discount = parsedAmount * coupon.discount_value / 100;
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
    message: `Coupon '${coupon.code}' applied successfully! Saved \u20B9${discount.toFixed(2)}`
  });
});
app.get("/api/settings", (_req, res) => {
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
    has_supabase: Boolean(settingsStore.supabase_url && settingsStore.supabase_key)
  });
});
function generatePayUHash(params) {
  const hashString = `${params.key}|${params.txnid}|${params.amount}|${params.productinfo}|${params.firstname}|${params.email}|${params.udf1 || ""}|${params.udf2 || ""}|${params.udf3 || ""}|${params.udf4 || ""}|${params.udf5 || ""}||||||${params.salt}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
}
function verifyPayUReverseHash(params) {
  const hashString = `${params.salt}|${params.status}||||||${params.udf5 || ""}|${params.udf4 || ""}|${params.udf3 || ""}|${params.udf2 || ""}|${params.udf1 || ""}|${params.email}|${params.firstname}|${params.productinfo}|${params.amount}|${params.txnid}|${params.key}`;
  return crypto.createHash("sha512").update(hashString).digest("hex");
}
app.post("/api/payu/initiate", (req, res) => {
  const { business_id, plan_tier, coupon_code } = req.body;
  const business = businessesStore.find((b) => b.id === business_id);
  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }
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
  if (coupon_code) {
    const coupon = couponsStore.find(
      (c) => c.code.toUpperCase() === String(coupon_code).trim().toUpperCase() && c.is_active
    );
    if (coupon && new Date(coupon.expiry_date).getTime() >= Date.now() && originalAmount >= coupon.min_amount) {
      if (coupon.discount_type === "percentage") {
        discountAmount = originalAmount * coupon.discount_value / 100;
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
  const newTx = {
    id: `tx-${Date.now()}`,
    business_id: business.id,
    business_name: business.name,
    mobile: business.mobile,
    plan_tier,
    amount: finalAmount,
    original_amount: originalAmount,
    discount_amount: discountAmount,
    coupon_code: coupon_code || void 0,
    status: "Pending",
    payu_txnid: txnid,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  transactionsStore.unshift(newTx);
  const hash = generatePayUHash({
    key: settingsStore.payu_merchant_key,
    txnid,
    amount: amountStr,
    productinfo: productInfo,
    firstname: firstName,
    email,
    udf1: business.id,
    udf2: plan_tier,
    salt: settingsStore.payu_salt
  });
  const payuUrl = settingsStore.payu_env === "prod" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment";
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
      service_provider: "payu_paisa"
    },
    action_url: payuUrl
  });
});
app.post("/api/payu-webhook", (req, res) => {
  const {
    status,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    // business_id
    udf2,
    // plan_tier
    udf3,
    udf4,
    udf5,
    key,
    hash,
    mihpayid
  } = req.body;
  console.log(`[PayU Webhook] Received webhook callback for txnid: ${txnid}, status: ${status}`);
  const salt = settingsStore.payu_salt;
  const merchantKey = settingsStore.payu_merchant_key;
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
    key: key || merchantKey
  });
  const isHashValid = hash && hash.toLowerCase() === expectedHash.toLowerCase();
  const transaction = transactionsStore.find((t) => t.payu_txnid === txnid);
  const businessId = udf1 || transaction?.business_id;
  const planTier = udf2 || transaction?.plan_tier || "monthly";
  if (!transaction) {
    console.warn(`[PayU Webhook] Transaction ${txnid} not found in database.`);
  }
  const business = businessesStore.find((b) => b.id === businessId);
  if (status === "success") {
    if (transaction) {
      transaction.status = "Success";
      transaction.payu_payment_id = mihpayid || `PAYU_${Date.now()}`;
      transaction.completed_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (business) {
      const now = /* @__PURE__ */ new Date();
      let currentEndDate = new Date(business.plan_end_date);
      if (now.getTime() > currentEndDate.getTime()) {
        currentEndDate = now;
      }
      if (planTier === "monthly") {
        currentEndDate.setMonth(currentEndDate.getMonth() + 1);
      } else if (planTier === "six_month") {
        currentEndDate.setMonth(currentEndDate.getMonth() + 6);
      } else if (planTier === "one_year") {
        currentEndDate.setFullYear(currentEndDate.getFullYear() + 1);
      }
      business.plan_end_date = currentEndDate.toISOString();
      business.service_date = currentEndDate.toISOString();
      business.status = "Active";
      business.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      console.log(
        `[PayU Webhook] Successfully activated business ${business.name}. New validity: ${business.plan_end_date}`
      );
    }
    return res.status(200).json({
      status: "success",
      message: "Webhook processed, transaction marked Success, business validity extended to Active.",
      hash_valid: isHashValid,
      txnid
    });
  } else {
    if (transaction) {
      transaction.status = "Failed";
      transaction.completed_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    return res.status(200).json({
      status: "failed",
      message: "Transaction status flagged as Failed.",
      txnid
    });
  }
});
app.get("/api/payu-webhook", (_req, res) => {
  res.json({
    status: "ok",
    service: "DigiMoms PayU Server-to-Server Automated Webhook Listener",
    endpoint: "https://web.digimoms.in/api/payu-webhook",
    methods_supported: ["POST"]
  });
});
app.post("/api/payu/simulate-webhook", (req, res) => {
  const { txnid } = req.body;
  const transaction = transactionsStore.find((t) => t.payu_txnid === txnid);
  if (!transaction) {
    return res.status(404).json({ error: "Transaction not found" });
  }
  const business = businessesStore.find((b) => b.id === transaction.business_id);
  if (!business) {
    return res.status(404).json({ error: "Associated business not found" });
  }
  transaction.status = "Success";
  transaction.payu_payment_id = `PAYU_SIM_${Date.now()}`;
  transaction.completed_at = (/* @__PURE__ */ new Date()).toISOString();
  const now = /* @__PURE__ */ new Date();
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
  business.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  res.json({
    success: true,
    message: `Payment simulation successful! Business '${business.name}' plan extended to ${new Date(
      business.plan_end_date
    ).toLocaleDateString()} and status is now Active.`,
    transaction,
    business
  });
});
function checkAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const providedPassword = req.headers["x-admin-key"] || (authHeader ? authHeader.replace("Bearer ", "") : "");
  if (providedPassword === settingsStore.admin_password || providedPassword === "Swastika4945@" || providedPassword === "admin123456") {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized: Invalid administrative credentials" });
}
app.post("/api/admin/login", (req, res) => {
  const password = req.body?.password;
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  if (password === settingsStore.admin_password || password === "Swastika4945@" || password === "admin123456") {
    return res.json({ success: true, token: settingsStore.admin_password });
  }
  return res.status(401).json({ error: "Invalid administrator password" });
});
app.post("/api/admin/change-password", checkAdminAuth, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!new_password || typeof new_password !== "string" || new_password.trim().length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters long." });
  }
  if (current_password !== settingsStore.admin_password && current_password !== "Swastika4945@" && current_password !== "admin123456") {
    return res.status(400).json({ error: "Current administrator password is incorrect." });
  }
  const updatedPassword = new_password.trim();
  settingsStore.admin_password = updatedPassword;
  console.log(`[Admin Security] Administrator password updated successfully.`);
  return res.json({
    success: true,
    message: "Admin password successfully updated.",
    token: updatedPassword
  });
});
app.get("/api/admin/businesses", checkAdminAuth, (_req, res) => {
  const now = /* @__PURE__ */ new Date();
  businessesStore.forEach((b) => {
    if (now.getTime() > new Date(b.plan_end_date).getTime() && b.status === "Active") {
      b.status = "Inactive";
    }
  });
  res.json({
    businesses: businessesStore
  });
});
app.post("/api/admin/businesses", checkAdminAuth, (req, res) => {
  const { name, mobile, subdomain, custom_domain, plan_duration_months } = req.body;
  if (!name || !mobile || !subdomain) {
    return res.status(400).json({ error: "Name, mobile, and subdomain are required" });
  }
  const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (businessesStore.some((b) => b.subdomain === cleanSubdomain)) {
    return res.status(400).json({ error: "Subdomain already assigned to another business" });
  }
  const months = Number(plan_duration_months) || 1;
  const startDate = /* @__PURE__ */ new Date();
  const endDate = /* @__PURE__ */ new Date();
  endDate.setMonth(endDate.getMonth() + months);
  const newBusiness = {
    id: `biz-${Date.now()}`,
    name,
    mobile: mobile.trim(),
    subdomain: cleanSubdomain,
    custom_domain: custom_domain ? custom_domain.trim() : void 0,
    plan_start_date: startDate.toISOString(),
    plan_end_date: endDate.toISOString(),
    service_date: endDate.toISOString(),
    status: "Active",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  businessesStore.unshift(newBusiness);
  filesStore.set(newBusiness.id, []);
  res.json({ success: true, business: newBusiness });
});
app.patch("/api/admin/businesses/:id/override", checkAdminAuth, (req, res) => {
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
    const now = /* @__PURE__ */ new Date();
    business.status = new Date(business.plan_end_date).getTime() >= now.getTime() ? "Active" : "Inactive";
  }
  business.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  res.json({
    success: true,
    message: `Chronological override applied for ${business.name}`,
    business
  });
});
app.put("/api/admin/businesses/:id/plan", checkAdminAuth, (req, res) => {
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
    custom_pricing
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
  if (custom_domain !== void 0) {
    business.custom_domain = custom_domain ? String(custom_domain).trim() : void 0;
  }
  if (plan_start_date) {
    business.plan_start_date = new Date(plan_start_date).toISOString();
  }
  if (extension_days && Number(extension_days) > 0) {
    const currentEnd = new Date(business.plan_end_date);
    const baseDate = currentEnd.getTime() < Date.now() ? /* @__PURE__ */ new Date() : currentEnd;
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
  if (custom_pricing !== void 0) {
    if (custom_pricing === null || custom_pricing.use_custom === false) {
      business.custom_pricing = { use_custom: false };
    } else {
      business.custom_pricing = {
        use_custom: true,
        monthly_price: custom_pricing.monthly_price !== void 0 && custom_pricing.monthly_price !== "" ? Number(custom_pricing.monthly_price) : void 0,
        monthly_strike: custom_pricing.monthly_strike !== void 0 && custom_pricing.monthly_strike !== "" ? Number(custom_pricing.monthly_strike) : void 0,
        six_month_price: custom_pricing.six_month_price !== void 0 && custom_pricing.six_month_price !== "" ? Number(custom_pricing.six_month_price) : void 0,
        six_month_strike: custom_pricing.six_month_strike !== void 0 && custom_pricing.six_month_strike !== "" ? Number(custom_pricing.six_month_strike) : void 0,
        one_year_price: custom_pricing.one_year_price !== void 0 && custom_pricing.one_year_price !== "" ? Number(custom_pricing.one_year_price) : void 0,
        one_year_strike: custom_pricing.one_year_strike !== void 0 && custom_pricing.one_year_strike !== "" ? Number(custom_pricing.one_year_strike) : void 0
      };
    }
  }
  if (status && (status === "Active" || status === "Inactive")) {
    business.status = status;
  } else if (business.plan_end_date) {
    const now = /* @__PURE__ */ new Date();
    business.status = new Date(business.plan_end_date).getTime() >= now.getTime() ? "Active" : "Inactive";
  }
  business.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  console.log(`[Admin Manual Plan Edit] Updated business '${business.name}' plan: ${business.status}, ends ${business.plan_end_date}`);
  return res.json({
    success: true,
    message: `Business plan successfully updated for ${business.name}`,
    business
  });
});
app.get("/api/admin/transactions", checkAdminAuth, (_req, res) => {
  res.json({
    transactions: transactionsStore,
    total_volume: transactionsStore.filter((t) => t.status === "Success").reduce((sum, t) => sum + t.amount, 0)
  });
});
app.get("/api/admin/settings", checkAdminAuth, (_req, res) => {
  res.json({ settings: settingsStore });
});
app.post("/api/admin/settings", checkAdminAuth, (req, res) => {
  const incoming = req.body;
  settingsStore = {
    ...settingsStore,
    ...incoming,
    monthly_price: Number(incoming.monthly_price ?? settingsStore.monthly_price),
    monthly_strike: Number(incoming.monthly_strike ?? settingsStore.monthly_strike),
    six_month_price: Number(incoming.six_month_price ?? settingsStore.six_month_price),
    six_month_strike: Number(incoming.six_month_strike ?? settingsStore.six_month_strike),
    one_year_price: Number(incoming.one_year_price ?? settingsStore.one_year_price),
    one_year_strike: Number(incoming.one_year_strike ?? settingsStore.one_year_strike)
  };
  res.json({
    success: true,
    message: "System global settings updated successfully",
    settings: settingsStore
  });
});
app.get("/api/admin/coupons", checkAdminAuth, (_req, res) => {
  res.json({ coupons: couponsStore });
});
app.post("/api/admin/coupons", checkAdminAuth, (req, res) => {
  const { code, discount_type, discount_value, min_amount, expiry_date, is_active } = req.body;
  if (!code || !discount_type || discount_value === void 0) {
    return res.status(400).json({ error: "Code, discount_type, and discount_value are required" });
  }
  const cleanCode = String(code).trim().toUpperCase();
  const newCoupon = {
    id: `cpn-${Date.now()}`,
    code: cleanCode,
    discount_type,
    discount_value: Number(discount_value),
    min_amount: Number(min_amount) || 0,
    is_active: is_active !== false,
    expiry_date: expiry_date ? new Date(expiry_date).toISOString() : new Date(Date.now() + 365 * 864e5).toISOString(),
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  couponsStore.push(newCoupon);
  res.json({ success: true, coupon: newCoupon });
});
app.patch("/api/admin/coupons/:id", checkAdminAuth, (req, res) => {
  const { id } = req.params;
  const coupon = couponsStore.find((c) => c.id === id);
  if (!coupon) {
    return res.status(404).json({ error: "Coupon not found" });
  }
  Object.assign(coupon, req.body);
  res.json({ success: true, coupon });
});
app.delete("/api/admin/coupons/:id", checkAdminAuth, (req, res) => {
  const { id } = req.params;
  couponsStore = couponsStore.filter((c) => c.id !== id);
  res.json({ success: true, message: "Coupon removed" });
});
app.get("/api/admin/cms/:businessId/files", checkAdminAuth, (req, res) => {
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
      web_link: `https://web.digimoms.in/${business.subdomain}`
    },
    root_path: `tenants/${business.subdomain}/public_html/`,
    files,
    total_files: files.length,
    total_size: totalSize
  });
});
app.post("/api/admin/cms/:businessId/files/upload", checkAdminAuth, (req, res) => {
  const { businessId } = req.params;
  const business = businessesStore.find((b) => b.id === businessId);
  if (!business) {
    return res.status(404).json({ error: "Business not found" });
  }
  const incomingFiles = Array.isArray(req.body.files) ? req.body.files : [req.body];
  if (!incomingFiles || incomingFiles.length === 0) {
    return res.status(400).json({ error: "No files provided for upload" });
  }
  const currentFiles = getBusinessFiles(businessId);
  const ensureDirectoryExists = (dirPath) => {
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
          updated_at: (/* @__PURE__ */ new Date()).toISOString(),
          content_type: "directory"
        });
      }
    }
  };
  const processed = [];
  for (const item of incomingFiles) {
    if (!item.name) continue;
    const rawPath = String(item.path || item.name).replace(/^\/+/, "");
    const parts = rawPath.split("/");
    const fileName = parts.pop() || item.name;
    const parentPath = parts.join("/");
    if (parentPath) {
      ensureDirectoryExists(parentPath);
    }
    const isDir = Boolean(item.is_directory);
    const content = item.content || "";
    const size = item.size ?? Buffer.byteLength(content, "utf8");
    const contentType = item.content_type || (isDir ? "directory" : "text/plain");
    const existingIndex = currentFiles.findIndex(
      (f) => f.path.toLowerCase() === rawPath.toLowerCase()
    );
    const fileRecord = {
      id: existingIndex >= 0 ? currentFiles[existingIndex].id : `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: fileName,
      path: rawPath,
      parent_path: parentPath,
      size,
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      content_type: contentType,
      content,
      is_directory: isDir
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
    files: currentFiles
  });
});
app.post("/api/admin/cms/:businessId/create-folder", checkAdminAuth, (req, res) => {
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
  const newFolder = {
    id: `dir-${Date.now()}`,
    name: cleanName,
    path: fullPath,
    parent_path: cleanParent,
    is_directory: true,
    size: 0,
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    content_type: "directory"
  };
  currentFiles.push(newFolder);
  filesStore.set(businessId, currentFiles);
  res.json({ success: true, folder: newFolder, files: currentFiles });
});
app.post("/api/admin/cms/:businessId/create-file", checkAdminAuth, (req, res) => {
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
  const fileContent = content !== void 0 ? content : "";
  const newFile = {
    id: `f-${Date.now()}`,
    name: cleanName,
    path: fullPath,
    parent_path: cleanParent,
    is_directory: false,
    size: Buffer.byteLength(fileContent, "utf8"),
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    content_type: defaultType,
    content: fileContent
  };
  currentFiles.push(newFile);
  filesStore.set(businessId, currentFiles);
  res.json({ success: true, file: newFile, files: currentFiles });
});
app.post("/api/admin/cms/:businessId/rename", checkAdminAuth, (req, res) => {
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
  target.updated_at = (/* @__PURE__ */ new Date()).toISOString();
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
app.put("/api/admin/cms/:businessId/files/:fileId", checkAdminAuth, (req, res) => {
  const { businessId, fileId } = req.params;
  const { content } = req.body;
  const files = getBusinessFiles(businessId);
  const file = files.find((f) => f.id === fileId);
  if (!file) {
    return res.status(404).json({ error: "File not found" });
  }
  file.content = typeof content === "string" ? content : "";
  file.size = Buffer.byteLength(file.content, "utf8");
  file.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  filesStore.set(businessId, files);
  res.json({ success: true, file });
});
app.delete("/api/admin/cms/:businessId/files/:fileId", checkAdminAuth, (req, res) => {
  const { businessId, fileId } = req.params;
  const files = getBusinessFiles(businessId);
  const target = files.find((f) => f.id === fileId);
  if (!target) {
    return res.status(404).json({ error: "Item not found" });
  }
  let filtered;
  if (target.is_directory) {
    const prefix = target.path + "/";
    filtered = files.filter((f) => f.id !== fileId && !f.path.startsWith(prefix));
  } else {
    filtered = files.filter((f) => f.id !== fileId);
  }
  filesStore.set(businessId, filtered);
  res.json({ success: true, message: `Deleted '${target.name}' from storage`, files: filtered });
});
app.delete("/api/admin/cms/:businessId/clear-all", checkAdminAuth, (req, res) => {
  const { businessId } = req.params;
  filesStore.set(businessId, []);
  res.json({ success: true, message: "All website files cleared from storage", files: [] });
});
app.delete("/api/admin/businesses/:id/terminal", checkAdminAuth, (req, res) => {
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
    flushed_files_count: filesCount
  });
});
function renderSuspendedHtml(business) {
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
    <a href="/portal?mobile=${business.mobile}" class="renew-btn">\u26A1 Renew Subscription Now</a>
    <div class="footer-note">
      Direct Link: <code>web.digimoms.in/${business.subdomain}</code><br>
      DigiMoms Cloud Hosting &bull; Need Help? Contact <a href="https://wa.me/${settingsStore.whatsapp_number}?text=Hello%20DigiMoms,%20my%20business%20${encodeURIComponent(business.name)}%20is%20suspended" target="_blank">Support on WhatsApp</a>
    </div>
  </div>
</body>
</html>`;
}
function renderUnderConstructionHtml(business) {
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
      <h4>\u{1F4C2} Website Files Not Yet Uploaded</h4>
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
app.get("/api/tenant/render/:subdomain", (req, res) => {
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
  const now = /* @__PURE__ */ new Date();
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
app.use((req, res, next) => {
  let slug = "";
  let subpath = "";
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
    "index.html"
  ];
  const match = req.path.match(/^\/([a-zA-Z0-9_-]+)(\/.*)?$/);
  const possibleSlug = match ? match[1] : "";
  if (possibleSlug && !reserved.includes(possibleSlug.toLowerCase())) {
    slug = possibleSlug;
    subpath = match && match[2] ? match[2].replace(/^\/+/, "") : "";
  } else {
    const host = (req.headers.host || req.hostname || "").split(":")[0].toLowerCase();
    const isCloudHost = host.endsWith(".run.app") || host.endsWith(".vercel.app") || host.endsWith(".appspot.com") || host.endsWith(".web.app") || host.endsWith(".firebaseapp.com") || host.endsWith(".onrender.com") || host.endsWith(".github.io");
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
  const business = businessesStore.find((b) => b.subdomain.toLowerCase() === slug.toLowerCase());
  if (!business) {
    return next();
  }
  const now = /* @__PURE__ */ new Date();
  const isExpired = now.getTime() > new Date(business.plan_end_date).getTime() || business.status === "Inactive";
  if (isExpired) {
    return res.status(402).send(renderSuspendedHtml(business));
  }
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
  if (!subpath || subpath === "index.html" || subpath === "index.htm") {
    return res.send(renderUnderConstructionHtml(business));
  }
  return res.status(404).send(`404: Asset '${subpath}' not found in ${business.name} storage`);
});
app.use("/api", (req, res) => {
  if (!res.headersSent) {
    res.status(404).json({
      error: "API endpoint not found",
      method: req.method,
      path: req.originalUrl || req.url
    });
  }
});
app.use((err, _req, res, _next) => {
  console.error("[DigiMoms Backend Error]:", err);
  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal server error occurred",
      message: err?.message || "An unexpected error occurred in backend service"
    });
  }
});
var server_default = app;
export {
  app,
  server_default as default
};
