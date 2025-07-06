/**
 * DPDP (Digital Personal Data Protection) API Routes
 * 
 * This module provides API endpoints for DPDP Act 2023 compliance:
 * - Data principal rights (access, correction, erasure, portability)
 * - Consent management (grant, withdraw, view)
 * - Grievance redressal
 * - Compliance reporting
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const DPDPService = require('../services/dpdpService');
const rateLimit = require('express-rate-limit');

const dpdpService = new DPDPService();

// Rate limiting for DPDP endpoints
const dpdpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: 'Too many DPDP requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Apply rate limiting to all DPDP routes
router.use(dpdpRateLimit);

/**
 * GET /api/dpdp/personal-data
 * Get user's personal data (Right to Access)
 */
router.get('/personal-data', authenticateToken, async (req, res) => {
  try {
    const personalData = await dpdpService.getPersonalData(req.user.localUser.id);
    res.json({
      success: true,
      data: personalData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting personal data:', error);
    res.status(500).json({
      error: 'Failed to retrieve personal data',
      code: 'PERSONAL_DATA_ACCESS_ERROR',
      details: error.message
    });
  }
});

/**
 * PUT /api/dpdp/personal-data
 * Update personal data (Right to Correction)
 */
router.put('/personal-data', authenticateToken, async (req, res) => {
  try {
    const result = await dpdpService.updatePersonalData(req.user.localUser.id, req.body, req);
    res.json({
      success: true,
      message: 'Personal data updated successfully',
      updatedFields: result.updatedFields,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating personal data:', error);
    res.status(500).json({
      error: 'Failed to update personal data',
      code: 'PERSONAL_DATA_UPDATE_ERROR',
      details: error.message
    });
  }
});

/**
 * DELETE /api/dpdp/personal-data
 * Delete personal data (Right to Erasure)
 */
router.delete('/personal-data', authenticateToken, async (req, res) => {
  try {
    const result = await dpdpService.deletePersonalData(req.user.localUser.id, req);
    res.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error deleting personal data:', error);
    res.status(500).json({
      error: 'Failed to delete personal data',
      code: 'PERSONAL_DATA_DELETION_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/dpdp/export
 * Export personal data (Right to Data Portability)
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const exportData = await dpdpService.exportPersonalData(req.user.localUser.id);
    res.json({
      success: true,
      data: exportData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error exporting personal data:', error);
    res.status(500).json({
      error: 'Failed to export personal data',
      code: 'PERSONAL_DATA_EXPORT_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/dpdp/consents
 * Get user's active consents
 */
router.get('/consents', authenticateToken, async (req, res) => {
  try {
    const consents = await dpdpService.getActiveConsents(req.user.localUser.id);
    res.json({
      success: true,
      data: consents,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting consents:', error);
    res.status(500).json({
      error: 'Failed to retrieve consents',
      code: 'CONSENTS_ACCESS_ERROR',
      details: error.message
    });
  }
});

/**
 * POST /api/dpdp/consents
 * Grant consent for data processing
 */
router.post('/consents', authenticateToken, async (req, res) => {
  try {
    const { purpose, dataTypes, consentType } = req.body;
    
    if (!purpose || !dataTypes) {
      return res.status(400).json({
        error: 'Purpose and dataTypes are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const consent = await dpdpService.recordConsent(
      req.user.localUser.id,
      purpose,
      dataTypes,
      consentType || 'EXPLICIT',
      req
    );

    res.json({
      success: true,
      message: 'Consent granted successfully',
      consent: {
        id: consent.id,
        purpose: consent.purpose,
        dataTypes: JSON.parse(consent.dataTypes),
        consentType: consent.consentType,
        grantedAt: consent.grantedAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error granting consent:', error);
    res.status(500).json({
      error: 'Failed to grant consent',
      code: 'CONSENT_GRANT_ERROR',
      details: error.message
    });
  }
});

/**
 * POST /api/dpdp/consents/:purpose/withdraw
 * Withdraw consent for specific purpose
 */
router.post('/consents/:purpose/withdraw', authenticateToken, async (req, res) => {
  try {
    const { purpose } = req.params;
    
    const consent = await dpdpService.withdrawConsent(
      req.user.localUser.id,
      purpose,
      req
    );

    res.json({
      success: true,
      message: 'Consent withdrawn successfully',
      consent: {
        id: consent.id,
        purpose: consent.purpose,
        withdrawnAt: consent.withdrawnAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error withdrawing consent:', error);
    res.status(500).json({
      error: 'Failed to withdraw consent',
      code: 'CONSENT_WITHDRAWAL_ERROR',
      details: error.message
    });
  }
});

/**
 * POST /api/dpdp/grievances
 * Submit grievance (Right to Grievance Redressal)
 */
router.post('/grievances', authenticateToken, async (req, res) => {
  try {
    const { type, subject, description, priority } = req.body;
    
    if (!type || !subject || !description) {
      return res.status(400).json({
        error: 'Type, subject, and description are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const grievance = await dpdpService.submitGrievance(
      req.user.localUser.id,
      { type, subject, description, priority },
      req
    );

    res.json({
      success: true,
      message: 'Grievance submitted successfully',
      grievance: {
        id: grievance.id,
        type: grievance.grievanceType,
        subject: grievance.subject,
        status: grievance.status,
        submittedAt: grievance.submittedAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error submitting grievance:', error);
    res.status(500).json({
      error: 'Failed to submit grievance',
      code: 'GRIEVANCE_SUBMISSION_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/dpdp/grievances
 * Get user's grievances
 */
router.get('/grievances', authenticateToken, async (req, res) => {
  try {
    const grievances = await dpdpService.getUserGrievances(req.user.localUser.id);
    res.json({
      success: true,
      data: grievances,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting grievances:', error);
    res.status(500).json({
      error: 'Failed to retrieve grievances',
      code: 'GRIEVANCES_ACCESS_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/dpdp/retention-info
 * Get data retention information
 */
router.get('/retention-info', authenticateToken, async (req, res) => {
  try {
    const retentionInfo = await dpdpService.getDataRetentionInfo(req.user.localUser.id);
    res.json({
      success: true,
      data: retentionInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting retention info:', error);
    res.status(500).json({
      error: 'Failed to retrieve retention information',
      code: 'RETENTION_INFO_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/dpdp/compliance-report
 * Generate compliance report (Admin only)
 */
router.get('/compliance-report', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required',
        code: 'MISSING_DATE_PARAMETERS'
      });
    }

    const report = await dpdpService.generateComplianceReport(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error generating compliance report:', error);
    res.status(500).json({
      error: 'Failed to generate compliance report',
      code: 'COMPLIANCE_REPORT_ERROR',
      details: error.message
    });
  }
});

/**
 * POST /api/dpdp/breach-report
 * Report data breach (Admin only)
 */
router.post('/breach-report', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { type, severity, affectedUsers, dataTypes, description, impactAssessment } = req.body;
    
    if (!type || !severity || !dataTypes) {
      return res.status(400).json({
        error: 'Type, severity, and dataTypes are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const breach = await dpdpService.reportDataBreach({
      type,
      severity,
      affectedUsers,
      dataTypes,
      description,
      impactAssessment
    });

    res.json({
      success: true,
      message: 'Data breach reported successfully',
      breach: {
        id: breach.id,
        type: breach.incidentType,
        severity: breach.severity,
        status: breach.status,
        detectedAt: breach.detectedAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error reporting data breach:', error);
    res.status(500).json({
      error: 'Failed to report data breach',
      code: 'BREACH_REPORT_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/dpdp/breaches
 * Get data breaches (Admin only)
 */
router.get('/breaches', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const breaches = await dpdpService.getDataBreaches();
    res.json({
      success: true,
      data: breaches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting data breaches:', error);
    res.status(500).json({
      error: 'Failed to retrieve data breaches',
      code: 'BREACHES_ACCESS_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/dpdp/health
 * DPDP service health check
 */
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      service: 'DPDP Compliance Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      compliance: {
        dpdpAct2023: true,
        consentManagement: true,
        dataPrincipalRights: true,
        breachNotification: true,
        auditLogging: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'DPDP Compliance Service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 