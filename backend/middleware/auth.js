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

const KeycloakService = require('../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');
const ***REMOVED-KEYCLOAK_DB_PASSWORD***Service = new KeycloakService();
const db = require('../models');
const axios = require('axios');

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

    // Try Keycloak validation first
    if (process.env.KEYCLOAK_ENABLED === 'true') {
      try {
        const validationResult = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.validateToken(token);
        
        if (validationResult.valid) {
          // Keycloak token is valid
          // Build where clause based on available user data
          const whereClause = { isActive: true };
          
          if (validationResult.user.walletAddress) {
            whereClause.walletAddress = validationResult.user.walletAddress;
          } else if (validationResult.user.email) {
            whereClause.email = validationResult.user.email;
          } else {
            // No wallet address or email available, can't find user
            return res.status(404).json({ 
              error: 'User not found in local database',
              code: 'USER_NOT_FOUND',
              details: 'No wallet address or email available for user lookup'
            });
          }
          
          const user = await db.User.findOne({ where: whereClause });

          if (!user) {
            return res.status(404).json({ 
              error: 'User not found in local database',
              code: 'USER_NOT_FOUND',
              details: 'User exists in Keycloak but not in local database'
            });
          }

          // Update last login timestamp
          await user.update({ lastLoginAt: new Date() });

          // Attach user information to request
          req.user = {
            ...validationResult.user,
            id: validationResult.user.dbUserId || user.id, // Use dbUserId if available, fallback to local user id
            partyType: user.partyType,
            localUser: {
              id: user.id,
              partyType: user.partyType,
              email: user.email,
              // add any other fields needed for downstream checks
            },
            token: token,
            authType: '***REMOVED-KEYCLOAK_DB_PASSWORD***'
          };

          // Debug logging
          console.log('🔑 [auth.js] req.user after Keycloak validation:', req.user);

          return next();
        }
      } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
        console.error('❌ Keycloak validation failed, trying database token:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Error);
        // Continue to database token validation
      }
    }

    // Database JWT token validation fallback
    try {
      const jwt = require('jsonwebtoken');
      
      // Check if this is a Keycloak token (they have a specific structure)
      if (token.includes('.') && token.split('.').length === 3) {
        // This looks like a JWT token, but let's check if it's a Keycloak token
        try {
          // Try to decode the token without verification to check its structure
          const decoded = jwt.decode(token);
          if (decoded && decoded.iss && (decoded.iss.includes('***REMOVED-KEYCLOAK_DB_PASSWORD***') || decoded.iss.includes('localhost:3000'))) {
            // This is a Keycloak token, but Keycloak validation already failed above
            // So this token is invalid or expired
            return res.status(401).json({ 
              error: 'Invalid or expired token',
              code: 'TOKEN_INVALID',
              details: 'Keycloak token validation failed'
            });
          }
        } catch (decodeError) {
          // Not a valid JWT, continue to database validation
        }
      }
      
      // Try database JWT validation with proper algorithm
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', {
        algorithms: ['HS256']
      });
      
      if (decoded.authType !== 'database') {
        return res.status(401).json({ 
          error: 'Invalid token type',
          code: 'TOKEN_INVALID',
          details: 'Token is not a database authentication token'
        });
      }

      // Get user from database
      const user = await db.User.findOne({
        where: { 
          id: decoded.userId,
          email: decoded.email,
          isActive: true 
        }
      });

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          details: 'User does not exist or is inactive'
        });
      }

      // Update last login timestamp
      await user.update({ lastLoginAt: new Date() });

      // Attach user information to request
      req.user = {
        userId: user.id,
        email: user.email,
        partyType: user.partyType,
        localUser: user,
        token: token,
        authType: 'database'
      };

      return next();

    } catch (jwtError) {
      console.error('❌ Database token validation failed:', jwtError);
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

    // Only validate with Keycloak if enabled
    if (process.env.KEYCLOAK_ENABLED !== 'true') {
      req.user = null;
      return next();
    }

    // Validate token with Keycloak
    try {
      const validationResult = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.validateToken(token);
      
      if (!validationResult.valid) {
        // Invalid token, continue without authentication
        req.user = null;
        return next();
      }

      // Get user from local database
      // Build where clause based on available user data
      const whereClause = { isActive: true };
      
      if (validationResult.user.walletAddress) {
        whereClause.walletAddress = validationResult.user.walletAddress;
      } else if (validationResult.user.email) {
        whereClause.email = validationResult.user.email;
      } else {
        // No wallet address or email available, skip user lookup
        req.user = null;
        return next();
      }
      
      const user = await db.User.findOne({ where: whereClause });

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
    } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
      console.error('❌ Keycloak validation failed in optional auth:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Error);
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