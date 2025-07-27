/**
 * Session Management Service
 * 
 * This service provides enhanced session management capabilities that extend
 * the existing authentication system without modifying core auth logic.
 * 
 * Features:
 * - Redis-based session storage
 * - Session timeout management
 * - Activity tracking
 * - Session blacklist
 * - Audit logging
 */

const redis = require('redis');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class SessionManagementService {
  constructor() {
    this.redisClient = null;
    this.sessionConfig = {
      defaultExpiration: 86400, // 24 hours
      maxInactivity: 1800, // 30 minutes
      cleanupInterval: 3600, // 1 hour
      blacklistExpiration: 86400 // 24 hours
    };
    
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    try {
      this.redisClient = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('⚠️ Redis connection refused, using in-memory fallback');
            return null; // Stop retrying
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.redisClient.on('error', (err) => {
        console.log('⚠️ Redis error, using in-memory fallback:', err.message);
        this.redisClient = null;
      });

      this.redisClient.on('connect', () => {
        console.log('✅ Redis connected for session management');
      });

      await this.redisClient.connect();
    } catch (error) {
      console.log('⚠️ Redis initialization failed, using in-memory fallback:', error.message);
      this.redisClient = null;
    }
  }

  /**
   * Create session with enhanced tracking
   * @param {Object} userData - User data from authentication
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Session creation result
   */
  async createSession(userData, token) {
    try {
      const sessionData = {
        userId: userData.id,
        email: userData.email,
        partyType: userData.partyType,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress: userData.ipAddress,
        userAgent: userData.userAgent,
        sessionId: this.generateSessionId()
      };

      // Store session in Redis if available, otherwise use memory
      if (this.redisClient) {
        await this.redisClient.setex(
          `session:${token}`,
          this.sessionConfig.defaultExpiration,
          JSON.stringify(sessionData)
        );
      }

      // Log session creation
      await this.logSessionEvent('SESSION_CREATED', {
        userId: userData.id,
        email: userData.email,
        sessionId: sessionData.sessionId,
        ipAddress: userData.ipAddress
      });

      return {
        success: true,
        sessionId: sessionData.sessionId,
        expiresIn: this.sessionConfig.defaultExpiration
      };

    } catch (error) {
      logger.error('Session creation error:', error);
      return {
        success: false,
        error: 'Session creation failed'
      };
    }
  }

  /**
   * Validate and update session
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Validation result
   */
  async validateSession(token) {
    try {
      // Check if token is blacklisted
      if (await this.isTokenBlacklisted(token)) {
        return {
          valid: false,
          reason: 'Token blacklisted'
        };
      }

      // Get session data from Redis
      if (this.redisClient) {
        const sessionData = await this.redisClient.get(`session:${token}`);
        
        if (!sessionData) {
          return {
            valid: false,
            reason: 'Session not found'
          };
        }

        const session = JSON.parse(sessionData);
        const now = new Date();
        const lastActivity = new Date(session.lastActivity);

        // Check for inactivity timeout
        if (now - lastActivity > this.sessionConfig.maxInactivity * 1000) {
          await this.revokeSession(token);
          return {
            valid: false,
            reason: 'Session expired due to inactivity'
          };
        }

        // Update last activity
        session.lastActivity = now.toISOString();
        await this.redisClient.setex(
          `session:${token}`,
          this.sessionConfig.defaultExpiration,
          JSON.stringify(session)
        );

        return {
          valid: true,
          session: session
        };
      }

      // Fallback: session is valid if Redis is not available
      return {
        valid: true,
        session: null
      };

    } catch (error) {
      logger.error('Session validation error:', error);
      return {
        valid: false,
        reason: 'Session validation failed'
      };
    }
  }

  /**
   * Revoke session
   * @param {string} token - JWT token
   * @returns {Promise<boolean>} Success status
   */
  async revokeSession(token) {
    try {
      // Remove from active sessions
      if (this.redisClient) {
        await this.redisClient.del(`session:${token}`);
      }

      // Add to blacklist
      await this.blacklistToken(token);

      // Log session revocation
      await this.logSessionEvent('SESSION_REVOKED', {
        token: token.substring(0, 10) + '...', // Log partial token for security
        reason: 'Manual revocation'
      });

      return true;

    } catch (error) {
      logger.error('Session revocation error:', error);
      return false;
    }
  }

  /**
   * Check if token is blacklisted
   * @param {string} token - JWT token
   * @returns {Promise<boolean>} Blacklist status
   */
  async isTokenBlacklisted(token) {
    try {
      if (this.redisClient) {
        const blacklisted = await this.redisClient.get(`blacklist:${token}`);
        return blacklisted === 'revoked';
      }
      return false;
    } catch (error) {
      logger.error('Blacklist check error:', error);
      return false;
    }
  }

  /**
   * Add token to blacklist
   * @param {string} token - JWT token
   * @returns {Promise<boolean>} Success status
   */
  async blacklistToken(token) {
    try {
      if (this.redisClient) {
        await this.redisClient.setex(
          `blacklist:${token}`,
          this.sessionConfig.blacklistExpiration,
          'revoked'
        );
      }
      return true;
    } catch (error) {
      logger.error('Token blacklist error:', error);
      return false;
    }
  }

  /**
   * Get active sessions for user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Active sessions
   */
  async getUserSessions(userId) {
    try {
      if (!this.redisClient) {
        return [];
      }

      const sessions = [];
      const keys = await this.redisClient.keys('session:*');
      
      for (const key of keys) {
        const sessionData = await this.redisClient.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.userId === userId) {
            sessions.push({
              sessionId: session.sessionId,
              createdAt: session.createdAt,
              lastActivity: session.lastActivity,
              ipAddress: session.ipAddress,
              userAgent: session.userAgent
            });
          }
        }
      }

      return sessions;

    } catch (error) {
      logger.error('Get user sessions error:', error);
      return [];
    }
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} Number of sessions cleaned up
   */
  async cleanupExpiredSessions() {
    try {
      if (!this.redisClient) {
        return 0;
      }

      let cleanedCount = 0;
      const keys = await this.redisClient.keys('session:*');
      const now = new Date();

      for (const key of keys) {
        const sessionData = await this.redisClient.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const lastActivity = new Date(session.lastActivity);

          if (now - lastActivity > this.sessionConfig.maxInactivity * 1000) {
            await this.redisClient.del(key);
            cleanedCount++;
          }
        }
      }

      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      return cleanedCount;

    } catch (error) {
      logger.error('Session cleanup error:', error);
      return 0;
    }
  }

  /**
   * Generate unique session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log session events for audit
   * @param {string} event - Event type
   * @param {Object} data - Event data
   * @returns {Promise<void>}
   */
  async logSessionEvent(event, data) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: event,
        ...data
      };

      logger.info('Session Event:', JSON.stringify(logEntry, null, 2));

      // Store in database if audit logging is enabled
      if (process.env.AUDIT_LOGGING_ENABLED === 'true') {
        const db = require('../models');
        await db.AuditLog.create({
          eventType: event,
          eventData: JSON.stringify(logEntry),
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date()
        });
      }

    } catch (error) {
      logger.error('Session event logging error:', error);
    }
  }

  /**
   * Get session statistics
   * @returns {Promise<Object>} Session statistics
   */
  async getSessionStats() {
    try {
      if (!this.redisClient) {
        return {
          activeSessions: 0,
          blacklistedTokens: 0,
          redisConnected: false
        };
      }

      const sessionKeys = await this.redisClient.keys('session:*');
      const blacklistKeys = await this.redisClient.keys('blacklist:*');

      return {
        activeSessions: sessionKeys.length,
        blacklistedTokens: blacklistKeys.length,
        redisConnected: true
      };

    } catch (error) {
      logger.error('Session stats error:', error);
      return {
        activeSessions: 0,
        blacklistedTokens: 0,
        redisConnected: false
      };
    }
  }
}

// Create singleton instance
const sessionManagementService = new SessionManagementService();

module.exports = sessionManagementService; 