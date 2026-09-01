import React, { useState, useEffect, useMemo } from 'react';
import {
  ParkingFacility,
  ParkingSlot,
} from '../../../types/citizen';
import { citizenParkingService } from '../../../services/citizenService';
import { ParkingFacilityCard } from './ParkingFacilityCard';
import { CinemaSeatParkingGrid } from './CinemaSeatParkingGrid';
import { ParkingSlotDetailCard } from './ParkingSlotDetailCard';
import { ParkingLegend } from './ParkingLegend';
import {
  ParkingSquare,
  ArrowLeft,
  Search,
  Zap,
  QrCode,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

interface CitizenParkingFinderProps {
  onBackToDashboard: () => void;
  onGetDirections: (facility: ParkingFacility, slot: ParkingSlot) => void;
}

export const CitizenParkingFinder: React.FC<CitizenParkingFinderProps> = ({
  onBackToDashboard,
  onGetDirections,
}) => {
  // State
  const [facilities, setFacilities] = useState<ParkingFacility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('gar-01');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'EV_ONLY' | 'NEARBY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Demo Pass Modal State
  const [passModalData, setPassModalData] = useState<{
    facility: ParkingFacility;
    slot: ParkingSlot;
    durationHours: number;
    passCode: string;
    validUntil: string;
    totalAmount: number;
  } | null>(null);

  // Load facilities from service layer
  useEffect(() => {
    const loadFacilities = async () => {
      setIsLoading(true);
      try {
        const data = await citizenParkingService.getNearbyParkingFacilities();
        setFacilities(data);
        if (data.length > 0 && !selectedFacilityId) {
          setSelectedFacilityId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load parking facilities:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFacilities();
  }, []);

  // Filtered facilities list
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (filterMode === 'EV_ONLY' && (!f.evChargingAvailable || f.evSlotsAvailable === 0)) {
        return false;
      }
      if (filterMode === 'NEARBY' && f.distanceKm > 1.0) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q) || f.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [facilities, filterMode, searchQuery]);

  const activeFacility = useMemo(() => {
    return facilities.find((f) => f.id === selectedFacilityId) || facilities[0] || null;
  }, [facilities, selectedFacilityId]);

  const selectedSlot = useMemo(() => {
    if (!activeFacility || !selectedSlotId) return null;
    return activeFacility.slots.find((s) => s.id === selectedSlotId) || null;
  }, [activeFacility, selectedSlotId]);

  // Handle facility selection
  const handleSelectFacility = (facility: ParkingFacility) => {
    setSelectedFacilityId(facility.id);
    setSelectedSlotId(null); // Clear slot selection on facility switch
  };

  // Handle slot selection (Correction 1: Pure UI state, toggle or replace)
  const handleSelectSlot = (slot: ParkingSlot) => {
    if (slot.status !== 'AVAILABLE') return;
    setSelectedSlotId((prev) => (prev === slot.id ? null : slot.id));
  };

  // Handle Demo Pass generation
  const handleSimulatePass = (facility: ParkingFacility, slot: ParkingSlot, durationHours: number) => {
    const passNum = Math.floor(100000 + Math.random() * 900000);
    const passCode = `PARK-DL-${passNum}`;
    const now = new Date();
    const validUntil = new Date(now.getTime() + durationHours * 3600 * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setPassModalData({
      facility,
      slot,
      durationHours,
      passCode,
      validUntil,
      totalAmount: slot.hourlyRate * durationHours,
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 🧭 Top Navigation & Back Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center space-x-2 text-xs font-extrabold text-slate-600 hover:text-blue-600 transition-colors w-fit group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Citizen Home</span>
        </button>

        {/* Accessibility & Demo Tag */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold">
            <Info className="w-3 h-3 text-blue-600" />
            <span>Designed with accessibility considerations based on WCAG/GIGW guidance.</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-black border border-amber-200">
            DEMO DATA
          </span>
        </div>
      </div>

      {/* 🅿️ Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =========================================================================
            LEFT COLUMN (Cols 1-5): NEARBY PARKING FACILITIES DISCOVERY
           ========================================================================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
          {/* Header */}
          <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
              <ParkingSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Find Parking Facilities
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Live availability, hourly tariffs, and EV charging points
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search garage name, sector, or code..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                filterMode === 'ALL'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({facilities.length})
            </button>
            <button
              onClick={() => setFilterMode('EV_ONLY')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1 whitespace-nowrap ${
                filterMode === 'EV_ONLY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>EV Ready</span>
            </button>
            <button
              onClick={() => setFilterMode('NEARBY')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                filterMode === 'NEARBY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              &lt; 1 km Nearby
            </button>
          </div>

          {/* Facilities List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center py-10 space-y-2">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Scanning nearby parking facilities...</p>
              </div>
            ) : filteredFacilities.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-500 font-medium">
                No parking facilities match your search filter.
              </div>
            ) : (
              filteredFacilities.map((fac) => (
                <ParkingFacilityCard
                  key={fac.id}
                  facility={fac}
                  isSelected={activeFacility?.id === fac.id}
                  onSelect={handleSelectFacility}
                />
              ))
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (Cols 6-12): MOVIE-THEATRE SEAT STYLE SLOT SELECTION
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {activeFacility ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-sm">
              {/* Facility Header Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {activeFacility.code}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {activeFacility.name}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {activeFacility.address} • {activeFacility.distanceDisplay} • Rate: ₹{activeFacility.hourlyRateInr}/hr
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                    {activeFacility.availableSlots} / {activeFacility.totalSlots} FREE
                  </span>
                </div>
              </div>

              {/* Status Legend */}
              <ParkingLegend />

              {/* 🎬 Visual Cinema-Seat Parking Slot Grid */}
              <CinemaSeatParkingGrid
                facility={activeFacility}
                selectedSlotId={selectedSlotId}
                onSelectSlot={handleSelectSlot}
              />

              {/* Selected Slot Details Panel (Interactive) */}
              {selectedSlot ? (
                <ParkingSlotDetailCard
                  facility={activeFacility}
                  slot={selectedSlot}
                  onGetDirections={onGetDirections}
                  onSimulatePass={handleSimulatePass}
                  onClearSelection={() => setSelectedSlotId(null)}
                />
              ) : (
                <div className="p-6 rounded-3xl bg-slate-50/70 border border-dashed border-slate-300 text-center space-y-1.5">
                  <Sparkles className="w-5 h-5 text-teal-600 mx-auto" />
                  <div className="text-xs font-extrabold text-slate-800">
                    Select any green Available slot above
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto font-medium">
                    Tap a parking bay on the map to inspect bay amenities, calculate tariffs, and trigger direct GPS navigation.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-slate-400 font-medium">
              Select a parking facility from the left column to view the movie-theatre slot map.
            </div>
          )}
        </div>
      </div>

      {/* 🎟️ Simulated Parking Pass Modal (Demo Feature) */}
      {passModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-teal-700">
                <QrCode className="w-5 h-5" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Simulated Digital Parking Pass (Demo)
                </h3>
              </div>
              <button
                onClick={() => setPassModalData(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
                aria-label="Close pass modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Mock graphic */}
            <div className="w-36 h-36 mx-auto bg-slate-900 text-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-lg">
              <QrCode className="w-20 h-20 text-white" />
              <span className="font-mono text-[9px] text-teal-300 font-bold mt-1">
                {passModalData.passCode}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Bay</span>
              <div className="text-2xl font-black font-mono text-blue-600">
                Slot {passModalData.slot.code}
              </div>
              <div className="font-extrabold text-sm text-slate-900">
                {passModalData.facility.name}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <strong className="text-slate-900">{passModalData.durationHours} Hours</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valid Until:</span>
                <strong className="text-slate-900">{passModalData.validUntil}</strong>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Demo Tariff:</span>
                <strong className="text-emerald-700 font-mono text-sm">₹{passModalData.totalAmount}</strong>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onGetDirections(passModalData.facility, passModalData.slot);
                  setPassModalData(null);
                }}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <span>Navigate to Parking</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
