-- Migration: 001_create_users_sessions
-- IntelliFlow AI Authentication & RBAC Core Tables

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  oauth_provider TEXT NOT NULL,
  oauth_subject_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  profile_image TEXT,
  role TEXT NOT NULL DEFAULT 'CITIZEN',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL,
  CONSTRAINT uq_oauth_identity UNIQUE (oauth_provider, oauth_subject_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_subject_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
