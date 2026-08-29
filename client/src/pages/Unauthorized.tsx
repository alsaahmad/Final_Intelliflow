import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const { role, getPortalPath } = useAuth();
  const location = useLocation();

  const state = (location.state as any) || {};
  const attemptedPath = state.attemptedPath || 'the requested route';
  const requiredRoles = state.requiredRoles as string[] | undefined;
  const requiredPermission = state.requiredPermission as string | undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg light-card p-8 border-rose-200 bg-white shadow-card text-center space-y-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 shadow-subtle">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold mb-2">
              <Lock className="w-3.5 h-3.5" /> 403 FORBIDDEN - ACCESS RESTRICTED
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Unauthorized Portal Access
            </h1>
            <p className="text-xs text-slate-600 mt-2">
              Your authenticated account credentials do not hold the required clearance level to access{' '}
              <code className="text-xs font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {attemptedPath}
              </code>
            </p>
          </div>

          {/* Authorization Analysis Card */}
          <div className="text-left p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Your Current Role:</span>
              <span className="font-bold text-blue-600">{role || 'UNAUTHENTICATED'}</span>
            </div>

            {requiredRoles && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500 font-medium">Required Role(s):</span>
                <span className="font-bold text-rose-600">{requiredRoles.join(' OR ')}</span>
              </div>
            )}

            {requiredPermission && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500 font-medium">Required Permission:</span>
                <span className="font-bold text-amber-700">{requiredPermission}</span>
              </div>
            )}
          </div>

          {/* Return CTA */}
          <div className="space-y-3 pt-2">
            <Link
              to={getPortalPath()}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to My Authorized Dashboard</span>
            </Link>

            <Link
              to="/login"
              className="inline-block text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Switch Role Gateway →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
