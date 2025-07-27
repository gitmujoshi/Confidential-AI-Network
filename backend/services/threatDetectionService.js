/**
 * Threat Detection Service
 * 
 * This service provides threat detection and security monitoring capabilities
 * that extend the existing authentication system without modifying core auth logic.
 * 
 * Features:
 * - Pattern recognition for suspicious activities
 * - Anomaly detection for user behavior
 * - Real-time threat monitoring
 * - Security alerting
 * - Audit logging
 */

const logger = require('../utils/logger');

class ThreatDetectionService {
  constructor() {
    this.suspiciousPatterns = [
      { pattern: /admin.*login/i, severity: 'HIGH', description: 'Admin login attempt' },
      { pattern: /password.*reset/i, severity: 'MEDIUM', description: 'Password reset activity' },
      { pattern: /api.*auth.*login.*failed/i, severity: 'MEDIUM', description: 'Failed login attempts' },
      { pattern: /wallet.*connect/i, severity: 'LOW', description: 'Wallet connection activity' }
    ];
    
    this.anomalyThresholds = {
      failedLogins: 3, // per 15 minutes
      suspiciousIPs: 10, // requests per minute
      unusualUserAgents: 5, // different UAs per IP
      rapidRequests: 50, // requests per minute per user
      unusualAccessTimes: 5 // requests outside business hours
    };
    
    this.threatPatterns = new Map();
    this.userActivity = new Map();
    this.ipActivity = new Map();
    
    // Initialize cleanup intervals
    this.startCleanupIntervals();
  }

  /**
   * Start cleanup intervals for threat detection data
   */
  startCleanupIntervals() {
    // Clean up old activity data every 15 minutes
    setInterval(() => {
      this.cleanupOldActivity();
    }, 15 * 60 * 1000);

    // Clean up threat patterns every hour
    setInterval(() => {
      this.cleanupThreatPatterns();
    }, 60 * 60 * 1000);
  }

  /**
   * Monitor authentication attempts for threats
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async monitorAuthAttempt(req, res, next) {
    try {
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      const endpoint = req.path;
      const method = req.method;
      const timestamp = new Date();

      // Check for suspicious patterns
      await this.detectSuspiciousPatterns(clientIP, userAgent, endpoint, method, timestamp);

      // Check for failed login attempts
      await this.detectFailedLoginAttempts(clientIP, timestamp);

      // Check for unusual access patterns
      await this.detectUnusualAccessPatterns(clientIP, userAgent, timestamp);

      // Check for rapid requests
      await this.detectRapidRequests(clientIP, timestamp);

      // Check for unusual access times
      await this.detectUnusualAccessTimes(clientIP, timestamp);

      next();
    } catch (error) {
      logger.error('Threat detection monitoring error:', error);
      next(); // Continue processing even if threat detection fails
    }
  }

  /**
   * Detect suspicious patterns in requests
   * @param {string} clientIP - Client IP address
   * @param {string} userAgent - User agent string
   * @param {string} endpoint - Request endpoint
   * @param {string} method - HTTP method
   * @param {Date} timestamp - Request timestamp
   */
  async detectSuspiciousPatterns(clientIP, userAgent, endpoint, method, timestamp) {
    const requestString = `${method} ${endpoint} ${userAgent}`.toLowerCase();

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.pattern.test(requestString)) {
        await this.logThreat({
          type: 'SUSPICIOUS_PATTERN',
          severity: pattern.severity,
          ip: clientIP,
          userAgent: userAgent,
          endpoint: endpoint,
          method: method,
          pattern: pattern.description,
          timestamp: timestamp.toISOString()
        });
      }
    }
  }

  /**
   * Detect failed login attempts
   * @param {string} clientIP - Client IP address
   * @param {Date} timestamp - Request timestamp
   */
  async detectFailedLoginAttempts(clientIP, timestamp) {
    const key = `failed_logins:${clientIP}`;
    const now = timestamp.getTime();
    const windowMs = 15 * 60 * 1000; // 15 minutes

    // Get existing failed attempts
    const existing = this.ipActivity.get(key) || { count: 0, firstAttempt: now };
    
    // Reset if outside window
    if (now - existing.firstAttempt > windowMs) {
      existing.count = 0;
      existing.firstAttempt = now;
    }

    existing.count++;
    this.ipActivity.set(key, existing);

    // Check threshold
    if (existing.count > this.anomalyThresholds.failedLogins) {
      await this.logThreat({
        type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'HIGH',
        ip: clientIP,
        failedAttempts: existing.count,
        windowMs: windowMs,
        timestamp: timestamp.toISOString()
      });

      // Optionally block IP (implement based on requirements)
      // await this.blockIP(clientIP, 3600); // 1 hour
    }
  }

  /**
   * Detect unusual access patterns
   * @param {string} clientIP - Client IP address
   * @param {string} userAgent - User agent string
   * @param {Date} timestamp - Request timestamp
   */
  async detectUnusualAccessPatterns(clientIP, userAgent, timestamp) {
    const key = `user_agents:${clientIP}`;
    const now = timestamp.getTime();
    const windowMs = 60 * 1000; // 1 minute

    // Track user agents per IP
    const existing = this.ipActivity.get(key) || { agents: new Set(), firstSeen: now };
    
    // Reset if outside window
    if (now - existing.firstSeen > windowMs) {
      existing.agents.clear();
      existing.firstSeen = now;
    }

    existing.agents.add(userAgent);
    this.ipActivity.set(key, existing);

    // Check for unusual number of different user agents
    if (existing.agents.size > this.anomalyThresholds.unusualUserAgents) {
      await this.logThreat({
        type: 'UNUSUAL_USER_AGENTS',
        severity: 'MEDIUM',
        ip: clientIP,
        userAgentCount: existing.agents.size,
        userAgents: Array.from(existing.agents),
        timestamp: timestamp.toISOString()
      });
    }
  }

  /**
   * Detect rapid requests from same IP
   * @param {string} clientIP - Client IP address
   * @param {Date} timestamp - Request timestamp
   */
  async detectRapidRequests(clientIP, timestamp) {
    const key = `rapid_requests:${clientIP}`;
    const now = timestamp.getTime();
    const windowMs = 60 * 1000; // 1 minute

    // Track request frequency
    const existing = this.ipActivity.get(key) || { count: 0, firstRequest: now };
    
    // Reset if outside window
    if (now - existing.firstRequest > windowMs) {
      existing.count = 0;
      existing.firstRequest = now;
    }

    existing.count++;
    this.ipActivity.set(key, existing);

    // Check threshold
    if (existing.count > this.anomalyThresholds.rapidRequests) {
      await this.logThreat({
        type: 'RAPID_REQUESTS',
        severity: 'MEDIUM',
        ip: clientIP,
        requestCount: existing.count,
        windowMs: windowMs,
        timestamp: timestamp.toISOString()
      });
    }
  }

  /**
   * Detect unusual access times
   * @param {string} clientIP - Client IP address
   * @param {Date} timestamp - Request timestamp
   */
  async detectUnusualAccessTimes(clientIP, timestamp) {
    const hour = timestamp.getHours();
    const isBusinessHours = hour >= 9 && hour <= 17;
    
    if (!isBusinessHours) {
      const key = `non_business_hours:${clientIP}`;
      const now = timestamp.getTime();
      const windowMs = 24 * 60 * 60 * 1000; // 24 hours

      // Track non-business hours activity
      const existing = this.ipActivity.get(key) || { count: 0, firstRequest: now };
      
      // Reset if outside window
      if (now - existing.firstRequest > windowMs) {
        existing.count = 0;
        existing.firstRequest = now;
      }

      existing.count++;
      this.ipActivity.set(key, existing);

      // Check threshold
      if (existing.count > this.anomalyThresholds.unusualAccessTimes) {
        await this.logThreat({
          type: 'UNUSUAL_ACCESS_TIME',
          severity: 'LOW',
          ip: clientIP,
          hour: hour,
          requestCount: existing.count,
          timestamp: timestamp.toISOString()
        });
      }
    }
  }

  /**
   * Monitor user behavior for anomalies
   * @param {Object} user - User object
   * @param {string} action - User action
   * @param {Object} context - Action context
   */
  async monitorUserBehavior(user, action, context) {
    try {
      const userId = user.id;
      const key = `user_behavior:${userId}`;
      const now = new Date();

      // Track user behavior patterns
      const existing = this.userActivity.get(key) || {
        actions: [],
        patterns: new Map(),
        lastActivity: now
      };

      // Add action to history
      existing.actions.push({
        action: action,
        context: context,
        timestamp: now.toISOString()
      });

      // Keep only last 100 actions
      if (existing.actions.length > 100) {
        existing.actions = existing.actions.slice(-100);
      }

      // Update patterns
      const patternKey = `${action}:${context.resource || 'unknown'}`;
      existing.patterns.set(patternKey, (existing.patterns.get(patternKey) || 0) + 1);

      existing.lastActivity = now;
      this.userActivity.set(key, existing);

      // Check for unusual behavior patterns
      await this.detectUnusualUserBehavior(userId, existing);

    } catch (error) {
      logger.error('User behavior monitoring error:', error);
    }
  }

  /**
   * Detect unusual user behavior
   * @param {number} userId - User ID
   * @param {Object} behavior - User behavior data
   */
  async detectUnusualUserBehavior(userId, behavior) {
    try {
      // Check for rapid action sequences
      const recentActions = behavior.actions.filter(action => {
        const actionTime = new Date(action.timestamp);
        const now = new Date();
        return (now - actionTime) < 60000; // Last minute
      });

      if (recentActions.length > 20) {
        await this.logThreat({
          type: 'RAPID_USER_ACTIONS',
          severity: 'MEDIUM',
          userId: userId,
          actionCount: recentActions.length,
          actions: recentActions.map(a => a.action),
          timestamp: new Date().toISOString()
        });
      }

      // Check for unusual action patterns
      const actionCounts = new Map();
      behavior.actions.forEach(action => {
        actionCounts.set(action.action, (actionCounts.get(action.action) || 0) + 1);
      });

      // Detect if user is performing unusual number of specific actions
      for (const [action, count] of actionCounts) {
        if (count > 50) { // Threshold for unusual action frequency
          await this.logThreat({
            type: 'UNUSUAL_ACTION_FREQUENCY',
            severity: 'LOW',
            userId: userId,
            action: action,
            count: count,
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      logger.error('Unusual behavior detection error:', error);
    }
  }

  /**
   * Log threat for analysis and alerting
   * @param {Object} threatData - Threat data
   */
  async logThreat(threatData) {
    try {
      const threat = {
        id: this.generateThreatId(),
        timestamp: new Date().toISOString(),
        ...threatData
      };

      // Store threat pattern for analysis
      const patternKey = `${threatData.type}:${threatData.ip || threatData.userId}`;
      const existingPattern = this.threatPatterns.get(patternKey) || { count: 0, firstSeen: new Date() };
      existingPattern.count++;
      existingPattern.lastSeen = new Date();
      this.threatPatterns.set(patternKey, existingPattern);

      // Log threat
      logger.warn('Security Threat Detected:', JSON.stringify(threat, null, 2));

      // Store in database if audit logging is enabled
      if (process.env.AUDIT_LOGGING_ENABLED === 'true') {
        const db = require('../models');
        await db.SecurityThreat.create({
          threatType: threatData.type,
          severity: threatData.severity,
          threatData: JSON.stringify(threat),
          ipAddress: threatData.ip,
          userId: threatData.userId,
          timestamp: new Date()
        });
      }

      // Send alert for high severity threats
      if (threatData.severity === 'HIGH') {
        await this.sendSecurityAlert(threat);
      }

    } catch (error) {
      logger.error('Threat logging error:', error);
    }
  }

  /**
   * Send security alert
   * @param {Object} threat - Threat data
   */
  async sendSecurityAlert(threat) {
    try {
      // In a real implementation, this would send alerts to security team
      // For now, we'll just log the alert
      logger.error('🚨 SECURITY ALERT:', {
        type: threat.type,
        severity: threat.severity,
        ip: threat.ip,
        userId: threat.userId,
        timestamp: threat.timestamp,
        details: threat
      });

      // TODO: Implement actual alerting (email, Slack, etc.)
      // await emailService.sendSecurityAlert(threat);
      // await slackService.sendSecurityAlert(threat);

    } catch (error) {
      logger.error('Security alert error:', error);
    }
  }

  /**
   * Block IP address temporarily
   * @param {string} ip - IP address to block
   * @param {number} duration - Block duration in seconds
   */
  async blockIP(ip, duration) {
    try {
      // In a real implementation, this would block the IP
      // For now, we'll just log the block
      logger.warn(`IP ${ip} blocked for ${duration} seconds`);

      // TODO: Implement actual IP blocking
      // await firewallService.blockIP(ip, duration);

    } catch (error) {
      logger.error('IP blocking error:', error);
    }
  }

  /**
   * Generate unique threat ID
   * @returns {string} Threat ID
   */
  generateThreatId() {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old activity data
   */
  cleanupOldActivity() {
    try {
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour

      // Clean up IP activity
      for (const [key, data] of this.ipActivity.entries()) {
        if (now - data.firstSeen > maxAge) {
          this.ipActivity.delete(key);
        }
      }

      // Clean up user activity
      for (const [key, data] of this.userActivity.entries()) {
        if (now - data.lastActivity.getTime() > maxAge) {
          this.userActivity.delete(key);
        }
      }

      logger.debug('Cleaned up old threat detection data');

    } catch (error) {
      logger.error('Threat detection cleanup error:', error);
    }
  }

  /**
   * Clean up old threat patterns
   */
  cleanupThreatPatterns() {
    try {
      const now = new Date();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const [key, pattern] of this.threatPatterns.entries()) {
        if (now - pattern.lastSeen.getTime() > maxAge) {
          this.threatPatterns.delete(key);
        }
      }

      logger.debug('Cleaned up old threat patterns');

    } catch (error) {
      logger.error('Threat pattern cleanup error:', error);
    }
  }

  /**
   * Get threat detection statistics
   * @returns {Object} Threat detection statistics
   */
  getThreatStats() {
    try {
      return {
        activePatterns: this.threatPatterns.size,
        trackedIPs: this.ipActivity.size,
        trackedUsers: this.userActivity.size,
        suspiciousPatterns: this.suspiciousPatterns.length,
        anomalyThresholds: this.anomalyThresholds
      };

    } catch (error) {
      logger.error('Threat stats error:', error);
      return {
        activePatterns: 0,
        trackedIPs: 0,
        trackedUsers: 0,
        suspiciousPatterns: 0,
        anomalyThresholds: {}
      };
    }
  }
}

// Create singleton instance
const threatDetectionService = new ThreatDetectionService();

module.exports = threatDetectionService; 