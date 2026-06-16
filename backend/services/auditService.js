const { sequelize } = require('../models');
const { getSiemIntegrationService } = require('./siem');

class AuditService {
  constructor() {
    this.db = sequelize;
    this.siem = getSiemIntegrationService();
  }

  /**
   * Forward to SIEM providers (non-blocking; failures do not affect audit persistence).
   */
  _forwardToSiem(auditLog) {
    if (!auditLog || !this.siem.isEnabled()) return;
    this.siem.forwardAuditLog(auditLog).catch((err) => {
      console.warn('[SIEM] Forward failed:', err.message);
    });
  }

  /**
   * Log audit events for compliance and security monitoring
   */
  async logEvent(eventType, eventData, userId = null, ipAddress = null, userAgent = null) {
    try {
      const auditLog = await this.db.models.AuditLog.create({
        eventType,
        eventData: JSON.stringify(eventData),
        userId,
        ipAddress,
        userAgent,
        timestamp: new Date()
      });

      console.log(`📝 Audit event logged: ${eventType} for user ${userId || 'system'}`);
      this._forwardToSiem(auditLog);
      return auditLog;
    } catch (error) {
      console.error('❌ Error logging audit event:', error);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(filters = {}, page = 1, limit = 50) {
    try {
      const whereClause = {};
      
      if (filters.eventType) {
        whereClause.eventType = filters.eventType;
      }
      
      if (filters.userId) {
        whereClause.userId = filters.userId;
      }
      
      if (filters.startDate) {
        whereClause.timestamp = {
          [this.db.Sequelize.Op.gte]: new Date(filters.startDate)
        };
      }
      
      if (filters.endDate) {
        whereClause.timestamp = {
          ...whereClause.timestamp,
          [this.db.Sequelize.Op.lte]: new Date(filters.endDate)
        };
      }

      const offset = (page - 1) * limit;
      
      const { count, rows } = await this.db.models.AuditLog.findAndCountAll({
        where: whereClause,
        order: [['timestamp', 'DESC']],
        limit,
        offset
      });

      return {
        logs: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.error('❌ Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId, page = 1, limit = 50) {
    return this.getAuditLogs({ userId }, page, limit);
  }

  /**
   * Get audit logs for compliance reporting
   */
  async getComplianceAuditLogs(startDate, endDate) {
    try {
      const logs = await this.db.models.AuditLog.findAll({
        where: {
          timestamp: {
            [this.db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
          }
        },
        order: [['timestamp', 'ASC']]
      });

      return logs;
    } catch (error) {
      console.error('❌ Error getting compliance audit logs:', error);
      throw error;
    }
  }

  /**
   * Log authentication events
   */
  async logAuthenticationEvent(eventType, userId, ipAddress, userAgent, success = true, details = {}) {
    return this.logEvent(`AUTH_${eventType.toUpperCase()}`, {
      success,
      details,
      timestamp: new Date()
    }, userId, ipAddress, userAgent);
  }

  /**
   * Log data access events
   */
  async logDataAccessEvent(userId, dataType, action, ipAddress = null, userAgent = null) {
    return this.logEvent('DATA_ACCESS', {
      dataType,
      action,
      timestamp: new Date()
    }, userId, ipAddress, userAgent);
  }

  /**
   * Log consent events
   */
  async logConsentEvent(eventType, userId, purpose, consentId, ipAddress = null, userAgent = null) {
    return this.logEvent(`CONSENT_${eventType.toUpperCase()}`, {
      purpose,
      consentId,
      timestamp: new Date()
    }, userId, ipAddress, userAgent);
  }

  /**
   * Log security events
   */
  async logSecurityEvent(eventType, userId, details, ipAddress = null, userAgent = null) {
    return this.logEvent(`SECURITY_${eventType.toUpperCase()}`, {
      details,
      timestamp: new Date()
    }, userId, ipAddress, userAgent);
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(startDate, endDate, eventTypes = []) {
    try {
      const whereClause = {
        timestamp: {
          [this.db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };

      if (eventTypes.length > 0) {
        whereClause.eventType = {
          [this.db.Sequelize.Op.in]: eventTypes
        };
      }

      const logs = await this.db.models.AuditLog.findAll({
        where: whereClause,
        order: [['timestamp', 'ASC']]
      });

      // Group by event type
      const eventSummary = {};
      logs.forEach(log => {
        if (!eventSummary[log.eventType]) {
          eventSummary[log.eventType] = 0;
        }
        eventSummary[log.eventType]++;
      });

      return {
        period: { startDate, endDate },
        totalEvents: logs.length,
        eventSummary,
        logs: logs.map(log => ({
          id: log.id,
          eventType: log.eventType,
          userId: log.userId,
          ipAddress: log.ipAddress,
          timestamp: log.timestamp,
          eventData: JSON.parse(log.eventData)
        }))
      };
    } catch (error) {
      console.error('❌ Error generating audit report:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldAuditLogs(retentionDays = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await this.db.models.AuditLog.destroy({
        where: {
          timestamp: {
            [this.db.Sequelize.Op.lt]: cutoffDate
          }
        }
      });

      console.log(`🧹 Cleaned up ${deletedCount} old audit logs (older than ${retentionDays} days)`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old audit logs:', error);
      throw error;
    }
  }
}

module.exports = AuditService; 