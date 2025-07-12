/**
 * Enterprise DID Signing Routes
 * 
 * Provides secure REST API endpoints for enterprise DID signing operations.
 * All endpoints require authentication and proper authorization.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const SigningService = require('../services/signingService');

// Initialize the signing service
const signingService = new SigningService();

/**
 * @route POST /api/signing/sign
 * @desc Sign a message with enterprise DID
 * @access Private (authenticated users only)
 */
router.post('/sign', authenticateToken, async (req, res) => {
  try {
    const { message, did } = req.body;
    const userId = req.user?.localUser?.id || req.user?.userId;

    console.log('🔐 Signing request received:', { userId, did, messageLength: message?.length });

    // Validate request
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!did) {
      return res.status(400).json({ error: 'DID is required' });
    }

    // Validate user permission to sign with this DID
    const hasPermission = await signingService.validateUserSigningPermission(userId, did);
    if (!hasPermission) {
      console.log('❌ User not authorized to sign with DID:', { userId, did });
      return res.status(403).json({ error: 'Not authorized to sign with this DID' });
    }

    // Sign the message
    const result = await signingService.signMessage(message, did, userId);

    console.log('✅ Signing completed successfully for user:', userId);

    res.json({
      success: true,
      signature: result.signature,
      did: result.did,
      timestamp: result.timestamp
    });

  } catch (error) {
    console.error('❌ Signing endpoint error:', error.message);
    res.status(500).json({ 
      error: 'Signing failed', 
      details: error.message 
    });
  }
});

/**
 * @route GET /api/signing/dids
 * @desc Get available enterprise DIDs
 * @access Private (authenticated users only)
 */
router.get('/dids', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.localUser?.id || req.user?.userId;
    console.log('📋 User requesting available DIDs:', userId);

    const availableDIDs = signingService.getAvailableDIDs();
    
    // Get public keys for each DID
    const didsWithKeys = availableDIDs.map(did => {
      try {
        const publicKey = signingService.getPublicKey(did);
        return {
          did,
          publicKey,
          available: true
        };
      } catch (error) {
        return {
          did,
          available: false,
          error: error.message
        };
      }
    });

    res.json({
      success: true,
      dids: didsWithKeys
    });

  } catch (error) {
    console.error('❌ Error getting available DIDs:', error.message);
    res.status(500).json({ 
      error: 'Failed to get available DIDs', 
      details: error.message 
    });
  }
});

/**
 * @route GET /api/signing/public-key/:did
 * @desc Get public key for a specific DID
 * @access Private (authenticated users only)
 */
router.get('/public-key/:did', authenticateToken, async (req, res) => {
  try {
    const { did } = req.params;
    const userId = req.user?.localUser?.id || req.user?.userId;

    console.log('🔑 User requesting public key for DID:', { userId, did });

    const publicKey = signingService.getPublicKey(did);

    res.json({
      success: true,
      did,
      publicKey
    });

  } catch (error) {
    console.error('❌ Error getting public key:', error.message);
    res.status(404).json({ 
      error: 'Public key not found', 
      details: error.message 
    });
  }
});

/**
 * @route POST /api/signing/validate-permission
 * @desc Validate if user can sign with a specific DID
 * @access Private (authenticated users only)
 */
router.post('/validate-permission', authenticateToken, async (req, res) => {
  try {
    const { did } = req.body;
    const userId = req.user?.localUser?.id || req.user?.userId;

    console.log('🔐 Validating user permission:', { userId, did });

    const hasPermission = await signingService.validateUserSigningPermission(userId, did);

    res.json({
      success: true,
      hasPermission,
      userId,
      did
    });

  } catch (error) {
    console.error('❌ Error validating permission:', error.message);
    res.status(500).json({ 
      error: 'Failed to validate permission', 
      details: error.message 
    });
  }
});

/**
 * @route POST /api/signing/test
 * @desc Test signing with a simple message
 * @access Private (authenticated users only)
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { did } = req.body;
    const userId = req.user?.localUser?.id || req.user?.userId;

    console.log('🧪 Testing signing for user:', { userId, did });

    // Create a test message
    const testMessage = `Test message for enterprise signing by user ${userId} at ${new Date().toISOString()}`;

    // Validate user permission
    const hasPermission = await signingService.validateUserSigningPermission(userId, did);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Not authorized to sign with this DID' });
    }

    // Sign the test message
    const result = await signingService.signMessage(testMessage, did, userId);

    res.json({
      success: true,
      testMessage,
      signature: result.signature,
      did: result.did,
      timestamp: result.timestamp
    });

  } catch (error) {
    console.error('❌ Test signing error:', error.message);
    res.status(500).json({ 
      error: 'Test signing failed', 
      details: error.message 
    });
  }
});

module.exports = router; 