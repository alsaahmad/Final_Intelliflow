import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Cpu,
  Lock,
  Users,
  HeartPulse,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>Platform Overview & Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            About IntelliFlow AI
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            IntelliFlow AI is a production-grade Smart City Digital Twin and Multi-Agency Governance Platform designed to synchronize urban infrastructure, emergency response fleets, and citizen engagement into one intelligent ecosystem.
          </p>
        </div>

        {/* System Architecture Tree Card (Matching the user's diagram) */}
        <div className="light-card p-8 sm:p-10 border-slate-200 shadow-card space-y-8 bg-white">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Platform Role & Authorization Architecture
            </h2>
            <p className="text-xs text-slate-500">
              Visual hierarchy of authentication gateway to departmental role authorization:
            </p>
          </div>

          {/* Interactive Hierarchy Flow Diagram */}
          <div className="max-w-4xl mx-auto p-6 rounded-2xl bg-slate-50/80 border border-slate-200 text-center space-y-6">
            {/* Step 1: Login */}
            <div className="inline-block px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-md">
              LOGIN GATEWAY
            </div>
            <div className="text-slate-400 font-black text-xl">↓</div>

            {/* Step 2: Authentication */}
            <div className="inline-block px-6 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-sm shadow-md">
              OAUTH 2.0 / OIDC AUTHENTICATION (PKCE)
            </div>
            <div className="text-slate-400 font-black text-xl">↓</div>

            {/* Step 3: Role Authorization */}
            <div className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md">
              ZERO-KNOWLEDGE SESSION AUTHORIZATION / ROLE
            </div>
            <div className="text-slate-400 font-black text-xl">↓</div>

            {/* 3 Main Branches */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Branch 1: Citizen */}
              <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-subtle text-left space-y-2">
                <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
                  <Users className="w-4 h-4" />
                  <span>1. CITIZEN</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Citizen Portal (`/citizen`): City Map, Smart Parking, Civic Reporting, Emergency SOS.
                </p>
              </div>

              {/* Branch 2: Government & Responders */}
              <div className="p-4 rounded-xl bg-white border border-indigo-200 shadow-subtle text-left space-y-3">
                <div className="flex items-center space-x-2 text-indigo-800 font-bold text-sm">
                  <Shield className="w-4 h-4" />
                  <span>2. GOVERNMENT</span>
                </div>
                <div className="space-y-2 border-t border-slate-100 pt-2 text-[11px]">
                  <div className="p-2 rounded bg-indigo-50/60 font-semibold text-indigo-900">
                    👮 Traffic Police (`/traffic-police`)
                  </div>
                  <div className="p-2 rounded bg-teal-50/60 font-semibold text-teal-900">
                    🏢 Municipal Corporation (`/municipal`)
                  </div>
                  <div className="p-2 rounded bg-rose-50/60 font-semibold text-rose-900">
                    🚑 Ambulance Responder (`/ambulance`)
                  </div>
                  <div className="p-2 rounded bg-emerald-50/60 font-semibold text-emerald-900">
                    🏥 Hospital Emergency (`/hospital`)
                  </div>
                </div>
              </div>

              {/* Branch 3: Command & Admin */}
              <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-subtle text-left space-y-3">
                <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                  <Flame className="w-4 h-4" />
                  <span>3. COMMAND & ADMIN</span>
                </div>
                <div className="space-y-2 border-t border-slate-100 pt-2 text-[11px]">
                  <div className="p-2 rounded bg-amber-50/60 font-semibold text-amber-900">
                    🛰️ Command Center ICCC (`/command-center`)
                  </div>
                  <div className="p-2 rounded bg-purple-50/60 font-semibold text-purple-900">
                    🛡️ System Administrator (`/admin`)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Pillars of Technology */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="light-card p-6 border-slate-200 space-y-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Adaptive AI Digital Twin</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consolidates thousands of IoT traffic cameras, environmental sensors, GPS telemetry from emergency vehicles, and smart parking bays into an interactive 3D digital model.
            </p>
          </div>

          <div className="light-card p-6 border-slate-200 space-y-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Emergency Green Corridors</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dynamically clears traffic signal waves along ambulance transit routes to reduce hospital transfer times by over 40% during critical medical and trauma events.
            </p>
          </div>

          <div className="light-card p-6 border-slate-200 space-y-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Zero-Trust RBAC Governance</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All backend endpoints enforce cryptographic session verification, preventing header spoofing and strictly restricting data access to authorized personnel only.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-6">
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm transition-all"
          >
            <span>Proceed to Role Authentication</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
