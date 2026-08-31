import React, { useState, useRef, useEffect } from 'react';
import { useTwin } from '../../context/TwinContext';
import { useAuth } from '../../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Radio,
  TrendingUp,
  Cpu,
  Hammer,
  Search,
  BarChart3,
  PlayCircle,
  X,
  User,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { TwinMode } from '../../types';

export const TopNavigation: React.FC = () => {
  const {
    mode,
    setMode,
    roads,
    junctions,
    hospitals,
    ambulances,
    cctvs,
    incidents,
    setSelectedEntity,
    openAnalytics,
    openScenarioModal,
  } = useTwin();

  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [portalsMenuOpen, setPortalsMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter entities by search query
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();

    const roadMatches = roads
      .filter((r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
      .map((r) => ({ type: 'ROAD' as const, label: `${r.code} - ${r.name}`, data: r }));

    const jncMatches = junctions
      .filter((j) => j.code.toLowerCase().includes(q) || j.name.toLowerCase().includes(q))
      .map((j) => ({ type: 'JUNCTION' as const, label: `${j.code} - ${j.name}`, data: j }));

    const hospMatches = hospitals
      .filter((h) => h.code.toLowerCase().includes(q) || h.name.toLowerCase().includes(q))
      .map((h) => ({ type: 'HOSPITAL' as const, label: `${h.code} - ${h.name}`, data: h }));

    const ambMatches = ambulances
      .filter((a) => a.unitCode.toLowerCase().includes(q) || a.paramedicLead.toLowerCase().includes(q))
      .map((a) => ({ type: 'AMBULANCE' as const, label: `Ambulance ${a.unitCode}`, data: a }));

    const cctvMatches = cctvs
      .filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .map((c) => ({ type: 'CCTV' as const, label: `${c.code} - Camera Feed`, data: c }));

    const incMatches = incidents
      .filter((i) => i.code.toLowerCase().includes(q) || i.title.toLowerCase().includes(q))
      .map((i) => ({ type: 'INCIDENT' as const, label: `${i.code} - ${i.title}`, data: i }));

    return [...roadMatches, ...jncMatches, ...hospMatches, ...ambMatches, ...cctvMatches, ...incMatches].slice(0, 8);
  }, [searchQuery, roads, junctions, hospitals, ambulances, cctvs, incidents]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (result: (typeof searchResults)[0]) => {
    setSelectedEntity({ type: result.type, data: result.data as any });
    setSearchQuery('');
    setSearchDropdownOpen(false);
  };

  const modeButtons: { id: TwinMode; label: string; icon: any; color: string; badgeColor: string }[] = [
    { id: 'LIVE', label: 'LIVE', icon: Radio, color: 'text-emerald-700', badgeColor: 'bg-emerald-500' },
    { id: 'PREDICTION', label: 'PREDICTION', icon: TrendingUp, color: 'text-blue-700', badgeColor: 'bg-blue-500' },
    { id: 'SIMULATION', label: 'SIMULATION', icon: Cpu, color: 'text-purple-700', badgeColor: 'bg-purple-600' },
    { id: 'BUILD', label: 'BUILD', icon: Hammer, color: 'text-amber-700', badgeColor: 'bg-amber-500' },
  ];

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between z-30 shadow-sm relative">
      {/* 1. Left: Brand Identity with Global Navigation Law */}
      <Link to="/" className="flex items-center space-x-3 flex-shrink-0 group" title="Return to IntelliFlow OS Home">
        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-black text-lg tracking-tight text-slate-900">IntelliTwin</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider border border-purple-200">
              URBAN TWIN & ICCC
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:block">
            See the city • Predict • Simulate • Protect
          </span>
        </div>
      </Link>

      {/* 2. Center: 4 Mode Switcher Tabs */}
      <div className="hidden lg:flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200 shadow-inner">
        {modeButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = mode === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setMode(btn.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm shadow-slate-200 border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {isActive && (
                <span className={`w-2 h-2 rounded-full ${btn.badgeColor} ${btn.id === 'LIVE' ? 'animate-ping' : ''}`} />
              )}
              <Icon className={`w-3.5 h-3.5 ${isActive ? btn.color : 'text-slate-400'}`} />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Global Search Bar */}
      <div ref={searchContainerRef} className="relative w-48 sm:w-64 md:w-80">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchDropdownOpen(true);
            }}
            onFocus={() => setSearchDropdownOpen(true)}
            placeholder="Search city / road / hospital..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchDropdownOpen(false);
              }}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchDropdownOpen && searchResults.length > 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-80 overflow-y-auto">
            <div className="text-[10px] font-extrabold uppercase text-slate-400 px-2 py-1">Matching Twin Assets</div>
            <div className="space-y-1">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-800 truncate">{res.label}</span>
                  <span className="font-mono text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {res.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Right: Quick Actions & Command Center User */}
      <div className="flex items-center space-x-2.5">
        {/* City Analytics Button */}
        <button
          onClick={openAnalytics}
          className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs transition-colors border border-slate-200/80"
          title="View Metropolitan Analytics"
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
          <span>Analytics</span>
        </button>

        {/* Create Scenario Button */}
        <button
          onClick={openScenarioModal}
          className="hidden sm:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs transition-colors border border-purple-200"
          title="Create What-If Scenario"
        >
          <PlayCircle className="w-3.5 h-3.5 text-purple-600" />
          <span>Simulate</span>
        </button>

        {/* Role Portals Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPortalsMenuOpen(!portalsMenuOpen)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs border border-slate-200/80 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Portals</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {portalsMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 px-3 py-1.5">Switch RBAC Portal</div>
              <div className="space-y-1">
                <Link
                  to="/command-center"
                  onClick={() => setPortalsMenuOpen(false)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-900 text-xs font-bold flex items-center justify-between block"
                >
                  <span>Command Center</span>
                  <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-black">ICCC</span>
                </Link>
                <Link
                  to="/traffic-police"
                  onClick={() => setPortalsMenuOpen(false)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 text-xs font-bold flex items-center justify-between block"
                >
                  <span>Traffic Police</span>
                  <span className="text-[9px] bg-indigo-100 text-indigo-900 px-1.5 py-0.5 rounded font-black">POLICE</span>
                </Link>
                <Link
                  to="/citizen"
                  onClick={() => setPortalsMenuOpen(false)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-900 text-xs font-bold flex items-center justify-between block"
                >
                  <span>Citizen Services</span>
                  <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-black">PUBLIC</span>
                </Link>
                <Link
                  to="/municipal"
                  onClick={() => setPortalsMenuOpen(false)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-xs font-bold flex items-center justify-between block"
                >
                  <span>Municipal Corp</span>
                  <span className="text-[9px] bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded font-black">CIVIC</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Info Capsule */}
        <div className="flex items-center space-x-2 pl-1">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
              {user?.name || 'Commander'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">ICCC Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
};
