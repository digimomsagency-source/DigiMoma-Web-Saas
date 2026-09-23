import React, { useState } from "react";
import { RenewalPortal } from "./components/RenewalPortal";
import { AdminPortal } from "./components/AdminPortal";
import {
  Globe,
  Shield,
  CreditCard,
  Layers,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<"portal" | "admin">("portal");
  const [showDeploymentManual, setShowDeploymentManual] = useState<boolean>(false);

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
            <nav className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-semibold">
              <button
                onClick={() => setCurrentView("portal")}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  currentView === "portal"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Public Renewal Portal
              </button>
              <button
                onClick={() => setCurrentView("admin")}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  currentView === "admin"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Go Admin Console
              </button>
            </nav>

            <button
              onClick={() => setShowDeploymentManual(true)}
              className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition"
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
          <RenewalPortal onOpenAdmin={() => setCurrentView("admin")} />
        ) : (
          <AdminPortal />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-900 bg-neutral-950 px-4 py-8 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Dedicated Multi-Tenant System running for <strong>web.digimoms.in</strong></span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>PayU Server-to-Server Webhook Active</span>
            <span>&bull;</span>
            <span>Supabase Free Tier (500 MB Limit Tracker)</span>
          </div>
        </div>
      </footer>

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
                  <div><code>/src/components/StorageTracker.tsx</code> &rarr; 500MB Live Storage Tracker with 80% (400MB) warning banner</div>
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
