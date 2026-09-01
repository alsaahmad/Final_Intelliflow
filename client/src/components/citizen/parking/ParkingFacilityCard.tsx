import React from 'react';
import { ParkingFacility } from '../../../types/citizen';
import {
  ParkingSquare,
  Zap,
  Accessibility,
  ArrowRight,
  Clock,
  MapPin,
} from 'lucide-react';

interface ParkingFacilityCardProps {
  facility: ParkingFacility;
  isSelected: boolean;
  onSelect: (facility: ParkingFacility) => void;
}

export const ParkingFacilityCard: React.FC<ParkingFacilityCardProps> = ({
  facility,
  isSelected,
  onSelect,
}) => {
  const isNearlyFull = facility.occupancyPercent >= 75;

  return (
    <div
      onClick={() => onSelect(facility)}
      className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer space-y-3.5 relative overflow-hidden ${
        isSelected
          ? 'bg-gradient-to-br from-teal-50/90 to-white border-teal-500 shadow-md ring-2 ring-teal-500/20'
          : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-sm hover:border-slate-300'
      }`}
      aria-label={`${facility.name}, ${facility.distanceDisplay}, ${facility.availableSlots} of ${facility.totalSlots} slots free, rate ₹${facility.hourlyRateInr} per hour`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start space-x-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform ${
              isSelected ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 scale-105' : 'bg-teal-50 text-teal-700'
            }`}
          >
            <ParkingSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-black text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                {facility.code}
              </span>
              {facility.evChargingAvailable && (
                <span className="inline-flex items-center space-x-0.5 text-emerald-800 bg-emerald-50 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                  <Zap className="w-2.5 h-2.5" />
                  <span>EV</span>
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 mt-1 leading-tight">{facility.name}</h3>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{facility.address}</span>
            </p>
          </div>
        </div>

        {/* Distance Badge */}
        <div className="text-right flex-shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-bold text-[10px] block">
            {facility.distanceDisplay}
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            ₹{facility.hourlyRateInr}/hr
          </span>
        </div>
      </div>

      {/* Live Free Slots Counter & Occupancy Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 font-semibold flex items-center space-x-1">
            <span>Availability:</span>
            <strong className="text-emerald-700 font-mono font-black">
              {facility.availableSlots} / {facility.totalSlots} FREE
            </strong>
          </span>

          <span
            className={`font-mono text-[11px] font-bold ${
              isNearlyFull ? 'text-rose-600' : 'text-slate-500'
            }`}
          >
            {facility.occupancyPercent}% Occupied
          </span>
        </div>

        {/* Progress meter */}
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isNearlyFull ? 'bg-rose-500' : 'bg-teal-600'
            }`}
            style={{ width: `${facility.occupancyPercent}%` }}
          />
        </div>
      </div>

      {/* Bottom Footer Info & Action */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{facility.operatingHours}</span>
          </span>
          {facility.accessibleSlotsAvailable > 0 && (
            <span className="flex items-center space-x-0.5 text-blue-700 font-semibold" title="Accessible bays available">
              <Accessibility className="w-3 h-3" />
              <span>{facility.accessibleSlotsAvailable} Free</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 text-teal-700 font-extrabold text-xs group">
          <span>{isSelected ? 'Viewing Slots' : 'View Slots'}</span>
          <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
        </div>
      </div>
    </div>
  );
};
