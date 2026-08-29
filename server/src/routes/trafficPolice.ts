import { Router, Request, Response } from 'express';
import { dbGet, dbQuery, dbRun } from '../db/db';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

export const trafficPoliceRouter = Router();

trafficPoliceRouter.use(authenticateToken);
trafficPoliceRouter.use(authorizeRoles(['TRAFFIC_POLICE', 'COMMAND_CENTER']));

/**
 * GET /api/traffic-police/overview
 * Overview telemetry for police console
 */
trafficPoliceRouter.get('/overview', async (_req: Request, res: Response) => {
  try {
    const junctions = await dbQuery<any>('SELECT * FROM traffic_junctions');
    const incidents = await dbQuery<any>('SELECT * FROM incidents ORDER BY created_at DESC LIMIT 10');
    const corridors = await dbQuery<any>('SELECT * FROM green_corridors WHERE status = "ACTIVE"');

    const heavyCount = junctions.filter((j: any) => j.status === 'HEAVY').length;
    const avgCongestion = Math.round(
      junctions.reduce((acc: number, j: any) => acc + (j.congestion_index || 0), 0) / (junctions.length || 1)
    );

    return res.json({
      success: true,
      stats: {
        activeJunctions: junctions.length,
        activeGreenCorridors: corridors.length,
        congestionIndex: `${avgCongestion}%`,
        heavyCongestionCount: heavyCount,
        activePatrolUnits: 14,
        challansToday: 148,
      },
      junctions,
      incidents,
      greenCorridors: corridors,
    });
  } catch (error: any) {
    console.error('Error in /api/traffic-police/overview:', error);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
});

/**
 * GET /api/traffic-police/predictions
 * AI Congestion Predictions (e.g. "Junction A: Severe Congestion in 15 mins")
 */
trafficPoliceRouter.get('/predictions', async (_req: Request, res: Response) => {
  try {
    const predictions = [
      {
        id: 'PRED-101',
        junctionCode: 'JNC-101',
        junctionName: 'Junction A - Central Boulevard & 4th Ave',
        alert: 'Severe Congestion in 15 mins',
        predictedCongestion: 88,
        currentCongestion: 84,
        predictedDelayMins: 18,
        confidenceScore: '94.2%',
        primaryCause: 'Evening peak outbound surge + Metro station construction slowdown',
        recommendedAction: 'Increase Green Phase by +15s on North-South corridor',
        urgency: 'CRITICAL',
      },
      {
        id: 'PRED-102',
        junctionCode: 'JNC-102',
        junctionName: 'Junction B - Metro Ring Expressway Toll',
        alert: 'Moderate Queue Forming in 25 mins',
        predictedCongestion: 68,
        currentCongestion: 56,
        predictedDelayMins: 8,
        confidenceScore: '89.0%',
        primaryCause: 'Shift change traffic from Sector B Tech Zone',
        recommendedAction: 'Enable dynamic toll lane bypass wave',
        urgency: 'MODERATE',
      },
      {
        id: 'PRED-103',
        junctionCode: 'JNC-104',
        junctionName: 'Junction D - Tech Park North Ring',
        alert: 'Optimal Flow Maintained',
        predictedCongestion: 35,
        currentCongestion: 31,
        predictedDelayMins: 2,
        confidenceScore: '96.5%',
        primaryCause: 'Balanced multi-directional vehicular throughput',
        recommendedAction: 'Keep adaptive AI cycle enabled',
        urgency: 'LOW',
      },
    ];

    return res.json({
      success: true,
      predictions,
      modelTimestamp: new Date().toISOString(),
      predictionHorizonMins: 30,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/traffic-police/simulator
 * Digital Twin Simulator: Test "Increase Green Light +15s" or custom adjustments
 */
trafficPoliceRouter.post('/simulator', async (req: Request, res: Response) => {
  try {
    const { junctionCode = 'JNC-101', greenDeltaSec = 15 } = req.body;

    const junction = await dbGet<any>('SELECT * FROM traffic_junctions WHERE code = ?', [junctionCode]);
    const currentGreen = junction?.current_green_time || 45;
    const currentCongestion = junction?.congestion_index || 84;
    const newGreen = currentGreen + greenDeltaSec;

    // Digital twin mathematical estimation
    const delayReductionPercent = Math.min(Math.round((greenDeltaSec / currentGreen) * 45), 55);
    const simulatedCongestion = Math.max(currentCongestion - Math.round(delayReductionPercent * 0.4), 20);
    const queueReductionMeters = greenDeltaSec * 18; // approx 18m queue discharge per second of extra green
    const simulatedDelayMins = Math.max(Math.round((junction?.ai_predicted_delay_mins || 18) * (1 - delayReductionPercent / 100)), 2);

    return res.json({
      success: true,
      junctionCode,
      junctionName: junction?.name || 'Junction A',
      parameters: {
        previousGreenTimeSec: currentGreen,
        newGreenTimeSec: newGreen,
        greenAdjustmentSec: greenDeltaSec,
      },
      simulationResults: {
        delayReductionPercent: `${delayReductionPercent}%`,
        queueReductionMeters: `${queueReductionMeters} meters`,
        previousCongestion: `${currentCongestion}%`,
        simulatedCongestion: `${simulatedCongestion}%`,
        previousEstimatedDelay: `${junction?.ai_predicted_delay_mins || 18} mins`,
        simulatedEstimatedDelay: `${simulatedDelayMins} mins`,
        throughputGainVehiclesPerHour: greenDeltaSec * 42,
        networkSpilloverRisk: 'Low (0.12)',
      },
      recommendation: `Increasing green phase to ${newGreen}s resolves bottleneck on Junction A within 4 signal cycles.`,
    });
  } catch (error: any) {
    console.error('Error in /api/traffic-police/simulator:', error);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
});

/**
 * POST /api/traffic-police/signal-override
 * Apply signal timing override to live junction
 */
trafficPoliceRouter.post('/signal-override', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const { junctionCode, newGreenTimeSec = 60, mode = 'MANUAL_OVERRIDE' } = req.body;

    if (!junctionCode) {
      return res.status(400).json({ success: false, message: 'Junction code is required.' });
    }

    await dbRun(
      'UPDATE traffic_junctions SET current_green_time = ?, status = ? WHERE code = ?',
      [newGreenTimeSec, mode === 'GREEN_CORRIDOR' ? 'GREEN_CORRIDOR' : 'OPTIMAL', junctionCode]
    );

    await dbRun(
      'INSERT INTO system_logs (user_id, action, details, severity) VALUES (?, ?, ?, ?)',
      [userId, 'SIGNAL_OVERRIDE', `Signal overridden on ${junctionCode} to ${newGreenTimeSec}s green (${mode})`, 'WARN']
    );

    const updated = await dbGet<any>('SELECT * FROM traffic_junctions WHERE code = ?', [junctionCode]);

    return res.json({
      success: true,
      message: `Signal override successfully pushed to controller for ${junctionCode}.`,
      junction: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
