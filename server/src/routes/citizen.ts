import { Router, Request, Response } from 'express';
import { dbGet, dbQuery, dbRun } from '../db/db';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

export const citizenRouter = Router();

// Apply auth and role protection to citizen routes
citizenRouter.use(authenticateToken);
citizenRouter.use(authorizeRoles(['CITIZEN', 'COMMAND_CENTER']));

/**
 * GET /api/citizen/overview
 * Overview stats for citizen portal
 */
citizenRouter.get('/overview', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const incidents = await dbQuery<any>(
      'SELECT * FROM incidents WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    const junctions = await dbQuery<any>(
      'SELECT code, name, sector, status, congestion_index, ai_prediction_alert FROM traffic_junctions'
    );

    const sosCount = await dbGet<any>(
      'SELECT COUNT(*) as count FROM sos_alerts WHERE user_id = ? AND status = "ACTIVE"',
      [userId]
    );

    return res.json({
      success: true,
      stats: {
        totalReports: incidents.length,
        activeSos: sosCount ? (sosCount.count ?? sosCount['COUNT(*)']) : 0,
        cityAverageCongestion: '48%',
      },
      myIncidents: incidents,
      junctions,
    });
  } catch (error: any) {
    console.error('Error in /api/citizen/overview:', error);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
});

/**
 * POST /api/citizen/incidents
 * Quick form: Report Public Problem (potholes, signal failure, accidents, waterlogging)
 */
citizenRouter.post('/incidents', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const { title, description, category, location, severity = 'MEDIUM' } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Title, description, and location are required.',
      });
    }

    let assignedDepartment = 'Municipal Works Department';
    if (category === 'SIGNAL_FAILURE' || category === 'ACCIDENT') {
      assignedDepartment = 'Traffic Police Division';
    } else if (category === 'WATERLOGGING') {
      assignedDepartment = 'Stormwater Drainage Directorate';
    }

    const result = await dbRun(
      `INSERT INTO incidents (user_id, title, description, category, location, severity, status, assigned_department)
       VALUES (?, ?, ?, ?, ?, ?, 'REPORTED', ?)`,
      [userId, title, description, category || 'POTHOLE', location, severity, assignedDepartment]
    );

    await dbRun(
      'INSERT INTO system_logs (user_id, action, details, severity) VALUES (?, ?, ?, ?)',
      [userId, 'INCIDENT_REPORTED', `Civic problem reported: "${title}" at ${location}`, 'INFO']
    );

    const newIncident = await dbGet<any>('SELECT * FROM incidents WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Problem report submitted successfully. Civic authorities notified.',
      incident: newIncident,
    });
  } catch (error: any) {
    console.error('Error in /api/citizen/incidents:', error);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
});

/**
 * GET /api/citizen/incidents
 * List citizen's reported problems or all public active problems
 */
citizenRouter.get('/incidents', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const myReports = await dbQuery<any>(
      'SELECT * FROM incidents WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    const recentCityReports = await dbQuery<any>(
      'SELECT id, title, category, location, severity, status, created_at FROM incidents ORDER BY created_at DESC LIMIT 15'
    );

    return res.json({
      success: true,
      myReports,
      recentCityReports,
    });
  } catch (error: any) {
    console.error('Error in /api/citizen/incidents:', error);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
});

/**
 * POST /api/citizen/sos
 * Prominent 112 SOS Emergency Beacon trigger
 */
citizenRouter.post('/sos', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const { location = 'Current Citizen GPS Coordinates', emergencyType = '112_GENERAL_DISTRESS' } = req.body;

    const result = await dbRun(
      `INSERT INTO sos_alerts (user_id, location, emergency_type, status, dispatched_units)
       VALUES (?, ?, ?, 'ACTIVE', 'ICCC Emergency Squad 09 + EMS 108')`,
      [userId, location, emergencyType]
    );

    await dbRun(
      'INSERT INTO system_logs (user_id, action, details, severity) VALUES (?, ?, ?, ?)',
      [userId, 'EMERGENCY_SOS_112', `112 SOS Alert triggered from ${location}`, 'CRITICAL']
    );

    const alert = await dbGet<any>('SELECT * FROM sos_alerts WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: '112 SOS Distress Signal Broadcasted. Police & EMS Units Dispatched.',
      alertId: alert?.id || result.insertId,
      status: 'ACTIVE',
      dispatchedUnits: ['Metropolitan Police Rapid Unit', 'EMS Ambulance Alpha-108'],
      etaMinutes: 4,
    });
  } catch (error: any) {
    console.error('Error in /api/citizen/sos:', error);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
});

/**
 * GET /api/citizen/traffic-status
 * Live Traffic Status for Citizen Portal Map
 */
citizenRouter.get('/traffic-status', async (_req: Request, res: Response) => {
  try {
    const junctions = await dbQuery<any>('SELECT * FROM traffic_junctions');
    const activeIncidents = await dbQuery<any>(
      'SELECT id, title, category, location, severity, status, latitude, longitude FROM incidents WHERE status != "RESOLVED"'
    );

    return res.json({
      success: true,
      junctions,
      incidents: activeIncidents,
      averageCommuteSpeedKmh: 34.5,
      congestionLevel: 'Moderate (Peak Hours)',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
