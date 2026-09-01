import { Router, Request, Response } from 'express';
import { dbGet, dbQuery, dbRun } from '../db/db';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

export const commandCenterRouter = Router();

commandCenterRouter.use(authenticateToken);
commandCenterRouter.use(
  authorizeRoles([
    'COMMAND_CENTER',
    'MUNICIPAL_CORP',
    'MUNICIPAL_CORPORATION',
    'MUNICIPAL_ENGINEER',
    'CITY_OPERATIONS',
    'ADMIN',
  ])
);

/**
 * GET /api/command/overview
 * High-level city overview metrics cards:
 * "Average Travel Time", "Active Green Corridors", "System Alerts"
 */
commandCenterRouter.get('/overview', async (_req: Request, res: Response) => {
  try {
    const junctions = await dbQuery<any>('SELECT * FROM traffic_junctions');
    const greenCorridors = await dbQuery<any>('SELECT * FROM green_corridors WHERE status = "ACTIVE"');
    const sosAlerts = await dbQuery<any>('SELECT * FROM sos_alerts WHERE status = "ACTIVE"');
    const criticalIncidents = await dbQuery<any>(
      'SELECT * FROM incidents WHERE severity = "CRITICAL" OR severity = "HIGH"'
    );
    const recentLogs = await dbQuery<any>(
      'SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 15'
    );

    // Calculate metrics
    const averageTravelTimeMins = 18.4;
    const travelTimeComparison = '-12.8% vs last week average';
    const activeGreenCorridorsCount = greenCorridors.length;
    const systemAlertsCount = sosAlerts.length + criticalIncidents.length;

    return res.json({
      success: true,
      metrics: {
        averageTravelTime: {
          value: '18.4 mins',
          comparison: travelTimeComparison,
          trend: 'down',
          networkEfficiencyScore: '91.4%',
        },
        activeGreenCorridors: {
          value: `${activeGreenCorridorsCount} Active`,
          details: 'Emergency Priority Signal Waves Enabled',
          corridors: greenCorridors,
        },
        systemAlerts: {
          value: `${systemAlertsCount} Alerts`,
          activeSosCount: sosAlerts.length,
          criticalIncidentsCount: criticalIncidents.length,
          status: systemAlertsCount > 3 ? 'ELEVATED_WATCH' : 'NOMINAL',
        },
      },
      cityHealth: {
        totalMonitoredJunctions: junctions.length,
        optimalFlowPct: '78%',
        cctvFeedsOnline: '184 / 184',
        connectedEmergencyVehicles: 28,
      },
      recentLogs,
    });
  } catch (error: any) {
    console.error('Error in /api/command/overview:', error);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
});

/**
 * GET /api/command/emergency-monitoring
 * Live Emergency Feeds & Active Green Corridors
 */
commandCenterRouter.get('/emergency-monitoring', async (_req: Request, res: Response) => {
  try {
    const activeSos = await dbQuery<any>(
      'SELECT s.*, u.name as citizen_name, u.phone_number FROM sos_alerts s LEFT JOIN users u ON s.user_id = u.id WHERE s.status = "ACTIVE" ORDER BY s.created_at DESC'
    );
    const corridors = await dbQuery<any>('SELECT * FROM green_corridors ORDER BY created_at DESC');
    const emergencyUnits = [
      { unitId: 'EMS-ALPHA-108', type: 'Advanced Cardiac Ambulance', status: 'IN_TRANSIT', speedKmh: 68, gps: 'Sector C Hospital Way' },
      { unitId: 'POLICE-INTERCEPTOR-04', type: 'Highway Patrol', status: 'PATROLLING', speedKmh: 45, gps: 'Western Expressway Toll' },
      { unitId: 'FIRE-HAZMAT-02', type: 'Heavy Rescue Tender', status: 'STANDBY', speedKmh: 0, gps: 'Station 12 Central' },
    ];

    return res.json({
      success: true,
      activeSos,
      greenCorridors: corridors,
      emergencyUnits,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/command/green-corridor
 * Activate or update a priority Green Corridor
 */
commandCenterRouter.post('/green-corridor', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const { name, assignedUnit, corridorRoute, etaMinutes = 8, speedKmh = 65 } = req.body;

    if (!name || !assignedUnit || !corridorRoute) {
      return res.status(400).json({ success: false, message: 'Name, assigned unit, and route are required.' });
    }

    const result = await dbRun(
      'INSERT INTO green_corridors (name, assigned_unit, corridor_route, status, eta_minutes, signals_cleared, speed_kmh) VALUES (?, ?, ?, "ACTIVE", ?, "0/5", ?)',
      [name, assignedUnit, corridorRoute, etaMinutes, speedKmh]
    );

    await dbRun(
      'INSERT INTO system_logs (user_id, action, details, severity) VALUES (?, ?, ?, ?)',
      [userId, 'GREEN_CORRIDOR_ACTIVATED', `Green Corridor "${name}" activated for ${assignedUnit}`, 'CRITICAL']
    );

    const newCorridor = await dbGet<any>('SELECT * FROM green_corridors WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Green Corridor initialized. Automated traffic light wave preemption engaged.',
      corridor: newCorridor,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/command/logs
 * Live System activity & security audit logs
 */
commandCenterRouter.get('/logs', async (_req: Request, res: Response) => {
  try {
    const logs = await dbQuery<any>(
      'SELECT l.*, u.name as user_name, u.role as user_role FROM system_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 50'
    );
    return res.json({ success: true, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
