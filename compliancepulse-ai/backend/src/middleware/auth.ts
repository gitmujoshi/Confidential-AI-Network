import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/User';
import { logger } from '../config/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as {
        id: string;
        email: string;
        role: string;
      };

      // Attach user to request
      req.user = decoded;

      next();
    } catch (error) {
      logger.warn('Invalid JWT token', { error });
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization middleware factory
 * Checks if user has required role
 */
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Attaches user if token is present but doesn't fail if missing
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, config.auth.jwtSecret) as {
          id: string;
          email: string;
          role: string;
        };

        req.user = decoded;
      } catch (error) {
        // Token invalid, but that's okay for optional auth
        logger.debug('Optional auth: invalid token', { error });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
