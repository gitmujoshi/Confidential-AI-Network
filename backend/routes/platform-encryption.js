/**
 * Platform Encryption API Routes
 * 
 * This module provides API endpoints for the platform encryption workflow,
 * including data encryption, JWT token management, and TEE attestation.
 */

const express = require('express');
const router = express.Router();
const PlatformEncryptionService = require('../services/platformEncryptionService');
const EnhancedJWTService = require('../services/enhancedJWTService');
const TEEAttestationService = require('../services/teeAttestationService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// Initialize services
const platformEncryptionService = new PlatformEncryptionService();
const enhancedJWTService = new EnhancedJWTService(platformEncryptionService);
const teeAttestationService = new TEEAttestationService(platformEncryptionService, enhancedJWTService);

/**
 * @route GET /api/platform-encryption/status
 * @desc Get platform encryption status
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = platformEncryptionService.getEncryptionStatus();
    const jwtStats = enhancedJWTService.getTokenStatistics();
    const teeStats = teeAttestationService.getTEEStatistics();
    
    res.json({
      success: true,
      platform: status,
      jwt: jwtStats,
      tee: teeStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get platform encryption status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get platform encryption status',
      message: error.message
    });
  }
});

/**
 * @route POST /api/platform-encryption/encrypt-data
 * @desc Encrypt data for TDP upload
 * @access TDP only
 */
router.post('/encrypt-data', authenticateToken, requireRole(['TDP']), async (req, res) => {
  try {
    const { data, dataType } = req.body;
    const tdpId = req.user.id;
    
    if (!data || !dataType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Data and dataType are required'
      });
    }
    
    const encryptedData = await platformEncryptionService.encryptDataForUpload(data, dataType, tdpId);
    
    logger.info(`Data encrypted for TDP ${tdpId}, type: ${dataType}`);
    
    res.json({
      success: true,
      data: encryptedData,
      message: 'Data encrypted successfully'
    });
  } catch (error) {
    logger.error('Failed to encrypt data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to encrypt data',
      message: error.message
    });
  }
});

/**
 * @route POST /api/platform-encryption/decrypt-data
 * @desc Decrypt data for TDC access
 * @access TDC only
 */
router.post('/decrypt-data', authenticateToken, requireRole(['TDC']), async (req, res) => {
  try {
    const { encryptedData, accessToken } = req.body;
    const tdcId = req.user.id;
    
    if (!encryptedData || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'EncryptedData and accessToken are required'
      });
    }
    
    const decryptedData = await platformEncryptionService.decryptDataForAccess(
      encryptedData, 
      tdcId, 
      accessToken
    );
    
    logger.info(`Data decrypted for TDC ${tdcId}`);
    
    res.json({
      success: true,
      data: decryptedData,
      message: 'Data decrypted successfully'
    });
  } catch (error) {
    logger.error('Failed to decrypt data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decrypt data',
      message: error.message
    });
  }
});

/**
 * @route POST /api/platform-encryption/create-data-access-token
 * @desc Create data access token for TDC
 * @access TDP only
 */
router.post('/create-data-access-token', authenticateToken, requireRole(['TDP']), async (req, res) => {
  try {
    const { tdcId, datasetId, purpose, contractId } = req.body;
    const tdpId = req.user.id;
    
    if (!tdcId || !datasetId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'TDC ID and dataset ID are required'
      });
    }
    
    const dataAccessToken = await enhancedJWTService.createDataAccessToken(
      { purpose, contractId },
      tdcId,
      datasetId
    );
    
    logger.info(`Data access token created for TDC ${tdcId}, dataset ${datasetId}`);
    
    res.json({
      success: true,
      token: dataAccessToken,
      message: 'Data access token created successfully'
    });
  } catch (error) {
    logger.error('Failed to create data access token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create data access token',
      message: error.message
    });
  }
});

/**
 * @route POST /api/platform-encryption/provision-tee
 * @desc Provision TEE environment
 * @access CCRP only
 */
router.post('/provision-tee', authenticateToken, requireRole(['CCRP']), async (req, res) => {
  try {
    const { hardwareType, resourceRequirements } = req.body;
    const ccrpId = req.user.id;
    
    if (!hardwareType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Hardware type is required'
      });
    }
    
    const teeInfo = await teeAttestationService.provisionTEE(
      { hardwareType, resourceRequirements },
      ccrpId
    );
    
    logger.info(`TEE provisioned for CCRP ${ccrpId}: ${teeInfo.teeId}`);
    
    res.json({
      success: true,
      tee: teeInfo,
      message: 'TEE provisioned successfully'
    });
  } catch (error) {
    logger.error('Failed to provision TEE:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to provision TEE',
      message: error.message
    });
  }
});

/**
 * @route POST /api/platform-encryption/verify-tee-attestation
 * @desc Verify TEE attestation
 * @access CCRP only
 */
router.post('/verify-tee-attestation', authenticateToken, requireRole(['CCRP']), async (req, res) => {
  try {
    const { attestationToken } = req.body;
    
    if (!attestationToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Attestation token is required'
      });
    }
    
    const verificationResult = await teeAttestationService.verifyTEEAttestation(attestationToken);
    
    logger.info(`TEE attestation verified: ${verificationResult.teeId}`);
    
    res.json({
      success: true,
      verification: verificationResult,
      message: 'TEE attestation verified successfully'
    });
  } catch (error) {
    logger.error('Failed to verify TEE attestation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify TEE attestation',
      message: error.message
    });
  }
});

/**
 * @route POST /api/platform-encryption/encrypt-training-results
 * @desc Encrypt training results
 * @access TDC only
 */
router.post('/encrypt-training-results', authenticateToken, requireRole(['TDC']), async (req, res) => {
  try {
    const { results, teeAttestationToken } = req.body;
    const tdcId = req.user.id;
    
    if (!results || !teeAttestationToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Results and TEE attestation token are required'
      });
    }
    
    const encryptedResults = await platformEncryptionService.encryptTrainingResults(
      results,
      tdcId,
      teeAttestationToken
    );
    
    logger.info(`Training results encrypted for TDC ${tdcId}`);
    
    res.json({
      success: true,
      data: encryptedResults,
      message: 'Training results encrypted successfully'
    });
  } catch (error) {
    logger.error('Failed to encrypt training results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to encrypt training results',
      message: error.message
    });
  }
});

/**
 * @route POST /api/platform-encryption/refresh-token
 * @desc Refresh access token
 * @access Authenticated users
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Refresh token is required'
      });
    }
    
    const newTokenResponse = await enhancedJWTService.refreshAccessToken(refreshToken);
    
    logger.info(`Access token refreshed for user ${newTokenResponse.user.id}`);
    
    res.json({
      success: true,
      data: newTokenResponse,
      message: 'Access token refreshed successfully'
    });
  } catch (error) {
    logger.error('Failed to refresh access token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh access token',
      message: error.message
    });
  }
});

/**
 * @route POST /api/platform-encryption/revoke-token
 * @desc Revoke token
 * @access Authenticated users
 */
router.post('/revoke-token', authenticateToken, async (req, res) => {
  try {
    const { token, reason } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Token is required'
      });
    }
    
    await enhancedJWTService.revokeToken(token, reason || 'User requested');
    
    logger.info(`Token revoked by user ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Token revoked successfully'
    });
  } catch (error) {
    logger.error('Failed to revoke token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke token',
      message: error.message
    });
  }
});

/**
 * @route GET /api/platform-encryption/active-tokens
 * @desc Get active tokens for user
 * @access Authenticated users
 */
router.get('/active-tokens', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activeTokens = enhancedJWTService.getActiveTokensForUser(userId);
    
    res.json({
      success: true,
      tokens: activeTokens,
      message: 'Active tokens retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get active tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active tokens',
      message: error.message
    });
  }
});

/**
 * @route GET /api/platform-encryption/tee-health/:teeId
 * @desc Get TEE health status
 * @access CCRP only
 */
router.get('/tee-health/:teeId', authenticateToken, requireRole(['CCRP']), async (req, res) => {
  try {
    const { teeId } = req.params;
    const healthStatus = await teeAttestationService.monitorTEEHealth(teeId);
    
    res.json({
      success: true,
      health: healthStatus,
      message: 'TEE health status retrieved successfully'
    });
  } catch (error) {
    logger.error('Failed to get TEE health status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get TEE health status',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/platform-encryption/tee/:teeId
 * @desc Decommission TEE
 * @access CCRP only
 */
router.delete('/tee/:teeId', authenticateToken, requireRole(['CCRP']), async (req, res) => {
  try {
    const { teeId } = req.params;
    const { reason } = req.body;
    
    await teeAttestationService.decommissionTEE(teeId, reason);
    
    logger.info(`TEE ${teeId} decommissioned by CCRP ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'TEE decommissioned successfully'
    });
  } catch (error) {
    logger.error('Failed to decommission TEE:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decommission TEE',
      message: error.message
    });
  }
});

module.exports = router;
