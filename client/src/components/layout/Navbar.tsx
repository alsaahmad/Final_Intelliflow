import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Lock,
  User as UserIcon,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, role, getPortalPath } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      {/* Top Government & Compliance Banner Strip */}
      <div className="bg-slate-900 text-slate-300 text-[11px] font-medium py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Digital Twin Engine: Active</span>
            </span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">MoHUA Smart Cities Framework</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>GIGW 3.0</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono">
              <Lock className="w-3 h-3 text-blue-400" />
              <span>DPDP Ready</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  IntelliFlow
                </span>
                <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-black tracking-widest uppercase border border-blue-200">
                  AI
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 hidden sm:block -mt-0.5">
                Smart City Traffic Intelligence
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-bold text-slate-600">
            <a
              href="#hero"
              className="hover:text-blue-600 transition-colors"
            >
              Overview
            </a>
            <a
              href="#metrics"
              className="hover:text-blue-600 transition-colors"
            >
              ROI Impact
            </a>
            <a
              href="#demo"
              className="hover:text-blue-600 transition-colors flex items-center space-x-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
              <span>Live Simulation</span>
            </a>
            <a
              href="#solutions"
              className="hover:text-blue-600 transition-colors"
            >
              Solutions
            </a>
            <a
              href="#features"
              className="hover:text-blue-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#comparison"
              className="hover:text-blue-600 transition-colors"
            >
              Comparison
            </a>
            <a
              href="#faq"
              className="hover:text-blue-600 transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Button */}
          <div className="hidden sm:flex items-center space-x-3">
            {isAuthenticated ? (
              <Link
                to={getPortalPath()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2 hover:-translate-y-0.5"
              >
                <UserIcon className="w-4 h-4" />
                <span>Go to Dashboard ({role})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5 hover:-translate-y-0.5"
              >
                <span>Login to Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-800">
            <a
              href="#hero"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Overview
            </a>
            <a
              href="#metrics"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              ROI Impact
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-bold"
            >
              Live Digital Twin Simulation
            </a>
            <a
              href="#solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Who is it for?
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Core Features
            </a>
            <a
              href="#comparison"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Platform Comparison
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Evaluation FAQ
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-100">
            {isAuthenticated ? (
              <Link
                to={getPortalPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md"
              >
                Go to Dashboard ({role})
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md"
              >
                Login to Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
