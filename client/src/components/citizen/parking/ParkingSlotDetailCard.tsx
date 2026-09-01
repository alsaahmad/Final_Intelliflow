import React, { useState } from 'react';
import {
  ParkingFacility,
  ParkingSlot,
} from '../../../types/citizen';
import {
  Navigation,
  QrCode,
  Zap,
  Accessibility,
  ShieldCheck,
  CheckCircle2,
  X,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface ParkingSlotDetailCardProps {
  facility: ParkingFacility;
  slot: ParkingSlot;
  onGetDirections: (facility: ParkingFacility, slot: ParkingSlot) => void;
  onSimulatePass: (facility: ParkingFacility, slot: ParkingSlot, durationHours: number) => void;
  onClearSelection: () => void;
}

export const ParkingSlotDetailCard: React.FC<ParkingSlotDetailCardProps> = ({
  facility,
  slot,
  onGetDirections,
  onSimulatePass,
  onClearSelection,
}) => {
  const [durationHours, setDurationHours] = useState<number>(2);

  const estimatedTotal = slot.hourlyRate * durationHours;

  return (
    <div
      aria-label={`Selected Parking Slot ${slot.code} details`}
      className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white to-blue-50/40 border-2 border-blue-500 shadow-xl shadow-blue-500/10 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-mono font-black text-xl shadow-md shadow-blue-600/30">
            {slot.code}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-mono font-extrabold text-[10px]">
                FLOOR {slot.level} • ROW {slot.row}
              </span>
              <span className="inline-flex items-center space-x-1 text-emerald-800 bg-emerald-100 text-[10px] font-black px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                <span>AVAILABLE TO SELECT</span>
              </span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mt-1">{facility.name}</h3>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{facility.address} ({facility.distanceDisplay})</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClearSelection}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Deselect slot"
          aria-label="Deselect parking slot"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bay Specs & Features */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        {/* Bay Category */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Bay Category
          </span>
          <div className="font-extrabold text-slate-900 flex items-center space-x-1.5">
            {slot.type === 'EV_CHARGING' ? (
              <>
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Fast EV Charging</span>
              </>
            ) : slot.type === 'ACCESSIBLE' ? (
              <>
                <Accessibility className="w-4 h-4 text-blue-600" />
                <span>Universal Accessible</span>
              </>
            ) : slot.type === 'VIP_EMERGENCY' ? (
              <>
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Priority Access</span>
              </>
            ) : (
              <span>Standard Sedan/SUV</span>
            )}
          </div>
        </div>

        {/* Hourly Tariff */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Base Tariff
          </span>
          <div className="font-extrabold text-slate-900 text-sm">
            ₹{slot.hourlyRate} <span className="text-[10px] text-slate-500 font-medium">/ hour</span>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Facility Hours
          </span>
          <div className="font-extrabold text-slate-900 text-xs truncate">
            {facility.operatingHours}
          </div>
        </div>
      </div>

      {/* Features Pill List */}
      {slot.features && slot.features.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            Bay Amenities:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {slot.features.map((feat, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-[11px] font-semibold flex items-center space-x-1"
              >
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>{feat}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Tariff Calculator */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-extrabold text-slate-900">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Estimated Parking Duration</span>
          </div>
          <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
            Est. Total: ₹{estimatedTotal}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs">
          {[1, 2, 4, 8].map((hrs) => (
            <button
              key={hrs}
              type="button"
              onClick={() => setDurationHours(hrs)}
              className={`py-2 rounded-xl font-bold transition-all ${
                durationHours === hrs
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {hrs} {hrs === 1 ? 'Hour' : 'Hours'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary & Secondary Action CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        {/* Primary CTA: Get Directions */}
        <button
          onClick={() => onGetDirections(facility, slot)}
          className="flex-1 py-3.5 px-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-teal-600/25 transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
        >
          <Navigation className="w-4 h-4" />
          <span>GET DIRECTIONS TO PARKING</span>
        </button>

        {/* Secondary CTA: Demo Pass Generator */}
        <button
          onClick={() => onSimulatePass(facility, slot, durationHours)}
          className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center space-x-2 border border-slate-200"
          title="Simulate slot reservation pass"
        >
          <QrCode className="w-4 h-4 text-slate-600" />
          <span>Simulate Pass (Demo)</span>
        </button>
      </div>
    </div>
  );
};
