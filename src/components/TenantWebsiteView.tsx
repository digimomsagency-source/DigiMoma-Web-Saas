import React, { useState, useEffect } from "react";
import { Globe, Shield, CreditCard, ChevronDown, ChevronUp, ArrowLeft, AlertTriangle, MessageCircle, ExternalLink, RefreshCw } from "lucide-react";

interface TenantWebsiteViewProps {
  subdomain: string;
}

interface BusinessStatus {
  id: string;
  name: string;
  mobile: string;
  subdomain: string;
  status: string;
  is_expired: boolean;
  plan_end_date: string;
  days_remaining?: number;
}

export function TenantWebsiteView({ subdomain }: TenantWebsiteViewProps) {
  const [badgeMinimized, setBadgeMinimized] = useState<boolean>(false);
  const [business, setBusiness] = useState<BusinessStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        setLoading(true);
        const res = await fetch(`/api/business/lookup?subdomain=${encodeURIComponent(subdomain)}`);
        if (res.status === 404) {
          if (isMounted) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (isMounted && data.business) {
          setBusiness(data.business);
        }
      } catch (err) {
        console.error("Failed to verify tenant validity:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [subdomain]);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-semibold text-neutral-300">Verifying domain validity &amp; subscription...</h3>
        <p className="text-xs text-neutral-500 font-mono mt-1">web.digimoms.in/{subdomain}</p>
      </div>
    );
  }

  // Case 1: Tenant is explicitly expired or marked Inactive -> Show suspension screen immediately
  const isExpired = business && (
    business.is_expired ||
    business.status === "Inactive" ||
    (business.plan_end_date && new Date(business.plan_end_date).getTime() <= Date.now())
  );

  if (isExpired && business) {
    const expiryFormatted = new Date(business.plan_end_date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-10 text-center shadow-2xl relative overflow-hidden">
          {/* Top highlight glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-red-500 rounded-full blur-[2px]" />

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-700/60 text-red-300 text-xs font-bold tracking-wide uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Website Suspended &bull; Renewal Required
          </div>

          {/* Business Details */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            {business.name}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-mono mb-4">
            web.digimoms.in/{business.subdomain}
          </p>

          <p className="text-sm text-neutral-300 leading-relaxed mb-6">
            This business website subscription validity expired on{" "}
            <strong className="text-white font-semibold">{expiryFormatted}</strong>.
            Public website rendering is temporarily suspended until domain renewal is completed.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <a
              href={`/portal?mobile=${encodeURIComponent(business.mobile)}`}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4" /> Renew Store Subscription Now
            </a>

            <a
              href={`https://wa.me/919475388085?text=Hello%20DigiMoms,%20my%20business%20website%20${encodeURIComponent(business.name)}%20(web.digimoms.in/${encodeURIComponent(business.subdomain)})%20is%20suspended.%20Please%20help%20me%20renew.`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-6 bg-emerald-700/20 hover:bg-emerald-700/30 border border-emerald-600/40 text-emerald-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4" /> Contact DigiMoms Support on WhatsApp
            </a>
          </div>

          {/* Agency Callout */}
          <div className="mt-8 pt-6 border-t border-neutral-800 text-xs text-neutral-500 space-y-2">
            <div>
              Looking for custom website design, e-commerce, or marketing?{" "}
              <a
                href="https://digimoms.in"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
              >
                Visit digimoms.in <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div>
              <a href="/portal" className="text-neutral-400 hover:text-white transition">
                &larr; Back to DigiMoms Renewal Portal
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Business 404
  if (!loading && notFound) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <Globe className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">404 - Business Not Found</h2>
          <p className="text-sm text-neutral-400 mb-6">
            No registered client website found under address: <br />
            <code className="text-blue-400 font-mono text-xs">web.digimoms.in/{subdomain}</code>
          </p>
          <a
            href="/portal"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs inline-flex items-center gap-2 transition"
          >
            Go to DigiMoms Portal
          </a>
        </div>
      </div>
    );
  }

  // Case 3: Business is Active or Loading -> Render Iframe
  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-white overflow-hidden flex flex-col">
      {/* Full-screen Tenant Website Render Frame */}
      <iframe
        src={`/api/tenant/render/${encodeURIComponent(subdomain)}?t=${Date.now()}`}
        className="w-full h-full flex-1 border-0"
        title={`${subdomain} - Live Website`}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />

      {/* Floating SaaS Badge & Quick Action Menu (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-50 transition-all duration-300">
        {badgeMinimized ? (
          <button
            onClick={() => setBadgeMinimized(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-white rounded-full shadow-lg border border-neutral-700 text-[11px] backdrop-blur-sm transition cursor-pointer"
            title="Expand DigiMoms SaaS Platform Badge"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold font-mono">DigiMoms Cloud</span>
            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        ) : (
          <div className="bg-neutral-950/95 text-white border border-neutral-800 rounded-2xl shadow-2xl p-3.5 max-w-xs backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-neutral-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">DigiMoms Cloud</div>
                  <div className="text-[10px] text-neutral-400 font-mono">web.digimoms.in/{subdomain}</div>
                </div>
              </div>
              <button
                onClick={() => setBadgeMinimized(true)}
                className="text-neutral-400 hover:text-white p-1 rounded transition cursor-pointer"
                title="Minimize badge"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2.5 flex items-center gap-2 text-[11px]">
              <a
                href={business?.mobile ? `/portal?mobile=${encodeURIComponent(business.mobile)}` : "/portal"}
                className="flex-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg flex items-center justify-center gap-1 transition text-center"
              >
                <CreditCard className="w-3 h-3" /> Renew Domain
              </a>
              <a
                href="/admin"
                className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-lg flex items-center justify-center gap-1 transition text-center"
              >
                <Shield className="w-3 h-3" /> Admin
              </a>
            </div>

            <div className="mt-2 pt-2 border-t border-neutral-800/60 text-center">
              <a
                href="/portal"
                className="inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-blue-400 transition"
              >
                <ArrowLeft className="w-3 h-3" /> Back to DigiMoms Portal
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
