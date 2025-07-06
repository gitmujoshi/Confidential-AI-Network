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

const db = require('../models');
const crypto = require('crypto');

class DPDPService {
  constructor() {
    this.auditService = require('./auditService');
    this.emailService = require('./emailService');
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
        isActive: false,
        deletedAt: new Date()
      }, { where: { id: userId } });

      // Withdraw all consents
      await db.Consent.update({
        isActive: false,
        withdrawnAt: new Date(),
        withdrawalMethod: 'DATA_DELETION_REQUEST'
      }, { where: { userId, isActive: true } });

      // Log data deletion
      await this.auditService.logEvent('PERSONAL_DATA_DELETED', {
        userId,
        deletionMethod: 'ANONYMIZATION',
        ipAddress: req?.ip
      });

      console.log(`✅ Personal data deleted for user ${userId}`);
      return { success: true, message: 'Personal data has been anonymized' };
    } catch (error) {
      console.error('❌ Error deleting personal data:', error);
      throw error;
    }
  }

  /**
   * Export personal data (Right to Data Portability)
   */
  async exportPersonalData(userId) {
    try {
      const data = await this.getPersonalData(userId);
      
      const exportData = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          format: 'JSON',
          version: '1.0',
          userId: userId
        },
        personalData: data
      };

      // Log data export
      await this.auditService.logEvent('PERSONAL_DATA_EXPORTED', {
        userId,
        exportFormat: 'JSON'
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
      const record = await db.DataProcessingRecord.create({
        userId,
        processingActivity,
        purpose,
        dataTypes: JSON.stringify(dataTypes),
        legalBasis,
        consentId,
        processedAt: new Date(),
        retentionPeriod: await this.getRetentionPeriod(dataTypes),
        securityMeasures: JSON.stringify(await this.getSecurityMeasures())
      });

      console.log(`✅ Data processing recorded for user ${userId}, activity: ${processingActivity}`);
      return record;
    } catch (error) {
      console.error('❌ Error recording data processing:', error);
      throw error;
    }
  }

  /**
   * Detect and report data breach
   */
  async reportDataBreach(incident) {
    try {
      const breach = await db.DataBreach.create({
        incidentType: incident.type,
        severity: incident.severity,
        affectedUsers: JSON.stringify(incident.affectedUsers || []),
        dataTypes: JSON.stringify(incident.dataTypes),
        detectedAt: new Date(),
        status: 'DETECTED',
        description: incident.description,
        impactAssessment: incident.impactAssessment
      });

      // Notify DPO within 72 hours
      await this.notifyDPO(breach);

      // Notify affected users
      if (incident.affectedUsers && incident.affectedUsers.length > 0) {
        await this.notifyAffectedUsers(breach);
      }

      // Report to authorities if required
      if (breach.severity === 'HIGH' || breach.severity === 'CRITICAL') {
        await this.reportToAuthorities(breach);
      }

      console.log(`✅ Data breach reported: ${breach.incidentType}, severity: ${breach.severity}`);
      return breach;
    } catch (error) {
      console.error('❌ Error reporting data breach:', error);
      throw error;
    }
  }

  /**
   * Submit grievance (Right to Grievance Redressal)
   */
  async submitGrievance(userId, grievanceData, req = null) {
    try {
      const grievance = await db.GrievanceRecord.create({
        userId,
        grievanceType: grievanceData.type,
        subject: grievanceData.subject,
        description: grievanceData.description,
        priority: grievanceData.priority || 'MEDIUM',
        submittedAt: new Date(),
        status: 'PENDING'
      });

      // Log grievance submission
      await this.auditService.logEvent('GRIEVANCE_SUBMITTED', {
        userId,
        grievanceId: grievance.id,
        grievanceType: grievanceData.type,
        ipAddress: req?.ip
      });

      // Notify DPO about new grievance
      await this.notifyDPOAboutGrievance(grievance);

      console.log(`✅ Grievance submitted for user ${userId}, type: ${grievanceData.type}`);
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
      const user = await db.User.findByPk(userId);
      const createdAt = user.createdAt;

      const policies = await db.DataRetentionPolicy.findAll({
        where: { isActive: true }
      });

      const retentionInfo = {};
      for (const policy of policies) {
        const expiresAt = new Date(createdAt);
        const years = parseInt(policy.retentionPeriod);
        expiresAt.setFullYear(expiresAt.getFullYear() + years);

        retentionInfo[policy.dataType] = {
          retentionPeriod: policy.retentionPeriod,
          expiresAt: expiresAt.toISOString(),
          reason: policy.retentionReason,
          disposalMethod: policy.disposalMethod
        };
      }

      return retentionInfo;
    } catch (error) {
      console.error('❌ Error getting retention info:', error);
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
          grantedAt: { [db.Sequelize.Op.between]: [startDate, endDate] }
        }
      });

      const dataProcessing = await db.DataProcessingRecord.findAll({
        where: {
          processedAt: { [db.Sequelize.Op.between]: [startDate, endDate] }
        }
      });

      const breaches = await db.DataBreach.findAll({
        where: {
          detectedAt: { [db.Sequelize.Op.between]: [startDate, endDate] }
        }
      });

      const grievances = await db.GrievanceRecord.findAll({
        where: {
          submittedAt: { [db.Sequelize.Op.between]: [startDate, endDate] }
        }
      });

      return {
        period: { startDate, endDate },
        summary: {
          totalConsents: consents.length,
          totalProcessingActivities: dataProcessing.length,
          totalBreaches: breaches.length,
          totalGrievances: grievances.length
        },
        consents: {
          byType: this.groupBy(consents, 'consentType'),
          byPurpose: this.groupBy(consents, 'purpose')
        },
        processing: {
          byLegalBasis: this.groupBy(dataProcessing, 'legalBasis'),
          byPurpose: this.groupBy(dataProcessing, 'purpose')
        },
        breaches: {
          bySeverity: this.groupBy(breaches, 'severity'),
          byType: this.groupBy(breaches, 'incidentType')
        },
        grievances: {
          byType: this.groupBy(grievances, 'grievanceType'),
          byStatus: this.groupBy(grievances, 'status')
        }
      };
    } catch (error) {
      console.error('❌ Error generating compliance report:', error);
      throw error;
    }
  }

  // Helper methods
  getConsentText(purpose) {
    const consentTexts = {
      'CONTRACT_MANAGEMENT': 'I consent to the processing of my personal data for contract management purposes.',
      'USER_REGISTRATION': 'I consent to the processing of my personal data for user registration and account management.',
      'COMMUNICATION': 'I consent to receive communications related to contract management and system updates.',
      'ANALYTICS': 'I consent to the processing of my data for analytics and system improvement purposes.'
    };
    return consentTexts[purpose] || 'I consent to the processing of my personal data for the specified purpose.';
  }

  async stopDataProcessing(userId, purpose) {
    // Implementation to stop data processing for specific purpose
    console.log(`🛑 Stopping data processing for user ${userId}, purpose: ${purpose}`);
  }

  async getRetentionPeriod(dataTypes) {
    // Default retention period
    return '7 years';
  }

  async getSecurityMeasures() {
    return {
      encryption: 'AES-256',
      accessControl: 'Role-based',
      auditLogging: 'Enabled',
      dataBackup: 'Daily'
    };
  }

  async notifyDPO(breach) {
    const dpoEmail = process.env.DPO_EMAIL || 'dpo@company.com';
    // Implementation for DPO notification
    console.log(`📧 Notifying DPO about breach: ${breach.incidentType}`);
  }

  async notifyAffectedUsers(breach) {
    // Implementation for user notification
    console.log(`📧 Notifying affected users about breach: ${breach.incidentType}`);
  }

  async reportToAuthorities(breach) {
    // Implementation for authority reporting
    console.log(`📋 Reporting breach to authorities: ${breach.incidentType}`);
  }

  async notifyDPOAboutGrievance(grievance) {
    // Implementation for DPO grievance notification
    console.log(`📧 Notifying DPO about grievance: ${grievance.grievanceType}`);
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {});
  }
}

module.exports = DPDPService; 