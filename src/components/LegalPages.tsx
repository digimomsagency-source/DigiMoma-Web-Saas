import React, { useState } from "react";
import { Shield, FileText, RefreshCw, PhoneCall, ExternalLink, X, ChevronRight, Lock, CheckCircle2 } from "lucide-react";

export type LegalTab = "terms" | "privacy" | "refund" | "contact";

interface LegalPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalPagesModal: React.FC<LegalPagesModalProps> = ({
  isOpen,
  onClose,
  initialTab = "terms",
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col text-neutral-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                DigiMoms Legal &amp; Compliance Center
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                  PayU Verified
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Official terms, privacy standards, and refund guidelines for DigiMoms Web Services
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("terms")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === "terms"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Terms &amp; Conditions
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === "privacy"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab("refund")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === "refund"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Cancellation &amp; Refund
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
              activeTab === "contact"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" /> Contact &amp; digimoms.in
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-neutral-300 leading-relaxed">
          
          {/* NOTICE BANNER: For other services, visit digimoms.in */}
          <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/40 border border-blue-800/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-white font-bold text-sm flex items-center gap-2">
                <span>Looking for New Web Development, SEO, or App Services?</span>
              </div>
              <p className="text-neutral-400 text-xs mt-0.5">
                This portal (<code>web.digimoms.in</code>) is dedicated exclusively to annual renewals and active client hosting. For all other creative and technical solutions, visit our main agency site.
              </p>
            </div>
            <a
              href="https://digimoms.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition shadow shrink-0"
            >
              Visit digimoms.in <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* TAB 1: TERMS & CONDITIONS */}
          {activeTab === "terms" && (
            <div className="space-y-4">
              <div className="border-b border-neutral-800 pb-2">
                <h3 className="text-base font-bold text-white">Terms and Conditions of Service</h3>
                <p className="text-[11px] text-neutral-400">Last updated: September 2026 &bull; DigiMoms Digital Agency</p>
              </div>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">1. Introduction &amp; Scope</h4>
                <p>
                  Welcome to <strong>DigiMoms</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). These Terms and Conditions govern the annual maintenance, cloud hosting, multi-tenant subdomains, and technical management provided to registered businesses and clients through our renewal portal at <code>web.digimoms.in</code> and main site at <code>digimoms.in</code>.
                </p>
                <p>
                  By verifying your registered business mobile number and initiating an annual renewal payment, you acknowledge and agree to be bound by these Terms.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">2. Annual Hosting &amp; Maintenance Subscriptions</h4>
                <p>
                  Annual renewals cover active DNS routing, SSL certificates, cloud storage server allocation, server security updates, and routine maintenance for your business website. Renewal charges are billed on an annual cycle as shown on your business verification statement.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                  <li><strong>Active Period:</strong> Subscriptions remain active for 365 calendar days from the previous expiration date.</li>
                  <li><strong>Grace Period:</strong> A 30-day grace period is provided following expiry during which the website remains accessible.</li>
                  <li><strong>Suspension:</strong> Failure to renew past the grace period may result in automated temporary downtime until payment confirmation.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">3. Client Content &amp; Intellectual Property</h4>
                <p>
                  Clients retain complete ownership of all trademarks, business logos, photographs, menus, and text content published on their website. DigiMoms reserves the right to suspend or remove content that violates Indian law, the Information Technology Act 2000, or infringes on third-party intellectual property.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">4. Limitation of Liability &amp; SLA</h4>
                <p>
                  DigiMoms strives for 99.9% uptime across all multi-tenant client sites. However, we are not liable for transient network disruptions caused by upstream cloud providers, domain registry authorities, or force majeure events.
                </p>
              </section>
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <div className="border-b border-neutral-800 pb-2">
                <h3 className="text-base font-bold text-white">Privacy Policy &amp; Data Protection</h3>
                <p className="text-[11px] text-neutral-400">Compliance with Information Technology Act (2000) &amp; Digital Personal Data Protection Act</p>
              </div>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">1. Information We Collect</h4>
                <p>
                  To facilitate seamless annual renewals and verify registered client accounts, we collect:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                  <li>Registered Business Name and Authorized Representative Name.</li>
                  <li>Registered 10-digit Indian Mobile Phone Number.</li>
                  <li>Registered Business Email Address and Subdomain Identifier.</li>
                  <li>Billing metadata and PayU Transaction Reference IDs.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">2. Payment Security &amp; No Card Storage</h4>
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Zero Financial Credential Storage:</span> DigiMoms does not capture, store, or process your credit/debit card numbers, CVVs, netbanking credentials, or UPI PINs. All online payments are handled directly by RBI-licensed payment gateway partners (PayU Payments Private Limited) with PCI-DSS 256-bit SSL encryption.
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">3. Data Usage &amp; Third-Party Non-Disclosure</h4>
                <p>
                  Your business contact information is strictly utilized to send automated renewal reminders, payment receipts, and critical server maintenance alerts. We never sell, rent, or trade client information to advertisers or marketing third parties.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">4. Grievance Redressal</h4>
                <p>
                  In accordance with the Information Technology Act 2000 and rules made thereunder, any grievance regarding data privacy may be escalated to our Grievance Officer at <code>contact@digimoms.in</code>.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: REFUND & CANCELLATION */}
          {activeTab === "refund" && (
            <div className="space-y-4">
              <div className="border-b border-neutral-800 pb-2">
                <h3 className="text-base font-bold text-white">Cancellation &amp; Refund Policy</h3>
                <p className="text-[11px] text-neutral-400">PayU Payment Gateway Merchant Guideline Compliant</p>
              </div>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">1. Cancellation Window</h4>
                <p>
                  Clients may request the cancellation of an annual hosting renewal within <strong>7 calendar days</strong> from the date of successful transaction, provided that automated registry fees for third-party domain extensions have not yet been irrevocably dispatched.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">2. Refund Eligibility &amp; Deductions</h4>
                <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                  <li><strong>Full Refund:</strong> If a duplicate payment occurred due to network timeout or gateway delay.</li>
                  <li><strong>Partial Refund:</strong> Annual hosting fees may be refunded pro-rata minus third-party registry costs (.in/.com registrar registration or renewal fees are non-refundable per ICANN/NIXI guidelines).</li>
                  <li><strong>Non-refundable:</strong> Once 7 calendar days have elapsed following renewal confirmation, annual hosting fees are non-refundable.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">3. Refund Processing Timeline</h4>
                <p>
                  Upon approval by DigiMoms accounts team, refunds are routed directly through PayU to the original payment source (UPI, Credit/Debit Card, or Netbanking). Funds typically reflect in your account within <strong>5 to 7 business banking days</strong> depending on your issuing bank.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-semibold text-white text-sm">4. How to Request a Refund</h4>
                <p>
                  To submit a cancellation or refund inquiry, send an email to <code>contact@digimoms.in</code> with your Business Name, Mobile Number, and PayU Transaction ID.
                </p>
              </section>
            </div>
          )}

          {/* TAB 4: CONTACT & DIGIMOMS.IN */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <div className="border-b border-neutral-800 pb-2">
                <h3 className="text-base font-bold text-white">Company Information &amp; Official Inquiries</h3>
                <p className="text-[11px] text-neutral-400">DigiMoms Digital Solutions &bull; Official Business Details</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Official Website</div>
                  <div className="text-sm font-bold text-blue-400">
                    <a href="https://digimoms.in" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1.5">
                      digimoms.in <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-[11px] text-neutral-400 pt-1">
                    For all agency services, custom website design, web apps, eCommerce, and digital marketing.
                  </p>
                </div>

                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Renewal Portal</div>
                  <div className="text-sm font-bold text-emerald-400">
                    <span>web.digimoms.in</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 pt-1">
                    Dedicated client portal for annual hosting, SSL, and server maintenance renewals.
                  </p>
                </div>

                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Support Email</div>
                  <div className="text-sm font-bold text-white">
                    <a href="mailto:contact@digimoms.in" className="hover:underline text-blue-400">
                      contact@digimoms.in
                    </a>
                  </div>
                  <p className="text-[11px] text-neutral-400 pt-1">
                    Priority response within 12-24 business hours for billing and technical queries.
                  </p>
                </div>

                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Helpdesk / WhatsApp</div>
                  <div className="text-sm font-bold text-white">
                    <span>+91 9475388085</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 pt-1">
                    Operating Hours: Mon - Sat, 10:00 AM to 7:00 PM IST.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                <div className="text-xs font-semibold text-white mb-1">Other Professional Services at digimoms.in:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-blue-400" /> UI/UX Web Design</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-blue-400" /> E-commerce Stores</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-blue-400" /> Search Engine (SEO)</div>
                  <div className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-blue-400" /> Cloud Hosting &amp; SSL</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/70 text-xs">
          <div className="text-neutral-500">
            &copy; {new Date().getFullYear()} DigiMoms. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://digimoms.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              digimoms.in <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
