import React, { useState } from 'react';
import {
  PhoneCall,
  HeartPulse,
  Shield,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Radio,
  Zap,
} from 'lucide-react';

export const EmergencyPublic: React.FC = () => {
  const [sosSent, setSosSent] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [locationName, setLocationName] = useState('Central Boulevard, Tech Park Sector 4');

  const handleTriggerSOS = () => {
    setSosSending(true);
    setTimeout(() => {
      setSosSending(false);
      setSosSent(true);
    }, 1200);
  };

  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            <span>24/7 Smart City Emergency Response Hub</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Emergency & SOS Assistance
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Instant connectivity to Unified First Responders (112), Ambulance (108), Traffic Police, and Fire Rescue.
          </p>
        </div>

        {/* Emergency Hotline Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="tel:112"
            className="light-card p-6 border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 transition-colors text-center space-y-2 block"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-rose-700">112</div>
            <div className="text-xs font-bold text-slate-900">National Unified SOS</div>
            <div className="text-[11px] text-slate-500">Police, Ambulance, Fire</div>
          </a>

          <a
            href="tel:108"
            className="light-card p-6 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition-colors text-center space-y-2 block"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-emerald-700">108</div>
            <div className="text-xs font-bold text-slate-900">Emergency Ambulance</div>
            <div className="text-[11px] text-slate-500">Immediate Trauma Care</div>
          </a>

          <a
            href="tel:1095"
            className="light-card p-6 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 transition-colors text-center space-y-2 block"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-indigo-700">1095</div>
            <div className="text-xs font-bold text-slate-900">Traffic Police Hotline</div>
            <div className="text-[11px] text-slate-500">Accident & Route Clear</div>
          </a>

          <a
            href="tel:101"
            className="light-card p-6 border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 transition-colors text-center space-y-2 block"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-amber-800">101</div>
            <div className="text-xs font-bold text-slate-900">Fire & Disaster Rescue</div>
            <div className="text-[11px] text-slate-500">Hazard & Evacuation</div>
          </a>
        </div>

        {/* Interactive 1-Click Distress SOS Box */}
        <div className="light-card p-8 border-rose-200 bg-white shadow-card max-w-3xl mx-auto space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">One-Tap Smart City SOS Beacon</h2>
              <p className="text-xs text-slate-500">Transmits your live GPS coordinates to nearest active emergency units</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Detected Incident Location</label>
              <div className="flex items-center space-x-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium">
                <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="bg-transparent w-full focus:outline-none"
                  placeholder="Enter location or street..."
                />
              </div>
            </div>

            {sosSent ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>EMERGENCY BEACON TRANSMITTED (TICKET #SOS-9182)</span>
                </div>
                <p className="text-xs text-emerald-800">
                  Command Center, EMS Ambulance Unit 108, and Traffic Police Division have received your distress call at <strong>{locationName}</strong>. Nearest Ambulance ETA: <strong>4.2 mins</strong>.
                </p>
                <button
                  onClick={() => setSosSent(false)}
                  className="text-xs font-bold text-emerald-700 underline pt-1"
                >
                  Reset SOS Beacon
                </button>
              </div>
            ) : (
              <button
                onClick={handleTriggerSOS}
                disabled={sosSending}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <Radio className={`w-5 h-5 ${sosSending ? 'animate-spin' : 'animate-pulse'}`} />
                <span>{sosSending ? 'Broadcasting SOS Beacon...' : 'ACTIVATE INSTANT EMERGENCY SOS (112)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Nearest Trauma Centers & Emergency Facilities */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Nearest Trauma Centers & Hospitals</h3>
              <p className="text-xs text-slate-500">Live bed availability and trauma capability</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Verified by Hospital Network</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="light-card p-6 border-slate-200 bg-white space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Metro General Trauma Center</h4>
                  <p className="text-xs text-slate-500">Sector 12, Hospital Way (1.8 km)</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                  LEVEL 1 TRAUMA
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="p-2 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500">ICU Beds</div>
                  <div className="font-bold text-slate-900">3 Available</div>
                </div>
                <div className="p-2 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500">Emergency Beds</div>
                  <div className="font-bold text-slate-900">6 Available</div>
                </div>
              </div>
              <a href="tel:108" className="inline-block text-xs font-bold text-brand-600 hover:underline">
                Direct Emergency Call →
              </a>
            </div>

            <div className="light-card p-6 border-slate-200 bg-white space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">City Super Specialty Hospital</h4>
                  <p className="text-xs text-slate-500">Outer Ring Road, North (3.4 km)</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                  LEVEL 2 TRAUMA
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="p-2 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500">ICU Beds</div>
                  <div className="font-bold text-slate-900">5 Available</div>
                </div>
                <div className="p-2 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500">Emergency Beds</div>
                  <div className="font-bold text-slate-900">11 Available</div>
                </div>
              </div>
              <a href="tel:108" className="inline-block text-xs font-bold text-brand-600 hover:underline">
                Direct Emergency Call →
              </a>
            </div>

            <div className="light-card p-6 border-slate-200 bg-white space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Metropolitan Police Headquarters</h4>
                  <p className="text-xs text-slate-500">Civic Square, Central Sector (2.1 km)</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                  POLICE CONTROL
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="p-2 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500">Patrol Units</div>
                  <div className="font-bold text-slate-900">18 Active</div>
                </div>
                <div className="p-2 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500">Response Avg</div>
                  <div className="font-bold text-slate-900">4.5 mins</div>
                </div>
              </div>
              <a href="tel:1095" className="inline-block text-xs font-bold text-indigo-600 hover:underline">
                Direct Police Dispatch →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
