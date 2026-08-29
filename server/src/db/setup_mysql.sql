-- ============================================================================
-- INTELLIFLOW AI - SMART CITY TRAFFIC MANAGEMENT & DIGITAL TWIN PLATFORM
-- MySQL Database Setup & Initialization Script
-- ============================================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS intelliflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE intelliflow_db;

-- ----------------------------------------------------------------------------
-- 1. Users Table (Core Authentication & Role-Based Access Control)
-- Roles: 'CITIZEN', 'TRAFFIC_POLICE', 'MUNICIPAL_CORP', 'COMMAND_CENTER'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('CITIZEN', 'TRAFFIC_POLICE', 'MUNICIPAL_CORP', 'COMMAND_CENTER') NOT NULL DEFAULT 'CITIZEN',
  badge_number VARCHAR(100) DEFAULT NULL,
  department VARCHAR(100) DEFAULT NULL,
  phone_number VARCHAR(50) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. Incidents & Civic Grievance Reports (Citizen & Police Incident Feed)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('POTHOLE', 'SIGNAL_FAILURE', 'ACCIDENT', 'WATERLOGGING', 'TRAFFIC_CONGESTION', 'OTHER') NOT NULL,
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) DEFAULT NULL,
  longitude DECIMAL(11, 8) DEFAULT NULL,
  severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  status ENUM('REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'REPORTED',
  assigned_department VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_incidents_status (status),
  INDEX idx_incidents_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. Emergency SOS Alerts (Citizen 112 Distress Broadcast)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sos_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) DEFAULT NULL,
  longitude DECIMAL(11, 8) DEFAULT NULL,
  emergency_type VARCHAR(100) NOT NULL DEFAULT '112_GENERAL_DISTRESS',
  status ENUM('ACTIVE', 'DISPATCHED', 'RESOLVED') NOT NULL DEFAULT 'ACTIVE',
  dispatched_units VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sos_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. Traffic Signals & Junctions (Traffic Police & Command Center Digital Twin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS traffic_junctions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  status ENUM('OPTIMAL', 'MODERATE', 'HEAVY', 'GREEN_CORRIDOR') NOT NULL DEFAULT 'OPTIMAL',
  current_green_time INT NOT NULL DEFAULT 45,
  default_cycle_time INT NOT NULL DEFAULT 90,
  congestion_index INT NOT NULL DEFAULT 35,
  ai_prediction_alert VARCHAR(255) DEFAULT NULL,
  ai_predicted_delay_mins INT DEFAULT 0,
  latitude DECIMAL(10, 8) DEFAULT NULL,
  longitude DECIMAL(11, 8) DEFAULT NULL,
  last_overridden_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_junctions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. Active Construction & Infrastructure Projects (Municipal Corp)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS road_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  contractor VARCHAR(255) NOT NULL,
  progress INT NOT NULL DEFAULT 0,
  budget_crores DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  status ENUM('PLANNING', 'IN_PROGRESS', 'INSPECTION', 'COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS',
  estimated_completion VARCHAR(100) NOT NULL,
  traffic_diversion_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. Pending Road Plan Approvals (Municipal Corp & Traffic Police)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS road_approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  proposed_by VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  closure_duration VARCHAR(100) NOT NULL,
  estimated_delay_mins INT NOT NULL DEFAULT 15,
  traffic_impact_level ENUM('LOW', 'MODERATE', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MODERATE',
  status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  comments TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. Green Corridors (Command Center & Traffic Police Priority Waves)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS green_corridors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  assigned_unit VARCHAR(255) NOT NULL,
  corridor_route VARCHAR(255) NOT NULL,
  status ENUM('PREPARING', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  eta_minutes INT NOT NULL DEFAULT 8,
  signals_cleared VARCHAR(100) NOT NULL DEFAULT '4/6',
  speed_kmh INT NOT NULL DEFAULT 62,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. System Activity & Audit Logs (Command Center & Admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(255) NOT NULL,
  details TEXT NULL,
  severity ENUM('INFO', 'WARN', 'ERROR', 'CRITICAL') NOT NULL DEFAULT 'INFO',
  ip_address VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Initial Seed Data (Pre-hashed with bcryptjs, password: 'password123')
-- ----------------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role, badge_number, department)
VALUES
  ('Alex Rivera', 'citizen@intelliflow.ai', '$2a$10$f6Bqm/q1Xg8x2E7r4mJnI.h8hJkV9k2w2nQo5wA8yT8m3qZ5gC/0e', 'CITIZEN', NULL, 'Civic Resident'),
  ('Insp. Rajesh Varma', 'police@intelliflow.ai', '$2a$10$f6Bqm/q1Xg8x2E7r4mJnI.h8hJkV9k2w2nQo5wA8yT8m3qZ5gC/0e', 'TRAFFIC_POLICE', 'TP-4092', 'Traffic Police Division A'),
  ('Dr. Elena Rostova', 'municipal@intelliflow.ai', '$2a$10$f6Bqm/q1Xg8x2E7r4mJnI.h8hJkV9k2w2nQo5wA8yT8m3qZ5gC/0e', 'MUNICIPAL_CORP', 'MC-1088', 'Urban Planning Directorate'),
  ('Capt. Marcus Chen', 'command@intelliflow.ai', '$2a$10$f6Bqm/q1Xg8x2E7r4mJnI.h8hJkV9k2w2nQo5wA8yT8m3qZ5gC/0e', 'COMMAND_CENTER', 'ICCC-01', 'Integrated Command Center')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Initial Junctions
INSERT INTO traffic_junctions (code, name, sector, status, current_green_time, default_cycle_time, congestion_index, ai_prediction_alert, ai_predicted_delay_mins, latitude, longitude)
VALUES
  ('JNC-101', 'Junction A - Central Boulevard & 4th Ave', 'Sector A', 'HEAVY', 45, 90, 84, 'Severe Congestion in 15 mins (Predicted delay: +18m)', 18, 28.6139, 77.2090),
  ('JNC-102', 'Junction B - Metro Ring Expressway Toll', 'Sector B', 'MODERATE', 60, 90, 56, 'Moderate flow expected during peak transit', 5, 28.6250, 77.2180),
  ('JNC-103', 'Junction C - Hospital Trauma Corridor', 'Sector C', 'GREEN_CORRIDOR', 75, 90, 22, 'Green Wave Active for Ambulance Unit 108', 0, 28.6010, 77.2250),
  ('JNC-104', 'Junction D - Tech Park North Ring', 'Sector D', 'OPTIMAL', 50, 90, 31, 'Smooth traffic conditions', 2, 28.6380, 77.2340)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Initial Road Projects
INSERT INTO road_projects (project_code, name, location, contractor, progress, budget_crores, status, estimated_completion, traffic_diversion_active)
VALUES
  ('PRJ-201', 'North Arterial Flyover Expansion', 'Sector 4 to Ring Road', 'L&T Infrastructure', 68, 42.50, 'IN_PROGRESS', 'Nov 2026', TRUE),
  ('PRJ-202', 'Smart Stormwater Drainage & Ducting', 'Central Boulevard', 'NCC Urban Works', 45, 18.20, 'IN_PROGRESS', 'Dec 2026', FALSE),
  ('PRJ-203', 'Metro Line Phase 3 Station Retrofit', 'Tech Park North', 'Afcons Infra', 85, 95.00, 'IN_PROGRESS', 'Oct 2026', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Initial Road Approvals
INSERT INTO road_approvals (title, proposed_by, location, closure_duration, estimated_delay_mins, traffic_impact_level, status, comments)
VALUES
  ('Underground Cable Ducting Closure', 'State Power Distribution Ltd', 'Western Express Arterial', '3 Days (Weekend)', 14, 'HIGH', 'PENDING', 'Requires traffic diversion via Outer Ring Road'),
  ('Water Main Replacement Project', 'Municipal Water Board', 'Sector 7 Market Cross', '24 Hours', 8, 'MODERATE', 'PENDING', 'Partial single-lane night closure proposed'),
  ('Pedestrian Skywalk Girder Placement', 'Urban Mobility Authority', 'Metro Station Gate 2', '6 Hours (Night)', 4, 'LOW', 'APPROVED', 'Scheduled for Sunday 01:00 AM - 07:00 AM')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Initial Green Corridors
INSERT INTO green_corridors (name, assigned_unit, corridor_route, status, eta_minutes, signals_cleared, speed_kmh)
VALUES
  ('Trauma Priority Wave 01', 'Ambulance EMS-108 (Cardiac)', 'Junction A -> JNC-103 -> City Trauma Hospital', 'ACTIVE', 6, '4/5', 68),
  ('VIP Escort Corridor 02', 'State Delegate Escort', 'Airport Tollway -> Central Secretariat', 'ACTIVE', 12, '6/8', 55)
ON DUPLICATE KEY UPDATE name=VALUES(name);
