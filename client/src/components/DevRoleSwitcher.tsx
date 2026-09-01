import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react';

export const DevRoleSwitcher: React.FC = () => {
  const { role, login, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const roleAccounts: { id: UserRole; email: string; label: string; desc: string; path: string; dotColor: string }[] = [
    { id: 'COMMAND_CENTER', email: 'command@intelliflow.ai', label: 'City Operations (ICCC)', desc: 'Consolidated municipal & command center', path: '/city-operations', dotColor: 'bg-blue-600' },
    { id: 'TRAFFIC_POLICE', email: 'police@intelliflow.ai', label: 'Traffic Police Console', desc: 'Signal override, predictions, tactical flow', path: '/traffic-police', dotColor: 'bg-indigo-600' },
    { id: 'CITIZEN', email: 'citizen@intelliflow.ai', label: 'Citizen Services Portal', desc: 'Civic reporting, traffic map, 112 SOS', path: '/citizen', dotColor: 'bg-blue-500' },
    { id: 'MUNICIPAL_CORP', email: 'municipal@intelliflow.ai', label: 'City Operations (Municipal)', desc: 'Infrastructure, grievance triage, closures', path: '/city-operations?tab=complaints', dotColor: 'bg-teal-600' },
    { id: 'COMMAND_CENTER', email: 'command@intelliflow.ai', label: 'Urban Digital Twin (Direct)', desc: '2D/3D map, What-If simulation HUD', path: '/digital-twin', dotColor: 'bg-purple-600' },
    { id: 'AMBULANCE_RESPONDER', email: 'citizen@intelliflow.ai', label: '108 Ambulance Unit (EMS)', desc: 'Green wave preemption, vitals stream', path: '/ambulance', dotColor: 'bg-rose-500' },
    { id: 'HOSPITAL', email: 'command@intelliflow.ai', label: 'Hospital Emergency Desk', desc: 'Trauma bays, ICU bed inventory & ETA', path: '/hospital', dotColor: 'bg-emerald-500' },
  ];

  const handleRoleChange = async (targetEmail: string, path: string) => {
    setSwitching(true);
    try {
      await login(targetEmail, 'password123');
      navigate(path);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to switch sandbox role:', err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 rounded-2xl p-4 shadow-2xl bg-white border border-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Quick Role Switcher
                </p>
                <p className="text-[10px] text-slate-500">Test live RBAC portals</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-1 max-h-72 overflow-y-auto pr-1">
            {roleAccounts.map((r) => {
              const isCurrent = r.id === role;
              return (
                <button
                  key={r.id}
                  onClick={() => handleRoleChange(r.email, r.path)}
                  disabled={switching}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${r.dotColor}`}></span>
                    <div>
                      <div className="text-xs">{r.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{r.desc}</div>
                    </div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-full bg-white text-slate-800 text-xs font-bold shadow-lg border border-slate-200 hover:border-blue-400 transition-all hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
          <span>ROLE: {role || 'GUEST'}</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </div>
  );
};
