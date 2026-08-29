import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import {
  Users,
  Car,
  Compass,
  Radio,
  ArrowLeft,
  KeyRound,
  Lock,
  Sparkles,
} from 'lucide-react';

interface RoleConfig {
  id: UserRole;
  slug: string;
  category: string;
  badge: string;
  badgeBg: string;
  title: string;
  department: string;
  description: string;
  personaName: string;
  personaEmail: string;
  personaTitle: string;
  icon: React.ReactNode;
  themeBorder: string;
  accentBtn: string;
  accessFeatures: string[];
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  citizen: {
    id: 'CITIZEN',
    slug: 'citizen',
    category: 'CITIZEN',
    badge: 'RESIDENT ACCESS',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    title: 'Citizen Resident Portal',
    department: 'Smart City Public Services',
    description: 'Access live municipal traffic map, report civic problem tickets (potholes, signals), and broadcast 112 emergency SOS beacons.',
    personaName: 'Alex Rivera',
    personaEmail: 'citizen@intelliflow.ai',
    personaTitle: 'Verified Resident (Sector 4)',
    icon: <Users className="w-8 h-8 text-blue-600" />,
    themeBorder: 'border-blue-200',
    accentBtn: 'bg-blue-600 hover:bg-blue-700',
    accessFeatures: [
      'Civic Problem Reporting with GPS Tagging',
      'One-Tap Emergency SOS (112) Dispatch Alert',
      'Live Traffic & Green Corridor Commute Heatmap',
      'Community Hazard Resolution Tracking',
    ],
  },
  'traffic-police': {
    id: 'TRAFFIC_POLICE',
    slug: 'traffic-police',
    category: 'GOVERNMENT',
    badge: 'LAW ENFORCEMENT',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    title: 'Traffic Police Console',
    department: 'Metropolitan Traffic Police Division',
    description: 'Enforce real-time traffic signal overrides, create green corridors, monitor AI predictions, and run Digital Twin what-if simulations.',
    personaName: 'Insp. Rajesh Varma',
    personaEmail: 'police@intelliflow.ai',
    personaTitle: 'Senior Traffic Inspector (Sector A)',
    icon: <Car className="w-8 h-8 text-indigo-600" />,
    themeBorder: 'border-indigo-200',
    accentBtn: 'bg-indigo-600 hover:bg-indigo-700',
    accessFeatures: [
      'Live Tactical City Map with Junction Pins',
      'AI Neural Congestion Forecast (15-30 mins)',
      'Digital Twin "+15s Green Light" Simulator',
      'Manual Signal Cycle Override Control',
    ],
  },
  municipal: {
    id: 'MUNICIPAL_CORP',
    slug: 'municipal',
    category: 'GOVERNMENT',
    badge: 'URBAN WORKS',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
    title: 'Municipal Corporation Portal',
    department: 'Urban Infrastructure & Public Works Directorate',
    description: 'Track active construction projects, evaluate and approve road closure permits, and simulate network traffic impact before physical execution.',
    personaName: 'Dr. Elena Rostova',
    personaEmail: 'municipal@intelliflow.ai',
    personaTitle: 'Chief Urban Planning Engineer',
    icon: <Compass className="w-8 h-8 text-teal-600" />,
    themeBorder: 'border-teal-200',
    accentBtn: 'bg-teal-600 hover:bg-teal-700',
    accessFeatures: [
      'Active Capital Works & Contractor Progress Tracking',
      'Pending Road Plan Approval Workflows (Approve/Reject)',
      'Traffic Impact Simulation on Proposed Road Closures',
      'Network Diversion & Detour Route Capacity Modeling',
    ],
  },
  'command-center': {
    id: 'COMMAND_CENTER',
    slug: 'command-center',
    category: 'COMMAND',
    badge: 'INTEGRATED COMMAND',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    title: 'Integrated Command & Control Center (ICCC)',
    department: 'Metropolitan Crisis Response Authority',
    description: 'Citywide situational awareness, multi-agency dispatch coordination, emergency green corridor priority preemption, and real-time audit logs.',
    personaName: 'Capt. Marcus Chen',
    personaEmail: 'command@intelliflow.ai',
    personaTitle: 'ICCC Operations Commander',
    icon: <Radio className="w-8 h-8 text-amber-700" />,
    themeBorder: 'border-amber-200',
    accentBtn: 'bg-amber-600 hover:bg-amber-700',
    accessFeatures: [
      'High-Level Metropolitan Metrics (Travel Time, Alerts)',
      'Live Emergency Green Corridor Signal Preemption',
      'Metropolitan Traffic Congestion Monitoring',
      'System Audit Logs & Security Telemetry',
    ],
  },
};

export const RoleLogin: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const config = roleId ? ROLE_CONFIGS[roleId] : null;

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="p-8 text-center space-y-4 max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl">
          <h2 className="text-xl font-bold text-slate-900">Role Gateway Not Found</h2>
          <p className="text-xs text-slate-500">The requested role identifier does not exist.</p>
          <Link
            to="/login"
            className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            ← View Login Directory
          </Link>
        </div>
      </div>
    );
  }

  const handlePersonaLogin = async () => {
    setLoading(true);
    try {
      await login(config.personaEmail, 'password123');
      navigate(`/${config.slug}`);
    } catch (err) {
      console.error('Failed to log in:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-xl w-full space-y-6">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Role Portals</span>
          </Link>
        </div>

        <div className={`p-8 sm:p-10 border-2 ${config.themeBorder} bg-white shadow-xl rounded-2xl space-y-6`}>
          <div className="flex items-start justify-between border-b border-slate-100 pb-6">
            <div className="space-y-2">
              <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${config.badgeBg}`}>
                {config.badge}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {config.title}
              </h1>
              <p className="text-xs font-semibold text-slate-500">{config.department}</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              {config.icon}
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {config.description}
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Role Permissions & Clearances Included:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {config.accessFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                {config.personaName.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-xs">{config.personaName}</div>
                <div className="text-[11px] text-slate-500">{config.personaEmail}</div>
                <div className="text-[10px] text-blue-600 font-semibold">{config.personaTitle}</div>
              </div>
            </div>

            <button
              onClick={handlePersonaLogin}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl ${config.accentBtn} text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Authenticating Officer...' : `Enter as ${config.personaName}`}</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-slate-400 text-[11px]">
            <Lock className="w-3 h-3" />
            <span>JWT Session Authentication • Clean Light Interface</span>
          </div>
        </div>
      </div>
    </div>
  );
};
