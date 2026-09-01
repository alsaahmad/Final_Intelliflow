import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  ParkingFacility,
  ParkingSlot,
  ParkingSlotStatus,
  ParkingSlotType,
} from '../types/citizen';
import { MOCK_PARKING_FACILITIES } from '../services/citizenService';
import { complaintsApiClient } from '../api/complaintsApiClient';
import { parkingApiClient } from '../api/parkingApiClient';


export interface CitizenComplaint {
  id: string;
  code: string;
  title: string;
  category: 'POTHOLE' | 'TRAFFIC_LIGHT_FAILURE' | 'WATERLOGGING' | 'ROAD_HAZARD' | 'ILLEGAL_PARKING';
  location: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  timestamp: string;
  assignedDepartment: string;
  reportedBy: string;
  description: string;
  estimatedResolutionHours: number;
  remarks?: string;
}

export type ParkingGarage = ParkingFacility;
export type { ParkingSlot, ParkingSlotStatus, ParkingSlotType };

export interface ParkingBooking {
  id: string;
  passCode: string;
  garageName: string;
  slotCode: string;
  vehicleNumber: string;
  durationHours: number;
  totalAmountInr: number;
  validUntil: string;
  qrPayload: string;
  bookedAt: string;
}

export interface DijkstraNode {
  id: string;
  name: string;
  coordinates: [number, number];
  category: 'METRO_HUB' | 'HOSPITAL' | 'AIRPORT' | 'CENTRAL_PLAZA' | 'RESIDENTIAL_SECTOR' | 'EXPRESSWAY_GATE';
}

export interface DijkstraEdge {
  from: string;
  to: string;
  distanceKm: number;
  baseSpeedKmh: number;
  currentCongestionPercent: number; // 0 - 100
  roadName: string;
}

export interface NavigationRouteResult {
  pathNodeIds: string[];
  pathCoordinates: [number, number][];
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
  congestionDelayMinutes: number;
  averageSpeedKmh: number;
  turnByTurnInstructions: {
    instruction: string;
    distanceMeters: number;
    roadName: string;
  }[];
}

export interface SosDispatchEvent {
  id: string;
  code: string;
  citizenName: string;
  location: string;
  coordinates: [number, number];
  timestamp: string;
  priority: 'CODE_RED_112';
  assignedAmbulanceUnit: string;
  destinationHospital: string;
  etaMinutes: number;
  status: 'BROADCASTED' | 'DISPATCHED' | 'EN_ROUTE' | 'HOSPITAL_TRIAGE';
}

interface CitySyncContextType {
  // Citizen Complaints ↔ Municipal Sync
  complaints: CitizenComplaint[];
  addComplaint: (complaint: Omit<CitizenComplaint, 'id' | 'code' | 'timestamp' | 'status' | 'assignedDepartment' | 'estimatedResolutionHours'>) => CitizenComplaint;
  updateComplaintStatus: (id: string, status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED', remarks?: string) => void;

  // Visual Cinema Parking
  garages: ParkingGarage[];
  activeGarage: ParkingGarage | null;
  setActiveGarage: (garage: ParkingGarage | null) => void;
  selectSlot: (garageId: string, slotId: string) => void;
  selectedSlot: ParkingSlot | null;
  activeBooking: ParkingBooking | null;
  confirmParkingBooking: (garageId: string, slotId: string, vehicleNumber: string, durationHours: number) => ParkingBooking;
  clearActiveBooking: () => void;

  // Dijkstra Navigation Engine
  nodes: DijkstraNode[];
  edges: DijkstraEdge[];
  calculateDijkstraRoute: (originNodeId: string, destinationNodeId: string) => NavigationRouteResult | null;

  // Emergency 112 / SOS
  sosDispatches: SosDispatchEvent[];
  trigger112Sos: (citizenName: string, location: string, coordinates?: [number, number]) => SosDispatchEvent;
}

const INITIAL_COMPLAINTS: CitizenComplaint[] = [
  {
    id: 'cmp-101',
    code: 'CIVIC-9021',
    title: 'Deep Pothole Cluster near Central Underpass',
    category: 'POTHOLE',
    location: 'Sector 4, Central Boulevard East',
    urgency: 'HIGH',
    status: 'IN_PROGRESS',
    timestamp: 'Today, 08:30 AM',
    assignedDepartment: 'Road Maintenance & Infrastructure',
    reportedBy: 'Rahul Sharma (Citizen)',
    description: 'Multiple sharp potholes causing vehicle slowdown and hazard for two-wheelers.',
    estimatedResolutionHours: 24,
    remarks: 'Field repair team mobilized. Bitumen cold-mix application scheduled.',
  },
  {
    id: 'cmp-102',
    code: 'CIVIC-9022',
    title: 'Traffic Signal Stuck on Red Phase',
    category: 'TRAFFIC_LIGHT_FAILURE',
    location: 'Junction J16, Inner Ring Crossing',
    urgency: 'EMERGENCY',
    status: 'PENDING',
    timestamp: 'Today, 09:15 AM',
    assignedDepartment: 'Traffic Police Electrical Wing',
    reportedBy: 'Priya Mehra (Citizen)',
    description: 'North-bound signal timer freezing at 00s causing heavy intersection gridlock.',
    estimatedResolutionHours: 4,
    remarks: 'Dispatched emergency electrical team for PLC reboot.',
  },
  {
    id: 'cmp-103',
    code: 'CIVIC-9023',
    title: 'Monsoon Waterlogging & Blocked Storm Drain',
    category: 'WATERLOGGING',
    location: 'Expressway Flyover Service Road',
    urgency: 'MEDIUM',
    status: 'RESOLVED',
    timestamp: 'Yesterday, 04:45 PM',
    assignedDepartment: 'Storm Water Drainage & Sewage',
    reportedBy: 'Anil Gupta (Citizen)',
    description: '1.5 feet standing water after thunderstorm blocking left service lane.',
    estimatedResolutionHours: 8,
    remarks: 'High-capacity de-watering suction pumps deployed. Drain cleared.',
  },
];

const INITIAL_GARAGES: ParkingGarage[] = MOCK_PARKING_FACILITIES;

const DIJKSTRA_NODES: DijkstraNode[] = [
  { id: 'node-cp', name: 'Central Connaught Plaza (J14)', coordinates: [28.6139, 77.2090], category: 'CENTRAL_PLAZA' },
  { id: 'node-metro', name: 'Metro Tech Station Hub (J15)', coordinates: [28.6195, 77.2145], category: 'METRO_HUB' },
  { id: 'node-hosp1', name: 'City General Trauma Center (H01)', coordinates: [28.6255, 77.2185], category: 'HOSPITAL' },
  { id: 'node-gate4', name: 'North Gateway Expressway (J16)', coordinates: [28.6210, 77.2025], category: 'EXPRESSWAY_GATE' },
  { id: 'node-hosp3', name: 'Apex Multi-Speciality Hub (H03)', coordinates: [28.6110, 77.1980], category: 'HOSPITAL' },
  { id: 'node-south', name: 'South Sector Boulevard (J18)', coordinates: [28.6065, 77.2120], category: 'RESIDENTIAL_SECTOR' },
  { id: 'node-civic', name: 'Municipal Civic Secretariat (J17)', coordinates: [28.6160, 77.2220], category: 'CENTRAL_PLAZA' },
  { id: 'node-airport', name: 'Airport Express Link Terminal (J19)', coordinates: [28.6030, 77.2010], category: 'AIRPORT' },
];

const DIJKSTRA_EDGES: DijkstraEdge[] = [
  { from: 'node-cp', to: 'node-metro', distanceKm: 1.2, baseSpeedKmh: 45, currentCongestionPercent: 78, roadName: 'R102 Central Arterial' },
  { from: 'node-metro', to: 'node-hosp1', distanceKm: 1.4, baseSpeedKmh: 40, currentCongestionPercent: 35, roadName: 'R105 Hospital Access Corridor' },
  { from: 'node-cp', to: 'node-gate4', distanceKm: 1.5, baseSpeedKmh: 50, currentCongestionPercent: 42, roadName: 'R101 North Arterial Link' },
  { from: 'node-gate4', to: 'node-metro', distanceKm: 1.8, baseSpeedKmh: 45, currentCongestionPercent: 55, roadName: 'R106 Outer Ring Connector' },
  { from: 'node-cp', to: 'node-south', distanceKm: 1.1, baseSpeedKmh: 40, currentCongestionPercent: 28, roadName: 'R103 South Metro Link' },
  { from: 'node-south', to: 'node-airport', distanceKm: 2.2, baseSpeedKmh: 60, currentCongestionPercent: 30, roadName: 'R110 Airport Express Highway' },
  { from: 'node-cp', to: 'node-hosp3', distanceKm: 1.6, baseSpeedKmh: 45, currentCongestionPercent: 40, roadName: 'R104 West Cross Avenue' },
  { from: 'node-hosp3', to: 'node-airport', distanceKm: 1.7, baseSpeedKmh: 50, currentCongestionPercent: 32, roadName: 'R108 Apex Link' },
  { from: 'node-metro', to: 'node-civic', distanceKm: 1.3, baseSpeedKmh: 40, currentCongestionPercent: 50, roadName: 'R107 Civic Center Road' },
  { from: 'node-civic', to: 'node-hosp1', distanceKm: 1.6, baseSpeedKmh: 45, currentCongestionPercent: 38, roadName: 'R109 East Bypass' },
];

const CitySyncContext = createContext<CitySyncContextType | undefined>(undefined);

export const CitySyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [complaints, setComplaints] = useState<CitizenComplaint[]>(INITIAL_COMPLAINTS);
  const [garages, setGarages] = useState<ParkingGarage[]>(INITIAL_GARAGES);
  const [activeGarage, setActiveGarage] = useState<ParkingGarage | null>(INITIAL_GARAGES[0]);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [activeBooking, setActiveBooking] = useState<ParkingBooking | null>(null);
  const [sosDispatches, setSosDispatches] = useState<SosDispatchEvent[]>([]);

  // Async sync on mount with FastAPI
  useEffect(() => {
    const syncData = async () => {
      try {
        const fetchedComplaints = await complaintsApiClient.getComplaints();
        if (fetchedComplaints && fetchedComplaints.length > 0) {
          setComplaints(fetchedComplaints);
        }
      } catch (err) {
        console.info('FastAPI complaints backend unreachable, using fallback datasets.', err);
      }

      try {
        const fetchedGarages = await parkingApiClient.getNearbyParkingFacilities();
        if (fetchedGarages && fetchedGarages.length > 0) {
          setGarages(fetchedGarages);
          setActiveGarage(fetchedGarages[0]);
        }
      } catch (err) {
        console.info('FastAPI parking backend unreachable, using fallback datasets.', err);
      }
    };
    syncData();
  }, []);

  // Add Complaint
  const addComplaint = useCallback(
    (complaintData: Omit<CitizenComplaint, 'id' | 'code' | 'timestamp' | 'status' | 'assignedDepartment' | 'estimatedResolutionHours'>) => {
      const codeNum = Math.floor(9000 + Math.random() * 999);
      const tempId = `cmp-${Date.now()}`;
      const newComplaint: CitizenComplaint = {
        ...complaintData,
        id: tempId,
        code: `CIVIC-${codeNum}`,
        timestamp: 'Just now',
        status: 'PENDING',
        assignedDepartment:
          complaintData.category === 'POTHOLE' || complaintData.category === 'ROAD_HAZARD'
            ? 'Road Maintenance & Infrastructure'
            : complaintData.category === 'TRAFFIC_LIGHT_FAILURE'
            ? 'Traffic Police Electrical Wing'
            : complaintData.category === 'WATERLOGGING'
            ? 'Storm Water Drainage & Sewage'
            : 'Urban Enforcement Bureau',
        estimatedResolutionHours: complaintData.urgency === 'EMERGENCY' ? 4 : complaintData.urgency === 'HIGH' ? 12 : 24,
      };
      setComplaints((prev) => [newComplaint, ...prev]);

      // Async backend persistence
      complaintsApiClient
        .createComplaint({
          title: complaintData.title,
          category: complaintData.category,
          location: complaintData.location,
          urgency: complaintData.urgency,
          description: complaintData.description,
        })
        .then((serverRecord) => {
          setComplaints((prev) => prev.map((c) => (c.id === tempId ? serverRecord : c)));
        })
        .catch((err) => {
          console.warn('Could not persist complaint to FastAPI backend:', err);
        });

      return newComplaint;
    },
    []
  );

  // Update Complaint Status (from Municipal / Ops Portal)
  const updateComplaintStatus = useCallback((id: string, status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED', remarks?: string) => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status,
            remarks: remarks || c.remarks,
          };
        }
        return c;
      })
    );

    // Async backend status update
    complaintsApiClient.updateComplaintStatus(id, status, remarks).catch((err) => {
      console.warn('Could not sync status update to FastAPI backend:', err);
    });
  }, []);


  // Select Parking Slot (Pure UI state selection - does not mutate underlying slot status)
  const selectSlot = useCallback(
    (garageId: string, slotId: string) => {
      const garage = garages.find((g) => g.id === garageId);
      if (!garage) return;
      const targetSlot = garage.slots.find((s) => s.id === slotId);
      if (!targetSlot || targetSlot.status !== 'AVAILABLE') return;

      setSelectedSlot((prev) => (prev?.id === slotId ? null : targetSlot));
    },
    [garages]
  );

  // Confirm Parking Booking & Generate QR Pass
  const confirmParkingBooking = useCallback(
    (garageId: string, slotId: string, vehicleNumber: string, durationHours: number) => {
      const garage = garages.find((g) => g.id === garageId) || garages[0];
      const slot = garage.slots.find((s) => s.id === slotId);
      const slotCode = slot ? slot.code : 'A-01';
      const amount = garage.hourlyRateInr * durationHours;
      const passNum = Math.floor(100000 + Math.random() * 900000);
      const passCode = `PARK-DL-${passNum}`;

      const now = new Date();
      const validUntil = new Date(now.getTime() + durationHours * 3600 * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const qrPayload = JSON.stringify({
        pass: passCode,
        garage: garage.name,
        slot: slotCode,
        veh: vehicleNumber.toUpperCase(),
        validUntil,
        val: amount,
      });

      const booking: ParkingBooking = {
        id: `book-${Date.now()}`,
        passCode,
        garageName: garage.name,
        slotCode,
        vehicleNumber: vehicleNumber.toUpperCase(),
        durationHours,
        totalAmountInr: amount,
        validUntil,
        qrPayload,
        bookedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Mark slot as occupied in garage
      setGarages((prev) =>
        prev.map((g) => {
          if (g.id !== garageId) return g;
          return {
            ...g,
            availableSlots: Math.max(0, g.availableSlots - 1),
            slots: g.slots.map((s) => (s.id === slotId ? { ...s, status: 'OCCUPIED' } : s)),
          };
        })
      );

      setSelectedSlot(null);
      setActiveBooking(booking);
      return booking;
    },
    [garages]
  );

  const clearActiveBooking = useCallback(() => {
    setActiveBooking(null);
  }, []);

  // Dijkstra Shortest Path Calculation
  const calculateDijkstraRoute = useCallback((originNodeId: string, destNodeId: string): NavigationRouteResult | null => {
    if (originNodeId === destNodeId) return null;

    // Build Adjacency Map
    const adj: Record<string, { to: string; weight: number; edge: DijkstraEdge }[]> = {};
    DIJKSTRA_NODES.forEach((n) => {
      adj[n.id] = [];
    });

    DIJKSTRA_EDGES.forEach((edge) => {
      // Weight = Travel time in minutes taking into account traffic congestion penalty
      // Effective speed = baseSpeed * (1 - congestion/120)
      const effectiveSpeed = Math.max(10, edge.baseSpeedKmh * (1 - (edge.currentCongestionPercent / 100) * 0.7));
      const travelTimeMinutes = (edge.distanceKm / effectiveSpeed) * 60;

      adj[edge.from]?.push({ to: edge.to, weight: travelTimeMinutes, edge });
      // bidirectional
      adj[edge.to]?.push({ to: edge.from, weight: travelTimeMinutes, edge });
    });

    // Dijkstra Algorithm
    const distances: Record<string, number> = {};
    const previous: Record<string, { node: string; edge: DijkstraEdge } | null> = {};
    const unvisited = new Set<string>();

    DIJKSTRA_NODES.forEach((n) => {
      distances[n.id] = Infinity;
      previous[n.id] = null;
      unvisited.add(n.id);
    });

    distances[originNodeId] = 0;

    while (unvisited.size > 0) {
      let currMinNode: string | null = null;
      let minDistance = Infinity;

      unvisited.forEach((nodeId) => {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          currMinNode = nodeId;
        }
      });

      if (!currMinNode || minDistance === Infinity) break;
      if (currMinNode === destNodeId) break;

      unvisited.delete(currMinNode);

      const neighbors = adj[currMinNode] || [];
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.to)) continue;
        const alt = distances[currMinNode] + neighbor.weight;
        if (alt < distances[neighbor.to]) {
          distances[neighbor.to] = alt;
          previous[neighbor.to] = { node: currMinNode, edge: neighbor.edge };
        }
      }
    }

    // Reconstruct Path
    const pathNodeIds: string[] = [];
    const usedEdges: DijkstraEdge[] = [];
    let curr: string | null = destNodeId;

    while (curr) {
      pathNodeIds.unshift(curr);
      const prevInfo: { node: string; edge: DijkstraEdge } | null = previous[curr] || null;
      if (prevInfo) {
        usedEdges.unshift(prevInfo.edge);
        curr = prevInfo.node;
      } else {
        break;
      }
    }

    if (pathNodeIds[0] !== originNodeId) return null;

    const pathCoordinates = pathNodeIds
      .map((id) => DIJKSTRA_NODES.find((n) => n.id === id)?.coordinates)
      .filter(Boolean) as [number, number][];

    let totalDistKm = 0;
    let normalTimeMin = 0;
    const instructions: { instruction: string; distanceMeters: number; roadName: string }[] = [];

    usedEdges.forEach((e, idx) => {
      totalDistKm += e.distanceKm;
      normalTimeMin += (e.distanceKm / e.baseSpeedKmh) * 60;
      const targetNode = DIJKSTRA_NODES.find((n) => n.id === pathNodeIds[idx + 1]);
      instructions.push({
        instruction: `Head onto ${e.roadName} towards ${targetNode?.name || 'next junction'}`,
        distanceMeters: Math.round(e.distanceKm * 1000),
        roadName: e.roadName,
      });
    });

    instructions.push({
      instruction: `Arrive at destination: ${DIJKSTRA_NODES.find((n) => n.id === destNodeId)?.name}`,
      distanceMeters: 0,
      roadName: 'Destination Arrival',
    });

    const totalEstTimeMinutes = Math.round(distances[destNodeId]);
    const delayMinutes = Math.max(0, Math.round(totalEstTimeMinutes - normalTimeMin));
    const avgSpeed = Math.round((totalDistKm / (totalEstTimeMinutes / 60)) || 35);

    return {
      pathNodeIds,
      pathCoordinates,
      totalDistanceKm: parseFloat(totalDistKm.toFixed(1)),
      estimatedTimeMinutes: totalEstTimeMinutes,
      congestionDelayMinutes: delayMinutes,
      averageSpeedKmh: avgSpeed,
      turnByTurnInstructions: instructions,
    };
  }, []);

  // 112 SOS Dispatch
  const trigger112Sos = useCallback((citizenName: string, location: string, coordinates?: [number, number]) => {
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const newDispatch: SosDispatchEvent = {
      id: `sos-${Date.now()}`,
      code: `SOS-112-${codeNum}`,
      citizenName: citizenName || 'Verified Citizen',
      location: location || 'GPS Location: Connaught Center Sector 4',
      coordinates: coordinates || [28.6139, 77.2090],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      priority: 'CODE_RED_112',
      assignedAmbulanceUnit: 'EMS-ALPHA-07 (ALS Unit)',
      destinationHospital: 'City General Trauma Center (H01)',
      etaMinutes: 3.8,
      status: 'DISPATCHED',
    };
    setSosDispatches((prev) => [newDispatch, ...prev]);
    return newDispatch;
  }, []);

  return (
    <CitySyncContext.Provider
      value={{
        complaints,
        addComplaint,
        updateComplaintStatus,
        garages,
        activeGarage,
        setActiveGarage,
        selectSlot,
        selectedSlot,
        activeBooking,
        confirmParkingBooking,
        clearActiveBooking,
        nodes: DIJKSTRA_NODES,
        edges: DIJKSTRA_EDGES,
        calculateDijkstraRoute,
        sosDispatches,
        trigger112Sos,
      }}
    >
      {children}
    </CitySyncContext.Provider>
  );
};

export const useCitySync = (): CitySyncContextType => {
  const context = useContext(CitySyncContext);
  if (!context) {
    throw new Error('useCitySync must be used within a CitySyncProvider');
  }
  return context;
};
