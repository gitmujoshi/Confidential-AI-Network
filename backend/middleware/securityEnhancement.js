/**
 * Security Enhancement Middleware
 * 
 * This middleware provides enhanced security features that extend the existing
 * authentication system without modifying core auth logic.
 * 
 * Features:
 * - Session management integration
 * - Threat detection monitoring
 * - Data encryption for sensitive fields
 * - Security headers
 * - Audit logging
 */

const sessionManagementService = require('../services/sessionManagementService');
const threatDetectionService = require('../services/threatDetectionService');
const dataEncryptionService = require('../services/dataEncryptionService');
const logger = require('../utils/logger');

/**
 * Enhanced security middleware that runs AFTER authentication
 * This ensures it doesn't interfere with existing auth logic
 */
const enhanceSecurity = async (req, res, next) => {
  try {
    // Add security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    });

    // Monitor for threats (non-blocking)
    threatDetectionService.monitorAuthAttempt(req, res, () => {
      // Continue processing even if threat detection fails
    });

    // Enhanced session management (if user is authenticated)
    if (req.user && req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      
      // Validate session with enhanced tracking
      const sessionValidation = await sessionManagementService.validateSession(token);
      
      if (!sessionValidation.valid) {
        logger.warn('Session validation failed:', sessionValidation.reason);
        // Don't block the request, just log the issue
      }
    }

    next();
  } catch (error) {
    logger.error('Security enhancement middleware error:', error);
    // Continue processing even if security enhancement fails
    next();
  }
};

/**
 * Session management middleware
 * Creates and manages sessions for authenticated users
 */
const manageSession = async (req, res, next) => {
  try {
    if (req.user && req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      
      // Create or update session
      const sessionData = {
        id: req.user.id,
        email: req.user.email,
        partyType: req.user.partyType,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      await sessionManagementService.createSession(sessionData, token);
    }

    next();
  } catch (error) {
    logger.error('Session management middleware error:', error);
    // Continue processing even if session management fails
    next();
  }
};

/**
 * Threat detection middleware for user actions
 * Monitors user behavior for anomalies
 */
const monitorUserBehavior = async (req, res, next) => {
  try {
    if (req.user) {
      const action = `${req.method} ${req.path}`;
      const context = {
        resource: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      // Monitor user behavior (non-blocking)
      threatDetectionService.monitorUserBehavior(req.user, action, context);
    }

    next();
  } catch (error) {
    logger.error('User behavior monitoring error:', error);
    // Continue processing even if monitoring fails
    next();
  }
};

/**
 * Data encryption middleware for sensitive fields
 * @param {Array} fields - Array of field names to encrypt
 */
const encryptSensitiveData = (fields) => {
  return dataEncryptionService.encryptSensitiveFields(fields);
};

/**
 * Data decryption middleware for sensitive fields
 * @param {Array} fields - Array of field names to decrypt
 */
const decryptSensitiveData = (fields) => {
  return dataEncryptionService.decryptSensitiveFields(fields);
};

/**
 * Security audit logging middleware
 * Logs security-relevant events
 */
const securityAuditLog = (eventType) => {
  return async (req, res, next) => {
    try {
      const auditData = {
        eventType: eventType,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        path: req.path,
        userId: req.user?.id,
        userEmail: req.user?.email,
        partyType: req.user?.partyType
      };

      // Log to database if audit logging is enabled
      if (process.env.AUDIT_LOGGING_ENABLED === 'true') {
        const db = require('../models');
        await db.AuditLog.create({
          eventType: eventType,
          eventData: JSON.stringify(auditData),
          userId: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date()
        });
      }

      logger.info('Security Audit:', JSON.stringify(auditData, null, 2));
      next();
    } catch (error) {
      logger.error('Security audit logging error:', error);
      next();
    }
  };
};

/**
 * Rate limiting enhancement middleware
 * Provides enhanced rate limiting with threat detection
 */
const enhancedRateLimit = (options = {}) => {
  return async (req, res, next) => {
    try {
      const clientIP = req.ip;
      const now = Date.now();
      const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
      const maxRequests = options.max || 100;

      // Use existing rate limiting logic
      if (!req.app.locals.enhancedRateLimit) {
        req.app.locals.enhancedRateLimit = new Map();
      }

      const rateLimitMap = req.app.locals.enhancedRateLimit;
      const clientData = rateLimitMap.get(clientIP) || { 
        count: 0, 
        resetTime: now + windowMs,
        requests: []
      };

      // Clean old requests
      clientData.requests = clientData.requests.filter(time => now - time < windowMs);

      if (now > clientData.resetTime) {
        clientData.count = 0;
        clientData.resetTime = now + windowMs;
        clientData.requests = [];
      }

      clientData.count++;
      clientData.requests.push(now);
      rateLimitMap.set(clientIP, clientData);

      if (clientData.count > maxRequests) {
        // Log rate limit violation as potential threat
        await threatDetectionService.logThreat({
          type: 'RATE_LIMIT_VIOLATION',
          severity: 'MEDIUM',
          ip: clientIP,
          endpoint: req.path,
          requestCount: clientData.count,
          windowMs: windowMs,
          timestamp: new Date().toISOString()
        });

        return res.status(429).json({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
      }

      next();
    } catch (error) {
      logger.error('Enhanced rate limiting error:', error);
      next();
    }
  };
};

/**
 * Security health check middleware
 * Provides security status information
 */
const securityHealthCheck = async (req, res, next) => {
  try {
    if (req.path === '/api/security/health') {
      const sessionStats = await sessionManagementService.getSessionStats();
      const threatStats = threatDetectionService.getThreatStats();
      const encryptionStats = await dataEncryptionService.getEncryptionStats();

      return res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          sessionManagement: {
            status: sessionStats.redisConnected ? 'connected' : 'fallback',
            activeSessions: sessionStats.activeSessions,
            blacklistedTokens: sessionStats.blacklistedTokens
          },
          threatDetection: {
            status: 'active',
            activePatterns: threatStats.activePatterns,
            trackedIPs: threatStats.trackedIPs,
            trackedUsers: threatStats.trackedUsers
          },
          dataEncryption: {
            status: 'active',
            algorithm: encryptionStats.algorithm,
            keyLength: encryptionStats.keyLength
          }
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Security health check error:', error);
    next();
  }
};

/**
 * Security cleanup middleware
 * Performs periodic security maintenance
 */
const securityCleanup = async (req, res, next) => {
  try {
    // Run cleanup tasks periodically (every 1000 requests)
    const requestCount = req.app.locals.requestCount || 0;
    req.app.locals.requestCount = requestCount + 1;

    if (requestCount % 1000 === 0) {
      // Clean up expired sessions
      await sessionManagementService.cleanupExpiredSessions();
      
      // Clean up old threat detection data
      threatDetectionService.cleanupOldActivity();
      threatDetectionService.cleanupThreatPatterns();
      
      logger.info('Security cleanup completed');
    }

    next();
  } catch (error) {
    logger.error('Security cleanup error:', error);
    next();
  }
};

module.exports = {
  enhanceSecurity,
  manageSession,
  monitorUserBehavior,
  encryptSensitiveData,
  decryptSensitiveData,
  securityAuditLog,
  enhancedRateLimit,
  securityHealthCheck,
  securityCleanup
}; 