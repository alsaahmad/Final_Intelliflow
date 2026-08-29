import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, isAuthenticated, logout, getPortalPath } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const getRoleBadge = () => {
    switch (role) {
      case 'CITIZEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold badge-citizen">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            CITIZEN PORTAL
          </span>
        );
      case 'TRAFFIC_POLICE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold badge-police">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            TRAFFIC POLICE
          </span>
        );
      case 'MUNICIPAL_CORP':
      case 'MUNICIPAL_CORPORATION':
      case 'MUNICIPAL_ENGINEER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold badge-municipal">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
            MUNICIPAL CORP
          </span>
        );
      case 'COMMAND_CENTER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold badge-command">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            COMMAND CENTER
          </span>
        );
      default:
        return null;
    }
  };

  const currentPortalPath = getPortalPath();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <Link to={currentPortalPath} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-base text-slate-900">
                  INTELLIFLOW AI
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  SMART CITY
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                DIGITAL TWIN TELEMETRY
              </p>
            </div>
          </Link>

          <div className="hidden md:block h-6 w-px bg-slate-200" />
          <div className="hidden md:flex items-center">{getRoleBadge()}</div>
        </div>

        {/* Right: User Profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold leading-none text-slate-900 truncate max-w-[140px]">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-none">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
