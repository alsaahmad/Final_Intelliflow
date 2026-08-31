import React, { useState } from 'react';
import { useTwin } from '../../../context/TwinContext';
import { Video, X, Eye, EyeOff, Radio } from 'lucide-react';

export const CCTVCamModal: React.FC = () => {
  const { cameraModalCCTV, closeCameraFeed } = useTwin();
  const [showAiBoxes, setShowAiBoxes] = useState(true);
  const [nightVision, setNightVision] = useState(false);

  if (!cameraModalCCTV) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 space-y-0">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {cameraModalCCTV.code}
                </span>
                <span className="inline-flex items-center space-x-1 text-emerald-700 text-[10px] font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>AI INFERENCE ACTIVE</span>
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 mt-0.5">{cameraModalCCTV.name}</h3>
            </div>
          </div>

          <button
            onClick={closeCameraFeed}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Camera Feed Canvas with Simulated CV Overlays */}
        <div
          className={`relative w-full h-80 sm:h-96 bg-slate-950 overflow-hidden select-none ${
            nightVision ? 'filter brightness-125 contrast-125 hue-rotate-90' : ''
          }`}
        >
          <img
            src={cameraModalCCTV.sampleStreamUrl}
            alt={cameraModalCCTV.name}
            className="w-full h-full object-cover opacity-90"
          />

          {/* Top Live Camera Telemetry Overlay */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-mono font-bold pointer-events-none drop-shadow-md">
            <div className="flex items-center space-x-2 bg-black/60 backdrop-blur px-2.5 py-1 rounded-lg border border-white/10">
              <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>REC ● 1080p 60FPS</span>
              <span className="text-slate-400">|</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>

            {/* DPDP Act 2023 Pulsing Shield Badge */}
            <div className="flex items-center space-x-1.5 bg-emerald-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-emerald-500/50 text-emerald-300 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-sans font-black">DPDP Privacy Mode: Edge Face & Plate Blurring Active</span>
            </div>
          </div>

          {/* Simulated AI Computer Vision Bounding Boxes */}
          {showAiBoxes && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Bounding Box 1: Stalled Sedan */}
              <div className="absolute top-[35%] left-[30%] w-36 h-28 border-2 border-rose-500 bg-rose-500/10 rounded-sm">
                <div className="absolute -top-5 left-0 bg-rose-600 text-white font-mono text-[9px] font-black px-1.5 py-0.2 rounded shadow">
                  COLLISION HAZARD: 97.4%
                </div>
              </div>

              {/* Bounding Box 2: Van */}
              <div className="absolute top-[40%] left-[55%] w-32 h-24 border-2 border-amber-400 bg-amber-400/10 rounded-sm">
                <div className="absolute -top-5 left-0 bg-amber-500 text-white font-mono text-[9px] font-black px-1.5 py-0.2 rounded shadow">
                  COMMERCIAL VAN: 94.8%
                </div>
              </div>

              {/* Bounding Box 3: Flowing Traffic */}
              <div className="absolute top-[50%] left-[10%] w-24 h-20 border-2 border-emerald-400 bg-emerald-400/10 rounded-sm">
                <div className="absolute -top-5 left-0 bg-emerald-600 text-white font-mono text-[9px] font-black px-1.5 py-0.2 rounded shadow">
                  SEDAN (42 km/h): 98.2%
                </div>
              </div>

              {/* Center Target Reticle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/40 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-rose-500 rounded-full" />
              </div>
            </div>
          )}

          {/* Bottom Feed Metadata Strip */}
          <div className="absolute bottom-3 left-3 right-3 bg-slate-900/85 backdrop-blur-md rounded-xl p-2.5 border border-white/10 flex flex-wrap items-center justify-between text-xs text-white gap-2">
            <div className="flex items-center space-x-3 text-[11px]">
              <span>
                Vehicles Detected: <strong className="text-emerald-400">{cameraModalCCTV.vehiclesDetectedCount}</strong>
              </span>
              <span>•</span>
              <span>
                Pedestrians: <strong className="text-blue-400">{cameraModalCCTV.pedestriansCount}</strong>
              </span>
              <span>•</span>
              <span>
                Density: <strong className="text-amber-400">{cameraModalCCTV.trafficDensity}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAiBoxes(!showAiBoxes)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold transition-colors flex items-center space-x-1"
              >
                {showAiBoxes ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                <span>AI Boxes</span>
              </button>

              <button
                onClick={() => setNightVision(!nightVision)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold transition-colors"
              >
                {nightVision ? 'Thermal Mode: ON' : 'IR Night Filter'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-600 font-medium">
            AI Event: <strong className="text-rose-600">{cameraModalCCTV.latestEvent.replace(/_/g, ' ')}</strong>
          </div>

          <button
            onClick={closeCameraFeed}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close Feed
          </button>
        </div>
      </div>
    </div>
  );
};
