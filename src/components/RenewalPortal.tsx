import React, { useState, useEffect } from "react";
import { Business, AppSettings } from "../types";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Tag,
  ArrowRight,
  RefreshCw,
  Eye,
  Check,
  Loader2,
} from "lucide-react";

interface RenewalPortalProps {
  initialMobile?: string;
  onOpenAdmin?: () => void;
}

export const RenewalPortal: React.FC<RenewalPortalProps> = ({ initialMobile, onOpenAdmin }) => {
  const [mobileInput, setMobileInput] = useState<string>(initialMobile || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [business, setBusiness] = useState<(Business & { days_remaining: number; is_expired: boolean }) | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Settings & Pricing Matrix from Admin
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Modal / Plan Selection State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<"monthly" | "six_month" | "one_year">("one_year");

  // Coupon state
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  const [couponResult, setCouponResult] = useState<{
    valid: boolean;
    discount_amount: number;
    final_amount: number;
    message: string;
  } | null>(null);

  // Checkout & PayU Processing state
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tenant Preview Drawer/Modal
  const [previewSubdomain, setPreviewSubdomain] = useState<string | null>(null);

  // Fetch dynamic system settings & pricing
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      setSettings(json);
    } catch (err) {
      console.error("Failed to load pricing settings", err);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Check URL parameters for PayU callback redirects
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const txnid = urlParams.get("txnid");
    const mobile = urlParams.get("mobile");
    const error = urlParams.get("error");

    if (paymentStatus === "success" && txnid) {
      setSuccessMessage(
        `PayU payment verified successfully! Transaction ID: ${txnid}. Your subscription plan has been extended and status is now Active.`
      );
      if (mobile) {
        setMobileInput(mobile);
        handleLookup(mobile);
      }
    } else if (paymentStatus === "failed") {
      setLookupError(
        `Payment was not completed or failed on PayU: ${error || "Transaction Cancelled"}. Your subscription was not renewed.`
      );
      if (mobile) {
        setMobileInput(mobile);
        handleLookup(mobile);
      }
    } else if (initialMobile) {
      handleLookup(initialMobile);
    }
  }, [initialMobile]);

  // Mobile Input Verification
  const handleLookup = async (mobileToSearch?: string) => {
    const query = mobileToSearch || mobileInput;
    if (!query.trim()) {
      setLookupError("Please enter your 10-digit registered mobile number.");
      return;
    }

    try {
      setLoading(true);
      setLookupError(null);
      setBusiness(null);

      const res = await fetch(`/api/business/lookup?mobile=${encodeURIComponent(query.trim())}`);
      const json = await res.json();

      if (!res.ok) {
        setLookupError(json.error || "No registered business found for this mobile number.");
      } else {
        setBusiness(json.business);
      }
    } catch {
      setLookupError("Unable to connect to verification server. Please check internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Pricing helper
  const getTierPrice = (tier: "monthly" | "six_month" | "one_year") => {
    if (!settings) {
      if (tier === "monthly") return { cost: 99, strike: 999 };
      if (tier === "six_month") return { cost: 499, strike: 594 };
      return { cost: 949, strike: 1188 };
    }
    if (tier === "monthly") return { cost: settings.monthly_price, strike: settings.monthly_strike };
    if (tier === "six_month") return { cost: settings.six_month_price, strike: settings.six_month_strike };
    return { cost: settings.one_year_price, strike: settings.one_year_strike };
  };

  // Current selected tier base amount
  const currentBasePrice = getTierPrice(selectedTier).cost;
  const currentFinalPrice = couponResult?.valid ? couponResult.final_amount : currentBasePrice;

  // Validate coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setCouponLoading(true);
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          amount: currentBasePrice,
        }),
      });
      const json = await res.json();
      setCouponResult(json);
    } catch {
      setCouponResult({
        valid: false,
        discount_amount: 0,
        final_amount: currentBasePrice,
        message: "Failed to validate coupon.",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  // Re-calculate coupon when tier changes
  const handleTierSelect = (tier: "monthly" | "six_month" | "one_year") => {
    setSelectedTier(tier);
    setCouponResult(null);
    setCouponCode("");
  };

  // Initiate PayU Checkout - DIRECT REAL SUBMISSION to PayU Gateway
  const handleInitiatePayU = async () => {
    if (!business) return;
    try {
      setCheckoutLoading(true);
      const res = await fetch("/api/payu/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id,
          plan_tier: selectedTier,
          coupon_code: couponResult?.valid ? couponCode.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (json.success && json.action_url && json.payu_params) {
        // Dynamically create and submit POST form directly to PayU Hosted Checkout!
        const form = document.createElement("form");
        form.method = "POST";
        form.action = json.action_url;
        form.style.display = "none";

        Object.entries(json.payu_params).forEach(([key, val]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(val);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else {
        alert(json.error || "Unable to initiate payment with PayU. Please check merchant key and salt in Admin settings.");
      }
    } catch (err) {
      console.error("PayU initialization error", err);
      alert("Failed to connect to payment server. Please check your network connection.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const whatsappUrl = `https://wa.me/${(settings?.whatsapp_number || "+919475388085").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    settings?.whatsapp_message || "I want to renewal domain"
  )}`;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Hero / Portal Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 text-neutral-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-blue-400" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Official Dedicated SaaS Portal &bull; web.digimoms.in
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            System Billing &amp; Website Renewal Portal
          </h1>
          <p className="text-sm md:text-base text-neutral-400 mt-2 leading-relaxed">
            Verify your store subscription validity, access automated payment extensions, or request custom domain renewal.
          </p>

          {/* Mobile Input Verification Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                id="mobile-input-verify"
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value)}
                placeholder="Enter 10-Digit Registered Mobile (e.g. 9876543210)"
                className="w-full pl-11 pr-4 py-3 bg-neutral-950 border border-neutral-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm font-mono outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Verify Store <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Lookup Error Message */}
      {lookupError && (
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-sm">{lookupError}</span>
        </div>
      )}

      {/* Success Banner (after payment/simulated webhook) */}
      {successMessage && (
        <div className="p-5 bg-emerald-950 border border-emerald-700 rounded-2xl text-emerald-100 flex items-start gap-4 shadow-sm">
          <div className="p-2 bg-emerald-700 text-white rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-base text-emerald-200">Payment &amp; Instant Webhook Verification Successful!</h4>
            <p className="text-sm text-emerald-300 mt-1">{successMessage}</p>
            <p className="text-xs text-emerald-400 mt-2">
              Server-to-Server PayU Webhook verified hash integrity, extended validity date, and activated store without manual delay.
            </p>
          </div>
        </div>
      )}

      {/* Business Details Card (When Verified) */}
      {business && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{business.name}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    business.status === "Active"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                      : "bg-red-950 text-red-300 border border-red-700"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      business.status === "Active" ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  Status: {business.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 mt-2">
                <span className="font-mono">Subdomain: {business.subdomain}.digimoms.in</span>
                {business.custom_domain && (
                  <span className="font-mono text-blue-400">Custom Domain: {business.custom_domain}</span>
                )}
                <span>Mobile: +91 {business.mobile}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setPreviewSubdomain(business.subdomain)}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-sm font-medium flex items-center gap-2 transition"
                title="Preview Tenant Website (or Fallback Layout)"
              >
                <Eye className="w-4 h-4 text-blue-400" /> Live Subdomain View
              </button>

              <button
                id="renew-now-btn"
                onClick={() => {
                  setIsRenewModalOpen(true);
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition shadow-md shadow-blue-900/30"
              >
                <CreditCard className="w-4 h-4" /> Renew Now
              </button>
            </div>
          </div>

          {/* FALLBACK NOTICE: If Expired / Inactive */}
          {business.is_expired && (
            <div className="p-4 bg-red-950/70 border border-red-700 rounded-xl text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                  <div className="font-semibold text-sm text-red-100">
                    Service Suspended - Store Validity Expired
                  </div>
                  <p className="text-xs text-red-300 mt-0.5">
                    Your store ended its active term on {new Date(business.plan_end_date).toLocaleDateString()}. Public traffic to <code className="text-red-200">{business.subdomain}.digimoms.in</code> currently sees the "Service Suspended - Please Renew" placeholder layout.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewSubdomain(business.subdomain)}
                className="text-xs px-3 py-1.5 bg-red-900/90 hover:bg-red-800 text-white rounded-lg font-medium transition self-start sm:self-auto shrink-0"
              >
                Inspect Suspended Layout
              </button>
            </div>
          )}

          {/* Validity Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
              <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                Plan Validity Start
              </div>
              <div className="text-base font-bold text-neutral-200 mt-1 font-mono">
                {new Date(business.plan_start_date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Activated registration date</div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
              <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                Plan Validity End
              </div>
              <div className="text-base font-bold text-neutral-200 mt-1 font-mono">
                {new Date(business.plan_end_date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">Expiration timestamp</div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
              <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
                Time Remaining
              </div>
              <div
                className={`text-base font-bold mt-1 font-mono ${
                  business.is_expired ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {business.is_expired ? "0 Days (Expired)" : `${business.days_remaining} Days Left`}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {business.is_expired ? "Renew immediately to restore" : "Continuous uptime verified"}
              </div>
            </div>
          </div>

          {/* Section 2: Domain Renewal Redirection (Visual Card) */}
          <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800 rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold">
                Domain Service
              </div>
              <h3 className="text-lg font-bold text-white">Domain Renewal (For Custom Domain Users Only)</h3>
              <p className="text-xs text-neutral-400 max-w-xl">
                If your business utilizes an independent custom domain (such as{" "}
                <code className="text-neutral-300">{business.custom_domain || "yourstore.com"}</code>), connect directly with our engineering registry via WhatsApp for manual DNS and registrar extensions.
              </p>
            </div>

            <a
              id="domain-renewal-whatsapp-btn"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm flex items-center gap-2.5 transition shadow-sm shrink-0"
            >
              <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
              Renew Custom Domain on WhatsApp
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>
          </div>
        </div>
      )}

      {/* RENEWAL PAYMENT PACKAGE MATRIX MODAL */}
      {isRenewModalOpen && business && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-2xl p-6 md:p-8 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-xl font-bold text-white">Renew Subscription Package</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Extending subscription validity for: <span className="text-blue-400 font-semibold">{business.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="text-neutral-400 hover:text-white text-lg px-2.5 py-1 rounded-lg hover:bg-neutral-800 transition"
              >
                &times;
              </button>
            </div>

            {/* Package Selection Matrix & Coupon */}
            <div className="mt-6 space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Select Renewal Tier
                  </label>

                  {/* 3 Customizable Tiers (populated dynamically from settings) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3">
                    {/* Tier 1: Monthly Plan */}
                    <div
                      onClick={() => handleTierSelect("monthly")}
                      className={`cursor-pointer rounded-xl p-4 border transition relative ${
                        selectedTier === "monthly"
                          ? "bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20"
                          : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-neutral-200">Monthly Plan</span>
                        {selectedTier === "monthly" && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="mt-3">
                        <span className="text-xs text-neutral-500 line-through mr-2 font-mono">
                          &#8377;{getTierPrice("monthly").strike}
                        </span>
                        <span className="text-xl font-bold font-mono text-white">
                          &#8377;{getTierPrice("monthly").cost}
                        </span>
                        <div className="text-[11px] text-neutral-400 mt-1">Valid for 30 Days</div>
                      </div>
                    </div>

                    {/* Tier 2: 6-Month Plan */}
                    <div
                      onClick={() => handleTierSelect("six_month")}
                      className={`cursor-pointer rounded-xl p-4 border transition relative ${
                        selectedTier === "six_month"
                          ? "bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20"
                          : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-neutral-200">6-Month Plan</span>
                        {selectedTier === "six_month" && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="mt-3">
                        <span className="text-xs text-neutral-500 line-through mr-2 font-mono">
                          &#8377;{getTierPrice("six_month").strike}
                        </span>
                        <span className="text-xl font-bold font-mono text-white">
                          &#8377;{getTierPrice("six_month").cost}
                        </span>
                        <div className="text-[11px] text-neutral-400 mt-1">Valid for 180 Days</div>
                      </div>
                    </div>

                    {/* Tier 3: 1-Year Plan (Recommended) */}
                    <div
                      onClick={() => handleTierSelect("one_year")}
                      className={`cursor-pointer rounded-xl p-4 border transition relative ${
                        selectedTier === "one_year"
                          ? "bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20"
                          : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <span className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Best Value
                      </span>
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-neutral-200">1-Year Plan</span>
                        {selectedTier === "one_year" && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="mt-3">
                        <span className="text-xs text-neutral-500 line-through mr-2 font-mono">
                          &#8377;{getTierPrice("one_year").strike}
                        </span>
                        <span className="text-xl font-bold font-mono text-emerald-400">
                          &#8377;{getTierPrice("one_year").cost}
                        </span>
                        <div className="text-[11px] text-neutral-400 mt-1">Valid for 365 Days</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Automated Voucher / Coupon Entry Box */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-400" /> Have a Discount Coupon?
                    </label>
                    <span className="text-[11px] text-neutral-500">Try coupon: RENEW50 or DIGI20</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="coupon-input"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="ENTER COUPON CODE"
                      className="flex-1 bg-neutral-900 border border-neutral-700 focus:border-blue-500 rounded-lg px-3 py-2 text-sm font-mono text-neutral-100 uppercase outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 rounded-lg text-xs font-semibold transition"
                    >
                      {couponLoading ? "Validating..." : "Apply Coupon"}
                    </button>
                  </div>

                  {couponResult && (
                    <div
                      className={`mt-2 text-xs p-2 rounded-lg flex items-center justify-between ${
                        couponResult.valid
                          ? "bg-emerald-950/70 border border-emerald-800 text-emerald-300"
                          : "bg-red-950/70 border border-red-800 text-red-300"
                      }`}
                    >
                      <span>{couponResult.message}</span>
                      {couponResult.valid && (
                        <span className="font-mono font-bold">-&#8377;{couponResult.discount_amount}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Final Billing Calculation Ledger */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-neutral-400">
                    <span>Base Tier Price:</span>
                    <span className="font-mono text-neutral-200">&#8377;{currentBasePrice.toFixed(2)}</span>
                  </div>
                  {couponResult?.valid && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Voucher Discount ({couponCode}):</span>
                      <span className="font-mono">-&#8377;{couponResult.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-neutral-800 pt-2 flex justify-between font-bold text-base text-white">
                    <span>Total Payable Amount:</span>
                    <span className="font-mono text-xl text-blue-400">&#8377;{currentFinalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Proceed to Pay with PayU Button (Single Direct Action) */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsRenewModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-neutral-400 hover:text-white text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleInitiatePayU}
                    disabled={checkoutLoading}
                    className="px-7 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to PayU...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Pay &#8377;{currentFinalPrice.toFixed(2)} with PayU <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* TENANT SUBDOMAIN LIVE PREVIEW MODAL */}
      {previewSubdomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-4xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Top Bar */}
            <div className="bg-neutral-950 border-b border-neutral-800 px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 font-mono text-xs text-neutral-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Simulating Tenant URL:</span>
                <span className="bg-neutral-800 px-2 py-0.5 rounded text-blue-400 font-semibold">
                  https://{previewSubdomain}.digimoms.in
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/tenant/render/${previewSubdomain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewSubdomain(null)}
                  className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition text-lg leading-none"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Iframe View */}
            <div className="flex-1 w-full bg-white">
              <iframe
                src={`/api/tenant/render/${previewSubdomain}`}
                title={`Tenant Preview - ${previewSubdomain}`}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
