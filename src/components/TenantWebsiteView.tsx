import React, { useState } from "react";
import { Globe, Shield, CreditCard, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

interface TenantWebsiteViewProps {
  subdomain: string;
}

export function TenantWebsiteView({ subdomain }: TenantWebsiteViewProps) {
  const [badgeMinimized, setBadgeMinimized] = useState<boolean>(false);

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-white overflow-hidden flex flex-col">
      {/* Full-screen Tenant Website Render Frame */}
      <iframe
        src={`/api/tenant/render/${encodeURIComponent(subdomain)}`}
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
                href="/portal"
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
