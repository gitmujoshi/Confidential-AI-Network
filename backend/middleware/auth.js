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
 */

const logger = require('../utils/logger');
const { normalizePartyType } = require('../utils/partyTypes');

/**
 * - Error handling
 */

const KeycloakService = require('../services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service');
const ***REMOVED-KEYCLOAK_DB_PASSWORD***Service = new KeycloakService();
const db = require('../models');
const axios = require('axios');
const tokenBlacklist = require('../tokenBlacklist');

/**
 * Validate JWT token and extract user information
 */
const authenticateToken = async (req, res, next) => {
  try {
    logger.info(`🔐 Authentication middleware hit for ${req.method} ${req.path}`);
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

    // Try Keycloak validation first if enabled and available
    console.log('🔍 [auth.js] KEYCLOAK_ENABLED:', process.env.KEYCLOAK_ENABLED, 'Type:', typeof process.env.KEYCLOAK_ENABLED);
    if (process.env.KEYCLOAK_ENABLED === 'true') {
      console.log('🔍 [auth.js] Starting Keycloak validation...');
      try {
        console.log('🔍 [auth.js] Calling ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.validateToken...');
        const validationResult = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.validateToken(token);
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
          const userInfo = validationResult.user || validationResult.payload || {};
          const ***REMOVED-KEYCLOAK_DB_PASSWORD***Username = userInfo.username || userInfo.email || userInfo.preferred_username;
          
          if (!***REMOVED-KEYCLOAK_DB_PASSWORD***Username) {
            return res.status(404).json({ 
              error: 'User not found in local database',
              code: 'USER_NOT_FOUND',
              details: 'No Keycloak username or email available for user lookup'
            });
          }
          
          // Find user by multiple possible identifiers
          let user = null;
          
          console.log('🔍 [auth.js] Looking for user with:', {
            ***REMOVED-KEYCLOAK_DB_PASSWORD***Username,
            userInfoEmail: userInfo.email,
            userInfoSub: userInfo.sub
          });
          
          // Try to find user by iamUsername first
          if (***REMOVED-KEYCLOAK_DB_PASSWORD***Username) {
            console.log('🔍 [auth.js] Trying to find user by iamUsername:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Username);
            user = await db.User.findOne({ 
              where: { 
                iamUsername: ***REMOVED-KEYCLOAK_DB_PASSWORD***Username,
                isActive: true 
              } 
            });
            console.log('🔍 [auth.js] User found by iamUsername:', user ? 'YES' : 'NO');
          }
          
          // If not found by iamUsername, try by email
          if (!user && userInfo.email) {
            console.log('🔍 [auth.js] Trying to find user by email:', userInfo.email);
            user = await db.User.findOne({ 
              where: { 
                email: userInfo.email,
                isActive: true 
              } 
            });
            console.log('🔍 [auth.js] User found by email:', user ? 'YES' : 'NO');
          }
          
          // If still not found, try by iamUserId (Keycloak user ID)
          if (!user && userInfo.sub) {
            console.log('🔍 [auth.js] Trying to find user by iamUserId:', userInfo.sub);
            user = await db.User.findOne({ 
              where: { 
                iamUserId: userInfo.sub,
                isActive: true 
              } 
            });
            console.log('🔍 [auth.js] User found by iamUserId:', user ? 'YES' : 'NO');
          }

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
          const normalizedPartyType = normalizePartyType(user.partyType);
          req.user = {
            ...userInfo,
            id: userInfo.dbUserId || user.id,
            partyType: normalizedPartyType,
            localUser: {
              id: user.id,
              name: user.name,
              email: user.email,
              partyType: normalizedPartyType,
              walletAddress: user.walletAddress,
              did: user.did,
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
            authType: '***REMOVED-KEYCLOAK_DB_PASSWORD***'
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
      } catch (***REMOVED-KEYCLOAK_DB_PASSWORD***Error) {
        console.error('❌ Keycloak validation failed:', ***REMOVED-KEYCLOAK_DB_PASSWORD***Error);
        return res.status(401).json({ 
          error: 'Invalid or expired token',
          code: 'TOKEN_INVALID',
          details: 'Keycloak token validation failed'
        });
      }
    }

    // If Keycloak is not enabled, use JWT validation for development
    console.log('🔐 Keycloak disabled, using JWT validation for development');
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
      
      // Find user in database
      const user = await db.User.findOne({
        where: { 
          id: decoded.userId,
          isActive: true 
        }
      });
      
      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          details: 'User not found in database'
        });
      }
      
      // Set user context for the request (mirror Keycloak shape so routes can use req.user.localUser)
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        partyType: normalizePartyType(user.partyType),
        organization: user.organization,
        walletAddress: user.walletAddress,
        publicKey: user.publicKey,
        did: user.did,
        depaId: user.depaId,
        location: user.location,
        isRegistered: user.isRegistered,
        onboardingStatus: user.onboardingStatus,
        profileCompleted: user.profileCompleted,
        emailVerified: user.emailVerified,
        token: token,
        authType: 'jwt',
        localUser: {
          id: user.id,
          name: user.name,
          email: user.email,
          partyType: normalizePartyType(user.partyType),
          walletAddress: user.walletAddress,
          did: user.did,
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
          depaId: user.depaId,
        },
      };
      
      console.log('🔑 [auth.js] req.user after JWT validation:', req.user);
      return next();
      
    } catch (jwtError) {
      console.error('❌ JWT validation failed:', jwtError);
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
        details: 'JWT token validation failed'
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
    const userPartyType = normalizePartyType(req.user.partyType);
    logger.info(`🔐 Role check - Required: ${JSON.stringify(roles)}, User roles: ${JSON.stringify(userRoles)}, Party type: ${userPartyType}`);
    const expandedRoles = Array.isArray(roles) ? roles : [roles];
    const legacyRoles = expandedRoles.flatMap((role) =>
      role === 'TSP' ? ['TSP', 'CCRP'] : [role]
    );
    
    const hasRole = legacyRoles.some(
      (role) => userRoles.includes(role) || userPartyType === normalizePartyType(role)
    );

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
 * Require TSP role
 */
const requireTSP = requireRole('TSP');

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
  requireTSP,
  requireAdmin,
  requireAppAdmin,
  requireAnyAdmin,
  optionalAuth,
  requireOnboardingComplete,
  requireEmailVerified,
  authRateLimit,
  logAuthEvent
}; 