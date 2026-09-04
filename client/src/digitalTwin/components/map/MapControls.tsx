import React from 'react';
import {
  Plus,
  Minus,
  Maximize2,
  Compass,
  RotateCcw,
  Building2,
} from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitBounds: () => void;
  is3DMode: boolean;
  onToggle3D: () => void;
  showBuildings3D: boolean;
  onToggleBuildings3D: () => void;
  onResetBearing: () => void;
  bearing?: number;
  zoomLevel: number;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitBounds,
  is3DMode,
  onToggle3D,
  showBuildings3D,
  onToggleBuildings3D,
  onResetBearing,
  bearing = 0,
  zoomLevel,
}) => {
  return (
    <div className="absolute top-4 right-4 z-[400] flex flex-col items-end space-y-2 pointer-events-auto select-none">
      {/* Zoom and Navigation Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 p-1 flex flex-col space-y-1">
        <button
          onClick={onZoomIn}
          title="Zoom In (Scroll Up)"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="text-[10px] font-mono font-black text-center text-slate-500 py-0.5 border-y border-slate-100">
          {zoomLevel.toFixed(1)}z
        </div>

        <button
          onClick={onZoomOut}
          title="Zoom Out (Scroll Down)"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* View Orientation & 3D Tilt Controls */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/80 p-1 flex flex-col space-y-1">
        <button
          onClick={onResetView}
          title="Reset View to Central Delhi"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onFitBounds}
          title="Fit Metropolitan Road Network"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-all"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* 2D / 3D Pitch View Toggle */}
        <button
          onClick={onToggle3D}
          title={is3DMode ? "Switch to 2D Top-Down View (0° Pitch)" : "Switch to 3D Tilted View (60° Pitch)"}
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs transition-all ${
            is3DMode
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
          }`}
        >
          {is3DMode ? '3D' : '2D'}
        </button>

        {/* 3D Buildings Toggle */}
        <button
          onClick={onToggleBuildings3D}
          title={showBuildings3D ? "Hide 3D Building Extrusions" : "Show 3D Building Extrusions"}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            showBuildings3D
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
              : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
        </button>
      </div>

      {/* Compass / Orientation Indicator & Reset Bearing */}
      <button
        onClick={onResetBearing}
        title="Reset Rotation to True North (0° Bearing)"
        className="bg-white/95 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-slate-200 shadow-md flex items-center space-x-1.5 text-[10px] font-bold text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-all"
      >
        <Compass
          className="w-3.5 h-3.5 text-rose-500 transition-transform duration-300"
          style={{ transform: `rotate(${-bearing}deg)` }}
        />
        <span>NORTH {Math.round((bearing + 360) % 360)}°</span>
      </button>

      {/* Basemap Attribution Badge */}
      <div className="bg-slate-900/80 backdrop-blur-md text-slate-300 rounded-lg px-2 py-0.5 text-[9px] font-medium border border-slate-700/60 shadow">
        OpenFreeMap Liberty (Vector 3D)
      </div>
    </div>
  );
};
