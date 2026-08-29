import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, HeartPulse } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600">
      {/* 24/7 Emergency strip */}
      <div className="bg-slate-50 border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center space-x-2 text-rose-700 font-bold">
            <HeartPulse className="w-4 h-4 animate-pulse text-rose-600" />
            <span>24/7 National Emergency Services:</span>
          </div>
          <div className="flex items-center space-x-6 text-slate-700">
            <a href="tel:112" className="hover:text-rose-600 font-bold">
              SOS: <span className="text-rose-600">112</span>
            </a>
            <span className="text-slate-300">|</span>
            <a href="tel:108" className="hover:text-rose-600 font-bold">
              Ambulance: <span className="text-rose-600">108</span>
            </a>
            <span className="text-slate-300">|</span>
            <a href="tel:1095" className="hover:text-indigo-600 font-bold">
              Traffic Police: <span className="text-indigo-600">1095</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Intro */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold text-blue-900 tracking-tight">
                IntelliFlow <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-black border border-blue-200">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Smart City Traffic Intelligence Platform. Moving urban mobility from reactive congestion management to proactive decision intelligence.
            </p>
            <div className="inline-flex items-center space-x-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDP Act (2023) Compliant • GIGW 3.0 Accessible</span>
            </div>
          </div>

          {/* Quick Solutions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Solutions</h4>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li><Link to="/login" className="hover:text-blue-600">Citizen Resident Services</Link></li>
              <li><Link to="/login" className="hover:text-blue-600">Traffic Police Console</Link></li>
              <li><Link to="/login" className="hover:text-blue-600">Municipal Digital Twin</Link></li>
              <li><Link to="/login" className="hover:text-blue-600">Command Center (ICCC)</Link></li>
            </ul>
          </div>

          {/* Governance & Policies */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Governance & Legal</h4>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li><Link to="/privacy" className="hover:text-blue-600 font-medium">Privacy Policy (DPDP)</Link></li>
              <li><Link to="/terms" className="hover:text-blue-600 font-medium">Terms of Service</Link></li>
              <li><Link to="/accessibility" className="hover:text-blue-600">Accessibility Statement</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600">Contact & Support</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} IntelliFlow AI. Smart City Decision Intelligence. All rights reserved.</p>
          <p className="text-[11px] text-slate-400">High Contrast Light Theme • GIGW 3.0 Guidelines</p>
        </div>
      </div>
    </footer>
  );
};
