import { Router, Request, Response } from 'express';
import { dbGet, dbQuery, dbRun } from '../db/db';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

export const municipalRouter = Router();

municipalRouter.use(authenticateToken);
municipalRouter.use(authorizeRoles(['MUNICIPAL_CORP', 'MUNICIPAL_CORPORATION', 'COMMAND_CENTER']));

/**
 * GET /api/municipal/overview
 * Overview stats for municipal portal
 */
municipalRouter.get('/overview', async (_req: Request, res: Response) => {
  try {
    const projects = await dbQuery<any>('SELECT * FROM road_projects ORDER BY progress ASC');
    const approvals = await dbQuery<any>('SELECT * FROM road_approvals ORDER BY created_at DESC');
    const activeRoadworks = projects.filter((p: any) => p.status === 'IN_PROGRESS');

    return res.json({
      success: true,
      stats: {
        activeProjectsCount: activeRoadworks.length,
        pendingApprovalsCount: approvals.filter((a: any) => a.status === 'PENDING').length,
        totalCapitalBudgetCrores: '155.70 Cr',
        grievancesResolvedMonth: 184,
      },
      projects,
      approvals,
    });
  } catch (error: any) {
    console.error('Error in /api/municipal/overview:', error);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
});

/**
 * GET /api/municipal/projects
 * Active Construction Projects
 */
municipalRouter.get('/projects', async (_req: Request, res: Response) => {
  try {
    const projects = await dbQuery<any>('SELECT * FROM road_projects ORDER BY created_at DESC');
    return res.json({ success: true, projects });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/municipal/approvals
 * Pending Road Plan Approvals
 */
municipalRouter.get('/approvals', async (_req: Request, res: Response) => {
  try {
    const approvals = await dbQuery<any>('SELECT * FROM road_approvals ORDER BY created_at DESC');
    return res.json({ success: true, approvals });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/municipal/approvals/:id/decision
 * Approve or Reject a pending road plan
 */
municipalRouter.post('/approvals/:id/decision', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const approvalId = parseInt(req.params.id, 10);
    const { decision, comments } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'APPROVED' or 'REJECTED'" });
    }

    await dbRun(
      'UPDATE road_approvals SET status = ?, comments = ? WHERE id = ?',
      [decision, comments || `Decision executed by municipal officer`, approvalId]
    );

    await dbRun(
      'INSERT INTO system_logs (user_id, action, details, severity) VALUES (?, ?, ?, ?)',
      [userId, 'ROAD_PLAN_DECISION', `Road plan #${approvalId} marked as ${decision}`, 'INFO']
    );

    const updated = await dbGet<any>('SELECT * FROM road_approvals WHERE id = ?', [approvalId]);

    return res.json({
      success: true,
      message: `Road plan #${approvalId} has been successfully ${decision.toLowerCase()}.`,
      approval: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/municipal/closure-simulation
 * Run Traffic Impact Simulation on Proposed Road Closures
 */
municipalRouter.post('/closure-simulation', async (req: Request, res: Response) => {
  try {
    const {
      roadSegment = 'Western Arterial Expressway (KM 4 - 8)',
      closureType = 'FULL_CLOSURE', // 'FULL_CLOSURE' | 'SINGLE_LANE' | 'NIGHT_ONLY'
      durationDays = 3,
      peakHourTrafficVehiclesPerHr = 4800,
    } = req.body;

    let impactFactor = 1.0;
    if (closureType === 'SINGLE_LANE') impactFactor = 0.45;
    if (closureType === 'NIGHT_ONLY') impactFactor = 0.20;

    const divertedVehiclesPerHour = Math.round(peakHourTrafficVehiclesPerHr * impactFactor);
    const estimatedAverageDelayMins = Math.round(14 * impactFactor * (durationDays > 1 ? 1.2 : 1.0));
    const secondaryCorridorCongestion = Math.min(Math.round(45 + impactFactor * 40), 96);

    const suggestedDetours = [
      {
        routeCode: 'DETOUR-ALPHA',
        routeName: 'Outer Bypass Boulevard via Sector 8',
        capacityPct: '72% Available',
        extraDistanceKm: 2.8,
        etaAddedMins: 4,
      },
      {
        routeCode: 'DETOUR-BETA',
        routeName: 'Metro Service Ring Road',
        capacityPct: '58% Available',
        extraDistanceKm: 4.1,
        etaAddedMins: 7,
      },
    ];

    const mitigationPlan = [
      'Adjust traffic signals on Detour Alpha +15s green wave during peak hours',
      'Deploy 4 traffic wardens at Sector 8 merge junction',
      'Broadcast public detour advisory on Citizen Portal & GPS feeds 48h prior',
    ];

    return res.json({
      success: true,
      simulation: {
        roadSegment,
        closureType,
        durationDays,
        impactScore: impactFactor >= 0.8 ? 'CRITICAL' : impactFactor >= 0.4 ? 'HIGH' : 'MODERATE',
        divertedVehiclesPerHour,
        estimatedAverageDelayMins,
        secondaryCorridorCongestionPct: secondaryCorridorCongestion,
        suggestedDetours,
        mitigationPlan,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/municipal/closure-simulation:', error);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
});
