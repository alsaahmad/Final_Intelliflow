import crypto from 'crypto';
import { getDatabase } from '../connection';
import { User } from '../../models/user';
import { UserRole } from '../../models/roles';
import { env } from '../../config/env';

export class UserRepository {
  /**
   * Convert SQLite row to User object
   */
  private static mapRow(row: any): any {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Find user by internal unique ID
   */
  static async findById(id: any): Promise<any | null> {
    const db = await getDatabase();
    const row = await db.get('SELECT * FROM users WHERE id = ?', id);
    return row ? this.mapRow(row) : null;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<any | null> {
    const db = await getDatabase();
    const row = await db.get('SELECT * FROM users WHERE email = ?', email.toLowerCase());
    return row ? this.mapRow(row) : null;
  }

  /**
   * Find user by OAuth provider and stable Subject ID
   */
  static async findByOAuth(provider: string, subjectId: string): Promise<any | null> {
    const db = await getDatabase();
    const row = await db.get(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_subject_id = ?',
      provider,
      subjectId
    );
    return row ? this.mapRow(row) : null;
  }

  /**
   * Create or update user upon successful OAuth authentication.
   */
  static async upsertOAuthUser(params: {
    oauth_provider: string;
    oauth_subject_id: string;
    email: string;
    name: string;
    profile_image?: string | null;
    defaultRole?: any;
  }): Promise<any> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    const existing = await this.findByEmail(params.email);

    if (existing) {
      await db.run(
        `UPDATE users SET name = ?, updated_at = ? WHERE id = ?`,
        params.name,
        now,
        existing.id
      );
      return await this.findById(existing.id);
    } else {
      const result = await db.run(
        `INSERT INTO users (name, email, password_hash, role, is_active, created_at, updated_at)
         VALUES (?, ?, 'oauth_managed', ?, 1, ?, ?)`,
        params.name,
        params.email.toLowerCase(),
        params.defaultRole || 'CITIZEN',
        now,
        now
      );
      return await this.findById(result.lastID);
    }
  }

  /**
   * Update role for a user
   */
  static async updateRole(userId: any, newRole: any): Promise<any | null> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.run('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', newRole, now, userId);
    return this.findById(userId);
  }

  /**
   * Set user active/inactive status
   */
  static async setActive(userId: any, isActive: boolean): Promise<any | null> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.run('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?', isActive ? 1 : 0, now, userId);
    return this.findById(userId);
  }

  /**
   * List all users
   */
  static async listUsers(): Promise<any[]> {
    const db = await getDatabase();
    const rows = await db.all('SELECT * FROM users ORDER BY created_at DESC');
    return rows.map(this.mapRow);
  }

  /**
   * Log an audit event
   */
  static async logAudit(
    userId: any,
    action: string,
    details?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();
      await db.run(
        'INSERT INTO system_logs (user_id, action, details, severity) VALUES (?, ?, ?, "INFO")',
        userId ? String(userId) : null,
        action,
        details || null
      );
    } catch (err) {
      // ignore
    }
  }
}
