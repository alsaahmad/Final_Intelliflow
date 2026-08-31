import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, HeartPulse } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 select-none">
      {/* 24/7 National Emergency & Helpline Banner */}
      <div className="bg-slate-50 border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center space-x-2 text-rose-700 font-bold">
            <HeartPulse className="w-4 h-4 animate-pulse text-rose-600" />
            <span>24/7 National Emergency Hotlines:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-700 text-xs">
            <a href="tel:112" className="hover:text-rose-600 font-bold flex items-center space-x-1">
              <span>National SOS:</span>
              <strong className="text-rose-600 font-mono">112</strong>
            </a>
            <span className="text-slate-300">|</span>
            <a href="tel:108" className="hover:text-rose-600 font-bold flex items-center space-x-1">
              <span>108 Ambulance:</span>
              <strong className="text-rose-600 font-mono">108</strong>
            </a>
            <span className="text-slate-300">|</span>
            <a href="tel:1095" className="hover:text-indigo-600 font-bold flex items-center space-x-1">
              <span>Traffic Police:</span>
              <strong className="text-indigo-600 font-mono">1095</strong>
            </a>
            <span className="text-slate-300">|</span>
            <a href="tel:1033" className="hover:text-amber-700 font-bold flex items-center space-x-1">
              <span>Highway Helpline:</span>
              <strong className="text-amber-700 font-mono">1033</strong>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* City Resilience Score Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white space-y-3 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="font-extrabold text-sm text-white">Metropolitan City Resilience Benchmark</h4>
                <p className="text-[11px] text-slate-400">Continuous telemetry verification across 4 smart-city pillars</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400 font-mono">82 / 100</span>
              <span className="text-[10px] text-slate-400 block font-semibold">High Stability Index</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-white/10">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block font-bold">TRAFFIC FLOW READINESS</span>
              <strong className="text-emerald-400 font-mono text-sm">78%</strong>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block font-bold">108 EMS READINESS</span>
              <strong className="text-blue-400 font-mono text-sm">91%</strong>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block font-bold">HOSPITAL ICU CAPACITY</span>
              <strong className="text-indigo-400 font-mono text-sm">82%</strong>
            </div>
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block font-bold">CCTV AI SURVEILLANCE</span>
              <strong className="text-teal-400 font-mono text-sm">94%</strong>
            </div>
          </div>
        </div>

        {/* 4 Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Intro */}
          <div className="space-y-3 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                IntelliFlow <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-black border border-blue-200">OS</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-medium">
              Enterprise Smart-City Traffic Intelligence Platform. Moving urban mobility from reactive congestion management to proactive decision intelligence.
            </p>
            <div className="inline-flex items-center space-x-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDP Act (2023) Compliant • GIGW 3.0 Accessible</span>
            </div>
          </div>

          {/* Suite Gateways */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Intelli-Suite Portals</h4>
            <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
              <li><Link to="/citizen" className="hover:text-blue-600">IntelliCivic (Citizen 360°)</Link></li>
              <li><Link to="/traffic-police" className="hover:text-blue-600">IntelliGuard (Traffic Police)</Link></li>
              <li><Link to="/municipal" className="hover:text-blue-600">IntelliWorks (Municipal Corp)</Link></li>
              <li><Link to="/digital-twin" className="hover:text-blue-600">IntelliTwin (Urban Twin & ICCC)</Link></li>
            </ul>
          </div>

          {/* Governance & Policies */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Governance & Legal</h4>
            <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
              <li><Link to="/privacy" className="hover:text-blue-600">Privacy Policy (DPDP)</Link></li>
              <li><Link to="/terms" className="hover:text-blue-600">Terms of Service</Link></li>
              <li><Link to="/accessibility" className="hover:text-blue-600">Accessibility Statement</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600">Contact & Support</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} IntelliFlow OS. Ministry of Housing & Urban Affairs Smart City Platform.</p>
          <p className="text-[11px] text-slate-400 font-medium">High Contrast Light Theme • GIGW 3.0 Guidelines</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
