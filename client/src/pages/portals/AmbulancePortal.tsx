import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  PhoneCall,
  HeartPulse,
  CheckCircle2,
  Zap,
  MapPin,
  Clock,
  Radio,
  Send,
  Activity,
} from 'lucide-react';

interface MissionData {
  unitId: string;
  driver: string;
  paramedicStatus: string;
  assignedIncident: {
    id: string;
    callType: string;
    priority: string;
    patientLocation: string;
    destinationHospital: string;
    etaMinutes: number;
  };
  greenCorridorStatus: {
    active: boolean;
    corridorId: string;
    signalsUpcoming: Array<{ name: string; state: string; distanceMeters: number }>;
  };
  vitalTelemetryStream: {
    heartRateBpm: number;
    spO2Percent: number;
    bloodPressure: string;
    ecgSyncLive: boolean;
  };
}

export const AmbulancePortal: React.FC = () => {
  const { user, logout } = useAuth();
  const [mission, setMission] = useState<MissionData | null>(null);
  const [corridorMessage, setCorridorMessage] = useState<string | null>(null);
  const [triageSent, setTriageSent] = useState(false);
  const [patientCondition, setPatientCondition] = useState('Severe Trauma / Conscious');

  const fetchMission = () => {
    axios
      .get('/api/ambulance/active-mission')
      .then((res) => setMission(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchMission();
  }, []);

  const handleRequestCorridor = async () => {
    try {
      const res = await axios.post('/api/ambulance/green-corridor/request', {
        emergencyCode: 'CODE_RED',
        destinationHospitalId: mission?.assignedIncident.destinationHospital,
      });
      setCorridorMessage(`✓ Green Corridor ${res.data.corridorId} ACTIVATED. Speed gain: ~${res.data.estimatedSpeedGainMinutes} mins.`);
      fetchMission();
    } catch (err) {
      setCorridorMessage('Failed to trigger green corridor.');
    }
  };

  const handleSendTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/ambulance/triage/submit', {
        condition: patientCondition,
        vitals: mission?.vitalTelemetryStream,
      });
      setTriageSent(true);
    } catch (err) {
      alert('Failed to transmit triage.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner with Global Navigation Law */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between light-card p-6 border-slate-200 bg-white shadow-card gap-4">
        <Link to="/" className="flex items-center space-x-4 group" title="Return to IntelliFlow OS Home">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <PhoneCall className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-extrabold text-[10px] border border-rose-200">
                EMS RAPID RESPONSE 108
              </span>
              <span className="text-xs text-slate-500 font-medium">Unit: {mission?.unitId || 'EMS-ALPHA-108'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              Paramedic {user?.name || 'Liam Connor'}
            </h1>
            <p className="text-xs text-slate-500">Status: <strong className="text-rose-600">{mission?.paramedicStatus || 'ACTIVE MISSION'}</strong></p>
          </div>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMission}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Refresh Telemetry
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors"
          >
            End Shift / Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Active Emergency Call Card */}
        <div className="light-card p-8 border-rose-300 bg-gradient-to-r from-white via-rose-50/20 to-white shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-rose-100 pb-4 gap-2">
            <div className="flex items-center space-x-3">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
              <div>
                <span className="font-mono text-xs font-black text-rose-700">
                  {mission?.assignedIncident.id || 'INC-8890'}
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {mission?.assignedIncident.callType || 'Cardiac Emergency / Acute Trauma'}
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs">
              {mission?.assignedIncident.priority || 'CODE RED - PRIORITY 1'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="text-slate-500 text-xs font-medium flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Patient Incident Location</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {mission?.assignedIncident.patientLocation || 'Building 4B, Metro Tech Zone'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="text-slate-500 text-xs font-medium flex items-center space-x-1">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-500" />
                <span>Destination Hospital & Bed</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {mission?.assignedIncident.destinationHospital || 'City General Trauma Center (ICU Bed 4 reserved)'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="text-slate-500 text-xs font-medium flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Current Hospital ETA</span>
              </div>
              <div className="font-black text-rose-600 text-xl">
                {mission?.assignedIncident.etaMinutes || 3.5} Minutes
              </div>
            </div>
          </div>

          {/* Green Corridor 1-Tap Trigger */}
          <div className="p-4 rounded-xl bg-rose-100/60 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-rose-900 text-sm flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-rose-600" />
                <span>Green Corridor Priority Wave</span>
              </div>
              <p className="text-xs text-rose-800">
                Override all traffic lights ahead to solid green. Auto-syncs with Traffic Police Division.
              </p>
            </div>
            <button
              onClick={handleRequestCorridor}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-2 flex-shrink-0"
            >
              <Radio className="w-4 h-4" />
              <span>ACTIVATE GREEN CORRIDOR</span>
            </button>
          </div>

          {corridorMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
              {corridorMessage}
            </div>
          )}
        </div>

        {/* Live Patient Vitals & In-Transit Triage Broadcast Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Vitals Telemetry */}
          <div className="lg:col-span-5 light-card p-6 border-slate-200 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Live In-Vehicle Bio-Telemetry</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ECG SYNC LIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] text-slate-500 font-bold">HEART RATE</div>
                <div className="text-2xl font-black text-slate-900">{mission?.vitalTelemetryStream.heartRateBpm || 104}</div>
                <div className="text-[10px] text-rose-600 font-bold">BPM (Tachycardia)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] text-slate-500 font-bold">OXYGEN SpO2</div>
                <div className="text-2xl font-black text-slate-900">{mission?.vitalTelemetryStream.spO2Percent || 96}%</div>
                <div className="text-[10px] text-emerald-600 font-bold">Stable on High Flow O2</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center col-span-2">
                <div className="text-[10px] text-slate-500 font-bold">BLOOD PRESSURE</div>
                <div className="text-xl font-black text-slate-900">{mission?.vitalTelemetryStream.bloodPressure || '135/88'} mmHg</div>
                <div className="text-[10px] text-slate-500 font-medium">Auto-measured 1 min ago</div>
              </div>
            </div>
          </div>

          {/* Transmit Triage to Hospital Trauma Desk */}
          <div className="lg:col-span-7 light-card p-6 border-slate-200 bg-white space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
              <Send className="w-4 h-4 text-brand-600" />
              <span>Transmit Pre-Hospital Triage to Trauma Bay</span>
            </div>

            {triageSent ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="font-bold text-sm flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Trauma Bay & ICU Team Mobilized!</span>
                </div>
                <p className="text-xs text-emerald-800">
                  Metro General Trauma Lead (Dr. Priya Sen) and Anesthesia Standby have acknowledged incoming ETA. Trauma Bay 02 prepared.
                </p>
                <button
                  onClick={() => setTriageSent(false)}
                  className="text-xs font-bold text-emerald-700 underline pt-1"
                >
                  Update Patient Status
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendTriage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Observation / Notes</label>
                  <textarea
                    rows={3}
                    value={patientCondition}
                    onChange={(e) => setPatientCondition(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  ></textarea>
                </div>

                <div className="flex items-center space-x-4 text-xs">
                  <label className="flex items-center space-x-2 font-medium text-slate-700">
                    <input type="checkbox" defaultChecked className="rounded text-rose-600" />
                    <span>Ventilator Standby Required</span>
                  </label>
                  <label className="flex items-center space-x-2 font-medium text-slate-700">
                    <input type="checkbox" defaultChecked className="rounded text-rose-600" />
                    <span>Blood Bank (O- / O+) Standby</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Triage to Hospital HOD</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
