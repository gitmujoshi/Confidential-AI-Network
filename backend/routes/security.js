/**
 * Security Routes
 * 
 * This module provides security-related endpoints that demonstrate the enhanced
 * security features without modifying existing authentication logic.
 * 
 * Features:
 * - Security health checks
 * - Session management endpoints
 * - Threat detection statistics
 * - Encryption testing
 * - Security audit logs
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyAdmin } = require('../middleware/auth');
const {
  enhanceSecurity,
  manageSession,
  monitorUserBehavior,
  securityAuditLog,
  securityHealthCheck,
  securityCleanup
} = require('../middleware/securityEnhancement');

const sessionManagementService = require('../services/sessionManagementService');
const threatDetectionService = require('../services/threatDetectionService');
const dataEncryptionService = require('../services/dataEncryptionService');

// Apply security enhancement middleware to all security routes
router.use(enhanceSecurity);
router.use(manageSession);
router.use(monitorUserBehavior);
router.use(securityCleanup);

/**
 * GET /api/security/health
 * Security health check endpoint
 */
router.get('/health', securityHealthCheck);

/**
 * GET /api/security/sessions
 * Get user sessions (admin only)
 */
router.get('/sessions', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const sessions = await sessionManagementService.getUserSessions(req.user.id);
    
    res.json({
      success: true,
      data: {
        userId: req.user.id,
        sessions: sessions,
        totalSessions: sessions.length
      }
    });
  } catch (error) {
    console.error('❌ Error getting user sessions:', error);
    res.status(500).json({
      error: 'Failed to retrieve user sessions',
      code: 'SESSIONS_RETRIEVAL_ERROR'
    });
  }
});

/**
 * POST /api/security/sessions/revoke
 * Revoke user session (admin only)
 */
router.post('/sessions/revoke', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token is required',
        code: 'MISSING_TOKEN'
      });
    }

    const revoked = await sessionManagementService.revokeSession(token);
    
    if (revoked) {
      res.json({
        success: true,
        message: 'Session revoked successfully'
      });
    } else {
      res.status(400).json({
        error: 'Failed to revoke session',
        code: 'SESSION_REVOKE_FAILED'
      });
    }
  } catch (error) {
    console.error('❌ Error revoking session:', error);
    res.status(500).json({
      error: 'Failed to revoke session',
      code: 'SESSION_REVOKE_ERROR'
    });
  }
});

/**
 * GET /api/security/threats
 * Get threat detection statistics (admin only)
 */
router.get('/threats', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const threatStats = threatDetectionService.getThreatStats();
    
    res.json({
      success: true,
      data: threatStats
    });
  } catch (error) {
    console.error('❌ Error getting threat stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve threat statistics',
      code: 'THREAT_STATS_ERROR'
    });
  }
});

/**
 * POST /api/security/encryption/test
 * Test encryption functionality (admin only)
 */
router.post('/encryption/test', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const testResult = await dataEncryptionService.testEncryption();
    
    res.json({
      success: true,
      data: {
        testPassed: testResult,
        message: testResult ? 'Encryption test passed' : 'Encryption test failed'
      }
    });
  } catch (error) {
    console.error('❌ Error testing encryption:', error);
    res.status(500).json({
      error: 'Failed to test encryption',
      code: 'ENCRYPTION_TEST_ERROR'
    });
  }
});

/**
 * GET /api/security/encryption/stats
 * Get encryption statistics (admin only)
 */
router.get('/encryption/stats', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const encryptionStats = await dataEncryptionService.getEncryptionStats();
    
    res.json({
      success: true,
      data: encryptionStats
    });
  } catch (error) {
    console.error('❌ Error getting encryption stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve encryption statistics',
      code: 'ENCRYPTION_STATS_ERROR'
    });
  }
});

/**
 * POST /api/security/encryption/rotate
 * Rotate encryption keys (admin only)
 */
router.post('/encryption/rotate', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const { oldKeyId, newKeyId } = req.body;
    
    if (!oldKeyId || !newKeyId) {
      return res.status(400).json({
        error: 'Old key ID and new key ID are required',
        code: 'MISSING_KEY_IDS'
      });
    }

    const rotated = await dataEncryptionService.rotateEncryptionKeys(oldKeyId, newKeyId);
    
    if (rotated) {
      res.json({
        success: true,
        message: 'Encryption keys rotated successfully'
      });
    } else {
      res.status(400).json({
        error: 'Failed to rotate encryption keys',
        code: 'KEY_ROTATION_FAILED'
      });
    }
  } catch (error) {
    console.error('❌ Error rotating encryption keys:', error);
    res.status(500).json({
      error: 'Failed to rotate encryption keys',
      code: 'KEY_ROTATION_ERROR'
    });
  }
});

/**
 * GET /api/security/audit
 * Get security audit logs (admin only)
 */
router.get('/audit', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0, eventType } = req.query;
    
    const whereClause = {};
    if (eventType) {
      whereClause.eventType = eventType;
    }

    const db = require('../models');
    const auditLogs = await db.AuditLog.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCount = await db.AuditLog.count({ where: whereClause });
    
    res.json({
      success: true,
      data: {
        logs: auditLogs,
        totalCount: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('❌ Error getting audit logs:', error);
    res.status(500).json({
      error: 'Failed to retrieve audit logs',
      code: 'AUDIT_LOGS_ERROR'
    });
  }
});

/**
 * GET /api/security/siem
 * SIEM integration status (admin only)
 */
router.get('/siem', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const { getSiemIntegrationService } = require('../services/siem');
    res.json({
      success: true,
      data: getSiemIntegrationService().status()
    });
  } catch (error) {
    console.error('❌ Error getting SIEM status:', error);
    res.status(500).json({
      error: 'Failed to retrieve SIEM status',
      code: 'SIEM_STATUS_ERROR'
    });
  }
});

/**
 * POST /api/security/block-ip
 * Block IP address (admin only)
 */
router.post('/block-ip', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const { ip, duration = 3600 } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        error: 'IP address is required',
        code: 'MISSING_IP'
      });
    }

    await threatDetectionService.blockIP(ip, duration);
    
    res.json({
      success: true,
      message: `IP ${ip} blocked for ${duration} seconds`
    });
  } catch (error) {
    console.error('❌ Error blocking IP:', error);
    res.status(500).json({
      error: 'Failed to block IP address',
      code: 'IP_BLOCK_ERROR'
    });
  }
});

/**
 * GET /api/security/status
 * Get overall security status (admin only)
 */
router.get('/status', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const sessionStats = await sessionManagementService.getSessionStats();
    const threatStats = threatDetectionService.getThreatStats();
    const encryptionStats = await dataEncryptionService.getEncryptionStats();

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        overallStatus: 'healthy',
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
      }
    });
  } catch (error) {
    console.error('❌ Error getting security status:', error);
    res.status(500).json({
      error: 'Failed to retrieve security status',
      code: 'SECURITY_STATUS_ERROR'
    });
  }
});

module.exports = router; 