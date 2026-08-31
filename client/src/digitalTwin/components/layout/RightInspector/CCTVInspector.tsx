import React from 'react';
import { CCTVCamera } from '../../../types';
import { useTwin } from '../../../context/TwinContext';
import { Video, Sparkles, Eye, Car, Users } from 'lucide-react';

interface CCTVInspectorProps {
  cctv: CCTVCamera;
}

export const CCTVInspector: React.FC<CCTVInspectorProps> = ({ cctv }) => {
  const { openCameraFeed } = useTwin();

  const getEventBadge = () => {
    switch (cctv.latestEvent) {
      case 'ACCIDENT_DETECTED':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black uppercase flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            <span>ACCIDENT DETECTED</span>
          </span>
        );
      case 'ROAD_BLOCKAGE':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black uppercase">ROAD BLOCKAGE</span>;
      case 'TRAFFIC_CONGESTION':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black uppercase">CONGESTION DETECTED</span>;
      case 'NORMAL':
      default:
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">FLOW NORMAL</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {cctv.code}
          </span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase text-emerald-700">{cctv.status}</span>
          </div>
        </div>
        <h3 className="text-base font-extrabold text-slate-900">{cctv.name}</h3>
        <p className="text-xs text-slate-500 font-medium">Azimuth: {cctv.azimuthHeading}° • FOV: {cctv.fovAngle}° Wide</p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <Car className="w-3 h-3 text-blue-500" />
            <span>Vehicles</span>
          </div>
          <div className="text-xl font-black text-slate-900">{cctv.vehiclesDetectedCount}</div>
          <span className="text-[10px] text-slate-500">{cctv.trafficDensity} Density</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase flex items-center space-x-1">
            <Users className="w-3 h-3 text-indigo-500" />
            <span>Pedestrians</span>
          </div>
          <div className="text-xl font-black text-slate-900">{cctv.pedestriansCount}</div>
          <span className="text-[10px] text-slate-500">Crosswalk telemetry</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase">AI Vision Model</div>
          <div className="text-xs font-bold text-slate-900">YOLOv10 + DeepSORT</div>
          <span className="text-[10px] text-emerald-600 font-bold">Edge Accelerated</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-0.5">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Confidence</div>
          <div className="text-lg font-black text-slate-900">{cctv.detectionConfidence}%</div>
          <span className="text-[10px] text-slate-500">Real-time inference</span>
        </div>
      </div>

      {/* Latest AI Event Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-700 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Real-Time Event State:</span>
          </span>
          {getEventBadge()}
        </div>
        <p className="text-[11px] text-slate-600">
          Continuous neural video inference monitoring for: Accidents, Stopped vehicles, Blockages, Wrong-way transit, Smoke/Fire, and Crowds.
        </p>
      </div>

      {/* Snapshot Preview Card */}
      <div
        onClick={() => openCameraFeed(cctv)}
        className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer group"
      >
        <img
          src={cctv.sampleStreamUrl}
          alt={cctv.name}
          className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-black text-xs shadow-lg flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Expand Live Stream</span>
          </span>
        </div>
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-[9px] font-bold">
          REC ● LIVE
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => openCameraFeed(cctv)}
          className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Launch AI Computer Vision Feed</span>
        </button>
      </div>
    </div>
  );
};
