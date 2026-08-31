import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  TwinMode,
  Road,
  RoadStatus,
  TrafficLevel,
  Junction,
  Hospital,
  Ambulance,
  CCTVCamera,
  Incident,
  PoliceStation,
  FireStation,
  CityResilienceScore,
  LayerVisibility,
  SelectedEntity,
  BuilderTool,
  SimulationScenarioConfig,
  SimulationResult,
} from '../types';
import {
  SEED_ROADS,
  SEED_JUNCTIONS,
  SEED_HOSPITALS,
  SEED_AMBULANCES,
  SEED_CCTV_CAMERAS,
  SEED_INCIDENTS,
  SEED_POLICE_STATIONS,
  SEED_FIRE_STATIONS,
  INITIAL_CITY_SCORE,
  DEFAULT_HACKATHON_SCENARIO,
} from '../data/seedTwinData';
import { runWhatIfSimulation } from '../engine/simulationEngine';

interface TwinContextType {
  mode: TwinMode;
  setMode: (m: TwinMode) => void;
  roads: Road[];
  junctions: Junction[];
  hospitals: Hospital[];
  ambulances: Ambulance[];
  cctvs: CCTVCamera[];
  incidents: Incident[];
  policeStations: PoliceStation[];
  fireStations: FireStation[];
  resilienceScore: CityResilienceScore;
  selectedEntity: SelectedEntity;
  setSelectedEntity: (e: SelectedEntity) => void;
  layerVisibility: LayerVisibility;
  toggleLayer: (k: keyof LayerVisibility) => void;
  setLayerVisibility: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  predictionHorizon: '+5m' | '+10m' | '+15m' | '+30m';
  setPredictionHorizon: (h: '+5m' | '+10m' | '+15m' | '+30m') => void;
  activeScenario: SimulationScenarioConfig;
  simulationResult: SimulationResult | null;
  simulationStepIndex: number;
  setSimulationStepIndex: (i: number) => void;
  isSimPlaying: boolean;
  playSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  runScenario: (config?: SimulationScenarioConfig) => void;
  applySimulationToLive: () => void;
  builderTool: BuilderTool;
  setBuilderTool: (tool: BuilderTool) => void;
  builderModalOpen: boolean;
  setBuilderModalOpen: (open: boolean) => void;
  builderCoords: [number, number] | null;
  setBuilderCoords: (coords: [number, number] | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cameraModalCCTV: CCTVCamera | null;
  openCameraFeed: (cctv: CCTVCamera) => void;
  closeCameraFeed: () => void;
  analyticsModalOpen: boolean;
  openAnalytics: () => void;
  closeAnalytics: () => void;
  scenarioModalOpen: boolean;
  openScenarioModal: () => void;
  closeScenarioModal: () => void;
  toast: { message: string; type: 'success' | 'info' | 'warning' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  hideToast: () => void;
  // Entity actions
  updateRoad: (road: Road) => void;
  addRoad: (road: Road) => void;
  addJunction: (junction: Junction) => void;
  addHospital: (hospital: Hospital) => void;
  addAmbulance: (ambulance: Ambulance) => void;
  addCCTV: (cctv: CCTVCamera) => void;
  addIncident: (incident: Incident) => void;
  simulateClosure: (roadId: string) => void;
  toggleRoadBlock: (roadId: string) => void;
  optimizeSignal: (junctionId: string, deltaSec?: number) => void;
  dispatchAmbulance: (incidentId: string, ambulanceId?: string, hospitalId?: string) => void;
  updateHospitalCapacity: (hospitalId: string, availableBeds: number, availableIcu: number) => void;
  resetToDefaultCity: () => void;
}

const TwinContext = createContext<TwinContextType | undefined>(undefined);

export const TwinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<TwinMode>('LIVE');
  const [roads, setRoads] = useState<Road[]>(SEED_ROADS);
  const [junctions, setJunctions] = useState<Junction[]>(SEED_JUNCTIONS);
  const [hospitals, setHospitals] = useState<Hospital[]>(SEED_HOSPITALS);
  const [ambulances, setAmbulances] = useState<Ambulance[]>(SEED_AMBULANCES);
  const [cctvs, setCctvs] = useState<CCTVCamera[]>(SEED_CCTV_CAMERAS);
  const [incidents, setIncidents] = useState<Incident[]>(SEED_INCIDENTS);
  const [policeStations] = useState<PoliceStation[]>(SEED_POLICE_STATIONS);
  const [fireStations] = useState<FireStation[]>(SEED_FIRE_STATIONS);
  const [resilienceScore, setResilienceScore] = useState<CityResilienceScore>(INITIAL_CITY_SCORE);

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    roads: true,
    traffic: true,
    junctions: true,
    cctv: true,
    hospitals: true,
    ambulances: true,
    police: true,
    fire: true,
    predictions: false,
    simulations: true,
  });

  const [predictionHorizon, setPredictionHorizon] = useState<'+5m' | '+10m' | '+15m' | '+30m'>('+15m');
  const [activeScenario, setActiveScenario] = useState<SimulationScenarioConfig>(DEFAULT_HACKATHON_SCENARIO);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulationStepIndex, setSimulationStepIndex] = useState<number>(0);
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(false);

  const [builderTool, setBuilderTool] = useState<BuilderTool>('NONE');
  const [builderModalOpen, setBuilderModalOpen] = useState<boolean>(false);
  const [builderCoords, setBuilderCoords] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cameraModalCCTV, setCameraModalCCTV] = useState<CCTVCamera | null>(null);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState<boolean>(false);
  const [scenarioModalOpen, setScenarioModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  const setMode = useCallback((newMode: TwinMode) => {
    setModeState(newMode);
    if (newMode === 'PREDICTION') {
      setLayerVisibility((prev) => ({ ...prev, predictions: true }));
    } else if (newMode === 'SIMULATION') {
      setLayerVisibility((prev) => ({ ...prev, simulations: true }));
    }
  }, []);

  const toggleLayer = useCallback((key: keyof LayerVisibility) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Run What-if Simulation
  const runScenario = useCallback((customScenario?: SimulationScenarioConfig) => {
    const targetConfig = customScenario || activeScenario;
    setActiveScenario(targetConfig);
    const result = runWhatIfSimulation(targetConfig, roads, junctions, hospitals);
    setSimulationResult(result);
    setSimulationStepIndex(0);
    setIsSimPlaying(true);
    setModeState('SIMULATION');
    showToast(`Simulation "${targetConfig.name}" initialized. Mathematical flow modeled.`, 'success');
  }, [activeScenario, roads, junctions, hospitals, showToast]);

  const playSimulation = useCallback(() => setIsSimPlaying(true), []);
  const pauseSimulation = useCallback(() => setIsSimPlaying(false), []);
  const resetSimulation = useCallback(() => {
    setIsSimPlaying(false);
    setSimulationStepIndex(0);
  }, []);

  // Apply Simulation Actions to Live Digital Twin
  const applySimulationToLive = useCallback(() => {
    if (!simulationResult) return;
    const { aiRecommendation } = simulationResult;

    // Apply road closures and speed adjustments to live state
    setRoads((prev) =>
      prev.map((r) => {
        if (aiRecommendation.affectedRoadsToClose.includes(r.id)) {
          return {
            ...r,
            status: 'BLOCKED',
            congestionPercent: 95,
            trafficLevel: 'CRITICAL',
            currentSpeedKmh: 4,
          };
        }
        if (r.id === 'r-105') {
          // Western bypass diversion
          return {
            ...r,
            status: 'GREEN_WAVE',
            currentSpeedKmh: 55,
            congestionPercent: 28,
            isEmergencyCorridor: true,
          };
        }
        return r;
      })
    );

    // Apply signal adjustments
    setJunctions((prev) =>
      prev.map((j) => {
        const adj = aiRecommendation.signalAdjustments.find((s) => s.junctionCode === j.code);
        if (adj) {
          return {
            ...j,
            signalTimerSeconds: j.signalTimerSeconds + adj.deltaGreenSec,
            currentSignalPhase: 'GREEN_CORRIDOR',
            trafficFlowPercent: Math.min(95, j.trafficFlowPercent + 15),
          };
        }
        return j;
      })
    );

    // Recalculate City Resilience score
    setResilienceScore((prev) => ({
      ...prev,
      overall: Math.min(100, prev.overall + 6),
      emergencyReadiness: 96,
      trafficReadiness: 84,
    }));

    setModeState('LIVE');
    setIsSimPlaying(false);
    showToast('✓ AI Decision Strategy Applied to Live Twin! Emergency wave preemption active.', 'success');
  }, [simulationResult, showToast]);

  // Entity update handlers
  const updateRoad = useCallback((updated: Road) => {
    setRoads((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedEntity({ type: 'ROAD', data: updated });
    showToast(`Road ${updated.code} updated.`, 'info');
  }, [showToast]);

  const addRoad = useCallback((newRoad: Road) => {
    setRoads((prev) => [newRoad, ...prev]);
    setSelectedEntity({ type: 'ROAD', data: newRoad });
    showToast(`Road ${newRoad.code} successfully added to Digital Twin!`, 'success');
  }, [showToast]);

  const addJunction = useCallback((newJnc: Junction) => {
    setJunctions((prev) => [newJnc, ...prev]);
    setSelectedEntity({ type: 'JUNCTION', data: newJnc });
    showToast(`Junction ${newJnc.code} added.`, 'success');
  }, [showToast]);

  const addHospital = useCallback((newHosp: Hospital) => {
    setHospitals((prev) => [newHosp, ...prev]);
    setSelectedEntity({ type: 'HOSPITAL', data: newHosp });
    showToast(`Hospital ${newHosp.code} registered on Emergency Grid.`, 'success');
  }, [showToast]);

  const addAmbulance = useCallback((newAmb: Ambulance) => {
    setAmbulances((prev) => [newAmb, ...prev]);
    setSelectedEntity({ type: 'AMBULANCE', data: newAmb });
    showToast(`Ambulance Unit ${newAmb.unitCode} commissioned.`, 'success');
  }, [showToast]);

  const addCCTV = useCallback((newCctv: CCTVCamera) => {
    setCctvs((prev) => [newCctv, ...prev]);
    setSelectedEntity({ type: 'CCTV', data: newCctv });
    showToast(`CCTV Camera ${newCctv.code} online with AI Vision.`, 'success');
  }, [showToast]);

  const addIncident = useCallback((newInc: Incident) => {
    setIncidents((prev) => [newInc, ...prev]);
    setSelectedEntity({ type: 'INCIDENT', data: newInc });
    showToast(`Incident ${newInc.code} logged on Incident Radar.`, 'warning');
  }, [showToast]);

  const simulateClosure = useCallback((roadId: string) => {
    const targetRoad = roads.find((r) => r.id === roadId);
    if (!targetRoad) return;
    const scenario: SimulationScenarioConfig = {
      id: `sc-closure-${Date.now()}`,
      name: `Simulated Closure — ${targetRoad.name}`,
      event: 'ROAD_CLOSURE',
      locationTarget: {
        type: 'ROAD',
        id: targetRoad.id,
        name: targetRoad.name,
      },
      severity: 'HIGH',
      durationMinutes: 45,
      blockageExtent: 'COMPLETE',
    };
    runScenario(scenario);
  }, [roads, runScenario]);

  const toggleRoadBlock = useCallback((roadId: string) => {
    setRoads((prev) =>
      prev.map((r) => {
        if (r.id === roadId) {
          const nextStatus: RoadStatus = r.status === 'BLOCKED' ? 'OPEN' : 'BLOCKED';
          const nextCongestion = nextStatus === 'BLOCKED' ? 95 : 45;
          const nextTrafficLevel: TrafficLevel = nextStatus === 'BLOCKED' ? 'CRITICAL' : 'MODERATE';
          const updated: Road = {
            ...r,
            status: nextStatus,
            congestionPercent: nextCongestion,
            trafficLevel: nextTrafficLevel,
            currentSpeedKmh: nextStatus === 'BLOCKED' ? 5 : 45,
          };
          setSelectedEntity({ type: 'ROAD', data: updated });
          showToast(`Road ${r.code} marked ${nextStatus}.`, nextStatus === 'BLOCKED' ? 'warning' : 'success');
          return updated;
        }
        return r;
      })
    );
  }, [showToast]);

  const optimizeSignal = useCallback((junctionId: string, deltaSec: number = 15) => {
    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id === junctionId || j.code === junctionId) {
          const updated = {
            ...j,
            signalTimerSeconds: j.signalTimerSeconds + deltaSec,
            currentSignalPhase: 'GREEN_CORRIDOR' as const,
            trafficFlowPercent: Math.min(96, j.trafficFlowPercent + 12),
            congestionIndex: Math.max(20, j.congestionIndex - 18),
          };
          setSelectedEntity({ type: 'JUNCTION', data: updated });
          showToast(`Signal on ${j.code} optimized (+${deltaSec}s green wave).`, 'success');
          return updated;
        }
        return j;
      })
    );
  }, [showToast]);

  const dispatchAmbulance = useCallback((incidentId: string, ambulanceId?: string, hospitalId?: string) => {
    const inc = incidents.find((i) => i.id === incidentId);
    const amb = ambulanceId
      ? ambulances.find((a) => a.id === ambulanceId)
      : ambulances.find((a) => a.status === 'AVAILABLE') || ambulances[0];
    const hosp = hospitalId ? hospitals.find((h) => h.id === hospitalId) : hospitals[0];

    if (!amb || !inc) return;

    setAmbulances((prev) =>
      prev.map((a) => {
        if (a.id === amb.id) {
          return {
            ...a,
            status: 'DISPATCHED',
            assignedIncidentId: inc.id,
            assignedHospitalId: hosp?.id,
            destinationHospitalName: hosp?.name,
            speedKmh: 54,
            etaMinutes: 5,
          };
        }
        return a;
      })
    );

    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status: 'RESPONDING', assignedAmbulanceId: amb.id } : i))
    );

    showToast(`Ambulance ${amb.unitCode} dispatched to ${inc.title}! Priority wave engaged.`, 'success');
  }, [ambulances, incidents, hospitals, showToast]);

  const updateHospitalCapacity = useCallback((hospitalId: string, availableBeds: number, availableIcu: number) => {
    setHospitals((prev) =>
      prev.map((h) => {
        if (h.id === hospitalId) {
          const capPct = Math.round(((h.totalBeds - availableBeds) / h.totalBeds) * 100);
          const updated = {
            ...h,
            availableBeds,
            availableIcu,
            capacityPercent: capPct,
          };
          setSelectedEntity({ type: 'HOSPITAL', data: updated });
          showToast(`Hospital ${h.code} bed telemetry updated and synced with 108 Dispatch.`, 'success');
          return updated;
        }
        return h;
      })
    );
  }, [showToast]);

  const resetToDefaultCity = useCallback(() => {
    setRoads(SEED_ROADS);
    setJunctions(SEED_JUNCTIONS);
    setHospitals(SEED_HOSPITALS);
    setAmbulances(SEED_AMBULANCES);
    setCctvs(SEED_CCTV_CAMERAS);
    setIncidents(SEED_INCIDENTS);
    setResilienceScore(INITIAL_CITY_SCORE);
    setModeState('LIVE');
    setSimulationResult(null);
    setSelectedEntity(null);
    showToast('Digital Twin state reset to metropolitan baseline.', 'info');
  }, [showToast]);

  const openCameraFeed = useCallback((cctv: CCTVCamera) => setCameraModalCCTV(cctv), []);
  const closeCameraFeed = useCallback(() => setCameraModalCCTV(null), []);
  const openAnalytics = useCallback(() => setAnalyticsModalOpen(true), []);
  const closeAnalytics = useCallback(() => setAnalyticsModalOpen(false), []);
  const openScenarioModal = useCallback(() => setScenarioModalOpen(true), []);
  const closeScenarioModal = useCallback(() => setScenarioModalOpen(false), []);

  // Simulation Timeline Auto-Step Player
  useEffect(() => {
    let timer: any;
    if (isSimPlaying && simulationResult) {
      timer = setInterval(() => {
        setSimulationStepIndex((curr) => {
          if (curr < simulationResult.timeline.length - 1) {
            return curr + 1;
          } else {
            setIsSimPlaying(false);
            return curr;
          }
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isSimPlaying, simulationResult]);

  // Live Subtle Telemetry Tick (Simulation / Live breathing effect)
  useEffect(() => {
    const liveInterval = setInterval(() => {
      if (mode === 'LIVE') {
        // Random subtle fluctuation in speeds and vehicle counts
        setRoads((prev) =>
          prev.map((r) => {
            const jitter = (Math.random() - 0.5) * 2;
            const newCongestion = Math.min(99, Math.max(10, Math.round(r.congestionPercent + jitter)));
            return {
              ...r,
              congestionPercent: newCongestion,
              currentVolumeVehPerHour: Math.round((r.capacityVehPerHour * newCongestion) / 100),
            };
          })
        );

        // Advance ambulance positions slightly if moving
        setAmbulances((prev) =>
          prev.map((a) => {
            if (a.status === 'EN_ROUTE' || a.status === 'DISPATCHED') {
              const deltaLat = (Math.random() - 0.48) * 0.0003;
              const deltaLng = (Math.random() - 0.48) * 0.0003;
              return {
                ...a,
                location: [a.location[0] + deltaLat, a.location[1] + deltaLng],
                speedKmh: Math.min(75, Math.max(35, a.speedKmh + Math.round((Math.random() - 0.5) * 4))),
              };
            }
            return a;
          })
        );

        // Decrement junction countdown timers
        setJunctions((prev) =>
          prev.map((j) => {
            const nextTimer = j.signalTimerSeconds > 1 ? j.signalTimerSeconds - 1 : 45;
            return { ...j, signalTimerSeconds: nextTimer };
          })
        );
      }
    }, 2800);

    return () => clearInterval(liveInterval);
  }, [mode]);

  return (
    <TwinContext.Provider
      value={{
        mode,
        setMode,
        roads,
        junctions,
        hospitals,
        ambulances,
        cctvs,
        incidents,
        policeStations,
        fireStations,
        resilienceScore,
        selectedEntity,
        setSelectedEntity,
        layerVisibility,
        toggleLayer,
        setLayerVisibility,
        predictionHorizon,
        setPredictionHorizon,
        activeScenario,
        simulationResult,
        simulationStepIndex,
        setSimulationStepIndex,
        isSimPlaying,
        playSimulation,
        pauseSimulation,
        resetSimulation,
        runScenario,
        applySimulationToLive,
        builderTool,
        setBuilderTool,
        builderModalOpen,
        setBuilderModalOpen,
        builderCoords,
        setBuilderCoords,
        searchQuery,
        setSearchQuery,
        cameraModalCCTV,
        openCameraFeed,
        closeCameraFeed,
        analyticsModalOpen,
        openAnalytics,
        closeAnalytics,
        scenarioModalOpen,
        openScenarioModal,
        closeScenarioModal,
        toast,
        showToast,
        hideToast,
        updateRoad,
        addRoad,
        addJunction,
        addHospital,
        addAmbulance,
        addCCTV,
        addIncident,
        simulateClosure,
        toggleRoadBlock,
        optimizeSignal,
        dispatchAmbulance,
        updateHospitalCapacity,
        resetToDefaultCity,
      }}
    >
      {children}
    </TwinContext.Provider>
  );
};

export const useTwin = () => {
  const context = useContext(TwinContext);
  if (!context) {
    throw new Error('useTwin must be used within a TwinProvider');
  }
  return context;
};
