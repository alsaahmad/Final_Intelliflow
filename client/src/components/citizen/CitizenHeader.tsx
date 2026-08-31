import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CitizenNotification } from '../../types/citizen';
import {
  Users,
  Bell,
  ShieldAlert,
  PhoneCall,
  LogOut,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';

interface CitizenHeaderProps {
  notifications: CitizenNotification[];
  onOpenPrivacyVault: () => void;
  onTriggerSos: () => void;
  onSelectNotificationAction?: (tab: 'NAVIGATION' | 'PARKING' | 'REPORT' | 'SOS' | 'DASHBOARD') => void;
}

export const CitizenHeader: React.FC<CitizenHeaderProps> = ({
  notifications,
  onOpenPrivacyVault,
  onTriggerSos,
  onSelectNotificationAction,
}) => {
  const { user, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  const getNotificationIcon = (type: CitizenNotification['type']) => {
    switch (type) {
      case 'ALERT':
        return <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'INFO':
      default:
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Mark with Global Navigation Law */}
        <Link
          to="/"
          className="flex items-center space-x-2.5 sm:space-x-3 group"
          title="Return to IntelliFlow OS Home"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                IntelliFlow
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200 tracking-wide">
                CITIZEN
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Civic Mobility & Traffic Decision Platform
            </span>
          </div>
        </Link>

        {/* Right Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-mono font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Menu Modal / Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-slate-400 py-4 font-medium">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (n.linkTab && onSelectNotificationAction) {
                            onSelectNotificationAction(n.linkTab);
                            setNotificationsOpen(false);
                          }
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          n.read
                            ? 'bg-slate-50/70 border-slate-200 text-slate-600'
                            : 'bg-blue-50/50 border-blue-200 text-slate-900 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {getNotificationIcon(n.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs truncate">{n.title}</span>
                              <span className="text-[9px] font-mono text-slate-400 whitespace-nowrap">
                                {n.timestamp}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                            {n.linkTab && (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-600 hover:underline mt-1">
                                <span>Open in {n.linkTab}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Privacy Vault Trigger */}
          <button
            onClick={onOpenPrivacyVault}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center space-x-1.5 border border-slate-200 transition-colors"
            title="Privacy & Data Preferences (Demo Mode)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Privacy Vault</span>
          </button>

          {/* Quick SOS Trigger */}
          <button
            onClick={onTriggerSos}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 flex items-center space-x-1.5 transition-transform active:scale-95"
            title="Emergency Assistance (Demo Mode)"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden xs:inline font-bold">112 SOS</span>
          </button>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
              {user?.name?.charAt(0) || 'C'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-none truncate max-w-[110px]">
                {user?.name || 'Citizen'}
              </span>
              <span className="text-[9px] text-emerald-600 font-bold flex items-center space-x-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Verified Citizen</span>
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
