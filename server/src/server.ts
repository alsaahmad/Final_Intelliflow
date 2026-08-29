import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { initDatabase, getDbEngine } from './db/db';
import { authRouter } from './routes/auth';
import { citizenRouter } from './routes/citizen';
import { trafficPoliceRouter } from './routes/trafficPolice';
import { municipalRouter } from './routes/municipal';
import { commandCenterRouter } from './routes/commandCenter';
import { errorHandler } from './middleware/errorHandler';

export function createServer() {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body Parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Health Check Endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'HEALTHY',
      service: 'IntelliFlow AI Backend Server',
      databaseEngine: getDbEngine(),
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/citizen', citizenRouter);
  app.use('/api/traffic-police', trafficPoliceRouter);
  app.use('/api/municipal', municipalRouter);
  app.use('/api/command', commandCenterRouter);

  // Backward compatibility alias for /auth
  app.use('/auth', authRouter);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export async function startServer() {
  const PORT = process.env.PORT || 5000;

  // Initialize DB tables and seed data
  await initDatabase();

  const app = createServer();
  const server = app.listen(PORT, () => {
    console.log(`
🏙️ ========================================================
   INTELLIFLOW AI - Smart City Traffic Management Platform
   Backend Server Running
========================================================
   🌐 Port:             ${PORT}
   💾 Database Engine:  ${getDbEngine().toUpperCase()}
   🔐 Auth:             JWT + bcryptjs (RBAC enabled)
   👥 Supported Roles:  CITIZEN, TRAFFIC_POLICE, MUNICIPAL_CORP, COMMAND_CENTER
   🔗 Health Check:     http://localhost:${PORT}/health
========================================================
    `);
  });

  return server;
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}
