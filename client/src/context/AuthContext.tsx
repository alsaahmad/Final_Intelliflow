import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, UserRole, AuthContextType } from '../types/auth';
import { authApi } from '../api/authClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('intelliflow_token'));
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper to compute portal redirect path based on role
   */
  const getPortalPath = useCallback((targetRole?: UserRole | null): string => {
    const activeRole = targetRole || role;
    switch (activeRole) {
      case 'CITIZEN':
        return '/citizen';
      case 'TRAFFIC_POLICE':
        return '/traffic-police';
      case 'MUNICIPAL_CORP':
      case 'MUNICIPAL_CORPORATION':
        return '/municipal';
      case 'COMMAND_CENTER':
        return '/command-center';
      default:
        return '/login';
    }
  }, [role]);

  /**
   * Verify token on startup
   */
  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('intelliflow_token');
    if (!savedToken) {
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.getMe();
      if (res.authenticated && res.user) {
        setUser(res.user);
        setRole(res.user.role);
        setToken(savedToken);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('intelliflow_token');
        setUser(null);
        setRole(null);
        setToken(null);
        setIsAuthenticated(false);
      }
    } catch {
      localStorage.removeItem('intelliflow_token');
      setUser(null);
      setRole(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Sign In with Email, Password & optional Role
   */
  const login = useCallback(async (email: string, password: string, selectedRole?: UserRole): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authApi.login(email, password, selectedRole);

      if (!res.success || !res.token || !res.user) {
        throw new Error(res.message || 'Login failed.');
      }

      localStorage.setItem('intelliflow_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setRole(res.user.role);
      setIsAuthenticated(true);
      return res.user;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register with Name, Email, Password, and Role
   */
  const register = useCallback(
    async (name: string, email: string, password: string, selectedRole: UserRole): Promise<User> => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await authApi.register(name, email, password, selectedRole);

        if (!res.success || !res.token || !res.user) {
          throw new Error(res.message || 'Registration failed.');
        }

        localStorage.setItem('intelliflow_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setRole(res.user.role);
        setIsAuthenticated(true);
        return res.user;
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Registration failed.';
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Clear authentication token and state
   */
  const logout = useCallback(() => {
    localStorage.removeItem('intelliflow_token');
    setUser(null);
    setToken(null);
    setRole(null);
    setIsAuthenticated(false);
    setError(null);
    window.location.href = '/login';
  }, []);

  const value: AuthContextType = {
    user,
    token,
    role,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    getPortalPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
