/**
 * Authentication Middleware
 * 
 * This middleware handles authentication and authorization using Keycloak IAM.
 * It validates JWT tokens and provides role-based access control.
 * 
 * Features:
 * - JWT token validation
 * - Role-based access control
 * - User context injection
 * - Error handling
 */

const KeycloakService = require('../services/keycloakService');
const keycloakService = new KeycloakService();
const db = require('../models');

/**
 * Validate JWT token and extract user information
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Try to validate token with Keycloak first
    try {
      const validationResult = await keycloakService.validateToken(token);
      
      if (validationResult.valid) {
        // Keycloak token is valid
        const user = await db.User.findOne({
          where: { 
            walletAddress: validationResult.user.walletAddress,
            isActive: true 
          }
        });

        if (!user) {
          return res.status(404).json({ 
            error: 'User not found in local database',
            code: 'USER_NOT_FOUND'
          });
        }

        // Update last login timestamp
        await user.update({ lastLoginAt: new Date() });

        // Attach user information to request
        req.user = {
          ...validationResult.user,
          localUser: user,
          token: token
        };

        return next();
      }
    } catch (keycloakError) {
      console.log('⚠️ Keycloak token validation failed, trying local JWT validation');
    }

    // Fallback: Try to validate as local JWT token
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Get user from local database using email
      const user = await db.User.findOne({
        where: { 
          email: decoded.email,
          isActive: true 
        }
      });

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found in local database',
          code: 'USER_NOT_FOUND'
        });
      }

      // Update last login timestamp
      await user.update({ lastLoginAt: new Date() });

      // Attach user information to request
      req.user = {
        userId: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        partyType: user.partyType,
        roles: [user.partyType], // Map partyType to roles
        localUser: user,
        token: token
      };

      return next();
    } catch (jwtError) {
      console.error('❌ Local JWT validation failed:', jwtError.message);
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
        details: 'Token validation failed'
      });
    }

  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Require specific role(s)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = req.user.roles || [];
    const userPartyType = req.user.partyType;
    
    // Check if user has any of the required roles
    const hasRole = Array.isArray(roles) 
      ? roles.some(role => userRoles.includes(role) || userPartyType === role)
      : userRoles.includes(roles) || userPartyType === roles;

    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: userRoles
      });
    }

    next();
  };
};

/**
 * Require TDP role
 */
const requireTDP = requireRole('TDP');

/**
 * Require TDC role
 */
const requireTDC = requireRole('TDC');

/**
 * Require CCRP role
 */
const requireCCRP = requireRole('CCRP');

/**
 * Require admin role
 */
const requireAdmin = requireRole('ADMIN');

/**
 * Require AppAdmin role
 */
const requireAppAdmin = requireRole('AppAdmin');

/**
 * Require any admin role (ADMIN or AppAdmin)
 */
const requireAnyAdmin = requireRole(['ADMIN', 'AppAdmin']);

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    // Validate token if provided
    const validationResult = await keycloakService.validateToken(token);
    
    if (!validationResult.valid) {
      // Invalid token, continue without authentication
      req.user = null;
      return next();
    }

    // Get user from local database
    const user = await db.User.findOne({
      where: { 
        walletAddress: validationResult.user.walletAddress,
        isActive: true 
      }
    });

    if (user) {
      // Update last login timestamp
      await user.update({ lastLoginAt: new Date() });
      
      req.user = {
        ...validationResult.user,
        localUser: user,
        token: token
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('❌ Optional authentication error:', error);
    // Continue without authentication on error
    req.user = null;
    next();
  }
};

/**
 * Require completed onboarding
 */
const requireOnboardingComplete = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const localUser = req.user.localUser;
    
    if (!localUser) {
      return res.status(404).json({ 
        error: 'User not found in local database',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check onboarding status
    if (localUser.onboardingStatus !== 'COMPLETED' && localUser.onboardingStatus !== 'VERIFIED') {
      return res.status(403).json({ 
        error: 'Onboarding not completed',
        code: 'ONBOARDING_INCOMPLETE',
        status: localUser.onboardingStatus,
        required: ['COMPLETED', 'VERIFIED']
      });
    }

    // Check profile completion
    if (!localUser.profileCompleted) {
      return res.status(403).json({ 
        error: 'Profile not completed',
        code: 'PROFILE_INCOMPLETE'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Onboarding check error:', error);
    return res.status(500).json({ 
      error: 'Onboarding validation error',
      code: 'ONBOARDING_VALIDATION_ERROR'
    });
  }
};

/**
 * Require email verification
 */
const requireEmailVerified = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const localUser = req.user.localUser;
    
    if (!localUser) {
      return res.status(404).json({ 
        error: 'User not found in local database',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check email verification
    if (!localUser.emailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Email verification check error:', error);
    return res.status(500).json({ 
      error: 'Email verification validation error',
      code: 'EMAIL_VALIDATION_ERROR'
    });
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = (req, res, next) => {
  // Simple rate limiting for auth endpoints
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Store rate limit data in memory (in production, use Redis)
  if (!req.app.locals.authRateLimit) {
    req.app.locals.authRateLimit = new Map();
  }
  
  const rateLimitMap = req.app.locals.authRateLimit;
  const clientData = rateLimitMap.get(clientIP) || { count: 0, resetTime: now + 60000 };
  
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + 60000; // 1 minute window
  }
  
  clientData.count++;
  rateLimitMap.set(clientIP, clientData);
  
  if (clientData.count > 10) { // 10 requests per minute
    return res.status(429).json({ 
      error: 'Too many authentication requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  next();
};

/**
 * Log authentication events
 */
const logAuthEvent = (event) => {
  return (req, res, next) => {
    const logData = {
      timestamp: new Date().toISOString(),
      event: event,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path
    };

    if (req.user) {
      logData.userId = req.user.id;
      logData.walletAddress = req.user.walletAddress;
      logData.partyType = req.user.partyType;
    }

    console.log('🔐 Auth Event:', JSON.stringify(logData, null, 2));
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireTDP,
  requireTDC,
  requireCCRP,
  requireAdmin,
  requireAppAdmin,
  requireAnyAdmin,
  optionalAuth,
  requireOnboardingComplete,
  requireEmailVerified,
  authRateLimit,
  logAuthEvent
}; 