import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server';
import { initDatabase } from '../src/db/db';

describe('IntelliFlow AI - RBAC & Full-Stack Auth Test Suite', () => {
  let app: any;
  const uniqueCitizenEmail = `test.citizen.${Date.now()}@intelliflow.ai`;
  let citizenToken: string;
  let policeToken: string;
  let municipalToken: string;
  let commandToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();
    app = createServer();
  });

  it('1. POST /api/auth/register registers a new user with selected role and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Citizen User',
        email: uniqueCitizenEmail,
        password: 'password123',
        role: 'CITIZEN',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('CITIZEN');
    expect(res.body.user.email).toBe(uniqueCitizenEmail);
    citizenToken = res.body.token;
  });

  it('2. POST /api/auth/register rejects duplicate email addresses', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Citizen',
        email: uniqueCitizenEmail,
        password: 'password123',
        role: 'CITIZEN',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('3. POST /api/auth/login succeeds with valid credentials and returns JWT with ID and Role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'police@intelliflow.ai',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('TRAFFIC_POLICE');
    policeToken = res.body.token;
  });

  it('4. POST /api/auth/login rejects invalid passwords', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'police@intelliflow.ai',
        password: 'wrong_password_999',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('5. Logs in as Municipal Corp and Command Center to acquire tokens', async () => {
    const resMuni = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'municipal@intelliflow.ai',
        password: 'password123',
      });
    expect(resMuni.status).toBe(200);
    municipalToken = resMuni.body.token;

    const resCmd = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'command@intelliflow.ai',
        password: 'password123',
      });
    expect(resCmd.status).toBe(200);
    commandToken = resCmd.body.token;
  });

  it('6. authenticateToken blocks unauthenticated requests (401)', async () => {
    const res = await request(app).get('/api/traffic-police/overview');
    expect(res.status).toBe(401);
  });

  it('7. authorizeRoles blocks Citizen from accessing Traffic Police routes (403)', async () => {
    const res = await request(app)
      .get('/api/traffic-police/overview')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('8. authorizeRoles allows Traffic Police to access Traffic Police routes (200)', async () => {
    const res = await request(app)
      .get('/api/traffic-police/overview')
      .set('Authorization', `Bearer ${policeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.junctions).toBeDefined();
  });

  it('9. Citizen Portal: Submits Public Problem report & triggers 112 SOS', async () => {
    const reportRes = await request(app)
      .post('/api/citizen/incidents')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Broken Traffic Light Sensor',
        description: 'Sensor not triggering green on Left Turn',
        category: 'SIGNAL_FAILURE',
        location: 'Sector 5 Crossing',
        severity: 'HIGH',
      });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.incident.title).toBe('Broken Traffic Light Sensor');

    const sosRes = await request(app)
      .post('/api/citizen/sos')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        location: 'Sector 5 Main Crossing GPS',
      });

    expect(sosRes.status).toBe(201);
    expect(sosRes.body.status).toBe('ACTIVE');
  });

  it('10. Traffic Police: Runs Digital Twin "+15s Green Light" Simulator', async () => {
    const simRes = await request(app)
      .post('/api/traffic-police/simulator')
      .set('Authorization', `Bearer ${policeToken}`)
      .send({
        junctionCode: 'JNC-101',
        greenDeltaSec: 15,
      });

    expect(simRes.status).toBe(200);
    expect(simRes.body.simulationResults.delayReductionPercent).toBeDefined();
  });

  it('11. Municipal Corp: Fetches projects and runs road closure traffic impact simulation', async () => {
    const simRes = await request(app)
      .post('/api/municipal/closure-simulation')
      .set('Authorization', `Bearer ${municipalToken}`)
      .send({
        roadSegment: 'Western Arterial Expressway (KM 4 - 8)',
        closureType: 'FULL_CLOSURE',
        durationDays: 3,
      });

    expect(simRes.status).toBe(200);
    expect(simRes.body.simulation.divertedVehiclesPerHour).toBeGreaterThan(0);
    expect(simRes.body.simulation.suggestedDetours.length).toBeGreaterThan(0);
  });

  it('12. Command Center: Fetches high-level metrics (Average Travel Time, Active Green Corridors, System Alerts)', async () => {
    const overviewRes = await request(app)
      .get('/api/command/overview')
      .set('Authorization', `Bearer ${commandToken}`);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.metrics.averageTravelTime.value).toBe('18.4 mins');
    expect(overviewRes.body.metrics.activeGreenCorridors.value).toContain('Active');
    expect(overviewRes.body.metrics.systemAlerts.value).toContain('Alerts');
  });
});
