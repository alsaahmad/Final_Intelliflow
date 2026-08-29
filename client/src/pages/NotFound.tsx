import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Compass, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md light-card p-8 border-slate-200 bg-white shadow-card text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600 shadow-subtle">
            <Compass className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="text-4xl font-black text-slate-900 tracking-tight">404</div>
            <h1 className="text-xl font-bold text-slate-800">Page Not Found</h1>
            <p className="text-xs text-slate-500">
              The requested smart city portal route or civic service could not be located.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/"
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Return to Public Home</span>
            </Link>
            <Link
              to="/login"
              className="inline-block text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Role Gateways Directory →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
