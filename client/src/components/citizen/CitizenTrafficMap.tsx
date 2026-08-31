import React from 'react';
import { CitizenJunctionSummary } from '../../types/citizen';
import { DualMapView, MapMarker } from '../map/DualMapView';
import {
  MapPin,
  Activity,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface CitizenTrafficMapProps {
  junctions: CitizenJunctionSummary[];
  selectedJunction: CitizenJunctionSummary | null;
  onSelectJunction: (junction: CitizenJunctionSummary) => void;
  onOpenFullNavigation?: () => void;
  isLoading?: boolean;
}

export const CitizenTrafficMap: React.FC<CitizenTrafficMapProps> = ({
  junctions,
  selectedJunction,
  onSelectJunction,
  onOpenFullNavigation,
  isLoading = false,
}) => {
  // Convert junctions into DualMapView markers
  const mapMarkers: MapMarker[] = junctions.map((j) => {
    const isSelected = selectedJunction?.id === j.id;
    const color = isSelected
      ? '#2563eb' // Blue highlight when selected
      : j.signalPhase === 'GREEN_CORRIDOR'
      ? '#059669' // Emerald
      : j.congestionPercent > 70
      ? '#e11d48' // Rose / Red
      : j.congestionPercent > 40
      ? '#f59e0b' // Amber
      : '#10b981'; // Green

    const badge =
      j.signalPhase === 'GREEN_CORRIDOR'
        ? '⚡'
        : j.congestionPercent > 70
        ? '!'
        : `${j.congestionPercent}%`;

    return {
      id: j.id,
      lat: j.location[0],
      lng: j.location[1],
      title: `${j.name} (${j.congestionPercent}% Flow - ${j.severity})`,
      category: 'JUNCTION',
      color,
      badge,
      onClick: () => onSelectJunction(j),
    };
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col space-y-3.5 relative">
      {/* Header with Title & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Traffic Around You</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Live arterial flow, signal status & corridor speed
            </p>
          </div>
        </div>

        {/* Severity Legend */}
        <div className="flex items-center space-x-2 text-[10px] font-bold">
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Clear (&lt;40%)</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Moderate</span>
          </span>
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>Heavy (&gt;70%)</span>
          </span>
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div className="relative w-full h-[340px] sm:h-[400px] lg:h-[440px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-xs space-y-2">
            <div className="w-8 h-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-xs font-bold text-slate-600">Loading traffic nodes...</span>
          </div>
        ) : junctions.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center space-y-2">
            <MapPin className="w-8 h-8 text-slate-400" />
            <p className="text-xs font-bold text-slate-700">No traffic junctions available in this perimeter</p>
            <p className="text-[11px] text-slate-500">Live sensing data may be offline or initializing.</p>
          </div>
        ) : (
          <>
            <DualMapView
              center={[28.6139, 77.209]}
              zoom={13.5}
              markers={mapMarkers}
              showControls={true}
            />

            {/* Bottom Floating Junction Prompt / Quick Telemetry Pill */}
            <div className="absolute bottom-3 left-3 right-3 z-[400] pointer-events-auto">
              {selectedJunction ? (
                <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs text-white shadow-sm flex-shrink-0 ${
                        selectedJunction.signalPhase === 'GREEN_CORRIDOR'
                          ? 'bg-emerald-600'
                          : selectedJunction.congestionPercent > 70
                          ? 'bg-rose-600'
                          : selectedJunction.congestionPercent > 40
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    >
                      {selectedJunction.code}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {selectedJunction.name}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            selectedJunction.congestionPercent > 70
                              ? 'bg-rose-100 text-rose-800'
                              : selectedJunction.congestionPercent > 40
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {selectedJunction.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                        <span>Flow: <strong className="text-slate-800">{selectedJunction.congestionPercent}%</strong></span>
                        <span>•</span>
                        <span>Speed: <strong className="text-slate-800">{selectedJunction.averageSpeedKmh} km/h</strong></span>
                        <span>•</span>
                        <span>Phase: <strong className="text-blue-700">{selectedJunction.signalPhase}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectJunction(selectedJunction)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1 flex-shrink-0 transition-colors"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-md flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold text-slate-800">Tap any junction node to view real-time traffic details</span>
                  </div>
                  {onOpenFullNavigation && (
                    <button
                      onClick={onOpenFullNavigation}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Route Planner</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
