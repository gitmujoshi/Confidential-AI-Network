/**
 * DID Management Routes
 * 
 * Handles DID-specific operations including:
 * - DID verification
 * - DID resolution
 * - DID information retrieval
 * - DID availability checking
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const didService = require('../services/didService');
const db = require('../models');

const router = express.Router();

// Rate limiting for DID operations
const didRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many DID operations, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Logging middleware for DID events
const logDIDEvent = (eventType) => (req, res, next) => {
  console.log(`🔐 [DID] ${eventType}: ${req.ip} - ${req.method} ${req.path}`);
  next();
};

/**
 * POST /api/did/verify
 * Verify ownership of a user-provided DID (both did:ethr and did:web)
 */
router.post('/verify', didRateLimit, logDIDEvent('VERIFY_DID'), async (req, res) => {
  try {
    const { did, walletAddress, signature, message } = req.body;

    // Validate required fields
    if (!did || !walletAddress || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS',
        details: {
          required: ['did', 'walletAddress', 'signature', 'message'],
          provided: Object.keys(req.body)
        }
      });
    }

    // Validate DID format
    if (!didService.validateDIDFormat(did)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid DID format',
        code: 'INVALID_DID_FORMAT',
        details: {
          supported: didService.supportedMethods,
          provided: did
        }
      });
    }

    // Check if DID is already registered
    const isAvailable = await didService.isDIDAvailable(did, db);
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        error: 'DID is already registered by another user',
        code: 'DID_ALREADY_EXISTS'
      });
    }

    // Verify DID ownership
    const isVerified = await didService.verifyDIDOwnership(
      did,
      walletAddress,
      signature,
      message
    );

    if (isVerified) {
      res.json({
        success: true,
        message: 'DID ownership verified successfully',
        verification: {
          did: did,
          verified: true,
          method: 'signature',
          verifiedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'DID ownership verification failed',
        code: 'DID_VERIFICATION_FAILED'
      });
    }

  } catch (error) {
    console.error('❌ DID verification error:', error);
    res.status(500).json({
      success: false,
      error: 'DID verification failed',
      code: 'DID_VERIFICATION_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/did/info/:did
 * Get information about a specific DID
 */
router.get('/info/:did', didRateLimit, logDIDEvent('GET_DID_INFO'), async (req, res) => {
  try {
    const { did } = req.params;

    // Validate DID format
    if (!didService.validateDIDFormat(did)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid DID format',
        code: 'INVALID_DID_FORMAT',
        details: {
          supported: didService.supportedMethods,
          provided: did
        }
      });
    }

    // Get DID information
    const didInfo = await didService.getDIDInfo(did);

    res.json({
      success: true,
      didInfo: {
        did: didInfo.did,
        method: didInfo.method,
        identifier: didInfo.identifier,
        verificationMethods: didInfo.didDocument.verificationMethod,
        authentication: didInfo.didDocument.authentication,
        assertionMethod: didInfo.didDocument.assertionMethod,
        created: didInfo.didDocument.created,
        updated: didInfo.didDocument.updated
      }
    });

  } catch (error) {
    console.error('❌ Get DID info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get DID information',
      code: 'DID_INFO_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/did/resolve/:did
 * Resolve a DID to its document (supports both did:ethr and did:web)
 */
router.get('/resolve/:did', didRateLimit, logDIDEvent('RESOLVE_DID'), async (req, res) => {
  try {
    const { did } = req.params;

    // Validate DID format
    if (!didService.validateDIDFormat(did)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid DID format',
        code: 'INVALID_DID_FORMAT',
        details: {
          supported: didService.supportedMethods,
          provided: did
        }
      });
    }

    // Resolve the DID
    const { didDocument, metadata } = await didService.resolveDID(did);

    res.json({
      success: true,
      didDocument: didDocument
    });

  } catch (error) {
    console.error('❌ DID resolution error:', error);
    res.status(500).json({
      success: false,
      error: 'DID resolution failed',
      code: 'DID_RESOLUTION_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/did/check/:did
 * Check if a DID is available for registration
 */
router.get('/check/:did', didRateLimit, logDIDEvent('CHECK_DID'), async (req, res) => {
  try {
    const { did } = req.params;

    // Validate DID format
    if (!didService.validateDIDFormat(did)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid DID format',
        code: 'INVALID_DID_FORMAT',
        details: {
          supported: didService.supportedMethods,
          provided: did
        }
      });
    }

    // Check availability
    const isAvailable = await didService.isDIDAvailable(did, db);

    res.json({
      success: true,
      available: isAvailable,
      did: did,
      message: isAvailable ? 'DID is available for registration' : 'DID is already registered'
    });

  } catch (error) {
    console.error('❌ DID availability check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check DID availability',
      code: 'DID_CHECK_ERROR',
      details: error.message
    });
  }
});

/**
 * POST /api/did/create-system
 * Create a system-generated DID for a wallet address
 */
router.post('/create-system', didRateLimit, logDIDEvent('CREATE_SYSTEM_DID'), async (req, res) => {
  try {
    const { walletAddress, network = 'goerli' } = req.body;

    // Validate wallet address
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required',
        code: 'WALLET_ADDRESS_REQUIRED'
      });
    }

    // Create system DID
    const did = didService.createSystemDID(walletAddress, network);

    res.json({
      success: true,
      did: did,
      walletAddress: walletAddress,
      network: network,
      method: 'ethr',
      source: 'SYSTEM_GENERATED'
    });

  } catch (error) {
    console.error('❌ System DID creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create system DID',
      code: 'SYSTEM_DID_CREATION_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/did/supported-methods
 * Get list of supported DID methods
 */
router.get('/supported-methods', logDIDEvent('GET_SUPPORTED_METHODS'), async (req, res) => {
  try {
    res.json({
      success: true,
      methods: didService.supportedMethods.map(method => ({
        method: method,
        description: getMethodDescription(method),
        example: getMethodExample(method)
      }))
    });
  } catch (error) {
    console.error('❌ Get supported methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported methods',
      code: 'SUPPORTED_METHODS_ERROR'
    });
  }
});

/**
 * Helper function to get method description
 */
function getMethodDescription(method) {
  const descriptions = {
    ethr: 'Ethereum-based DIDs using wallet addresses',
    web: 'Web-based DIDs hosted on web domains',
    key: 'Self-contained DIDs with embedded public keys'
  };
  return descriptions[method] || 'Unknown DID method';
}

/**
 * Helper function to get method example
 */
function getMethodExample(method) {
  const examples = {
    ethr: 'did:ethr:goerli:0x1234567890abcdef...',
    web: 'did:web:company.com:user:alice',
    key: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
  };
  return examples[method] || 'No example available';
}

module.exports = router; 