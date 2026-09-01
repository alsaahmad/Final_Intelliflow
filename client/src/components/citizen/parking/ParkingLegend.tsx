import React from 'react';
import { Check, Lock, Car, Ban } from 'lucide-react';

export const ParkingLegend: React.FC = () => {
  return (
    <div
      aria-label="Parking Slot Status Legend"
      className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs select-none"
    >
      <div className="flex items-center space-x-1.5 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
        <span>Slot Legend:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] font-semibold text-slate-700">
        {/* Available */}
        <div className="flex items-center space-x-1.5" title="Available for immediate parking">
          <div className="w-5 h-5 rounded-lg bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center text-emerald-700 text-[10px] font-mono font-bold shadow-xs">
            P
          </div>
          <span>Available</span>
        </div>

        {/* Selected */}
        <div className="flex items-center space-x-1.5" title="Currently selected bay">
          <div className="w-5 h-5 rounded-lg bg-blue-600 border-2 border-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-blue-900 font-bold">Selected</span>
        </div>

        {/* Occupied */}
        <div className="flex items-center space-x-1.5" title="Bay currently occupied by vehicle">
          <div className="w-5 h-5 rounded-lg bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center opacity-85">
            <Car className="w-3 h-3" />
          </div>
          <span className="text-rose-900 font-medium">Occupied</span>
        </div>

        {/* Reserved */}
        <div className="flex items-center space-x-1.5" title="Corporate or emergency permit reserved">
          <div className="w-5 h-5 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center opacity-85">
            <Lock className="w-3 h-3" />
          </div>
          <span className="text-amber-900 font-medium">Reserved</span>
        </div>

        {/* Disabled / Maintenance */}
        <div className="flex items-center space-x-1.5" title="Bay closed for maintenance / sensor calibration">
          <div className="w-5 h-5 rounded-lg bg-slate-200 border border-slate-300 text-slate-500 flex items-center justify-center opacity-70">
            <Ban className="w-3 h-3" />
          </div>
          <span className="text-slate-500 font-medium">Maintenance</span>
        </div>
      </div>
    </div>
  );
};
