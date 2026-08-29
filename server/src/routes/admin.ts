import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole, requirePermission } from '../middleware/rbac';
import { Permissions } from '../models/roles';
import { UserRepository } from '../db/repositories/userRepository';
import { getDatabase } from '../db/connection';
import { sanitizeUser } from '../models/user';

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireRole('ADMIN' as any));

/**
 * GET /api/admin/users
 */
adminRouter.get('/users', requirePermission(Permissions.USERS_MANAGE), async (_req: Request, res: Response) => {
  try {
    const users = await UserRepository.listUsers();
    res.json({
      status: 'success',
      count: users.length,
      users: users.map(sanitizeUser),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 */
adminRouter.patch('/users/:id/role', requirePermission(Permissions.ROLES_MANAGE), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const updated = await UserRepository.updateRole(id, role);
    if (!updated) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Target user not found.' });
    }

    await UserRepository.logAudit(
      req.user?.id || null,
      'ADMIN_ROLE_CHANGE',
      `Admin assigned role '${role}' to user '${updated.email}' (${updated.id})`,
      req.ip
    );

    res.json({
      status: 'success',
      message: `User role updated to ${role}`,
      user: sanitizeUser(updated),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 */
adminRouter.patch('/users/:id/status', requirePermission(Permissions.USERS_MANAGE), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const updated = await UserRepository.setActive(id, isActive);
    if (!updated) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Target user not found.' });
    }

    await UserRepository.logAudit(
      req.user?.id || null,
      'ADMIN_STATUS_CHANGE',
      `Admin set active=${isActive} for user '${updated.email}' (${updated.id})`,
      req.ip
    );

    res.json({
      status: 'success',
      message: `User account ${isActive ? 'activated' : 'deactivated'}`,
      user: sanitizeUser(updated),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});

/**
 * GET /api/admin/audit-logs
 */
adminRouter.get('/audit-logs', requirePermission(Permissions.SYSTEM_MANAGE), async (_req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const logs = await db.all('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 50');
    res.json({
      status: 'success',
      logs,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'DATABASE_ERROR', message: err.message });
  }
});
