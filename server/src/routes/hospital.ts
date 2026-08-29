import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole, requirePermission } from '../middleware/rbac';
import { UserRole, Permissions } from '../models/roles';

export const hospitalRouter = Router();

// Base auth
hospitalRouter.use(requireAuth);

/**
 * GET /api/hospital/dashboard
 */
hospitalRouter.get(
  '/dashboard',
  requireRole(UserRole.HOSPITAL, UserRole.COMMAND_CENTER, UserRole.ADMIN),
  (req: Request, res: Response) => {
    res.json({
      status: 'success',
      hospitalName: 'Metropolitan Super Specialty & Trauma Care',
      leadDoctor: req.user?.name,
      bedCapacity: {
        totalEmergencyBeds: 24,
        availableEmergencyBeds: 6,
        totalIcuBeds: 16,
        availableIcuBeds: 3,
        ventilatorsAvailable: 5,
        o2BufferHours: 72,
      },
      bloodBankSupply: {
        'O+': 'HIGH (24 Units)',
        'O-': 'MODERATE (6 Units)',
        'A+': 'HIGH (18 Units)',
        'B+': 'HIGH (20 Units)',
        'AB+': 'STABLE (10 Units)',
      },
      inboundAmbulances: [
        {
          unitId: 'EMS-ALPHA-108',
          etaMinutes: 3.5,
          condition: 'Acute Trauma / Cardiac Event',
          triageTag: 'RED_PRIORITY_1',
          vitals: 'BP 135/88, SpO2 96%, HR 104',
          allocatedBed: 'Trauma Bay 02',
          traumaTeamReady: true,
        },
        {
          unitId: 'EMS-DELTA-102',
          etaMinutes: 12.0,
          condition: 'Fracture / Stable',
          triageTag: 'YELLOW_PRIORITY_2',
          vitals: 'BP 120/80, SpO2 99%, HR 78',
          allocatedBed: 'Emergency Bay 07',
          traumaTeamReady: false,
        },
      ],
      traumaTeamStatus: 'STANDBY_ALERT_ACTIVE',
    });
  }
);

/**
 * PATCH /api/hospital/beds/update
 */
hospitalRouter.patch(
  '/beds/update',
  requirePermission(Permissions.BEDS_MANAGE),
  (req: Request, res: Response) => {
    const { availableEmergencyBeds, availableIcuBeds, ventilatorsAvailable } = req.body;
    res.json({
      status: 'BED_STATUS_UPDATED',
      broadcastedToICCC: true,
      updatedValues: {
        availableEmergencyBeds: availableEmergencyBeds ?? 6,
        availableIcuBeds: availableIcuBeds ?? 3,
        ventilatorsAvailable: ventilatorsAvailable ?? 5,
      },
      updatedBy: req.user?.name,
      timestamp: new Date().toISOString(),
    });
  }
);
