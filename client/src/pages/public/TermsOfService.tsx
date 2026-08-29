import React from 'react';
import { FileText } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>Platform Agreement & Guidelines</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-slate-500 text-xs">
            Effective Date: August 2026 • IntelliFlow Smart City Operations
          </p>
        </div>

        <div className="light-card p-8 border-slate-200 bg-white shadow-card space-y-6 text-xs text-slate-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing the IntelliFlow AI portal or services, you agree to comply with these terms, applicable metropolitan municipal regulations, and IT cyber laws.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Permitted Use of Emergency Services</h2>
            <p className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 font-medium">
              Misuse, prank calling, or fraudulent activation of the Emergency SOS feature (112 / 108 / Green Corridors) constitutes a punishable offense under the Disaster Management and Police Acts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Departmental & Role Access</h2>
            <p>
              Access to Government, Police, Municipal, and Command Center consoles is strictly restricted to verified personnel. Any attempt to escalate privileges or forge authentication headers is actively logged and reported to Cyber Crime authorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Limitation of Liability</h2>
            <p>
              While IntelliFlow AI strives for continuous 99.99% uptime, municipal telemetry and traffic advisories are provided on an "as-is" basis to assist urban mobility and civic safety.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
