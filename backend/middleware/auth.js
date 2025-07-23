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
const axios = require('axios');
const tokenBlacklist = require('../tokenBlacklist');

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

    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      return res.status(401).json({ 
        error: 'Token has been invalidated',
        code: 'TOKEN_BLACKLISTED'
      });
    }

    // Try Keycloak validation first
    console.log('🔍 [auth.js] KEYCLOAK_ENABLED:', process.env.KEYCLOAK_ENABLED, 'Type:', typeof process.env.KEYCLOAK_ENABLED);
    if (process.env.KEYCLOAK_ENABLED === 'true') {
      console.log('🔍 [auth.js] Starting Keycloak validation...');
      try {
        console.log('🔍 [auth.js] Calling keycloakService.validateToken...');
        const validationResult = await keycloakService.validateToken(token);
        console.log('🔍 [auth.js] Validation result:', validationResult);
        
        if (validationResult.valid) {
          // 🔒 FROZEN AUTHENTICATION LOGIC - DO NOT MODIFY
          // This authentication logic is frozen and should not be changed
          // unless explicitly requested by the user.
          // 
          // Current implementation: Keycloak username ↔ Database iamUsername matching only
          // Excluded: walletAddress, email, and other attributes
          // 
          // To modify this logic, you must:
          // 1. Get explicit permission from the user
          // 2. Document the change with clear reasoning
          // 3. Test thoroughly before deployment
          
          // Use only Keycloak username to match with database iamUsername
          // Fallback to email if username is not available
          const keycloakUsername = validationResult.user.username || validationResult.user.email;
          
          if (!keycloakUsername) {
            return res.status(404).json({ 
              error: 'User not found in local database',
              code: 'USER_NOT_FOUND',
              details: 'No Keycloak username or email available for user lookup'
            });
          }
          
          // Find user by iamUsername (which should match Keycloak username)
          const user = await db.User.findOne({ 
            where: { 
              iamUsername: keycloakUsername,
              isActive: true 
            } 
          });

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
              name: user.name,
              email: user.email,
              partyType: user.partyType,
              walletAddress: user.walletAddress,
              publicKey: user.publicKey,
              description: user.description,
              organization: user.organization,
              phoneNumber: user.phoneNumber,
              website: user.website,
              location: user.location,
              isRegistered: user.isRegistered,
              onboardingStatus: user.onboardingStatus,
              profileCompleted: user.profileCompleted,
              emailVerified: user.emailVerified,
              depaId: user.depaId
            },
            token: token,
            authType: 'keycloak'
          };

          // Debug logging
          console.log('🔑 [auth.js] req.user after Keycloak validation:', req.user);

          return next();
        } else {
          // Token is invalid (expired, malformed, etc.)
          console.log('❌ [auth.js] Token validation failed:', validationResult.error);
          return res.status(401).json({ 
            error: 'Invalid or expired token',
            code: 'TOKEN_INVALID',
            details: validationResult.error
          });
        }
      } catch (keycloakError) {
        console.error('❌ Keycloak validation failed:', keycloakError);
        return res.status(401).json({ 
          error: 'Invalid or expired token',
          code: 'TOKEN_INVALID',
          details: 'Keycloak token validation failed'
        });
      }
    }

    // If Keycloak is not enabled, return error
    return res.status(500).json({
      error: 'Keycloak authentication is required but not enabled',
      code: 'KEYCLOAK_NOT_ENABLED'
    });

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
      const validationResult = await keycloakService.validateToken(token);
      
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

      // If user not found by email, try by iamUsername (which should be the Keycloak username)
      if (!user && validationResult.user.username) {
        const userByUsername = await db.User.findOne({ 
          where: { 
            iamUsername: validationResult.user.username,
            isActive: true 
          } 
        });
        if (userByUsername) {
          // Update last login timestamp
          await userByUsername.update({ lastLoginAt: new Date() });
          
          req.user = {
            ...validationResult.user,
            localUser: userByUsername,
            token: token
          };
        } else {
          req.user = null;
        }
      } else if (user) {
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
    } catch (keycloakError) {
      console.error('❌ Keycloak validation failed in optional auth:', keycloakError);
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