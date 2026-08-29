import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server';
import { initDatabase } from '../src/db/db';

describe('IntelliFlow AI - Authentication & Token Tests', () => {
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();
    app = createServer();
  });

  it('1. GET /api/auth/me rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('2. GET /api/auth/demo-accounts returns pre-seeded accounts for all 4 roles', async () => {
    const res = await request(app).get('/api/auth/demo-accounts');
    expect(res.status).toBe(200);
    expect(res.body.accounts).toBeDefined();
    expect(res.body.accounts.length).toBeGreaterThanOrEqual(4);
  });

  it('3. Authenticates with valid demo credentials and returns Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'citizen@intelliflow.ai',
        password: 'password123',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.role).toBe('CITIZEN');

    // /api/auth/me should return authenticated user
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe('citizen@intelliflow.ai');
  });

  it('4. Rejects expired or malformed Bearer tokens', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_token_123');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });
});
