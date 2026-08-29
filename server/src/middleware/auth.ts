import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserDTO, UserRole } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'intelliflow_ai_jwt_secret_key_2026_smart_city_platform';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware: authenticateToken
 * Verifies JWT token from Authorization: Bearer <token> header or session fallback
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Access denied. No authentication token provided in Authorization header.',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Invalid or expired authentication token.',
      });
    }

    req.user = decoded as JwtPayload;
    next();
  });
}

// Backward compatibility alias
export const requireAuth = authenticateToken;

/**
 * Middleware: authorizeRoles
 * Checks if the authenticated user's role is included in the permitted roles
 */
export function authorizeRoles(allowedRoles: (UserRole | string)[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required before role verification.',
      });
    }

    const userRole = req.user.role;
    
    // Normalize role string (e.g. support MUNICIPAL_CORPORATION as alias)
    const normalizedRole = userRole === 'MUNICIPAL_CORPORATION' ? 'MUNICIPAL_CORP' : userRole;

    const hasRole = allowedRoles.some((r) => {
      const normAllowed = r === 'MUNICIPAL_CORPORATION' ? 'MUNICIPAL_CORP' : r;
      return normAllowed === normalizedRole;
    });

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Forbidden: Access restricted. Role '${userRole}' does not have sufficient clearance for this portal.`,
      });
    }

    next();
  };
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
