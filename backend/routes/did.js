/**
 * DID Management Routes
 * 
 * Handles DID-specific operations including:
 * - DID verification
 * - DID resolution
 * - DID information retrieval
 * - DID availability checking
 * - Enterprise DID management
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken, requireRole } = require('../middleware/auth');
const didService = require('../services/didService');
const db = require('../models');

const router = express.Router();

// Rate limiting for DID operations
const didRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many DID requests, please try again later',
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
    const encodedDID = decodeURIComponent(did);

    console.log(`🔍 Resolving DID: ${encodedDID}`);

    // Validate DID format
    if (!didService.validateDIDFormat(encodedDID)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid DID format',
        code: 'INVALID_DID_FORMAT',
        details: {
          supported: didService.supportedMethods,
          provided: encodedDID
        }
      });
    }

    // Resolve the DID
    const { didDocument, metadata } = await didService.resolveDID(encodedDID);

    res.json({
      success: true,
      did: encodedDID,
      didDocument: didDocument,
      metadata: metadata
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
    const encodedDID = decodeURIComponent(did);

    console.log(`🔍 Checking DID availability: ${encodedDID}`);

    // Validate DID format
    if (!didService.validateDIDFormat(encodedDID)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid DID format',
        code: 'INVALID_DID_FORMAT',
        details: {
          supported: didService.supportedMethods,
          provided: encodedDID
        }
      });
    }

    // Check availability
    const isAvailable = await didService.isDIDAvailable(encodedDID, db);

    res.json({
      success: true,
      did: encodedDID,
      available: isAvailable
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
      })),
      enterprise: {
        allowedDomains: didService.enterpriseConfig.allowedDomains.length > 0,
        requireHttps: didService.enterpriseConfig.requireHttps,
        maxRedirects: didService.enterpriseConfig.maxRedirects,
        timeout: didService.enterpriseConfig.timeout
      }
    });
  } catch (error) {
    console.error('❌ Get supported methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported methods',
      code: 'SUPPORTED_METHODS_ERROR',
      details: error.message
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

/**
 * GET /api/did/enterprise/validate/:did
 * Validate DID for enterprise use
 */
router.get('/enterprise/validate/:did', didRateLimit, async (req, res) => {
  try {
    const { did } = req.params;
    const encodedDID = decodeURIComponent(did);

    console.log(`🏢 Validating enterprise DID: ${encodedDID}`);

    if (!didService.validateDIDFormat(encodedDID)) {
      return res.status(400).json({
        error: 'Invalid DID format',
        code: 'INVALID_DID_FORMAT',
        details: {
          supported: didService.supportedMethods,
          provided: encodedDID
        }
      });
    }

    const parsed = didService.parseDID(encodedDID);
    
    // Enterprise-specific validation
    const validation = {
      did: encodedDID,
      method: parsed.method,
      isValid: true,
      enterprise: {
        isEnterprise: false,
        hasServices: false,
        serviceTypes: [],
        verificationMethods: 0,
        domainRestricted: false,
        recommendations: []
      }
    };

    try {
      const { didDocument, metadata } = await didService.resolveDID(encodedDID);
      
      if (metadata.enterprise) {
        validation.enterprise = metadata.enterprise;
      }

      // Check for enterprise indicators
      if (didDocument.service && didDocument.service.length > 0) {
        validation.enterprise.hasServices = true;
        validation.enterprise.serviceTypes = didDocument.service.map(s => s.type);
        
        // Check for enterprise service types
        const enterpriseServices = ['LinkedDomains', 'LinkedIn', 'GitHub', 'Twitter', 'Organization', 'LegalEntity'];
        const hasEnterpriseServices = validation.enterprise.serviceTypes.some(type => 
          enterpriseServices.some(es => type.includes(es))
        );
        
        if (hasEnterpriseServices) {
          validation.enterprise.isEnterprise = true;
        }
      }

      validation.enterprise.verificationMethods = didDocument.verificationMethod?.length || 0;

      // Domain restrictions
      if (didService.enterpriseConfig.allowedDomains.length > 0) {
        validation.enterprise.domainRestricted = true;
        const domain = parsed.method === 'web' ? parsed.identifier.split(':')[0] : null;
        
        if (domain) {
          const isAllowed = didService.enterpriseConfig.allowedDomains.some(allowedDomain => {
            return domain === allowedDomain || domain.endsWith('.' + allowedDomain);
          });
          
          if (!isAllowed) {
            validation.isValid = false;
            validation.enterprise.recommendations.push('Domain not in allowed list');
          }
        }
      }

      // Recommendations
      if (!validation.enterprise.hasServices) {
        validation.enterprise.recommendations.push('Add LinkedDomains service for enterprise use');
      }
      
      if (validation.enterprise.verificationMethods < 2) {
        validation.enterprise.recommendations.push('Consider adding multiple verification methods for redundancy');
      }

    } catch (resolutionError) {
      validation.isValid = false;
      validation.enterprise.recommendations.push('DID resolution failed: ' + resolutionError.message);
    }

    res.json({
      success: true,
      ...validation
    });

  } catch (error) {
    console.error('❌ Enterprise DID validation error:', error);
    res.status(500).json({
      error: 'Enterprise DID validation failed',
      code: 'ENTERPRISE_VALIDATION_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/did/enterprise/domains
 * Get allowed domains for enterprise DID:web
 */
router.get('/enterprise/domains', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    res.json({
      success: true,
      allowedDomains: didService.enterpriseConfig.allowedDomains,
      requireHttps: didService.enterpriseConfig.requireHttps,
      maxRedirects: didService.enterpriseConfig.maxRedirects,
      timeout: didService.enterpriseConfig.timeout
    });
  } catch (error) {
    console.error('❌ Get enterprise domains error:', error);
    res.status(500).json({
      error: 'Failed to get enterprise domains',
      code: 'ENTERPRISE_DOMAINS_ERROR',
      details: error.message
    });
  }
});

/**
 * POST /api/did/enterprise/domains
 * Update allowed domains for enterprise DID:web (admin only)
 */
router.post('/enterprise/domains', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { allowedDomains, requireHttps, maxRedirects, timeout } = req.body;

    // Update enterprise configuration
    if (allowedDomains) {
      didService.enterpriseConfig.allowedDomains = Array.isArray(allowedDomains) ? allowedDomains : [];
    }
    
    if (typeof requireHttps === 'boolean') {
      didService.enterpriseConfig.requireHttps = requireHttps;
    }
    
    if (typeof maxRedirects === 'number') {
      didService.enterpriseConfig.maxRedirects = maxRedirects;
    }
    
    if (typeof timeout === 'number') {
      didService.enterpriseConfig.timeout = timeout;
    }

    console.log('✅ Enterprise DID configuration updated:', didService.enterpriseConfig);

    res.json({
      success: true,
      message: 'Enterprise DID configuration updated successfully',
      config: didService.enterpriseConfig
    });

  } catch (error) {
    console.error('❌ Update enterprise domains error:', error);
    res.status(500).json({
      error: 'Failed to update enterprise domains',
      code: 'ENTERPRISE_DOMAINS_UPDATE_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/did/cache/stats
 * Get DID cache statistics (admin only)
 */
router.get('/cache/stats', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const stats = didService.getCacheStats();
    
    res.json({
      success: true,
      cache: stats
    });
  } catch (error) {
    console.error('❌ Get cache stats error:', error);
    res.status(500).json({
      error: 'Failed to get cache statistics',
      code: 'CACHE_STATS_ERROR',
      details: error.message
    });
  }
});

/**
 * POST /api/did/cache/clear
 * Clear DID cache (admin only)
 */
router.post('/cache/clear', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    didService.clearCache();
    
    res.json({
      success: true,
      message: 'DID cache cleared successfully'
    });
  } catch (error) {
    console.error('❌ Clear cache error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      code: 'CACHE_CLEAR_ERROR',
      details: error.message
    });
  }
});

/**
 * GET /api/did/supported-methods
 * Get supported DID methods
 */
router.get('/supported-methods', async (req, res) => {
  try {
    res.json({
      success: true,
      methods: didService.supportedMethods,
      enterprise: {
        allowedDomains: didService.enterpriseConfig.allowedDomains.length > 0,
        requireHttps: didService.enterpriseConfig.requireHttps,
        maxRedirects: didService.enterpriseConfig.maxRedirects,
        timeout: didService.enterpriseConfig.timeout
      }
    });
  } catch (error) {
    console.error('❌ Get supported methods error:', error);
    res.status(500).json({
      error: 'Failed to get supported methods',
      code: 'SUPPORTED_METHODS_ERROR',
      details: error.message
    });
  }
});

/**
 * POST /api/did/create-system
 * Create a system-generated DID (admin only)
 */
router.post('/create-system', authenticateToken, requireRole(['ADMIN', 'TDP']), didRateLimit, async (req, res) => {
  try {
    const { walletAddress, network, method } = req.body;

    console.log(`🔧 Creating system DID: ${method} for wallet: ${walletAddress}`);

    if (!walletAddress || !method) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_REQUIRED_FIELDS',
        details: {
          required: ['walletAddress', 'method'],
          provided: Object.keys(req.body)
        }
      });
    }

    let did;
    switch (method) {
      case 'ethr':
        did = didService.createSystemDID(walletAddress, network || 'goerli');
        break;
      case 'web':
        const { domain, path } = req.body;
        if (!domain) {
          return res.status(400).json({
            error: 'Domain required for did:web',
            code: 'MISSING_DOMAIN'
          });
        }
        did = didService.createSystemWebDID(domain, path || '');
        break;
      default:
        return res.status(400).json({
          error: 'Unsupported DID method',
          code: 'UNSUPPORTED_DID_METHOD',
          details: {
            supported: ['ethr', 'web'],
            provided: method
          }
        });
    }

    res.json({
      success: true,
      did,
      method,
      walletAddress,
      network: network || 'goerli'
    });

  } catch (error) {
    console.error('❌ System DID creation error:', error);
    res.status(500).json({
      error: 'Failed to create system DID',
      code: 'SYSTEM_DID_CREATION_ERROR',
      details: error.message
    });
  }
});

module.exports = router; 