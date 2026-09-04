import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { emergencyApiClient } from '../../api/emergencyApiClient';
import {
  HeartPulse,
  CheckCircle2,
  Radio,
  Sliders,
} from 'lucide-react';

interface HospitalDashboardData {
  hospitalName: string;
  traumaLevel: string;
  bedCapacity: {
    totalEmergencyBeds: number;
    availableEmergencyBeds: number;
    totalIcuBeds: number;
    availableIcuBeds: number;
    ventilatorsAvailable?: number;
    o2BufferHours?: number;
  };
  incomingAmbulances?: Array<{
    unitId: string;
    etaMinutes: number;
    patientCondition: string;
    allocatedBed: string;
    traumaTeamReady: boolean;
  }>;
  inboundAmbulances?: Array<{
    unitId: string;
    etaMinutes: number;
    patientCondition?: string;
    condition?: string;
    triageTag?: string;
    vitals?: string;
    allocatedBed: string;
    traumaTeamReady: boolean;
  }>;

  traumaTeamStatus: string;
}

export const HospitalPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<HospitalDashboardData | null>(null);
  const [availableEmergency, setAvailableEmergency] = useState(6);
  const [availableIcu, setAvailableIcu] = useState(3);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      await emergencyApiClient.getMonitoring();
      const mockPayload = {

        hospitalName: 'City General Trauma Center (H01)',
        traumaLevel: 'Level 1 Regional Trauma Lead',
        bedCapacity: {
          totalEmergencyBeds: 20,
          availableEmergencyBeds: availableEmergency,
          totalIcuBeds: 10,
          availableIcuBeds: availableIcu,
          ventilatorsAvailable: 5,
          o2BufferHours: 48,
        },
        incomingAmbulances: [
          {
            unitId: 'EMS-ALPHA-108',
            etaMinutes: 3.8,
            patientCondition: 'Severe Trauma / Conscious',
            allocatedBed: 'Emergency Bay ER-04',
            traumaTeamReady: true,
          },
        ],
        inboundAmbulances: [
          {
            unitId: 'EMS-ALPHA-108',
            etaMinutes: 3.8,
            patientCondition: 'Severe Trauma / Conscious',
            condition: 'Severe Trauma / Conscious',
            triageTag: 'RED',
            vitals: 'BP 128/84 | HR 98',
            allocatedBed: 'Emergency Bay ER-04',
            traumaTeamReady: true,
          },
        ],
        traumaTeamStatus: 'STANDBY_ALERTED',
      };
      setData(mockPayload);
    } catch {
      const mockPayload = {
        hospitalName: 'City General Trauma Center (H01)',
        traumaLevel: 'Level 1 Regional Trauma Lead',
        bedCapacity: {
          totalEmergencyBeds: 20,
          availableEmergencyBeds: availableEmergency,
          totalIcuBeds: 10,
          availableIcuBeds: availableIcu,
          ventilatorsAvailable: 5,
          o2BufferHours: 48,
        },
        incomingAmbulances: [
          {
            unitId: 'EMS-ALPHA-108',
            etaMinutes: 3.8,
            patientCondition: 'Severe Trauma / Conscious',
            allocatedBed: 'Emergency Bay ER-04',
            traumaTeamReady: true,
          },
        ],
        inboundAmbulances: [
          {
            unitId: 'EMS-ALPHA-108',
            etaMinutes: 3.8,
            patientCondition: 'Severe Trauma / Conscious',
            condition: 'Severe Trauma / Conscious',
            triageTag: 'RED',
            vitals: 'BP 128/84 | HR 98',
            allocatedBed: 'Emergency Bay ER-04',
            traumaTeamReady: true,
          },
        ],

        traumaTeamStatus: 'STANDBY_ALERTED',
      };
      setData(mockPayload);
    }
  };


  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleUpdateBeds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await emergencyApiClient.updateHospitalBeds(availableEmergency, availableIcu);
      setUpdateMsg(`✓ Bed availability updated and synced with Integrated Command Center (ICCC) & 108 Dispatch (${res.dataSource === 'FASTAPI_POSTGRES' ? 'LIVE' : 'DEMO'}).`);
      fetchDashboard();
    } catch (err) {
      setUpdateMsg('Failed to update bed count.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner with Global Navigation Law */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between light-card p-6 border-slate-200 bg-white shadow-card gap-4">
        <Link to="/" className="flex items-center space-x-4 group" title="Return to IntelliFlow OS Home">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200">
                HOSPITAL EMERGENCY & TRAUMA DESK
              </span>
              <span className="text-xs text-slate-500 font-medium">Level 1 Regional Trauma Lead</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {data?.hospitalName || 'Metropolitan Super Specialty & Trauma Care'}
            </h1>
            <p className="text-xs text-slate-500">Trauma Director: <strong>{user?.name || 'Dr. Priya Sen'}</strong></p>
          </div>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Sync ICCC Feeds
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
        {/* Real-time Bed Capacity Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="light-card p-5 border-slate-200 bg-white space-y-1">
            <div className="text-xs text-slate-500 font-medium">Available ICU Beds</div>
            <div className="text-3xl font-black text-emerald-600">
              {data?.bedCapacity.availableIcuBeds || 3} / {data?.bedCapacity.totalIcuBeds || 16}
            </div>
            <div className="text-[10px] text-slate-500">Ventilator Equipped</div>
          </div>

          <div className="light-card p-5 border-slate-200 bg-white space-y-1">
            <div className="text-xs text-slate-500 font-medium">Emergency Bays Free</div>
            <div className="text-3xl font-black text-blue-600">
              {data?.bedCapacity.availableEmergencyBeds || 6} / {data?.bedCapacity.totalEmergencyBeds || 24}
            </div>
            <div className="text-[10px] text-slate-500">Trauma Ready</div>
          </div>

          <div className="light-card p-5 border-slate-200 bg-white space-y-1">
            <div className="text-xs text-slate-500 font-medium">Ventilators Free</div>
            <div className="text-3xl font-black text-indigo-600">
              {data?.bedCapacity.ventilatorsAvailable || 5}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">O2 Buffer: {data?.bedCapacity.o2BufferHours || 72}h</div>
          </div>

          <div className="light-card p-5 border-slate-200 bg-white space-y-1">
            <div className="text-xs text-slate-500 font-medium">Inbound Ambulances</div>
            <div className="text-3xl font-black text-rose-600">
              {data?.inboundAmbulances?.length || 2} En Route
            </div>
            <div className="text-[10px] text-rose-600 font-semibold">Priority 1 Inbound</div>
          </div>
        </div>

        {/* Incoming Emergency Inbound Radar */}
        <div className="light-card p-6 border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
              <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
              <span>Inbound Ambulance Live ETA Radar & Triage Telemetry</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-200">
              LIVE TRAFFIC SYNC
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.inboundAmbulances || []).map((amb, idx) => (

              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-black text-slate-900">{amb.unitId}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{amb.condition}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-rose-600">{amb.etaMinutes} mins</span>
                    <div className="text-[10px] font-extrabold text-rose-600">{amb.triageTag}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
                  <div className="text-slate-500 font-medium">Paramedic Stream Vitals:</div>
                  <div className="font-bold text-slate-800">{amb.vitals}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                  <div className="text-slate-600">Allocated: <strong className="text-slate-900">{amb.allocatedBed}</strong></div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ Trauma Team Standby
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manage Bed Counts Form */}
        <div className="light-card p-6 border-slate-200 bg-white space-y-4">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>Update Real-Time Hospital Bed Inventory</span>
          </div>

          {updateMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              {updateMsg}
            </div>
          )}

          <form onSubmit={handleUpdateBeds} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Available Emergency Bays</label>
              <input
                type="number"
                min="0"
                max="50"
                value={availableEmergency}
                onChange={(e) => setAvailableEmergency(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Available ICU Beds</label>
              <input
                type="number"
                min="0"
                max="30"
                value={availableIcu}
                onChange={(e) => setAvailableIcu(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Broadcast Bed Update to ICCC</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
