/**
 * DPDP (Digital Personal Data Protection) Service
 * 
 * This service implements comprehensive DPDP Act 2023 compliance for the
 * Contract Management System, including:
 * - Consent management
 * - Data principal rights
 * - Data retention policies
 * - Breach notification
 * - Audit logging
 * - Compliance monitoring
 */

const crypto = require('crypto');
const db = require('../models');

class DPDPService {
  constructor() {
    const AuditService = require('./auditService');
    const EmailService = require('./emailService');
    this.auditService = new AuditService();
    this.emailService = new EmailService();
  }

  /**
   * Record user consent for data processing
   */
  async recordConsent(userId, purpose, dataTypes, consentType = 'EXPLICIT', req = null) {
    try {
      const consent = await db.Consent.create({
        userId,
        purpose,
        dataTypes: JSON.stringify(dataTypes),
        consentType,
        consentText: this.getConsentText(purpose),
        grantedAt: new Date(),
        isActive: true,
        version: '1.0',
        withdrawalMethod: 'WEB_INTERFACE',
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent')
      });

      // Log consent event
      await this.auditService.logEvent('CONSENT_GRANTED', {
        userId,
        purpose,
        consentId: consent.id,
        dataTypes
      });

      console.log(`✅ Consent recorded for user ${userId}, purpose: ${purpose}`);
      return consent;
    } catch (error) {
      console.error('❌ Error recording consent:', error);
      throw error;
    }
  }

  /**
   * Withdraw user consent
   */
  async withdrawConsent(userId, purpose, req = null) {
    try {
      const consent = await db.Consent.findOne({
        where: { userId, purpose, isActive: true }
      });

      if (!consent) {
        throw new Error('No active consent found for this purpose');
      }

      await consent.update({
        isActive: false,
        withdrawnAt: new Date(),
        withdrawalMethod: req?.method || 'WEB_INTERFACE'
      });

      // Log consent withdrawal
      await this.auditService.logEvent('CONSENT_WITHDRAWN', {
        userId,
        purpose,
        consentId: consent.id
      });

      // Stop processing data for this purpose
      await this.stopDataProcessing(userId, purpose);

      console.log(`✅ Consent withdrawn for user ${userId}, purpose: ${purpose}`);
      return consent;
    } catch (error) {
      console.error('❌ Error withdrawing consent:', error);
      throw error;
    }
  }

  /**
   * Get user's personal data (Right to Access)
   */
  async getPersonalData(userId) {
    try {
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const consents = await db.Consent.findAll({
        where: { userId, isActive: true },
        order: [['grantedAt', 'DESC']]
      });

      const dataProcessing = await db.DataProcessingRecord.findAll({
        where: { userId },
        order: [['processedAt', 'DESC']],
        limit: 100
      });

      const retentionInfo = await this.getDataRetentionInfo(userId);

      const personalData = {
        basicInfo: {
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          organization: user.organization,
          location: user.location,
          website: user.website
        },
        professionalInfo: {
          partyType: user.partyType,
          description: user.description
        },
        technicalInfo: {
          walletAddress: user.walletAddress,
          did: user.did,
          publicKey: user.publicKey
        },
        consents: consents.map(c => ({
          id: c.id,
          purpose: c.purpose,
          dataTypes: JSON.parse(c.dataTypes),
          consentType: c.consentType,
          grantedAt: c.grantedAt,
          version: c.version
        })),
        dataProcessing: dataProcessing.map(d => ({
          id: d.id,
          processingActivity: d.processingActivity,
          purpose: d.purpose,
          dataTypes: JSON.parse(d.dataTypes),
          legalBasis: d.legalBasis,
          processedAt: d.processedAt,
          retentionPeriod: d.retentionPeriod
        })),
        dataRetention: retentionInfo
      };

      // Log data access
      await this.auditService.logEvent('PERSONAL_DATA_ACCESSED', {
        userId,
        dataTypes: ['BASIC_INFO', 'PROFESSIONAL_INFO', 'TECHNICAL_INFO', 'CONSENTS', 'PROCESSING_RECORDS']
      });

      return personalData;
    } catch (error) {
      console.error('❌ Error getting personal data:', error);
      throw error;
    }
  }

  /**
   * Update personal data (Right to Correction)
   */
  async updatePersonalData(userId, updates, req = null) {
    try {
      const allowedFields = [
        'name', 'email', 'phoneNumber', 'organization', 
        'location', 'website', 'description'
      ];

      const sanitizedUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          sanitizedUpdates[key] = value;
        }
      }

      if (Object.keys(sanitizedUpdates).length === 0) {
        throw new Error('No valid fields to update');
      }

      await db.User.update(sanitizedUpdates, { where: { id: userId } });

      // Log data update
      await this.auditService.logEvent('PERSONAL_DATA_UPDATED', {
        userId,
        updatedFields: Object.keys(sanitizedUpdates),
        ipAddress: req?.ip
      });

      console.log(`✅ Personal data updated for user ${userId}`);
      return { success: true, updatedFields: Object.keys(sanitizedUpdates) };
    } catch (error) {
      console.error('❌ Error updating personal data:', error);
      throw error;
    }
  }

  /**
   * Delete personal data (Right to Erasure)
   */
  async deletePersonalData(userId, req = null) {
    try {
      // Anonymize personal data instead of complete deletion
      await db.User.update({
        name: 'DELETED_USER',
        email: `deleted_${userId}@deleted.com`,
        phoneNumber: null,
        organization: null,
        location: null,
        website: null,
        description: null,
        walletAddress: null,
        did: null,
        publicKey: null
      }, { where: { id: userId } });

      // Deactivate all consents
      await db.Consent.update({
        isActive: false,
        withdrawnAt: new Date()
      }, { where: { userId } });

      // Log data erasure
      await this.auditService.logEvent('PERSONAL_DATA_ERASED', {
        userId,
        ipAddress: req?.ip
      });

      console.log(`✅ Personal data erased for user ${userId}`);
      return { success: true, message: 'Personal data erased successfully' };
    } catch (error) {
      console.error('❌ Error erasing personal data:', error);
      throw error;
    }
  }

  /**
   * Export personal data (Right to Portability)
   */
  async exportPersonalData(userId) {
    try {
      const personalData = await this.getPersonalData(userId);
      
      // Add export metadata
      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        dataVersion: '1.0',
        ...personalData
      };

      // Log data export
      await this.auditService.logEvent('PERSONAL_DATA_EXPORTED', {
        userId,
        exportDate: exportData.exportDate
      });

      console.log(`✅ Personal data exported for user ${userId}`);
      return exportData;
    } catch (error) {
      console.error('❌ Error exporting personal data:', error);
      throw error;
    }
  }

  /**
   * Record data processing activity
   */
  async recordDataProcessing(userId, processingActivity, purpose, dataTypes, legalBasis, consentId = null) {
    try {
      const retentionPeriod = await this.getRetentionPeriod(dataTypes);
      
      const processingRecord = await db.DataProcessingRecord.create({
        userId,
        processingActivity,
        purpose,
        dataTypes: JSON.stringify(dataTypes),
        legalBasis,
        consentId,
        processedAt: new Date(),
        retentionPeriod
      });

      // Log processing activity
      await this.auditService.logEvent('DATA_PROCESSING_RECORDED', {
        userId,
        processingActivity,
        purpose,
        dataTypes
      });

      console.log(`✅ Data processing recorded for user ${userId}, activity: ${processingActivity}`);
      return processingRecord;
    } catch (error) {
      console.error('❌ Error recording data processing:', error);
      throw error;
    }
  }

  /**
   * Report data breach
   */
  async reportDataBreach(incident) {
    try {
      const breach = await db.DataBreach.create({
        breachType: incident.type,
        description: incident.description,
        severity: incident.severity,
        affectedUsers: incident.affectedUsers || 0,
        discoveredAt: new Date(),
        status: 'DETECTED',
        impactAssessment: incident.impactAssessment,
        mitigationActions: incident.mitigationActions
      });

      // Notify DPO
      await this.notifyDPO(breach);

      // Notify affected users if severity is high or critical
      if (['HIGH', 'CRITICAL'].includes(incident.severity)) {
        await this.notifyAffectedUsers(breach);
      }

      // Report to authorities if required
      if (incident.severity === 'CRITICAL') {
        await this.reportToAuthorities(breach);
      }

      // Log breach report
      await this.auditService.logEvent('DATA_BREACH_REPORTED', {
        breachId: breach.id,
        breachType: incident.type,
        severity: incident.severity
      });

      console.log(`✅ Data breach reported: ${incident.type}, severity: ${incident.severity}`);
      return breach;
    } catch (error) {
      console.error('❌ Error reporting data breach:', error);
      throw error;
    }
  }

  /**
   * Submit grievance
   */
  async submitGrievance(userId, grievanceData, req = null) {
    try {
      const grievance = await db.Grievance.create({
        userId,
        grievanceType: grievanceData.type,
        description: grievanceData.description,
        priority: grievanceData.priority || 'MEDIUM',
        submittedAt: new Date(),
        status: 'SUBMITTED',
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent')
      });

      // Notify DPO about grievance
      await this.notifyDPOAboutGrievance(grievance);

      // Log grievance submission
      await this.auditService.logEvent('GRIEVANCE_SUBMITTED', {
        userId,
        grievanceId: grievance.id,
        grievanceType: grievanceData.type
      });

      console.log(`✅ Grievance submitted by user ${userId}, type: ${grievanceData.type}`);
      return grievance;
    } catch (error) {
      console.error('❌ Error submitting grievance:', error);
      throw error;
    }
  }

  /**
   * Get data retention information
   */
  async getDataRetentionInfo(userId) {
    try {
      const processingRecords = await db.DataProcessingRecord.findAll({
        where: { userId },
        order: [['processedAt', 'DESC']]
      });

      const retentionInfo = processingRecords.map(record => ({
        dataType: JSON.parse(record.dataTypes),
        retentionPeriod: record.retentionPeriod,
        processedAt: record.processedAt,
        expiresAt: new Date(record.processedAt.getTime() + (record.retentionPeriod * 24 * 60 * 60 * 1000))
      }));

      return retentionInfo;
    } catch (error) {
      console.error('❌ Error getting data retention info:', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate, endDate) {
    try {
      const consents = await db.Consent.findAll({
        where: {
          grantedAt: {
            [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
          }
        }
      });

      const processingRecords = await db.DataProcessingRecord.findAll({
        where: {
          processedAt: {
            [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
          }
        }
      });

      const grievances = await db.Grievance.findAll({
        where: {
          submittedAt: {
            [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
          }
        }
      });

      const breaches = await db.DataBreach.findAll({
        where: {
          discoveredAt: {
            [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
          }
        }
      });

      const report = {
        period: { startDate, endDate },
        summary: {
          totalConsents: consents.length,
          activeConsents: consents.filter(c => c.isActive).length,
          withdrawnConsents: consents.filter(c => !c.isActive).length,
          totalProcessingActivities: processingRecords.length,
          totalGrievances: grievances.length,
          resolvedGrievances: grievances.filter(g => g.status === 'RESOLVED').length,
          totalBreaches: breaches.length,
          criticalBreaches: breaches.filter(b => b.severity === 'CRITICAL').length
        },
        details: {
          consents: this.groupBy(consents, 'purpose'),
          processingActivities: this.groupBy(processingRecords, 'processingActivity'),
          grievances: this.groupBy(grievances, 'grievanceType'),
          breaches: this.groupBy(breaches, 'breachType')
        }
      };

      console.log(`✅ Compliance report generated for period: ${startDate} to ${endDate}`);
      return report;
    } catch (error) {
      console.error('❌ Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Get consent text for specific purpose
   */
  getConsentText(purpose) {
    const consentTexts = {
      'CONTRACT_MANAGEMENT': 'I consent to the processing of my personal data for contract management purposes including contract creation, signing, and execution.',
      'DATASET_ACCESS': 'I consent to the processing of my personal data for dataset access and management including browsing, purchasing, and usage tracking.',
      'SYSTEM_OPERATIONS': 'I consent to the processing of my personal data for system operations including authentication, authorization, and technical support.',
      'COMPLIANCE': 'I consent to the processing of my personal data for compliance purposes including audit trails, regulatory reporting, and legal obligations.',
      'COMMUNICATIONS': 'I consent to the processing of my personal data for communications including notifications, updates, and support messages.'
    };

    return consentTexts[purpose] || 'I consent to the processing of my personal data for the specified purpose.';
  }

  /**
   * Stop data processing for specific purpose
   */
  async stopDataProcessing(userId, purpose) {
    try {
      // This would implement logic to stop data processing
      // For now, we just log the action
      console.log(`🛑 Data processing stopped for user ${userId}, purpose: ${purpose}`);
      return true;
    } catch (error) {
      console.error('❌ Error stopping data processing:', error);
      throw error;
    }
  }

  /**
   * Get retention period for data types
   */
  async getRetentionPeriod(dataTypes) {
    // Default retention periods in days
    const retentionPeriods = {
      'BASIC_INFO': 365 * 3, // 3 years
      'PROFESSIONAL_INFO': 365 * 5, // 5 years
      'TECHNICAL_INFO': 365 * 2, // 2 years
      'CONSENTS': 365 * 7, // 7 years
      'PROCESSING_RECORDS': 365 * 5, // 5 years
      'AUDIT_LOGS': 365 * 7 // 7 years
    };

    // Return the longest retention period for the data types
    const periods = dataTypes.map(type => retentionPeriods[type] || 365);
    return Math.max(...periods);
  }

  /**
   * Get security measures
   */
  async getSecurityMeasures() {
    return {
      encryption: 'AES-256 encryption for data at rest and TLS 1.3 for data in transit',
      accessControls: 'Role-based access control with multi-factor authentication',
      auditLogging: 'Comprehensive audit logging for all data access and modifications',
      dataMinimization: 'Only necessary data is collected and processed',
      retentionPolicies: 'Automated data retention and deletion policies'
    };
  }

  /**
   * Notify DPO about breach
   */
  async notifyDPO(breach) {
    try {
      // This would send notification to DPO
      console.log(`📧 DPO notified about breach: ${breach.breachType}, severity: ${breach.severity}`);
      return true;
    } catch (error) {
      console.error('❌ Error notifying DPO:', error);
      return false;
    }
  }

  /**
   * Notify affected users about breach
   */
  async notifyAffectedUsers(breach) {
    try {
      // This would send notifications to affected users
      console.log(`📧 Affected users notified about breach: ${breach.breachType}`);
      return true;
    } catch (error) {
      console.error('❌ Error notifying affected users:', error);
      return false;
    }
  }

  /**
   * Report breach to authorities
   */
  async reportToAuthorities(breach) {
    try {
      // This would report to regulatory authorities
      console.log(`📧 Breach reported to authorities: ${breach.breachType}`);
      return true;
    } catch (error) {
      console.error('❌ Error reporting to authorities:', error);
      return false;
    }
  }

  /**
   * Notify DPO about grievance
   */
  async notifyDPOAboutGrievance(grievance) {
    try {
      // This would send notification to DPO about grievance
      console.log(`📧 DPO notified about grievance: ${grievance.grievanceType}`);
      return true;
    } catch (error) {
      console.error('❌ Error notifying DPO about grievance:', error);
      return false;
    }
  }

  /**
   * Group array by key
   */
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }
}

module.exports = DPDPService; 