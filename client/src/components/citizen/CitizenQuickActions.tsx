import React from 'react';
import {
  PhoneCall,
  Navigation,
  ParkingSquare,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

interface CitizenQuickActionsProps {
  onSelectAction: (action: 'SOS' | 'NAVIGATION' | 'PARKING' | 'REPORT') => void;
}

export const CitizenQuickActions: React.FC<CitizenQuickActionsProps> = ({ onSelectAction }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <span>Main Quick Actions</span>
        </h2>
        <span className="text-[11px] font-semibold text-slate-400">Tap to open service modal</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Action 1: Emergency SOS */}
        <button
          onClick={() => onSelectAction('SOS')}
          className="group text-left p-4 sm:p-5 rounded-3xl bg-white border border-rose-200 hover:border-rose-400 shadow-sm hover:shadow-lg hover:shadow-rose-600/10 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-start justify-between w-full mb-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors flex items-center justify-center shadow-sm">
              <PhoneCall className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black tracking-wide uppercase border border-rose-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
              <span>112 SOS (DEMO)</span>
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                Emergency SOS
              </h3>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-1">
              Simulated emergency assistance request for rapid response demonstration.
            </p>
          </div>
        </button>

        {/* Action 2: Smart Navigation */}
        <button
          onClick={() => onSelectAction('NAVIGATION')}
          className="group text-left p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-lg hover:shadow-blue-600/10 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-start justify-between w-full mb-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center shadow-sm">
              <Navigation className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200 uppercase tracking-wide">
              OPTIMAL ROUTE
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                Smart Navigation
              </h3>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-1">
              Traffic-weighted graph routing avoiding congested bottlenecks.
            </p>
          </div>
        </button>

        {/* Action 3: Find Parking */}
        <button
          onClick={() => onSelectAction('PARKING')}
          className="group text-left p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 hover:border-teal-300 shadow-sm hover:shadow-lg hover:shadow-teal-600/10 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-start justify-between w-full mb-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors flex items-center justify-center shadow-sm">
              <ParkingSquare className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-extrabold border border-teal-200 uppercase tracking-wide">
              FIND PARKING
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-teal-600 transition-colors">
                Find Parking
              </h3>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-1">
              Locate nearby parking facilities, live slot availability, and rates.
            </p>
          </div>
        </button>

        {/* Action 4: Report Problem */}
        <button
          onClick={() => onSelectAction('REPORT')}
          className="group text-left p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 hover:border-amber-300 shadow-sm hover:shadow-lg hover:shadow-amber-600/10 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="flex items-start justify-between w-full mb-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold border border-amber-200 uppercase tracking-wide">
              CIVIC SYNC
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                Report Problem
              </h3>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-1">
              Transmit pothole or signal issues directly to Municipal Queue.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
