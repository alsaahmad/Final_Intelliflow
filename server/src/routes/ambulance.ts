import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole, requirePermission } from '../middleware/rbac';
import { UserRole, Permissions } from '../models/roles';

export const ambulanceRouter = Router();

// Base auth
ambulanceRouter.use(requireAuth);

/**
 * GET /api/ambulance/active-mission
 */
ambulanceRouter.get(
  '/active-mission',
  requireRole(UserRole.AMBULANCE_RESPONDER, UserRole.COMMAND_CENTER, UserRole.ADMIN),
  (req: Request, res: Response) => {
    res.json({
      status: 'success',
      unitId: 'EMS-ALPHA-108',
      driver: req.user?.name,
      paramedicStatus: 'EN_ROUTE_TO_PATIENT',
      assignedIncident: {
        id: 'INC-8890',
        callType: 'Cardiac Emergency / Acute Trauma',
        priority: 'CODE_RED',
        patientLocation: 'Building 4B, Metro Tech Zone',
        destinationHospital: 'City General Trauma Center (ICU Bed 4 reserved)',
        etaMinutes: 3.5,
        gpsCoordinates: { lat: 28.6139, lng: 77.2090 },
      },
      greenCorridorStatus: {
        active: true,
        corridorId: 'GC-901',
        signalsUpcoming: [
          { name: '4th Avenue Junction', state: 'HELD_GREEN', distanceMeters: 400 },
          { name: 'Hospital Access Slip Road', state: 'HELD_GREEN', distanceMeters: 1100 },
        ],
      },
      vitalTelemetryStream: {
        heartRateBpm: 104,
        spO2Percent: 96,
        bloodPressure: '135/88',
        ecgSyncLive: true,
      },
    });
  }
);

/**
 * POST /api/ambulance/green-corridor/request
 */
ambulanceRouter.post(
  '/green-corridor/request',
  requirePermission(Permissions.GREEN_CORRIDOR_REQUEST),
  (req: Request, res: Response) => {
    const { destinationHospitalId, emergencyCode } = req.body;
    res.json({
      status: 'REQUEST_BROADCASTED',
      message: 'Automatic green corridor requested with Traffic Police & Command Center.',
      corridorId: `GC-${Math.floor(100 + Math.random() * 900)}`,
      destination: destinationHospitalId || 'City General Trauma Center',
      priority: emergencyCode || 'CODE_RED',
      estimatedSpeedGainMinutes: 6.8,
      timestamp: new Date().toISOString(),
    });
  }
);

/**
 * POST /api/ambulance/triage/submit
 */
ambulanceRouter.post(
  '/triage/submit',
  requirePermission(Permissions.TRIAGE_SUBMIT),
  (req: Request, res: Response) => {
    const { patientAge, condition, vitals, requiredEquipment } = req.body;
    res.json({
      status: 'TRIAGE_TRANSMITTED',
      destinationHospitalNotified: true,
      traumaTeamMobilized: true,
      patientDetails: {
        condition: condition || 'Critical / Conscious',
        triageTag: 'RED_PRIORITY_1',
        vitals: vitals || { spO2: 96, bp: '135/88' },
        requiredEquipment: requiredEquipment || ['Ventilator', 'Defibrillator Standby'],
      },
      timestamp: new Date().toISOString(),
    });
  }
);
