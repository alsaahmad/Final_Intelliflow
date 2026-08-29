import React from 'react';
import { Lock } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>Data Protection & DPDP Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-500 text-xs">
            Last Updated: August 2026 • IntelliFlow Smart City Digital Governance
          </p>
        </div>

        <div className="light-card p-8 border-slate-200 bg-white shadow-card space-y-6 text-xs text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Overview & Commitment</h2>
            <p>
              IntelliFlow AI respects your fundamental right to privacy. This Privacy Policy details how we collect, process, and protect your personal and telemetry data when accessing smart city portals, reporting civic issues, or utilizing emergency SOS features.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Zero-Knowledge Identity Architecture</h2>
            <p>
              When authenticating via Google OAuth 2.0 or OIDC providers, IntelliFlow AI never stores raw passwords or sensitive credentials. User sessions are cryptographically signed using HttpOnly, SameSite cookies with automated server-side expiration upon logout.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Emergency Telemetry & Location Sharing</h2>
            <p>
              When a citizen activates the Emergency SOS button, precise GPS coordinates and emergency contact details are transmitted strictly to active emergency response personnel (Police, 108 EMS, Fire Rescue). This data is retained only for incident post-mortem and audit compliance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Grievance Data & Anonymity</h2>
            <p>
              Citizens may choose to submit public civic grievances anonymously. Where contact details are provided, they are only shared with the Municipal Works engineer assigned to resolve the ticket.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. Your Rights Under DPDP Act</h2>
            <p>
              Under the Digital Personal Data Protection Act, you retain the right to access your stored data, request corrections, or request complete account erasure by contacting our Data Protection Officer at <strong className="text-slate-900">dpo@intelliflow.city</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
