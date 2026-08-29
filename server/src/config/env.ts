import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root or server root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  
  // Session Security
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters long').default('intelliflow_super_secret_session_key_replace_in_production_32char_min'),
  SESSION_SECURE: z.string().default('false').transform((val) => val === 'true'),
  SESSION_MAX_AGE_MS: z.string().default('86400000').transform((val) => parseInt(val, 10)),

  // Database
  DATABASE_PATH: z.string().default('./data/intelliflow.db'),
  DATABASE_URL: z.string().optional(),

  // OAuth / OIDC
  OAUTH_PROVIDER: z.enum(['google', 'generic-oidc', 'dev']).default('google'),
  OAUTH_CLIENT_ID: z.string().default('mock-google-client-id.apps.googleusercontent.com'),
  OAUTH_CLIENT_SECRET: z.string().default('mock-google-client-secret'),
  OAUTH_ISSUER: z.string().default('https://accounts.google.com'),
  OAUTH_REDIRECT_URI: z.string().default('http://localhost:5000/auth/callback'),
  OAUTH_SCOPE: z.string().default('openid email profile'),

  // Roles
  DEFAULT_DEMO_ROLE: z.enum(['CITIZEN', 'COMMAND_CENTER', 'MUNICIPAL_ENGINEER', 'ADMIN']).default('CITIZEN'),

  // Development sandbox mode
  ENABLE_DEV_MOCK_AUTH: z.string().default('true').transform((val) => val === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables configuration:', parsed.error.format());
  throw new Error('Invalid environment configuration.');
}

export const env = parsed.data;
