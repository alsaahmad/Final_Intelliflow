import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export interface DbResult {
  insertId?: number;
  changes?: number;
}

export type DbEngine = 'mysql' | 'sqlite';

let activeEngine: DbEngine = 'sqlite';
let mysqlPool: mysql.Pool | null = null;
let sqliteDb: Database | null = null;

// Initialize Database connection & tables
export async function initDatabase(): Promise<void> {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE || 'intelliflow_db';

  // If password is provided or explicitly requested, attempt MySQL connection first
  if (process.env.USE_MYSQL === 'true' || password !== undefined) {
    try {
      // 1. Create database if it doesn't exist
      const rootConn = await mysql.createConnection({ host, port, user, password });
      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await rootConn.end();

      // 2. Connect pool to the target database
      mysqlPool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test connection
      await mysqlPool.query('SELECT 1');
      activeEngine = 'mysql';
      console.log(`✅ [IntelliFlow DB] Connected to MySQL (${host}:${port}/${database})`);

      await createMySqlTables();
      await seedInitialData();
      return;
    } catch (err: any) {
      console.warn(`⚠️ [IntelliFlow DB] MySQL connection failed (${err.message}). Falling back to embedded SQLite database...`);
    }
  }

  // SQLite fallback
  activeEngine = 'sqlite';
  const dbDir = path.resolve(process.cwd(), './data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'intelliflow.db');

  sqliteDb = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await sqliteDb.run('PRAGMA foreign_keys = ON;');
  console.log(`✅ [IntelliFlow DB] Connected to SQLite database (${dbPath})`);

  await createSqliteTables();
  await seedInitialData();
}

// Create MySQL Tables
async function createMySqlTables() {
  if (!mysqlPool) return;

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('CITIZEN', 'TRAFFIC_POLICE', 'MUNICIPAL_CORP', 'COMMAND_CENTER') NOT NULL DEFAULT 'CITIZEN',
      badge_number VARCHAR(100) DEFAULT NULL,
      department VARCHAR(100) DEFAULT NULL,
      phone_number VARCHAR(50) DEFAULT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_email_role (email, role),
      INDEX idx_users_email (email),
      INDEX idx_users_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      location VARCHAR(255) NOT NULL,
      latitude DECIMAL(10, 8) DEFAULT NULL,
      longitude DECIMAL(11, 8) DEFAULT NULL,
      severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
      status VARCHAR(50) NOT NULL DEFAULT 'REPORTED',
      assigned_department VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS sos_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      location VARCHAR(255) NOT NULL,
      emergency_type VARCHAR(100) NOT NULL DEFAULT '112_GENERAL_DISTRESS',
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      dispatched_units VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS traffic_junctions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      sector VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'OPTIMAL',
      current_green_time INT NOT NULL DEFAULT 45,
      default_cycle_time INT NOT NULL DEFAULT 90,
      congestion_index INT NOT NULL DEFAULT 35,
      ai_prediction_alert VARCHAR(255) DEFAULT NULL,
      ai_predicted_delay_mins INT DEFAULT 0,
      latitude DECIMAL(10, 8) DEFAULT NULL,
      longitude DECIMAL(11, 8) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS road_projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      contractor VARCHAR(255) NOT NULL,
      progress INT NOT NULL DEFAULT 0,
      budget_crores DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
      status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
      estimated_completion VARCHAR(100) NOT NULL,
      traffic_diversion_active BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS road_approvals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      proposed_by VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      closure_duration VARCHAR(100) NOT NULL,
      estimated_delay_mins INT NOT NULL DEFAULT 15,
      traffic_impact_level VARCHAR(50) NOT NULL DEFAULT 'MODERATE',
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      comments TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS green_corridors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      assigned_unit VARCHAR(255) NOT NULL,
      corridor_route VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      eta_minutes INT NOT NULL DEFAULT 8,
      signals_cleared VARCHAR(100) NOT NULL DEFAULT '4/6',
      speed_kmh INT NOT NULL DEFAULT 62,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      action VARCHAR(255) NOT NULL,
      details TEXT NULL,
      severity VARCHAR(50) NOT NULL DEFAULT 'INFO',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

// Create SQLite Tables
async function createSqliteTables() {
  if (!sqliteDb) return;

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('CITIZEN', 'TRAFFIC_POLICE', 'MUNICIPAL_CORP', 'COMMAND_CENTER')) NOT NULL DEFAULT 'CITIZEN',
      badge_number TEXT DEFAULT NULL,
      department TEXT DEFAULT NULL,
      phone_number TEXT DEFAULT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(email, role)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude REAL DEFAULT NULL,
      longitude REAL DEFAULT NULL,
      severity TEXT NOT NULL DEFAULT 'MEDIUM',
      status TEXT NOT NULL DEFAULT 'REPORTED',
      assigned_department TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sos_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NULL,
      location TEXT NOT NULL,
      emergency_type TEXT NOT NULL DEFAULT '112_GENERAL_DISTRESS',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      dispatched_units TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS traffic_junctions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      sector TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPTIMAL',
      current_green_time INTEGER NOT NULL DEFAULT 45,
      default_cycle_time INTEGER NOT NULL DEFAULT 90,
      congestion_index INTEGER NOT NULL DEFAULT 35,
      ai_prediction_alert TEXT DEFAULT NULL,
      ai_predicted_delay_mins INTEGER DEFAULT 0,
      latitude REAL DEFAULT NULL,
      longitude REAL DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS road_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      contractor TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      budget_crores REAL NOT NULL DEFAULT 0.0,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
      estimated_completion TEXT NOT NULL,
      traffic_diversion_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS road_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      proposed_by TEXT NOT NULL,
      location TEXT NOT NULL,
      closure_duration TEXT NOT NULL,
      estimated_delay_mins INTEGER NOT NULL DEFAULT 15,
      traffic_impact_level TEXT NOT NULL DEFAULT 'MODERATE',
      status TEXT NOT NULL DEFAULT 'PENDING',
      comments TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS green_corridors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      assigned_unit TEXT NOT NULL,
      corridor_route TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      eta_minutes INTEGER NOT NULL DEFAULT 8,
      signals_cleared TEXT NOT NULL DEFAULT '4/6',
      speed_kmh INTEGER NOT NULL DEFAULT 62,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NULL,
      action TEXT NOT NULL,
      details TEXT NULL,
      severity TEXT NOT NULL DEFAULT 'INFO',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
}

// Seed initial demo data
async function seedInitialData() {
  const existingUsers = await dbGet<any>('SELECT COUNT(*) as cnt FROM users');
  const count = existingUsers ? (existingUsers.cnt ?? existingUsers['COUNT(*)']) : 0;

  if (count === 0) {
    const passwordHash = await bcrypt.hash('password123', 10);

    const demoUsers = [
      {
        name: 'Alex Rivera',
        email: 'citizen@intelliflow.ai',
        password_hash: passwordHash,
        role: 'CITIZEN',
        badge_number: null,
        department: 'Civic Resident',
      },
      {
        name: 'Insp. Rajesh Varma',
        email: 'police@intelliflow.ai',
        password_hash: passwordHash,
        role: 'TRAFFIC_POLICE',
        badge_number: 'TP-4092',
        department: 'Traffic Police Division A',
      },
      {
        name: 'Dr. Elena Rostova',
        email: 'municipal@intelliflow.ai',
        password_hash: passwordHash,
        role: 'MUNICIPAL_CORP',
        badge_number: 'MC-1088',
        department: 'Urban Planning Directorate',
      },
      {
        name: 'Capt. Marcus Chen',
        email: 'command@intelliflow.ai',
        password_hash: passwordHash,
        role: 'COMMAND_CENTER',
        badge_number: 'ICCC-01',
        department: 'Integrated Command Center',
      },
    ];

    for (const u of demoUsers) {
      await dbRun(
        'INSERT INTO users (name, email, password_hash, role, badge_number, department) VALUES (?, ?, ?, ?, ?, ?)',
        [u.name, u.email, u.password_hash, u.role, u.badge_number, u.department]
      );
    }
  }

  // Seed Junctions if empty
  const junctions = await dbGet<any>('SELECT COUNT(*) as cnt FROM traffic_junctions');
  const jCount = junctions ? (junctions.cnt ?? junctions['COUNT(*)']) : 0;
  if (jCount === 0) {
    const demoJunctions = [
      ['JNC-101', 'Junction A - Central Boulevard & 4th Ave', 'Sector A', 'HEAVY', 45, 90, 84, 'Severe Congestion in 15 mins (Predicted delay: +18m)', 18, 28.6139, 77.209],
      ['JNC-102', 'Junction B - Metro Ring Expressway Toll', 'Sector B', 'MODERATE', 60, 90, 56, 'Moderate flow expected during peak transit', 5, 28.625, 77.218],
      ['JNC-103', 'Junction C - Hospital Trauma Corridor', 'Sector C', 'GREEN_CORRIDOR', 75, 90, 22, 'Green Wave Active for Ambulance Unit 108', 0, 28.601, 77.225],
      ['JNC-104', 'Junction D - Tech Park North Ring', 'Sector D', 'OPTIMAL', 50, 90, 31, 'Smooth traffic conditions', 2, 28.638, 77.234],
    ];

    for (const j of demoJunctions) {
      await dbRun(
        'INSERT INTO traffic_junctions (code, name, sector, status, current_green_time, default_cycle_time, congestion_index, ai_prediction_alert, ai_predicted_delay_mins, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        j
      );
    }
  }

  // Seed Road Projects if empty
  const projects = await dbGet<any>('SELECT COUNT(*) as cnt FROM road_projects');
  const pCount = projects ? (projects.cnt ?? projects['COUNT(*)']) : 0;
  if (pCount === 0) {
    const demoProjects = [
      ['PRJ-201', 'North Arterial Flyover Expansion', 'Sector 4 to Ring Road', 'L&T Infrastructure', 68, 42.5, 'IN_PROGRESS', 'Nov 2026', 1],
      ['PRJ-202', 'Smart Stormwater Drainage & Ducting', 'Central Boulevard', 'NCC Urban Works', 45, 18.2, 'IN_PROGRESS', 'Dec 2026', 0],
      ['PRJ-203', 'Metro Line Phase 3 Station Retrofit', 'Tech Park North', 'Afcons Infra', 85, 95.0, 'IN_PROGRESS', 'Oct 2026', 1],
    ];

    for (const p of demoProjects) {
      await dbRun(
        'INSERT INTO road_projects (project_code, name, location, contractor, progress, budget_crores, status, estimated_completion, traffic_diversion_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p
      );
    }
  }

  // Seed Road Approvals if empty
  const approvals = await dbGet<any>('SELECT COUNT(*) as cnt FROM road_approvals');
  const aCount = approvals ? (approvals.cnt ?? approvals['COUNT(*)']) : 0;
  if (aCount === 0) {
    const demoApprovals = [
      ['Underground Cable Ducting Closure', 'State Power Distribution Ltd', 'Western Express Arterial', '3 Days (Weekend)', 14, 'HIGH', 'PENDING', 'Requires traffic diversion via Outer Ring Road'],
      ['Water Main Replacement Project', 'Municipal Water Board', 'Sector 7 Market Cross', '24 Hours', 8, 'MODERATE', 'PENDING', 'Partial single-lane night closure proposed'],
      ['Pedestrian Skywalk Girder Placement', 'Urban Mobility Authority', 'Metro Station Gate 2', '6 Hours (Night)', 4, 'LOW', 'APPROVED', 'Scheduled for Sunday 01:00 AM - 07:00 AM'],
    ];

    for (const a of demoApprovals) {
      await dbRun(
        'INSERT INTO road_approvals (title, proposed_by, location, closure_duration, estimated_delay_mins, traffic_impact_level, status, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        a
      );
    }
  }

  // Seed Green Corridors if empty
  const corridors = await dbGet<any>('SELECT COUNT(*) as cnt FROM green_corridors');
  const cCount = corridors ? (corridors.cnt ?? corridors['COUNT(*)']) : 0;
  if (cCount === 0) {
    const demoCorridors = [
      ['Trauma Priority Wave 01', 'Ambulance EMS-108 (Cardiac)', 'Junction A -> JNC-103 -> City Trauma Hospital', 'ACTIVE', 6, '4/5', 68],
      ['VIP Escort Corridor 02', 'State Delegate Escort', 'Airport Tollway -> Central Secretariat', 'ACTIVE', 12, '6/8', 55],
    ];

    for (const c of demoCorridors) {
      await dbRun(
        'INSERT INTO green_corridors (name, assigned_unit, corridor_route, status, eta_minutes, signals_cleared, speed_kmh) VALUES (?, ?, ?, ?, ?, ?, ?)',
        c
      );
    }
  }

  // Seed initial citizen incidents if empty
  const incidents = await dbGet<any>('SELECT COUNT(*) as cnt FROM incidents');
  const iCount = incidents ? (incidents.cnt ?? incidents['COUNT(*)']) : 0;
  if (iCount === 0) {
    const citizenUser = await dbGet<any>('SELECT id FROM users LIMIT 1');
    const defaultUserId = citizenUser?.id || null;

    const demoIncidents = [
      [defaultUserId, 'Deep Pothole on Right Lane', 'Near Central Boulevard Signal junction causing sudden braking', 'POTHOLE', 'Central Boulevard Sector 4', 'MEDIUM', 'REPORTED', 'Municipal Road Maintenance'],
      [defaultUserId, 'Traffic Signal Blinking Yellow Malfunction', 'Signal stuck on amber at 4th Ave intersection', 'SIGNAL_FAILURE', '4th Ave & 8th Cross', 'HIGH', 'IN_PROGRESS', 'Traffic Police Division A'],
      [defaultUserId, 'Monsoon Waterlogging on Underpass', '3 feet water accumulation under Ring Road bridge', 'WATERLOGGING', 'Outer Ring Road Underpass', 'CRITICAL', 'ACKNOWLEDGED', 'Municipal Stormwater Directorate'],
    ];

    for (const inc of demoIncidents) {
      await dbRun(
        'INSERT INTO incidents (user_id, title, description, category, location, severity, status, assigned_department) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        inc
      );
    }
  }
}

// Universal Query Interface
export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (activeEngine === 'mysql' && mysqlPool) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows as T[];
  }

  if (sqliteDb) {
    return await sqliteDb.all<T[]>(sql, params);
  }

  throw new Error('Database not initialized');
}

export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  if (activeEngine === 'mysql' && mysqlPool) {
    const [rows] = await mysqlPool.query(sql, params);
    const list = rows as T[];
    return list.length > 0 ? list[0] : null;
  }

  if (sqliteDb) {
    const row = await sqliteDb.get<T>(sql, params);
    return row || null;
  }

  throw new Error('Database not initialized');
}

export async function dbRun(sql: string, params: any[] = []): Promise<DbResult> {
  if (activeEngine === 'mysql' && mysqlPool) {
    const [result] = await mysqlPool.execute(sql, params);
    const res = result as mysql.ResultSetHeader;
    return {
      insertId: res.insertId,
      changes: res.affectedRows,
    };
  }

  if (sqliteDb) {
    const res = await sqliteDb.run(sql, params);
    return {
      insertId: res.lastID,
      changes: res.changes,
    };
  }

  throw new Error('Database not initialized');
}

export function getDbEngine(): DbEngine {
  return activeEngine;
}
