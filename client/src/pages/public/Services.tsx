import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Car,
  ParkingSquare,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const Services: React.FC = () => {
  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-widest text-brand-600">
            IntelliFlow Smart City Ecosystem
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            City Services & Utilities Catalog
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Explore dedicated public services available across the smart city network.
          </p>
        </div>

        {/* 3 Featured Public Services Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Service 1: Emergency / SOS */}
          <div className="light-card p-8 border-slate-200 bg-white flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-1 rounded bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase tracking-wider">
                Emergency 24/7
              </div>
              <h2 className="text-xl font-bold text-slate-900">Emergency & SOS 112</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct one-touch distress transmission with real-time GPS location sharing. Connects immediately to Unified Police, Ambulance (108), and Fire Rescue dispatchers.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instant 112/108/101 Emergency Calling</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Nearest Trauma Centers & Police Station Locator</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Automated Green Corridor Priority Alert</span>
                </li>
              </ul>
            </div>
            <Link
              to="/services/emergency"
              className="inline-flex items-center justify-center space-x-2 w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors"
            >
              <span>Access Emergency Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Service 2: Traffic Information */}
          <div className="light-card p-8 border-slate-200 bg-white flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Car className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-1 rounded bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                Live Telemetry
              </div>
              <h2 className="text-xl font-bold text-slate-900">Traffic Information & AI Routing</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Real-time congestion heatmaps by zone, adaptive signal timings, active green corridor route warnings, and civil roadwork notifications.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Live Sector Congestion Indexes (48% Avg)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Active Emergency Corridor Alerts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dynamic Road Maintenance Schedules</span>
                </li>
              </ul>
            </div>
            <Link
              to="/services/traffic"
              className="inline-flex items-center justify-center space-x-2 w-full py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition-colors"
            >
              <span>View Live Traffic Information</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Service 3: Smart Parking */}
          <div className="light-card p-8 border-slate-200 bg-white flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <ParkingSquare className="w-6 h-6" />
              </div>
              <div className="inline-block px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wider">
                IoT Sensors
              </div>
              <h2 className="text-xl font-bold text-slate-900">Smart Parking & EV Hubs</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sensor-connected municipal parking garages and curbside spots. View real-time availability, EV fast-charging plugs, and pre-reserve spots.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>340+ Vacant Spots Across 18 Garages</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>EV Fast Charger Availability Live Tracker</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pre-book slot from Citizen Portal</span>
                </li>
              </ul>
            </div>
            <Link
              to="/services/parking"
              className="inline-flex items-center justify-center space-x-2 w-full py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors"
            >
              <span>Explore Parking Finder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Civic Grievance Banner */}
        <div className="light-card p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Need to report a civic or municipal issue?</h3>
            <p className="text-xs text-slate-600 max-w-xl">
              File a grievance for potholes, street lighting, garbage accumulation, or traffic signal malfunctions directly to the Municipal Works and Traffic Police departments.
            </p>
          </div>
          <Link
            to="/grievance"
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex-shrink-0"
          >
            File Grievance Ticket →
          </Link>
        </div>
      </div>
    </div>
  );
};
