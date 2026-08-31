import {
  SimulationScenarioConfig,
  SimulationResult,
  Road,
  Junction,
  Hospital,
  SimulationTimelineStep,
  AIRecommendation,
} from '../types';

export function runWhatIfSimulation(
  scenario: SimulationScenarioConfig,
  currentRoads: Road[],
  _currentJunctions: Junction[],
  _currentHospitals: Hospital[]
): SimulationResult {
  const isTargetJunction = scenario.locationTarget.type === 'JUNCTION';
  const targetId = scenario.locationTarget.id;

  // Severity multipliers
  const severityMultiplier = {
    LOW: 1.15,
    MEDIUM: 1.35,
    HIGH: 1.75,
    CRITICAL: 2.1,
  }[scenario.severity];

  const blockageFactor = scenario.blockageExtent === 'COMPLETE' ? 1.4 : 1.15;

  // Compute Normal Baseline
  const normalAvgTraffic = Math.round(
    currentRoads.reduce((sum, r) => sum + r.congestionPercent, 0) / currentRoads.length
  );
  const normalAvgEta = 8;
  const normalAffectedRoads = currentRoads.filter((r) => r.congestionPercent > 70).length;

  // Compute Simulated Values
  const simulatedAvgTraffic = Math.min(
    Math.round(normalAvgTraffic * severityMultiplier * (blockageFactor * 0.75)),
    95
  );
  const ambulanceDelay = Math.round(scenario.severity === 'CRITICAL' ? 8 : scenario.severity === 'HIGH' ? 6 : 3);
  const simulatedAvgEta = normalAvgEta + ambulanceDelay;
  const simulatedAffectedRoads = Math.min(currentRoads.length, normalAffectedRoads + 5);
  const simulatedResilience = Math.max(82 - Math.round(ambulanceDelay * 3.5), 45);

  // Identify affected road IDs and junctions
  let affectedRoadIds: string[] = [];
  let affectedJunctionIds: string[] = [];

  if (isTargetJunction) {
    affectedJunctionIds = [targetId, 'j-15', 'j-18'];
    affectedRoadIds = ['r-102', 'r-101', 'r-105'];
  } else {
    affectedRoadIds = [targetId, 'r-102'];
    affectedJunctionIds = ['j-14', 'j-15'];
  }

  // Generate Replayable Simulation Timeline Steps (09:40 to 09:53)
  const timeline: SimulationTimelineStep[] = [
    {
      timeLabel: '09:40',
      timestampMinutes: 0,
      eventTitle: 'Normal City Baseline',
      description: 'Nominal traffic flow across arterial network. Baseline congestion at 42%.',
      trafficCongestion: 42,
    },
    {
      timeLabel: '09:42',
      timestampMinutes: 2,
      eventTitle: `${scenario.event} Detected by AI Vision`,
      description: `CCTV-142 automated object detector identifies ${scenario.event.toLowerCase()} at ${scenario.locationTarget.name}. Severity: ${scenario.severity}.`,
      trafficCongestion: 54,
      activeAction: 'CCTV AI Alarm Raised',
    },
    {
      timeLabel: '09:44',
      timestampMinutes: 4,
      eventTitle: 'Queue Building & Spillover',
      description: `Road R102 partially blocked; vehicular throughput drops 65%. Queue delay propagation into adjacent junctions.`,
      trafficCongestion: 66,
      activeAction: 'Traffic Flow Restricted',
    },
    {
      timeLabel: '09:47',
      timestampMinutes: 7,
      eventTitle: 'EMS Ambulance Dispatched',
      description: 'AMB-07 deployed with Advanced Life Support equipment. Green corridor route calculation initiated.',
      trafficCongestion: 71,
      activeAction: 'Ambulance AMB-07 En Route',
    },
    {
      timeLabel: '09:50',
      timestampMinutes: 10,
      eventTitle: 'Peak Gridlock & Road Closure',
      description: 'Road R102 blocked for emergency triage & clearance. Inbound delays reach +6 minutes.',
      trafficCongestion: 78,
      activeAction: 'Complete Arterial Blockage',
    },
    {
      timeLabel: '09:53',
      timestampMinutes: 13,
      eventTitle: 'AI Optimization & Signal Wave Engaged',
      description: 'Dynamic green corridor preemption engaged on R105 bypass. Traffic successfully diverted.',
      trafficCongestion: 62,
      activeAction: 'Traffic Restabilization',
    },
  ];

  // Synthesize AI Decision Engine Recommendation
  const aiRecommendation: AIRecommendation = {
    id: `rec-${Date.now()}`,
    title: `${scenario.severity} IMPACT RESPONSE RECOMMENDATION`,
    scenarioImpact: scenario.severity,
    recommendedActions: [
      'Close R102 (Central Boulevard Arterial) to through-traffic to protect emergency lane.',
      'Divert inbound vehicles through R105 (Western Bypass Diversion Corridor).',
      'Prioritize ambulance green corridor wave for AMB-07 via R108 to H01 (City General Trauma Center).',
      'Redirect secondary non-critical admissions to H03 (Apex Critical Care).',
      'Adjust signal cycle at J14 → J16 (+15s green wave preemption).',
    ],
    expectedEtaImprovementPercent: 31,
    expectedThroughputGainVehPerHr: 480,
    affectedRoadsToClose: ['r-102'],
    diversionRoutes: [
      { from: 'J14', to: 'J18', via: 'R105 (Western Bypass)' },
      { from: 'J18', to: 'J16', via: 'R110 (South-West Connector)' },
    ],
    signalAdjustments: [
      { junctionCode: 'J14', deltaGreenSec: 15 },
      { junctionCode: 'J16', deltaGreenSec: 20 },
    ],
    recommendedHospitalId: 'h-01',
    confidenceScore: '95.8% (Multi-modal Graph Decision Engine)',
    reasoning:
      'Dynamic rerouting via Western Bypass (R105) mitigates 480 veh/hr buildup and prevents gridlock spillover into Transit Hub J15 while guaranteeing sub-7 min hospital transit for incoming trauma patient.',
  };

  return {
    scenarioConfig: scenario,
    normalState: {
      averageTrafficPercent: 42,
      averageEtaMinutes: normalAvgEta,
      affectedRoadsCount: 2,
      affectedHospitalsCount: 2,
      cityResilience: 82,
    },
    simulatedState: {
      averageTrafficPercent: simulatedAvgTraffic,
      averageEtaMinutes: simulatedAvgEta,
      affectedRoadsCount: simulatedAffectedRoads,
      affectedHospitalsCount: 2,
      ambulanceDelayMinutes: ambulanceDelay,
      cityResilience: simulatedResilience,
    },
    timeline,
    aiRecommendation,
    affectedRoadIds,
    affectedJunctionIds,
  };
}
