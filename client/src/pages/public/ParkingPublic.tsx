import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ParkingSquare,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ParkingLot {
  id: string;
  name: string;
  total: number;
  available: number;
  evChargers: number;
  evAvailable: number;
  feePerHour: string;
  zone: string;
}

export const ParkingPublic: React.FC = () => {
  const [lots, setLots] = useState<ParkingLot[]>([
    { id: 'LOT-A1', name: 'Metro Central Underground Lot', total: 200, available: 54, evChargers: 12, evAvailable: 4, feePerHour: '₹30/hr', zone: 'Central' },
    { id: 'LOT-B2', name: 'Civic Center Smart Plaza', total: 150, available: 68, evChargers: 8, evAvailable: 5, feePerHour: '₹20/hr', zone: 'Sector 4' },
    { id: 'LOT-C3', name: 'Tech Valley Multi-level Park', total: 400, available: 180, evChargers: 24, evAvailable: 14, feePerHour: '₹40/hr', zone: 'North Tech' },
    { id: 'LOT-D4', name: 'Metro Hospital Visitor Garage', total: 120, available: 40, evChargers: 6, evAvailable: 2, feePerHour: '₹25/hr', zone: 'Hospital Zone' },
  ]);

  const [totalAvailable, setTotalAvailable] = useState(342);

  useEffect(() => {
    axios
      .get('/api/public/parking')
      .then((res) => {
        if (res.data.lots) setLots(res.data.lots);
        if (res.data.totalAvailable) setTotalAvailable(res.data.totalAvailable);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <ParkingSquare className="w-3.5 h-3.5" />
            <span>Smart City IoT Parking Network</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Smart Parking & EV Charging
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Live sensor-verified vacancy across all municipal multi-level garages and curbside smart bays.
          </p>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="light-card p-6 border-slate-200 bg-white space-y-1">
            <div className="text-xs text-slate-500 font-medium">Total Available Spots</div>
            <div className="text-3xl font-black text-blue-600">{totalAvailable}</div>
            <div className="text-xs text-emerald-600 font-semibold">Live IoT Ultrasonic Sensors</div>
          </div>

          <div className="light-card p-6 border-slate-200 bg-white space-y-1">
            <div className="text-xs text-slate-500 font-medium">EV Charging Fast Plugs</div>
            <div className="text-3xl font-black text-emerald-600">25 Available</div>
            <div className="text-xs text-slate-500">Across 18 Municipal Garages</div>
          </div>

          <div className="light-card p-6 border-slate-200 bg-white space-y-1">
            <div className="text-xs text-slate-500 font-medium">Average Tariff</div>
            <div className="text-3xl font-black text-slate-900">₹30 / hr</div>
            <div className="text-xs text-slate-500">Contactless UPI & FASTag Enabled</div>
          </div>
        </div>

        {/* Parking Lots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lots.map((lot) => (
            <div key={lot.id} className="light-card p-6 border-slate-200 bg-white space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                    {lot.zone}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{lot.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">{lot.feePerHour}</span>
                  <div className="text-[10px] text-slate-500">Standard Rate</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Capacity Status</span>
                  <span className="text-blue-600">{lot.available} / {lot.total} spots free</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${Math.round(((lot.total - lot.available) / lot.total) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* EV Charging & Reservation CTA */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>{lot.evAvailable} EV Plugs Free</span>
                </div>
                <Link
                  to="/login/citizen"
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors"
                >
                  Reserve via Citizen Portal →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
