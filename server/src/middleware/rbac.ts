import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission, hasPermission } from '../models/roles';
import { UserRepository } from '../db/repositories/userRepository';

/**
 * Middleware: Requires the authenticated user to hold one of the specified roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: 'UNAUTHENTICATED',
        message: 'Authentication required before checking role authorization.',
      });
    }

    if (!allowedRoles.includes(user.role)) {
      await UserRepository.logAudit(
        user.id,
        'UNAUTHORIZED_ROLE_ACCESS',
        `User with role '${user.role}' attempted to access route requiring '${allowedRoles.join(', ')}' (${req.method} ${req.originalUrl})`,
        req.ip
      );

      return res.status(403).json({
        error: 'FORBIDDEN_ROLE',
        message: `Access denied. Requires one of [${allowedRoles.join(', ')}] role. Current role: ${user.role}`,
        userRole: user.role,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
}

/**
 * Middleware: Requires the authenticated user's role to possess specific permissions
 */
export function requirePermission(...requiredPermissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: 'UNAUTHENTICATED',
        message: 'Authentication required before checking permissions.',
      });
    }

    const missingPermissions = requiredPermissions.filter(
      (perm) => !hasPermission(user.role, perm)
    );

    if (missingPermissions.length > 0) {
      await UserRepository.logAudit(
        user.id,
        'UNAUTHORIZED_PERMISSION_ACCESS',
        `User '${user.id}' (${user.role}) missing permissions: ${missingPermissions.join(', ')}`,
        req.ip
      );

      return res.status(403).json({
        error: 'FORBIDDEN_PERMISSION',
        message: `Access denied. Missing required permission(s): ${missingPermissions.join(', ')}`,
        missingPermissions,
      });
    }

    next();
  };
}
