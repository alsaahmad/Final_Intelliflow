import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Car,
  AlertTriangle,
  HeartPulse,
  Navigation,
} from 'lucide-react';

interface TrafficData {
  cityCongestionIndex: number;
  corridors: Array<{ name: string; congestion: string; speedKmh: number; status: string }>;
  advisories: string[];
}

export const TrafficPublic: React.FC = () => {
  const [traffic, setTraffic] = useState<TrafficData>({
    cityCongestionIndex: 48,
    corridors: [
      { name: 'Outer Ring Expressway', congestion: 'LOW (22%)', speedKmh: 68, status: 'FLOWING' },
      { name: 'Central Boulevard Hub', congestion: 'MODERATE (54%)', speedKmh: 34, status: 'MODERATE' },
      { name: 'Hospital Link Corridor', congestion: 'CLEAR (18%)', speedKmh: 55, status: 'GREEN_CORRIDOR' },
      { name: 'Tech Park Expressway', congestion: 'HEAVY (72%)', speedKmh: 20, status: 'CONGESTED' },
      { name: 'Old Town Commercial Way', congestion: 'MODERATE (45%)', speedKmh: 28, status: 'MODERATE' },
    ],
    advisories: [
      'Green Corridor active between Ring Road and Trauma Center.',
      'Peak hour advisory in effect for Tech Park North zone.',
    ],
  });

  useEffect(() => {
    axios
      .get('/api/public/traffic')
      .then((res) => {
        if (res.data) setTraffic(res.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            <Car className="w-3.5 h-3.5 text-amber-700" />
            <span>Real-Time Traffic Digital Twin</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Metropolitan Traffic Information
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Live arterial congestion feeds, active green corridors, and dynamic municipal road advisories.
          </p>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="light-card p-6 border-slate-200 bg-white space-y-2">
            <div className="text-xs text-slate-500 font-medium">Citywide Congestion Index</div>
            <div className="text-3xl font-black text-slate-900">{traffic.cityCongestionIndex}%</div>
            <div className="text-xs text-emerald-600 font-semibold">Normal Flow • 142 AI Signals Active</div>
          </div>

          <div className="light-card p-6 border-slate-200 bg-white space-y-2">
            <div className="text-xs text-slate-500 font-medium">Active Green Corridors</div>
            <div className="text-3xl font-black text-rose-600">1 Active Wave</div>
            <div className="text-xs text-rose-600 font-semibold">Hospital Link Corridor Priority</div>
          </div>

          <div className="light-card p-6 border-slate-200 bg-white space-y-2">
            <div className="text-xs text-slate-500 font-medium">Average Arterial Speed</div>
            <div className="text-3xl font-black text-blue-600">46.2 km/h</div>
            <div className="text-xs text-slate-500">Updated every 15 seconds</div>
          </div>
        </div>

        {/* Major Corridors Table / Cards */}
        <div className="light-card p-6 sm:p-8 border-slate-200 bg-white space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Major Arterial Corridors Live Status</h2>
              <p className="text-xs text-slate-500">Real-time sensor and camera speed analytics</p>
            </div>
            <span className="text-xs font-bold text-brand-600">Live AI Sync</span>
          </div>

          <div className="space-y-3">
            {traffic.corridors.map((c, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 gap-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                    <Navigation className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                    <div className="text-xs text-slate-500">Speed: <strong className="text-slate-800">{c.speedKmh} km/h</strong></div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-slate-700">{c.congestion}</span>
                  {c.status === 'GREEN_CORRIDOR' && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[11px] border border-rose-200 flex items-center space-x-1">
                      <HeartPulse className="w-3 h-3 text-rose-600 animate-pulse" />
                      <span>GREEN CORRIDOR</span>
                    </span>
                  )}
                  {c.status === 'FLOWING' && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                      FLOWING
                    </span>
                  )}
                  {c.status === 'MODERATE' && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[11px]">
                      MODERATE
                    </span>
                  )}
                  {c.status === 'CONGESTED' && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px]">
                      CONGESTED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Advisories */}
        <div className="light-card p-6 border-slate-200 bg-white space-y-4">
          <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Active Traffic & Roadwork Advisories</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {traffic.advisories.map((adv, idx) => (
              <li key={idx} className="flex items-start space-x-2 p-3 rounded-lg bg-amber-50/60 border border-amber-200/50">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 flex-shrink-0"></span>
                <span>{adv}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
