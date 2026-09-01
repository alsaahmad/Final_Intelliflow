import React, { useState } from 'react';
import {
  ParkingFacility,
  ParkingSlot,
} from '../../../types/citizen';
import {
  Zap,
  Accessibility,
  Car,
  Lock,
  Ban,
  Check,
  ArrowDown,
  ArrowUp,
  Sparkles,
} from 'lucide-react';

interface CinemaSeatParkingGridProps {
  facility: ParkingFacility;
  selectedSlotId: string | null;
  onSelectSlot: (slot: ParkingSlot) => void;
}

export const CinemaSeatParkingGrid: React.FC<CinemaSeatParkingGridProps> = ({
  facility,
  selectedSlotId,
  onSelectSlot,
}) => {
  const [activeFloor, setActiveFloor] = useState<number>(1);

  // Group slots by floor level and rows
  const floorSlots = facility.slots.filter((s) => s.level === activeFloor);
  const rows = Array.from(new Set(floorSlots.map((s) => s.row))).sort();

  return (
    <div
      aria-label={`${facility.name} Floor ${activeFloor} Movie-theatre style parking slot map`}
      className="space-y-4 select-none"
    >
      {/* Floor Level Selector Tabs */}
      {facility.levels > 1 && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Parking Deck:
            </span>
          </div>

          <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-extrabold space-x-1">
            {Array.from({ length: facility.levels }, (_, i) => i + 1).map((lvl) => {
              const isActive = activeFloor === lvl;
              const lvlSlots = facility.slots.filter((s) => s.level === lvl);
              const freeLvl = lvlSlots.filter((s) => s.status === 'AVAILABLE').length;

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setActiveFloor(lvl)}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-white text-blue-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Deck Level ${lvl}, ${freeLvl} slots free`}
                >
                  <span>Level {lvl} ({lvl === 1 ? 'Ground' : 'Upper Deck'})</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-blue-100 text-blue-900' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {freeLvl} free
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 🎬 Cinema Stage / Driveway Entry Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-slate-800 to-blue-900 text-white p-3 text-center shadow-md">
        <div className="flex items-center justify-center space-x-2 text-[11px] font-black uppercase tracking-widest text-blue-200">
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          <span>Vehicle Entry Gate & Ticket Terminal</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </div>
        <div className="w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mt-1 rounded-full opacity-80" />
      </div>

      {/* 🚗 The Movie-Hall Style Slot Grid with Aisle Divider */}
      <div className="overflow-x-auto pb-2 pt-1">
        <div className="min-w-[420px] sm:min-w-full space-y-3 bg-slate-50/70 p-4 sm:p-5 rounded-3xl border border-slate-200">
          {rows.map((rowName) => {
            const rowSlots = floorSlots.filter((s) => s.row === rowName).sort((a, b) => a.col - b.col);
            const leftColSlots = rowSlots.filter((s) => s.col <= 3);
            const rightColSlots = rowSlots.filter((s) => s.col > 3);

            return (
              <div key={rowName} className="flex items-center justify-between gap-2 sm:gap-4">
                {/* Row Header */}
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs sm:text-sm text-slate-700 shadow-xs flex-shrink-0">
                  {rowName}
                </div>

                {/* Left Bay Cluster (Cols 1-3) */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 flex-1">
                  {leftColSlots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const isAvailable = slot.status === 'AVAILABLE';

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => onSelectSlot(slot)}
                        className={`min-h-[50px] sm:min-h-[56px] rounded-2xl font-mono text-xs font-extrabold transition-all duration-150 p-1.5 flex flex-col items-center justify-between relative focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isSelected
                            ? 'bg-blue-600 border-2 border-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105 z-10'
                            : slot.status === 'OCCUPIED'
                            ? 'bg-rose-100 border border-rose-200 text-rose-700 cursor-not-allowed opacity-75'
                            : slot.status === 'RESERVED'
                            ? 'bg-amber-100 border border-amber-200 text-amber-800 cursor-not-allowed opacity-75'
                            : slot.status === 'DISABLED'
                            ? 'bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-300 hover:border-emerald-400 hover:shadow-md hover:scale-[1.03] cursor-pointer'
                        }`}
                        aria-label={`Parking bay ${slot.code}, ${slot.type.toLowerCase().replace('_', ' ')}, status ${slot.status.toLowerCase()}${isAvailable ? ', rate ₹' + slot.hourlyRate + ' per hour' : ''}`}
                        aria-pressed={isSelected}
                      >
                        {/* Slot Code Header */}
                        <div className="flex items-center justify-between w-full px-1">
                          <span className="font-black text-[11px] sm:text-xs">{slot.code}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                        </div>

                        {/* Center Icon Indicator */}
                        <div className="my-0.5">
                          {isSelected ? (
                            <span className="text-[9px] font-sans font-black tracking-tight uppercase">
                              SELECTED
                            </span>
                          ) : slot.status === 'OCCUPIED' ? (
                            <Car className="w-3.5 h-3.5 opacity-80" />
                          ) : slot.status === 'RESERVED' ? (
                            <Lock className="w-3.5 h-3.5 opacity-80" />
                          ) : slot.status === 'DISABLED' ? (
                            <Ban className="w-3.5 h-3.5 opacity-80" />
                          ) : slot.type === 'EV_CHARGING' ? (
                            <Zap className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                          ) : slot.type === 'ACCESSIBLE' ? (
                            <Accessibility className="w-3.5 h-3.5 text-blue-600" />
                          ) : slot.type === 'VIP_EMERGENCY' ? (
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700">P</span>
                          )}
                        </div>

                        {/* Bottom Feature Tag */}
                        <div className="text-[9px] font-mono leading-none">
                          {slot.type === 'EV_CHARGING' ? '⚡ EV' : slot.type === 'ACCESSIBLE' ? '♿' : `₹${slot.hourlyRate}`}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 🚖 Center Driveway / Aisle Divider */}
                <div className="w-7 sm:w-10 flex flex-col items-center justify-center text-slate-300 font-mono text-[9px] font-extrabold uppercase tracking-tighter select-none border-x border-dashed border-slate-300 py-1">
                  <span>A</span>
                  <span>I</span>
                  <span>S</span>
                  <span>L</span>
                  <span>E</span>
                </div>

                {/* Right Bay Cluster (Cols 4-6) */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 flex-1">
                  {rightColSlots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    const isAvailable = slot.status === 'AVAILABLE';

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => onSelectSlot(slot)}
                        className={`min-h-[50px] sm:min-h-[56px] rounded-2xl font-mono text-xs font-extrabold transition-all duration-150 p-1.5 flex flex-col items-center justify-between relative focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isSelected
                            ? 'bg-blue-600 border-2 border-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105 z-10'
                            : slot.status === 'OCCUPIED'
                            ? 'bg-rose-100 border border-rose-200 text-rose-700 cursor-not-allowed opacity-75'
                            : slot.status === 'RESERVED'
                            ? 'bg-amber-100 border border-amber-200 text-amber-800 cursor-not-allowed opacity-75'
                            : slot.status === 'DISABLED'
                            ? 'bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-300 hover:border-emerald-400 hover:shadow-md hover:scale-[1.03] cursor-pointer'
                        }`}
                        aria-label={`Parking bay ${slot.code}, ${slot.type.toLowerCase().replace('_', ' ')}, status ${slot.status.toLowerCase()}${isAvailable ? ', rate ₹' + slot.hourlyRate + ' per hour' : ''}`}
                        aria-pressed={isSelected}
                      >
                        {/* Slot Code Header */}
                        <div className="flex items-center justify-between w-full px-1">
                          <span className="font-black text-[11px] sm:text-xs">{slot.code}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-white" />}
                        </div>

                        {/* Center Icon Indicator */}
                        <div className="my-0.5">
                          {isSelected ? (
                            <span className="text-[9px] font-sans font-black tracking-tight uppercase">
                              SELECTED
                            </span>
                          ) : slot.status === 'OCCUPIED' ? (
                            <Car className="w-3.5 h-3.5 opacity-80" />
                          ) : slot.status === 'RESERVED' ? (
                            <Lock className="w-3.5 h-3.5 opacity-80" />
                          ) : slot.status === 'DISABLED' ? (
                            <Ban className="w-3.5 h-3.5 opacity-80" />
                          ) : slot.type === 'EV_CHARGING' ? (
                            <Zap className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                          ) : slot.type === 'ACCESSIBLE' ? (
                            <Accessibility className="w-3.5 h-3.5 text-blue-600" />
                          ) : slot.type === 'VIP_EMERGENCY' ? (
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700">P</span>
                          )}
                        </div>

                        {/* Bottom Feature Tag */}
                        <div className="text-[9px] font-mono leading-none">
                          {slot.type === 'EV_CHARGING' ? '⚡ EV' : slot.type === 'ACCESSIBLE' ? '♿' : `₹${slot.hourlyRate}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🚗 Driveway Exit Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 p-2.5 text-center shadow-xs">
        <div className="flex items-center justify-center space-x-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          <ArrowUp className="w-3 h-3" />
          <span>Exit Ramp to Outer Arterial Corridor</span>
          <ArrowUp className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
