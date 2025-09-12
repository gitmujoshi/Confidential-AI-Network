/**
 * Enterprise Signing API Routes
 * Handles contract signing with enterprise cloud KMS systems
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const EnterpriseKeyService = require('../services/enterpriseKeyService');
const EnterpriseSigningService = require('../services/enterpriseSigningService');

const enterpriseKeyService = new EnterpriseKeyService();
const enterpriseSigningService = new EnterpriseSigningService();

/**
 * @route POST /api/enterprise/keys/register
 * @desc Register an enterprise public key
 * @access Private
 */
router.post('/keys/register', authenticateToken, async (req, res) => {
  try {
    const { publicKey, algorithm, keyId, provider, metadata } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!publicKey || !algorithm || !keyId || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: publicKey, algorithm, keyId, provider'
      });
    }

    const result = await enterpriseKeyService.registerPublicKey(
      { publicKey, algorithm, keyId, provider, metadata },
      userId
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error registering enterprise key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/enterprise/keys
 * @desc Get user's enterprise keys
 * @access Private
 */
router.get('/keys', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const keys = await enterpriseKeyService.getUserEnterpriseKeys(userId);

    res.json({
      success: true,
      data: keys
    });

  } catch (error) {
    console.error('Error fetching enterprise keys:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/enterprise/keys/:keyId
 * @desc Get specific enterprise key
 * @access Private
 */
router.get('/keys/:keyId', authenticateToken, async (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.user.id;

    const key = await enterpriseKeyService.getEnterpriseKey(keyId, userId);

    res.json({
      success: true,
      data: key
    });

  } catch (error) {
    console.error('Error fetching enterprise key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/enterprise/keys/:keyId
 * @desc Deactivate an enterprise key
 * @access Private
 */
router.delete('/keys/:keyId', authenticateToken, async (req, res) => {
  try {
    const { keyId } = req.params;
    const userId = req.user.id;

    const result = await enterpriseKeyService.deactivateKey(keyId, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error deactivating enterprise key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/enterprise/keys/supported-algorithms
 * @desc Get supported key algorithms
 * @access Public
 */
router.get('/keys/supported-algorithms', (req, res) => {
  try {
    const algorithms = enterpriseKeyService.getSupportedAlgorithms();

    res.json({
      success: true,
      data: algorithms
    });

  } catch (error) {
    console.error('Error fetching supported algorithms:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/enterprise/sign
 * @desc Sign a contract with enterprise KMS
 * @access Private
 */
router.post('/sign', authenticateToken, async (req, res) => {
  try {
    const { contractId, keyId, kmsConfig } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!contractId || !keyId || !kmsConfig) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractId, keyId, kmsConfig'
      });
    }

    const result = await enterpriseSigningService.signContract(
      contractId,
      userId,
      keyId,
      kmsConfig
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/enterprise/signing-requests
 * @desc Get user's signing requests
 * @access Private
 */
router.get('/signing-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await enterpriseSigningService.getUserSigningRequests(userId);

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Error fetching signing requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/enterprise/contracts/:contractId/signatures
 * @desc Get contract signatures
 * @access Private
 */
router.get('/contracts/:contractId/signatures', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const signatures = await enterpriseSigningService.getContractSignatures(contractId);

    res.json({
      success: true,
      data: signatures
    });

  } catch (error) {
    console.error('Error fetching contract signatures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/enterprise/verify
 * @desc Verify a contract signature
 * @access Private
 */
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { contractId, signature, keyId } = req.body;

    // Validate required fields
    if (!contractId || !signature || !keyId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractId, signature, keyId'
      });
    }

    const isValid = await enterpriseSigningService.verifyContractSignature(
      contractId,
      signature,
      keyId
    );

    res.json({
      success: true,
      data: {
        isValid: isValid,
        contractId: contractId,
        keyId: keyId
      }
    });

  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
