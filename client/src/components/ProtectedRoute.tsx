import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { ShieldCheck } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <ShieldCheck className="w-7 h-7 text-blue-600 absolute" />
        </div>
        <div className="mt-4 text-center space-y-1">
          <p className="text-xs font-bold text-slate-800 tracking-wider uppercase">
            Verifying Identity Credentials...
          </p>
          <p className="text-[11px] text-slate-500 font-medium">IntelliFlow AI Security</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verify Role Requirement
  if (requiredRoles && requiredRoles.length > 0 && role) {
    // Check if role is present (normalizing any aliases)
    const normalizedRole = role === 'MUNICIPAL_CORPORATION' ? 'MUNICIPAL_CORP' : role;
    const isAllowed = requiredRoles.some((r) => {
      const normReq = r === 'MUNICIPAL_CORPORATION' ? 'MUNICIPAL_CORP' : r;
      return normReq === normalizedRole;
    });

    if (!isAllowed) {
      return (
        <Navigate
          to="/unauthorized"
          state={{
            attemptedPath: location.pathname,
            requiredRoles,
            currentRole: role,
          }}
          replace
        />
      );
    }
  }

  return <>{children}</>;
};
