import React from 'react';
import {
  Plus,
  Minus,
  Maximize2,
  Compass,
  Layers,
  Box,
  RotateCcw,
} from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFitBounds: () => void;
  is3DMode: boolean;
  onToggle3D: () => void;
  tileTheme: 'positron' | 'voyager' | 'osm';
  onCycleTileTheme: () => void;
  zoomLevel: number;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitBounds,
  is3DMode,
  onToggle3D,
  tileTheme,
  onCycleTileTheme,
  zoomLevel,
}) => {
  const getThemeLabel = () => {
    switch (tileTheme) {
      case 'positron':
        return 'Light Clean';
      case 'voyager':
        return 'Vibrant Twin';
      case 'osm':
        return 'Standard Map';
      default:
        return 'Light Clean';
    }
  };

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

        <div className="text-[10px] font-mono font-black text-center text-slate-400 py-0.5 border-y border-slate-100">
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
          title="Reset View to City Center"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onFitBounds}
          title="Fit Metropolitan Boundary"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-all"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={onToggle3D}
          title="Toggle 2.5D Isometric Pitch"
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            is3DMode
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
          }`}
        >
          <Box className="w-4 h-4" />
        </button>
      </div>

      {/* Map Tile Style Switcher */}
      <button
        onClick={onCycleTileTheme}
        title="Cycle Map Style (Light Clean / Vibrant Twin / Standard)"
        className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md text-slate-700 hover:text-blue-600 font-bold text-xs flex items-center space-x-1.5 transition-all hover:bg-white"
      >
        <Layers className="w-3.5 h-3.5 text-blue-600" />
        <span>{getThemeLabel()}</span>
      </button>

      {/* Compass / Orientation Indicator */}
      <div className="bg-white/90 backdrop-blur rounded-xl px-2 py-1 border border-slate-200 shadow-sm flex items-center space-x-1 text-[10px] font-bold text-slate-600">
        <Compass className="w-3 h-3 text-rose-500 animate-spin" style={{ animationDuration: '12s' }} />
        <span>NORTH 0°</span>
      </div>
    </div>
  );
};
