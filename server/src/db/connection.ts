import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

let dbInstance: Database | null = null;

/**
 * Initialize and retrieve the database connection instance
 */
export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const isTest = env.NODE_ENV === 'test';
  const dbPath = isTest ? ':memory:' : path.resolve(process.cwd(), env.DATABASE_PATH);

  if (!isTest) {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  sqlite3.verbose();
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Enable foreign keys
  await dbInstance.run('PRAGMA foreign_keys = ON;');

  return dbInstance;
}

/**
 * Reset database instance (useful for testing)
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
