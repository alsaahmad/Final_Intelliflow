import React, { useState } from 'react';
import { useTwin } from '../../context/TwinContext';
import { Road, Junction, Hospital, Ambulance, CCTVCamera, Incident } from '../../types';
import { Hammer, X, CheckCircle2, MapPin } from 'lucide-react';

export const TwinBuilderModal: React.FC = () => {
  const {
    builderModalOpen,
    setBuilderModalOpen,
    builderTool,
    setBuilderTool,
    builderCoords,
    addRoad,
    addJunction,
    addHospital,
    addAmbulance,
    addCCTV,
    addIncident,
  } = useTwin();

  // Generic form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [extra1, setExtra1] = useState('');
  const [extra2, setExtra2] = useState('');

  if (!builderModalOpen || !builderCoords) return null;

  const lat = builderCoords[0];
  const lng = builderCoords[1];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (builderTool === 'ADD_ROAD') {
      const roadCode = code || `R${Math.floor(100 + Math.random() * 900)}`;
      const roadName = name || 'New Arterial Corridor';
      const newRoad: Road = {
        id: `r-custom-${Date.now()}`,
        code: roadCode,
        name: roadName,
        type: 'ARTERIAL',
        coordinates: [
          [lat - 0.005, lng - 0.005],
          [lat, lng],
          [lat + 0.005, lng + 0.005],
        ],
        lengthKm: 1.5,
        lanes: parseInt(extra1 || '4', 10),
        speedLimitKmh: 50,
        currentSpeedKmh: 42,
        capacityVehPerHour: 1800,
        currentVolumeVehPerHour: 540,
        congestionPercent: 30,
        trafficLevel: 'LOW',
        status: 'OPEN',
        fromJunctionId: 'j-14',
        toJunctionId: 'j-15',
        prediction15MinCongestion: 35,
        prediction30MinCongestion: 40,
        lastUpdated: 'Just now',
      };
      addRoad(newRoad);
    } else if (builderTool === 'ADD_JUNCTION') {
      const jncCode = code || `J${Math.floor(20 + Math.random() * 80)}`;
      const jncName = name || `Junction ${jncCode} Cross`;
      const newJnc: Junction = {
        id: `j-custom-${Date.now()}`,
        code: jncCode,
        name: jncName,
        sector: extra1 || 'Sector A - New Grid',
        location: [lat, lng],
        trafficFlowPercent: 45,
        queueLengthMeters: 25,
        averageSpeedKmh: 40,
        currentSignalPhase: 'NORTH_SOUTH',
        signalTimerSeconds: 45,
        cycleLengthSeconds: 90,
        cctvOnline: true,
        activeIncidentsCount: 0,
        congestionIndex: 35,
        connectedRoadIds: ['r-101'],
      };
      addJunction(newJnc);
    } else if (builderTool === 'ADD_HOSPITAL') {
      const hospCode = code || `H0${Math.floor(5 + Math.random() * 5)}`;
      const hospName = name || `${hospCode} Emergency Trauma Center`;
      const newHosp: Hospital = {
        id: `h-custom-${Date.now()}`,
        code: hospCode,
        name: hospName,
        location: [lat, lng],
        address: extra1 || 'Metropolitan Medical Sector',
        emergencyStatus: 'OPERATIONAL',
        totalBeds: parseInt(extra2 || '60', 10),
        availableBeds: Math.round(parseInt(extra2 || '60', 10) * 0.6),
        totalIcu: 12,
        availableIcu: 6,
        ventilatorsFree: 4,
        oxygenBufferHours: 72,
        capacityPercent: 40,
        nearbyAmbulancesCount: 2,
        averageEtaMinutes: 8,
        traumaLevel: 'LEVEL_1_LEAD',
        contactPhone: '+91 11 2345 0000',
      };
      addHospital(newHosp);
    } else if (builderTool === 'ADD_AMBULANCE') {
      const ambCode = code || `AMB-0${Math.floor(9 + Math.random() * 9)}`;
      const newAmb: Ambulance = {
        id: `amb-custom-${Date.now()}`,
        unitCode: ambCode,
        type: 'ADVANCED_LIFE_SUPPORT',
        status: 'AVAILABLE',
        location: [lat, lng],
        speedKmh: 0,
        heading: 0,
        nearestJunction: 'New Grid Junction',
        assignedHospitalId: 'h-01',
        destinationHospitalName: 'City General Trauma Center',
        etaMinutes: 4,
        paramedicLead: name || 'Paramedic Crew Alpha',
        batteryOrFuelPercent: 95,
      };
      addAmbulance(newAmb);
    } else if (builderTool === 'ADD_CCTV') {
      const cctvCode = code || `CCTV-${Math.floor(150 + Math.random() * 50)}`;
      const newCctv: CCTVCamera = {
        id: `cctv-custom-${Date.now()}`,
        code: cctvCode,
        name: name || `${cctvCode} (AI Vision)`,
        location: [lat, lng],
        status: 'ONLINE',
        azimuthHeading: 45,
        fovAngle: 85,
        vehiclesDetectedCount: 54,
        pedestriansCount: 12,
        trafficDensity: 'LOW',
        aiDetectionActive: true,
        latestEvent: 'NORMAL',
        detectionConfidence: 98.2,
        sampleStreamUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
        lastSnapshotTime: 'Just now',
      };
      addCCTV(newCctv);
    } else if (builderTool === 'ADD_INCIDENT') {
      const incCode = code || `INC-${Math.floor(9000 + Math.random() * 900)}`;
      const newInc: Incident = {
        id: `inc-custom-${Date.now()}`,
        code: incCode,
        title: name || 'Reported Incident Event',
        type: 'ACCIDENT',
        locationName: extra1 || 'Selected Grid Location',
        coordinates: [lat, lng],
        detectedBy: 'ICCC Operator',
        severity: 'HIGH',
        status: 'RESPONDING',
        timeReported: new Date().toLocaleTimeString(),
        roadStatus: 'PARTIALLY_BLOCKED',
        affectedVehiclesCount: 12,
        description: extra2 || 'Operational incident logged via Digital Twin Builder.',
      };
      addIncident(newInc);
    }

    // Reset and close
    setCode('');
    setName('');
    setExtra1('');
    setExtra2('');
    setBuilderTool('NONE');
    setBuilderModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-amber-700">
            <Hammer className="w-5 h-5" />
            <h3 className="text-base font-extrabold text-slate-900">
              Configure & Spawn {builderTool.replace('ADD_', '')}
            </h3>
          </div>
          <button
            onClick={() => setBuilderModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2 text-xs text-slate-600">
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            Target GPS: <strong className="font-mono text-slate-900">[{lat.toFixed(4)}, {lng.toFixed(4)}]</strong>
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Asset Code / Identifier</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. R111, J20, H05, AMB-09"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Asset Name / Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. North Outer Express Link"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {builderTool === 'ADD_ROAD' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Number of Lanes</label>
              <input
                type="number"
                min="1"
                max="8"
                value={extra1}
                onChange={(e) => setExtra1(e.target.value)}
                placeholder="4"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
              />
            </div>
          )}

          {builderTool === 'ADD_HOSPITAL' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Sector</label>
                <input
                  type="text"
                  value={extra1}
                  onChange={(e) => setExtra1(e.target.value)}
                  placeholder="Sector B Gateway"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Bed Count</label>
                <input
                  type="number"
                  value={extra2}
                  onChange={(e) => setExtra2(e.target.value)}
                  placeholder="80"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setBuilderModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md shadow-amber-600/30 transition-all flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>SAVE TO TWIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
