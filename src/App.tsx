import React, { useState, useEffect } from "react";
import { RenewalPortal } from "./components/RenewalPortal";
import { AdminPortal } from "./components/AdminPortal";
import { TenantWebsiteView } from "./components/TenantWebsiteView";
import { LegalPagesModal, LegalTab } from "./components/LegalPages";
import {
  Globe,
  Shield,
  CreditCard,
  Layers,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  FileText,
} from "lucide-react";

const RESERVED_SLUGS = [
  "admin",
  "portal",
  "api",
  "assets",
  "src",
  "public",
  "favicon.ico",
  "robots.txt",
  "index.html",
  "vite",
  "@vite",
  "health",
  "status",
];

function getInitialRoute(): { view: "portal" | "admin" | "tenant"; tenantSlug?: string } {
  if (typeof window === "undefined") return { view: "portal" };

  const host = window.location.hostname.toLowerCase();

  // Cloud preview domains (e.g. *.run.app, *.vercel.app) MUST NEVER be treated as tenant subdomains!
  const isCloudHost =
    host.endsWith(".run.app") ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".appspot.com") ||
    host.endsWith(".web.app") ||
    host.endsWith(".firebaseapp.com") ||
    host.endsWith(".onrender.com") ||
    host.endsWith(".github.io");

  // 1. Check Subdomain in Hostname ONLY for digimoms.in or local development (*.localhost)
  if (!isCloudHost) {
    if (host.endsWith(".web.digimoms.in")) {
      const sub = host.replace(".web.digimoms.in", "").trim();
      if (sub && sub !== "web" && sub !== "www" && !RESERVED_SLUGS.includes(sub)) {
        return { view: "tenant", tenantSlug: sub };
      }
    } else if (host.endsWith(".digimoms.in")) {
      const sub = host.replace(".digimoms.in", "").trim();
      if (sub && sub !== "web" && sub !== "www" && !RESERVED_SLUGS.includes(sub)) {
        return { view: "tenant", tenantSlug: sub };
      }
    } else if (host.endsWith(".localhost")) {
      const sub = host.replace(".localhost", "").trim();
      if (sub && !RESERVED_SLUGS.includes(sub)) {
        return { view: "tenant", tenantSlug: sub };
      }
    }
  }

  // 2. Check Pathname (e.g. /royalsweets or /admin or /portal)
  const path = window.location.pathname;
  if (path === "/admin" || path.startsWith("/admin/")) {
    return { view: "admin" };
  }
  if (path === "/portal" || path.startsWith("/portal/")) {
    return { view: "portal" };
  }

  // Check if root or empty
  if (path === "/" || path === "") {
    return { view: "portal" };
  }

  // Check for tenant path (e.g. /royalsweets or /apexstudio)
  const match = path.match(/^\/([a-zA-Z0-9_-]+)(\/.*)?$/);
  if (match && match[1]) {
    const slug = match[1].toLowerCase();
    const isSystemOrPreview =
      slug.startsWith("ais-") ||
      slug.includes("ais-dev") ||
      slug.includes("ais-pre") ||
      slug.length > 35;

    if (!RESERVED_SLUGS.includes(slug) && !isSystemOrPreview) {
      return { view: "tenant", tenantSlug: slug };
    }
  }

  return { view: "portal" };
}

export default function App() {
  const [routeInfo, setRouteInfo] = useState<{ view: "portal" | "admin" | "tenant"; tenantSlug?: string }>(getInitialRoute);
  const [showDeploymentManual, setShowDeploymentManual] = useState<boolean>(false);
  const [legalModalOpen, setLegalModalOpen] = useState<boolean>(false);
  const [legalTab, setLegalTab] = useState<LegalTab>("terms");

  const openLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalModalOpen(true);
  };

  useEffect(() => {
    const handlePopState = () => {
      setRouteInfo(getInitialRoute());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (view: "portal" | "admin") => {
    setRouteInfo({ view });
    window.history.pushState(null, "", view === "admin" ? "/admin" : "/portal");
  };

  // If viewing a tenant client's website (e.g. web.digimoms.in/royalsweets)
  if (routeInfo.view === "tenant" && routeInfo.tenantSlug) {
    return <TenantWebsiteView subdomain={routeInfo.tenantSlug} />;
  }

  const currentView = routeInfo.view === "admin" ? "admin" : "portal";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Global Navigation Bar for web.digimoms.in */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  DigiMoms <span className="text-blue-400">Cloud SaaS</span>
                </span>
                <span className="bg-neutral-800 text-neutral-300 font-mono text-[11px] px-2 py-0.5 rounded-full border border-neutral-700">
                  web.digimoms.in
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Multi-Tenant Website Renewals &amp; Master Admin Management
              </p>
            </div>
          </div>

          {/* View Switcher Controls */}
          <div className="flex items-center gap-2">
            <a
              href="https://digimoms.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-medium border border-neutral-700 transition"
              title="Official Agency Website for all services"
            >
              <span>Visit digimoms.in</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>

            <nav className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-semibold">
              <button
                onClick={() => navigateTo("portal")}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  currentView === "portal"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Public Renewal Portal
              </button>
              <button
                onClick={() => navigateTo("admin")}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  currentView === "admin"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Go Admin Console
              </button>
            </nav>

            <button
              onClick={() => openLegal("terms")}
              className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition cursor-pointer"
              title="Legal Policies & Terms"
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowDeploymentManual(true)}
              className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition cursor-pointer"
              title="View Deployment Manual & Instructions"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main App Content Body */}
      <main className="px-4 lg:px-8 py-8">
        {currentView === "portal" ? (
          <RenewalPortal onOpenAdmin={() => navigateTo("admin")} />
        ) : (
          <AdminPortal />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-900 bg-neutral-950 px-4 py-10 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Main agency callout */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <div className="text-white font-semibold text-sm">
                Need a new website, custom software, or digital marketing?
              </div>
              <p className="text-neutral-400 text-xs mt-0.5">
                This renewal portal is for existing client maintenance. For all other business inquiries, visit our main agency portal.
              </p>
            </div>
            <a
              href="https://digimoms.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition shadow-sm shrink-0"
            >
              Visit digimoms.in <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Links & Legal Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-neutral-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Dedicated Multi-Tenant System running for <strong>web.digimoms.in</strong></span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-neutral-400">
              <button
                onClick={() => openLegal("terms")}
                className="hover:text-blue-400 transition cursor-pointer"
              >
                Terms &amp; Conditions
              </button>
              <span>&bull;</span>
              <button
                onClick={() => openLegal("privacy")}
                className="hover:text-blue-400 transition cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>&bull;</span>
              <button
                onClick={() => openLegal("refund")}
                className="hover:text-blue-400 transition cursor-pointer"
              >
                Refund &amp; Cancellation
              </button>
              <span>&bull;</span>
              <button
                onClick={() => openLegal("contact")}
                className="hover:text-blue-400 transition cursor-pointer"
              >
                Contact &amp; Grievance
              </button>
              <span>&bull;</span>
              <span className="text-emerald-400">PayU Webhook Active</span>
            </div>
          </div>

          <div className="text-center text-[11px] text-neutral-600 pt-1">
            &copy; {new Date().getFullYear()} DigiMoms Agency. Official Domain: <a href="https://digimoms.in" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-blue-400 underline">digimoms.in</a>. All rights reserved.
          </div>
        </div>
      </footer>

      {/* LEGAL & COMPLIANCE MODAL */}
      <LegalPagesModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
      />

      {/* DEPLOYMENT & MANUAL INSTRUCTIONS DRAWER/MODAL */}
      {showDeploymentManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-3xl max-h-[85vh] rounded-2xl p-6 md:p-8 text-neutral-200 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-950 text-blue-400 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Manual Deployment &amp; Hosting Guide</h3>
                  <p className="text-xs text-neutral-400">
                    Step-by-step instructions for non-programmers to deploy on <code>web.digimoms.in</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeploymentManual(false)}
                className="text-neutral-400 hover:text-white text-xl px-2"
              >
                &times;
              </button>
            </div>

            <div className="mt-6 space-y-6 text-xs text-neutral-300 leading-relaxed">
              {/* Step 1 */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" /> 1. Subdomain DNS Setup on your Registrar (cPanel / Cloudflare / GoDaddy)
                </div>
                <p>
                  Since this application is strictly independent and hosted under <strong>web.digimoms.in</strong>, add the following DNS record under the <code>digimoms.in</code> domain:
                </p>
                <div className="bg-neutral-900 p-3 rounded-lg font-mono text-[11px] space-y-1">
                  <div>Type: <strong>A</strong> or <strong>CNAME</strong></div>
                  <div>Host / Name: <strong>web</strong> (evaluates to <code>web.digimoms.in</code>)</div>
                  <div>Target / Points to: <strong>Your Server IP</strong> or <strong>App URL</strong></div>
                  <div>TTL: <strong>Auto</strong> or <strong>3600</strong></div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" /> 2. Supabase Database &amp; Storage Configuration
                </div>
                <p>
                  1. Log into your Supabase Dashboard (<a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">supabase.com</a>).<br />
                  2. Open the <strong>SQL Editor</strong>, click <strong>New Query</strong>.<br />
                  3. Copy the production SQL script from the <strong>SQL &amp; Host Routing Guide</strong> tab in the Go Admin console.<br />
                  4. Click <strong>RUN</strong> to create the <code>businesses</code>, <code>transactions</code>, <code>coupons</code>, and <code>settings</code> tables, plus the <code>get_database_size()</code> function and Row Level Security rules.<br />
                  5. In Supabase &gt; Storage, verify that the <code>client-assets</code> bucket exists.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" /> 3. PayU Payment Gateway Webhook Setup
                </div>
                <p>
                  1. Log into your PayU Merchant Dashboard.<br />
                  2. Under Integration Details, copy your <strong>Merchant Key</strong> and <strong>Salt</strong>.<br />
                  3. In this application&apos;s <strong>Global Management Controls</strong>, paste your Key and Salt.<br />
                  4. Under PayU Webhooks, register the standalone listener URL:<br />
                  <code className="text-blue-400 font-mono bg-neutral-900 px-2 py-1 rounded inline-block mt-1">
                    https://web.digimoms.in/api/payu-webhook
                  </code>
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" /> 4. File Structure &amp; Names Reference
                </div>
                <div className="font-mono text-[11px] text-neutral-400 space-y-1">
                  <div><code>/server.ts</code> &rarr; Standalone Node/Express backend with PayU Webhook &amp; DB RPC endpoints</div>
                  <div><code>/src/data/schema.sql</code> &rarr; Complete Supabase PostgreSQL table &amp; RLS migrations</div>
                  <div><code>/src/components/LegalPages.tsx</code> &rarr; Terms &amp; Conditions, Privacy Policy, &amp; PayU Refund Policy</div>
                  <div><code>/src/components/RenewalPortal.tsx</code> &rarr; Public Mobile Verification, Pricing Matrix, &amp; WhatsApp Domain Renewal</div>
                  <div><code>/src/components/AdminPortal.tsx</code> &rarr; Directory Ledger, Chronological Override, CMS Virtual Files &amp; Nuclear Purge</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDeploymentManual(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs transition"
              >
                Close Manual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
