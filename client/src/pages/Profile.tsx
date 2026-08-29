import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Link } from 'react-router-dom';
import {
  Mail,
  Calendar,
  Clock,
  KeyRound,
  ArrowLeft,
  CheckCircle,
  LogOut,
  Fingerprint,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, role, permissions = [], logout, getPortalPath } = useAuth();

  if (!user) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'CITIZEN':
        return 'badge-citizen';
      case 'TRAFFIC_POLICE':
        return 'badge-police';
      case 'MUNICIPAL_CORP':
      case 'MUNICIPAL_CORPORATION':
      case 'MUNICIPAL_ENGINEER':
        return 'badge-municipal';
      case 'COMMAND_CENTER':
        return 'badge-command';
      case 'ADMIN':
        return 'badge-admin';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Back Link */}
        <div>
          <Link
            to={getPortalPath()}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* User Card */}
        <div className="light-card p-8 border-slate-200 bg-white shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-black shadow-md">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${getRoleBadge()}`}>
                    {role}
                  </span>
                  <span className="flex items-center text-xs text-emerald-600 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Verified Account
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">{user.name}</h1>
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors flex items-center space-x-1.5 flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Revoke Session / Logout</span>
            </button>
          </div>

          {/* Session Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
                <span>Account ID</span>
              </div>
              <div className="font-mono text-slate-800 font-bold truncate">#{user.id}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Account Created</span>
              </div>
              <div className="font-bold text-slate-800">{formatDate(user.created_at)}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Department</span>
              </div>
              <div className="font-bold text-slate-800">{user.department || 'Civic Platform'}</div>
            </div>
          </div>

          {/* Assigned RBAC Permissions */}
          {permissions.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Assigned RBAC Permissions ({permissions.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {permissions.map((p: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
