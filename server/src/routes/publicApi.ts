import { Router, Request, Response } from 'express';

export const publicApiRouter = Router();

// In-memory grievance storage for interactive public demo
const grievances: Array<{
  id: string;
  category: string;
  title: string;
  location: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'WORK_ASSIGNED' | 'RESOLVED';
  createdAt: string;
  citizenName: string;
}> = [
  {
    id: 'GRV-2026-901',
    category: 'Traffic Signal',
    title: 'Signal synchronization delay at North Avenue',
    location: 'North Ave & Outer Ring',
    status: 'WORK_ASSIGNED',
    createdAt: '2026-08-28T10:14:00Z',
    citizenName: 'Dev Citizen',
  },
  {
    id: 'GRV-2026-902',
    category: 'Road Infrastructure',
    title: 'Pothole near Metro Station Gate 2',
    location: 'Sector 14 Metro Station',
    status: 'IN_REVIEW',
    createdAt: '2026-08-29T08:30:00Z',
    citizenName: 'Anil K.',
  },
];

/**
 * GET /api/public/stats
 * Real-time Smart City Digital Twin live metrics
 */
publicApiRouter.get('/stats', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    metrics: {
      activeCitizensConnected: 142850,
      trafficCongestionAverage: '48%',
      airQualityIndexAqi: 74,
      aqiStatus: 'MODERATE_GOOD',
      parkingSpotsAvailable: 342,
      totalParkingLots: 18,
      activeGreenCorridors: 2,
      emergencyResponseAvgMinutes: 5.4,
      totalCivicIssuesResolved: 12490,
      activeSurveillanceCameras: 420,
    },
    liveAlerts: [
      { id: 'ALT-1', type: 'EMERGENCY_CORRIDOR', message: 'Green Corridor active along North Expressway towards Metro Hospital.', severity: 'CRITICAL', timestamp: '2 mins ago' },
      { id: 'ALT-2', type: 'TRAFFIC_ADVISORY', message: 'Heavy rain expected in South Sector; advisory speed 40 km/h.', severity: 'INFO', timestamp: '15 mins ago' },
      { id: 'ALT-3', type: 'ROADWORK', message: 'Civil works scheduled on Central Flyover Lane 3 from 11 PM to 5 AM.', severity: 'WARNING', timestamp: '1 hour ago' },
    ],
  });
});

/**
 * GET /api/public/traffic
 */
publicApiRouter.get('/traffic', (req: Request, res: Response) => {
  res.json({
    status: 'success',
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
});

/**
 * GET /api/public/parking
 */
publicApiRouter.get('/parking', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    totalAvailable: 342,
    lots: [
      { id: 'LOT-A1', name: 'Metro Central Underground Lot', total: 200, available: 54, evChargers: 12, evAvailable: 4, feePerHour: '₹30/hr', zone: 'Central' },
      { id: 'LOT-B2', name: 'Civic Center Smart Plaza', total: 150, available: 68, evChargers: 8, evAvailable: 5, feePerHour: '₹20/hr', zone: 'Sector 4' },
      { id: 'LOT-C3', name: 'Tech Valley Multi-level Park', total: 400, available: 180, evChargers: 24, evAvailable: 14, feePerHour: '₹40/hr', zone: 'North Tech' },
      { id: 'LOT-D4', name: 'Metro Hospital Visitor Garage', total: 120, available: 40, evChargers: 6, evAvailable: 2, feePerHour: '₹25/hr', zone: 'Hospital Zone' },
    ],
  });
});

/**
 * POST /api/public/grievances
 * Public grievance / civic issue submission
 */
publicApiRouter.post('/grievances', (req: Request, res: Response) => {
  const { category, title, location, citizenName, citizenEmail } = req.body;
  if (!category || !title || !location) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Category, title, and location are required.' });
  }

  const newId = `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const ticket = {
    id: newId,
    category,
    title,
    location,
    status: 'SUBMITTED' as const,
    createdAt: new Date().toISOString(),
    citizenName: citizenName || 'Anonymous Citizen',
  };

  grievances.unshift(ticket);

  res.status(201).json({
    status: 'TICKET_CREATED',
    ticketId: newId,
    message: 'Your civic grievance has been logged and assigned to the Municipal Corporation & Traffic Division.',
    ticket,
  });
});

/**
 * GET /api/public/grievances/track/:ticketId
 */
publicApiRouter.get('/grievances/track/:ticketId', (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const match = grievances.find((g) => g.id.toLowerCase() === ticketId.toLowerCase());

  if (!match) {
    return res.status(404).json({
      error: 'TICKET_NOT_FOUND',
      message: `No grievance ticket found for ID: ${ticketId}. Please check the ticket number.`,
    });
  }

  res.json({
    status: 'success',
    ticket: match,
  });
});
