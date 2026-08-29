import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server';
import { initDatabase } from '../src/db/db';

describe('IntelliFlow AI - RBAC & Route Authorization Tests', () => {
  let app: any;
  let citizenToken: string;
  let policeToken: string;
  let municipalToken: string;
  let commandToken: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();
    app = createServer();

    // Acquire tokens for all 4 roles
    const citRes = await request(app).post('/api/auth/login').send({ email: 'citizen@intelliflow.ai', password: 'password123' });
    citizenToken = citRes.body.token;

    const polRes = await request(app).post('/api/auth/login').send({ email: 'police@intelliflow.ai', password: 'password123' });
    policeToken = polRes.body.token;

    const munRes = await request(app).post('/api/auth/login').send({ email: 'municipal@intelliflow.ai', password: 'password123' });
    municipalToken = munRes.body.token;

    const cmdRes = await request(app).post('/api/auth/login').send({ email: 'command@intelliflow.ai', password: 'password123' });
    commandToken = cmdRes.body.token;
  });

  it('1. Unauthenticated request to protected route is rejected with 401', async () => {
    const res = await request(app).get('/api/traffic-police/overview');
    expect(res.status).toBe(401);
  });

  it('2. Authenticated CITIZEN can access citizen routes', async () => {
    const res = await request(app)
      .get('/api/citizen/incidents')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('3. CITIZEN is rejected with 403 Forbidden when accessing Traffic Police routes', async () => {
    const res = await request(app)
      .get('/api/traffic-police/overview')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('4. CITIZEN is rejected with 403 Forbidden when accessing Municipal routes', async () => {
    const res = await request(app)
      .get('/api/municipal/projects')
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('5. COMMAND_CENTER user can access Command Center route', async () => {
    const res = await request(app)
      .get('/api/command/overview')
      .set('Authorization', `Bearer ${commandToken}`);

    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
  });

  it('6. MUNICIPAL_CORP user can access Municipal routes', async () => {
    const res = await request(app)
      .get('/api/municipal/projects')
      .set('Authorization', `Bearer ${municipalToken}`);

    expect(res.status).toBe(200);
    expect(res.body.projects).toBeDefined();
  });

  it('7. TRAFFIC_POLICE can access traffic overview', async () => {
    const res = await request(app)
      .get('/api/traffic-police/overview')
      .set('Authorization', `Bearer ${policeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.junctions).toBeDefined();
  });
});
