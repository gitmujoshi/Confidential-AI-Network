const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const contractSigningService = require('../services/contractSigningService');
const enterpriseSigningService = require('../services/enterpriseSigningService');

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

// Get signing configuration (public endpoint)
router.get('/config', (req, res) => {
  try {
    const config = contractSigningService.getSigningConfig();
    res.json(config);
  } catch (error) {
    console.error('Error fetching signing config:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch signing configuration' 
    });
  }
});

// ============================================================================
// TRADITIONAL SIGNING ENDPOINTS
// ============================================================================

// Get user's signing keys
router.get('/keys', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const result = await contractSigningService.getUserSigningKeys(userId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching user signing keys:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch signing keys' 
    });
  }
});

// Generate new signing key
router.post('/keys/generate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { algorithm } = req.body;
    const result = await contractSigningService.generateSigningKey(userId, algorithm);
    res.json(result);
  } catch (error) {
    console.error('Error generating signing key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate signing key' 
    });
  }
});

// Revoke signing key
router.delete('/keys/:keyId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { keyId } = req.params;
    const result = await contractSigningService.revokeSigningKey(userId, keyId);
    res.json(result);
  } catch (error) {
    console.error('Error revoking signing key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to revoke signing key' 
    });
  }
});

// Sign a contract
router.post('/sign', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { contractId, keyId, contractHash } = req.body;

    if (!contractId || !keyId || !contractHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractId, keyId, contractHash'
      });
    }

    const result = await contractSigningService.signContract(contractId, userId, keyId, contractHash);
    res.json(result);
  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sign contract' 
    });
  }
});

// Verify signature
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { contractId, signature, keyId, contractHash } = req.body;

    if (!contractId || !signature || !keyId || !contractHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractId, signature, keyId, contractHash'
      });
    }

    const result = await contractSigningService.verifySignature(contractId, signature, keyId, contractHash);
    res.json(result);
  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify signature' 
    });
  }
});

// Get contract signatures
router.get('/contracts/:contractId/signatures', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const result = await contractSigningService.getContractSignatures(contractId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching contract signatures:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch contract signatures' 
    });
  }
});

// Get signing events for a contract
router.get('/contracts/:contractId/events', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const result = await contractSigningService.getSigningEvents(contractId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching signing events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch signing events' 
    });
  }
});

// Get signing statistics for user
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const result = await contractSigningService.getSigningStats(userId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching signing stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch signing stats' 
    });
  }
});

// ============================================================================
// ENTERPRISE SIGNING ENDPOINTS
// ============================================================================

// Register enterprise key
router.post('/enterprise/keys/register', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { publicKey, provider, algorithm, metadata } = req.body;

    if (!publicKey || !provider || !algorithm) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: publicKey, provider, algorithm'
      });
    }

    const result = await enterpriseSigningService.registerEnterpriseKey(
      userId, 
      publicKey, 
      provider, 
      algorithm, 
      metadata
    );
    res.json(result);
  } catch (error) {
    console.error('Error registering enterprise key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to register enterprise key' 
    });
  }
});

// Get enterprise keys
router.get('/enterprise/keys', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const result = await enterpriseSigningService.getEnterpriseKeys(userId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching enterprise keys:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch enterprise keys' 
    });
  }
});

// Get specific enterprise key
router.get('/enterprise/keys/:keyId', authenticateToken, async (req, res) => {
  try {
    const { keyId } = req.params;
    const result = await enterpriseSigningService.getEnterpriseKey(keyId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching enterprise key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch enterprise key' 
    });
  }
});

// Deactivate enterprise key
router.delete('/enterprise/keys/:keyId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { keyId } = req.params;
    const result = await enterpriseSigningService.deactivateEnterpriseKey(userId, keyId);
    res.json(result);
  } catch (error) {
    console.error('Error deactivating enterprise key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to deactivate enterprise key' 
    });
  }
});

// Get supported algorithms for enterprise signing
router.get('/enterprise/algorithms', authenticateToken, async (req, res) => {
  try {
    const result = await enterpriseSigningService.getSupportedAlgorithms();
    res.json(result);
  } catch (error) {
    console.error('Error fetching enterprise algorithms:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch enterprise algorithms' 
    });
  }
});

// Initiate enterprise signing
router.post('/enterprise/sign', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { contractId, enterpriseKeyId, contractHash, kmsConfig } = req.body;

    if (!contractId || !enterpriseKeyId || !contractHash || !kmsConfig) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractId, enterpriseKeyId, contractHash, kmsConfig'
      });
    }

    const result = await enterpriseSigningService.initiateEnterpriseSigning(
      contractId, 
      userId, 
      enterpriseKeyId, 
      contractHash, 
      kmsConfig
    );
    res.json(result);
  } catch (error) {
    console.error('Error initiating enterprise signing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate enterprise signing' 
    });
  }
});

// Verify enterprise signature
router.post('/enterprise/verify', authenticateToken, async (req, res) => {
  try {
    const { contractId, signature, enterpriseKeyId, contractHash } = req.body;

    if (!contractId || !signature || !enterpriseKeyId || !contractHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractId, signature, enterpriseKeyId, contractHash'
      });
    }

    const result = await enterpriseSigningService.verifyEnterpriseSignature(
      contractId, 
      signature, 
      enterpriseKeyId, 
      contractHash
    );
    res.json(result);
  } catch (error) {
    console.error('Error verifying enterprise signature:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify enterprise signature' 
    });
  }
});

// Get signing requests
router.get('/enterprise/signing-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const result = await enterpriseSigningService.getSigningRequests(userId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching signing requests:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch signing requests' 
    });
  }
});

// Get contract signatures (unified - both traditional and enterprise)
router.get('/contracts/:contractId/signatures', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    const result = await enterpriseSigningService.getContractSignatures(contractId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching contract signatures:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch contract signatures' 
    });
  }
});

// ============================================================================
// KMS CONFIGURATION ENDPOINTS
// ============================================================================

// Test KMS connection
router.post('/enterprise/kms/test', authenticateToken, async (req, res) => {
  try {
    const { provider, credentials, keyId, region, vaultUrl } = req.body;

    if (!provider || !credentials || !keyId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: provider, credentials, keyId'
      });
    }

    // Test connection using cloud KMS service
    const cloudKmsService = require('../services/cloudKmsService');
    
    try {
      const testResult = await cloudKmsService.testConnection(provider, {
        credentials,
        keyId,
        region,
        vaultUrl
      });

      res.json({
        success: true,
        message: 'KMS connection successful',
        provider,
        keyId,
        testResult
      });
    } catch (testError) {
      res.status(400).json({
        success: false,
        error: `KMS connection failed: ${testError.message}`,
        provider,
        keyId
      });
    }
  } catch (error) {
    console.error('Error testing KMS connection:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test KMS connection' 
    });
  }
});

// Save KMS configuration
router.post('/enterprise/kms/save', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { provider, credentials, keyId, region, vaultUrl, metadata } = req.body;

    if (!provider || !credentials || !keyId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: provider, credentials, keyId'
      });
    }

    // Store KMS configuration securely
    const secretManager = require('../services/secretManager');
    const secretName = `kms-config-${userId}-${provider}`;
    
    const kmsConfig = {
      provider,
      credentials,
      keyId,
      region,
      vaultUrl,
      metadata: {
        ...metadata,
        userId,
        savedAt: new Date().toISOString()
      }
    };

    // Store in secret manager
    await secretManager.storeCredentials(secretName, 'VAULT', kmsConfig, provider);

    res.json({
      success: true,
      message: 'KMS configuration saved successfully',
      secretName,
      provider,
      keyId
    });
  } catch (error) {
    console.error('Error saving KMS configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save KMS configuration' 
    });
  }
});

// Get KMS configuration
router.get('/enterprise/kms/config', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.localUser?.id || req.user.id;
    const { provider } = req.query;

    if (!provider) {
      return res.status(400).json({
        success: false,
        error: 'Provider parameter is required'
      });
    }

    // Retrieve KMS configuration
    const secretManager = require('../services/secretManager');
    const secretName = `kms-config-${userId}-${provider}`;
    
    try {
      const kmsConfig = await secretManager.getCredentials(secretName, 'VAULT');
      
      // Remove sensitive credentials from response
      const safeConfig = {
        provider: kmsConfig.provider,
        keyId: kmsConfig.keyId,
        region: kmsConfig.region,
        vaultUrl: kmsConfig.vaultUrl,
        metadata: kmsConfig.metadata
      };

      res.json({
        success: true,
        config: safeConfig
      });
    } catch (secretError) {
      res.status(404).json({
        success: false,
        error: 'KMS configuration not found'
      });
    }
  } catch (error) {
    console.error('Error retrieving KMS configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve KMS configuration' 
    });
  }
});

module.exports = router;
