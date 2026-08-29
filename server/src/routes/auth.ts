import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbGet, dbRun, dbQuery } from '../db/db';
import { authenticateToken, generateToken } from '../middleware/auth';
import { sanitizeUser, UserRole } from '../models/user';

export const authRouter = Router();

const VALID_ROLES: UserRole[] = ['CITIZEN', 'TRAFFIC_POLICE', 'MUNICIPAL_CORP', 'COMMAND_CENTER'];

/**
 * GET /api/auth/roles-for-email
 * Returns the list of registered roles for a given email address
 */
authRouter.get('/roles-for-email', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string)?.trim().toLowerCase();
    if (!email) {
      return res.json({ success: true, roles: [] });
    }
    const accounts = await dbQuery<any>('SELECT role, name FROM users WHERE email = ?', [email]);
    return res.json({
      success: true,
      roles: accounts.map((a) => a.role),
      accountsCount: accounts.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/register
 * Hashes password, saves user with their selected role to MySQL, returns JWT
 * Allows one person (same email) to have multiple accounts with distinct roles!
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    let { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Name, email, password, and role are all required.',
      });
    }

    email = email.trim().toLowerCase();

    // Normalize role string
    if (role === 'MUNICIPAL_CORPORATION') {
      role = 'MUNICIPAL_CORP';
    }

    if (!VALID_ROLES.includes(role as UserRole)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ROLE',
        message: `Role must be one of: ${VALID_ROLES.join(', ')}`,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters in length.',
      });
    }

    // Check if an account with this (email, role) already exists
    const existing = await dbGet<any>('SELECT id FROM users WHERE email = ? AND role = ?', [email, role]);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_ALREADY_EXISTS',
        message: `You already have an account registered with the ${role} role under this email. Please sign in instead.`,
      });
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    // Department / badge assignment defaults
    let department = 'Civic Resident';
    let badgeNumber = null;
    if (role === 'TRAFFIC_POLICE') {
      department = 'Metropolitan Traffic Division';
      badgeNumber = `TP-${Math.floor(1000 + Math.random() * 9000)}`;
    } else if (role === 'MUNICIPAL_CORP') {
      department = 'Municipal Urban Infrastructure & Planning';
      badgeNumber = `MC-${Math.floor(1000 + Math.random() * 9000)}`;
    } else if (role === 'COMMAND_CENTER') {
      department = 'Integrated Command & Control Center';
      badgeNumber = `ICCC-${Math.floor(10 + Math.random() * 90)}`;
    }

    const result = await dbRun(
      'INSERT INTO users (name, email, password_hash, role, badge_number, department) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), email, passwordHash, role, badgeNumber, department]
    );

    const newUserId = result.insertId || 1;
    const newUser = await dbGet<any>('SELECT * FROM users WHERE id = ?', [newUserId]);

    const sanitized = sanitizeUser(newUser);

    // Sign JWT
    const token = generateToken({
      id: sanitized.id,
      name: sanitized.name,
      email: sanitized.email,
      role: sanitized.role,
    });

    // Log registration
    await dbRun('INSERT INTO system_logs (user_id, action, details, severity) VALUES (?, ?, ?, ?)', [
      sanitized.id,
      'USER_REGISTERED',
      `New user registered with role: ${sanitized.role}`,
      'INFO',
    ]);

    return res.status(201).json({
      success: true,
      message: `Account registered successfully for role: ${sanitized.role}.`,
      token,
      user: sanitized,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/register:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Internal server error during registration.',
    });
  }
});

/**
 * POST /api/auth/login
 * Verifies credentials, returns a JWT containing the user's ID and Role
 * Supports signing into specific roles or selecting between multiple accounts
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    let { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required.',
      });
    }

    email = email.trim().toLowerCase();

    // If role is specified, query directly for that role
    let user: any = null;
    if (role) {
      if (role === 'MUNICIPAL_CORPORATION') role = 'MUNICIPAL_CORP';
      user = await dbGet<any>('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);
    } else {
      // Find all accounts matching this email
      const matchingAccounts = await dbQuery<any>('SELECT * FROM users WHERE email = ?', [email]);
      if (matchingAccounts.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'No account found with this email. Please check your credentials or register.',
        });
      }

      if (matchingAccounts.length === 1) {
        user = matchingAccounts[0];
      } else {
        // Multiple role accounts exist for this email
        // Check which ones match password
        const passwordMatches: any[] = [];
        for (const acc of matchingAccounts) {
          const valid = await bcrypt.compare(password, acc.password_hash);
          if (valid) passwordMatches.push(acc);
        }

        if (passwordMatches.length === 0) {
          return res.status(401).json({
            success: false,
            error: 'INVALID_CREDENTIALS',
            message: 'Invalid password for this account.',
          });
        }

        if (passwordMatches.length === 1) {
          user = passwordMatches[0];
        } else {
          // Multiple accounts with same password, return available roles for selection
          return res.status(200).json({
            success: false,
            requiresRoleSelection: true,
            message: 'Multiple role accounts found for this email. Please select which role to sign in as.',
            availableRoles: passwordMatches.map((a) => a.role),
          });
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: role
          ? `No ${role} account found for this email address.`
          : 'Invalid email or password. Please verify your credentials.',
      });
    }

    // Check password using bcryptjs
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid password. Please verify your credentials.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'ACCOUNT_DEACTIVATED',
        message: 'This account has been deactivated. Please contact platform support.',
      });
    }

    // Normalize role string if needed
    let userRole = user.role;
    if (userRole === 'MUNICIPAL_CORPORATION') {
      userRole = 'MUNICIPAL_CORP';
    }

    const sanitized = sanitizeUser({ ...user, role: userRole });

    // Generate JWT token containing ID and Role
    const token = generateToken({
      id: sanitized.id,
      name: sanitized.name,
      email: sanitized.email,
      role: sanitized.role,
    });

    // Log login
    await dbRun('INSERT INTO system_logs (user_id, action, details, severity) VALUES (?, ?, ?, ?)', [
      sanitized.id,
      'USER_LOGIN',
      `Successful login by ${sanitized.name} (${sanitized.role})`,
      'INFO',
    ]);

    return res.json({
      success: true,
      message: `Signed in as ${sanitized.role}.`,
      token,
      user: sanitized,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: error.message || 'Internal server error during login.',
    });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user and role details from JWT
 */
authRouter.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    const user = await dbGet<any>('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User record not found.',
      });
    }

    return res.json({
      success: true,
      authenticated: true,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve profile.',
    });
  }
});

/**
 * GET /api/auth/demo-accounts
 * Helper endpoint returning list of quick-test accounts
 */
authRouter.get('/demo-accounts', async (req: Request, res: Response) => {
  try {
    const users = await dbQuery<any>('SELECT id, name, email, role, badge_number, department FROM users');
    return res.json({
      success: true,
      accounts: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        badge: u.badge_number,
        department: u.department,
      })),
    });
  } catch (err: any) {
    return res.json({ success: false, accounts: [] });
  }
});
