import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import {
  Activity,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Users,
  Car,
  Radio,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface RoleOption {
  id: UserRole;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  activeColor: string;
  defaultEmail: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'CITIZEN',
    label: 'Citizen',
    subtitle: 'Public resident & SOS',
    icon: <Users className="w-5 h-5" />,
    activeColor: 'border-blue-500 bg-blue-50/70 text-blue-900',
    defaultEmail: 'citizen@intelliflow.ai',
  },
  {
    id: 'TRAFFIC_POLICE',
    label: 'Traffic Police',
    subtitle: 'Signals & tactical flow',
    icon: <Car className="w-5 h-5" />,
    activeColor: 'border-indigo-500 bg-indigo-50/70 text-indigo-900',
    defaultEmail: 'police@intelliflow.ai',
  },
  {
    id: 'COMMAND_CENTER',
    label: 'City Operations',
    subtitle: 'Municipal & ICCC command',
    icon: <Radio className="w-5 h-5" />,
    activeColor: 'border-amber-500 bg-amber-50/70 text-amber-900',
    defaultEmail: 'command@intelliflow.ai',
  },
];

export const Login: React.FC = () => {
  const { login, register, getPortalPath } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('CITIZEN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('citizen@intelliflow.ai');
  const [password, setPassword] = useState('password123');

  // When role changes, update default email for convenience (Sign In only)
  const handleRoleSelect = (roleId: UserRole) => {
    setSelectedRole(roleId);
    const roleConfig = ROLES.find((r) => r.id === roleId);
    if (roleConfig && mode === 'login') {
      setEmail(roleConfig.defaultEmail);
      setPassword('password123');
    }
  };

  // When switching to signup, always lock to CITIZEN
  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    if (newMode === 'signup') {
      setSelectedRole('CITIZEN');
      setEmail('');
      setName('');
      setPassword('');
    } else {
      const roleConfig = ROLES.find((r) => r.id === selectedRole) || ROLES[0];
      setEmail(roleConfig.defaultEmail);
      setPassword('password123');
    }
  };

  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
  }, [mode, selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await login(email, password, selectedRole);
        setSuccessMsg(`Authenticated as ${user.name} (${user.role}). Entering portal...`);
        const targetPath = getPortalPath(user.role);
        setTimeout(() => {
          navigate(targetPath);
        }, 400);
      } else {
        const user = await register(name, email, password, selectedRole);
        setSuccessMsg(`Account created for ${user.name} as ${user.role}! Entering portal...`);
        const targetPath = getPortalPath(user.role);
        setTimeout(() => {
          navigate(targetPath);
        }, 400);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const currentRoleConfig = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-2">
            <Activity className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">IntelliFlow</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-black tracking-widest uppercase">
              AI
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500">
            Unified Smart City Traffic & Governance Gateway
          </p>
        </div>

        {/* Authentication Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Sign In vs Create Account Toggle */}
          <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('signup')}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Selection: shown for Sign In (all roles); hidden for Create Account (Citizen only) */}
          {mode === 'login' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Select Role to Sign In As:</label>
                <span className="text-[10px] text-slate-400 font-medium">1 person can have multiple role profiles</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {ROLES.map((r) => {
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleSelect(r.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex items-start space-x-2.5 ${
                        isSelected
                          ? r.activeColor
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                      }`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 ${isSelected ? 'text-current' : 'text-slate-400'}`}>
                        {r.icon}
                      </div>
                      <div>
                        <div className="font-bold text-xs leading-tight">{r.label}</div>
                        <div className="text-[10px] opacity-75 leading-tight mt-0.5">{r.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Create Account: locked to Citizen only — no role picker
            <div className="flex items-center space-x-3 p-3 rounded-xl border-2 border-blue-200 bg-blue-50/70">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-xs text-blue-900">Citizen Account</div>
                <div className="text-[10px] text-blue-700 mt-0.5">Public resident &amp; SOS access</div>
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-md">
                Resident
              </span>
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <span>
                {loading
                  ? 'Authenticating...'
                  : mode === 'login'
                  ? `Sign In as ${currentRoleConfig.label}`
                  : `Create ${currentRoleConfig.label} Account`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Badge */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure JWT Bearer Session • High-Contrast Light Theme</span>
          </div>
        </div>
      </div>
    </div>
  );
};
