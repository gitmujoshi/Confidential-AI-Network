/**
 * Global Deployment Routes
 * 
 * This module provides APIs for managing multi-deployment configurations
 * and global DEPA ID uniqueness across different countries and jurisdictions.
 * 
 * Features:
 * - Deployment registration and management
 * - Global DEPA ID generation and validation
 * - Cross-deployment uniqueness verification
 * - Jurisdiction-specific compliance
 * - Backward compatibility with existing DEPA IDs
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyAdmin } = require('../middleware/auth');
const GlobalDEPAIdService = require('../services/globalDEPAIdService');
const globalDEPAIdService = new GlobalDEPAIdService();

/**
 * GET /api/global-deployment/status
 * Get current deployment status and configuration
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const currentDeployment = globalDEPAIdService.getCurrentDeployment();
    const allDeployments = globalDEPAIdService.getAllDeployments();
    
    res.json({
      success: true,
      data: {
        currentDeployment,
        totalDeployments: allDeployments.length,
        deployments: allDeployments
      }
    });
  } catch (error) {
    console.error('❌ Error getting deployment status:', error);
    res.status(500).json({
      error: 'Failed to get deployment status',
      code: 'DEPLOYMENT_STATUS_ERROR'
    });
  }
});

/**
 * POST /api/global-deployment/register
 * Register a new deployment (admin only)
 */
router.post('/register', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const {
      deploymentId,
      prefix,
      region,
      country,
      jurisdiction,
      dataResidency,
      regulatoryFramework,
      timezone,
      currency,
      language
    } = req.body;

    // Validate required fields
    if (!deploymentId || !prefix || !region || !country) {
      return res.status(400).json({
        error: 'Missing required deployment information',
        code: 'MISSING_DEPLOYMENT_INFO'
      });
    }

    // Validate prefix uniqueness
    if (!globalDEPAIdService.validateDeploymentPrefix(prefix)) {
      return res.status(400).json({
        error: `Deployment prefix ${prefix} already exists`,
        code: 'DUPLICATE_PREFIX'
      });
    }

    const deploymentInfo = {
      deploymentId,
      prefix,
      region,
      country,
      jurisdiction: jurisdiction || 'US-Federal',
      dataResidency: dataResidency || 'US',
      regulatoryFramework: regulatoryFramework || [],
      timezone: timezone || 'UTC',
      currency: currency || 'USD',
      language: language || 'en-US'
    };

    const registered = globalDEPAIdService.registerDeployment(deploymentInfo);
    
    if (registered) {
      res.json({
        success: true,
        message: `Deployment ${deploymentId} registered successfully`,
        data: deploymentInfo
      });
    } else {
      res.status(400).json({
        error: 'Failed to register deployment',
        code: 'REGISTRATION_FAILED'
      });
    }
  } catch (error) {
    console.error('❌ Error registering deployment:', error);
    res.status(500).json({
      error: 'Failed to register deployment',
      code: 'REGISTRATION_ERROR'
    });
  }
});

/**
 * POST /api/global-deployment/generate
 * Generate global DEPA ID for entity type
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { entityType, deploymentPrefix, jurisdiction } = req.body;

    if (!entityType) {
      return res.status(400).json({
        error: 'Entity type is required',
        code: 'MISSING_ENTITY_TYPE'
      });
    }

    let globalDEPAId;

    if (jurisdiction) {
      // Generate jurisdiction-compliant DEPA ID
      globalDEPAId = globalDEPAIdService.generateJurisdictionCompliantDEPAId(entityType, jurisdiction);
    } else {
      // Generate standard global DEPA ID
      globalDEPAId = globalDEPAIdService.generateGlobalDEPAId(entityType, deploymentPrefix);
    }

    const deploymentInfo = globalDEPAIdService.extractDeploymentInfo(globalDEPAId);
    const verification = await globalDEPAIdService.verifyGlobalUniqueness(globalDEPAId);

    res.json({
      success: true,
      data: {
        globalDEPAId,
        entityType,
        deploymentInfo,
        verification,
        jurisdiction: jurisdiction || null
      }
    });
  } catch (error) {
    console.error('❌ Error generating global DEPA ID:', error);
    res.status(500).json({
      error: 'Failed to generate global DEPA ID',
      code: 'GENERATION_ERROR'
    });
  }
});

/**
 * POST /api/global-deployment/verify
 * Verify global uniqueness of DEPA ID
 */
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { globalDEPAId } = req.body;

    if (!globalDEPAId) {
      return res.status(400).json({
        error: 'Global DEPA ID is required',
        code: 'MISSING_DEPA_ID'
      });
    }

    const verification = await globalDEPAIdService.verifyGlobalUniqueness(globalDEPAId);
    const deploymentInfo = globalDEPAIdService.extractDeploymentInfo(globalDEPAId);

    res.json({
      success: true,
      data: {
        globalDEPAId,
        verification,
        deploymentInfo
      }
    });
  } catch (error) {
    console.error('❌ Error verifying global DEPA ID:', error);
    res.status(500).json({
      error: 'Failed to verify global DEPA ID',
      code: 'VERIFICATION_ERROR'
    });
  }
});

/**
 * GET /api/global-deployment/jurisdictions
 * Get available jurisdiction configurations
 */
router.get('/jurisdictions', authenticateToken, async (req, res) => {
  try {
    const jurisdictions = [
      {
        code: 'US-Federal',
        name: 'United States Federal',
        dataResidency: 'US',
        encryptionStandards: ['AES-256', 'FIPS-140-2'],
        auditRequirements: ['SOX', 'FedRAMP'],
        depaIdFormat: 'US-[REGION]-[ENTITY_TYPE]-[GUID]'
      },
      {
        code: 'EU-GDPR',
        name: 'European Union GDPR',
        dataResidency: 'EU',
        encryptionStandards: ['AES-256', 'GDPR-Article-32'],
        auditRequirements: ['GDPR', 'ISO-27001'],
        depaIdFormat: 'EU-[REGION]-[ENTITY_TYPE]-[GUID]'
      },
      {
        code: 'AP-Singapore',
        name: 'Asia Pacific Singapore',
        dataResidency: 'Singapore',
        encryptionStandards: ['AES-256', 'MAS-TRM'],
        auditRequirements: ['PDPA', 'ISO-27001'],
        depaIdFormat: 'AP-[REGION]-[ENTITY_TYPE]-[GUID]'
      },
      {
        code: 'CA-Federal',
        name: 'Canada Federal',
        dataResidency: 'Canada',
        encryptionStandards: ['AES-256', 'FIPS-140-2'],
        auditRequirements: ['PIPEDA', 'ISO-27001'],
        depaIdFormat: 'CA-[REGION]-[ENTITY_TYPE]-[GUID]'
      }
    ];

    res.json({
      success: true,
      data: {
        jurisdictions,
        totalJurisdictions: jurisdictions.length
      }
    });
  } catch (error) {
    console.error('❌ Error getting jurisdictions:', error);
    res.status(500).json({
      error: 'Failed to get jurisdictions',
      code: 'JURISDICTIONS_ERROR'
    });
  }
});

/**
 * POST /api/global-deployment/convert
 * Convert standard DEPA ID to global DEPA ID
 */
router.post('/convert', authenticateToken, async (req, res) => {
  try {
    const { standardDEPAId, deploymentPrefix } = req.body;

    if (!standardDEPAId) {
      return res.status(400).json({
        error: 'Standard DEPA ID is required',
        code: 'MISSING_STANDARD_DEPA_ID'
      });
    }

    // Check if already global
    if (globalDEPAIdService.isGlobalDEPAId(standardDEPAId)) {
      return res.status(400).json({
        error: 'DEPA ID is already in global format',
        code: 'ALREADY_GLOBAL'
      });
    }

    const globalDEPAId = globalDEPAIdService.convertToGlobalDEPAId(standardDEPAId, deploymentPrefix);
    const deploymentInfo = globalDEPAIdService.extractDeploymentInfo(globalDEPAId);

    res.json({
      success: true,
      data: {
        standardDEPAId,
        globalDEPAId,
        deploymentInfo
      }
    });
  } catch (error) {
    console.error('❌ Error converting DEPA ID:', error);
    res.status(500).json({
      error: 'Failed to convert DEPA ID',
      code: 'CONVERSION_ERROR'
    });
  }
});

/**
 * GET /api/global-deployment/test
 * Test global DEPA ID generation (admin only)
 */
router.get('/test', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const testResults = globalDEPAIdService.testGlobalGeneration();
    const currentDeployment = globalDEPAIdService.getCurrentDeployment();

    res.json({
      success: true,
      data: {
        testResults,
        currentDeployment,
        totalTests: Object.keys(testResults).length,
        passedTests: Object.values(testResults).filter(r => r.success).length,
        failedTests: Object.values(testResults).filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('❌ Error testing global DEPA ID generation:', error);
    res.status(500).json({
      error: 'Failed to test global DEPA ID generation',
      code: 'TEST_ERROR'
    });
  }
});

/**
 * GET /api/global-deployment/deployments
 * Get all registered deployments (admin only)
 */
router.get('/deployments', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const deployments = globalDEPAIdService.getAllDeployments();
    
    res.json({
      success: true,
      data: {
        deployments,
        totalDeployments: deployments.length,
        activeDeployments: deployments.filter(d => d.status === 'ACTIVE').length
      }
    });
  } catch (error) {
    console.error('❌ Error getting deployments:', error);
    res.status(500).json({
      error: 'Failed to get deployments',
      code: 'DEPLOYMENTS_ERROR'
    });
  }
});

/**
 * GET /api/global-deployment/deployment/:prefix
 * Get specific deployment information
 */
router.get('/deployment/:prefix', authenticateToken, async (req, res) => {
  try {
    const { prefix } = req.params;
    const deploymentInfo = globalDEPAIdService.getDeploymentInfo(prefix);

    if (!deploymentInfo) {
      return res.status(404).json({
        error: 'Deployment not found',
        code: 'DEPLOYMENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: deploymentInfo
    });
  } catch (error) {
    console.error('❌ Error getting deployment info:', error);
    res.status(500).json({
      error: 'Failed to get deployment info',
      code: 'DEPLOYMENT_INFO_ERROR'
    });
  }
});

/**
 * POST /api/global-deployment/validate-prefix
 * Validate deployment prefix uniqueness
 */
router.post('/validate-prefix', authenticateToken, async (req, res) => {
  try {
    const { prefix } = req.body;

    if (!prefix) {
      return res.status(400).json({
        error: 'Prefix is required',
        code: 'MISSING_PREFIX'
      });
    }

    const isValid = globalDEPAIdService.validateDeploymentPrefix(prefix);
    const existingDeployment = globalDEPAIdService.getDeploymentInfo(prefix);

    res.json({
      success: true,
      data: {
        prefix,
        isValid,
        available: isValid,
        existingDeployment: existingDeployment || null
      }
    });
  } catch (error) {
    console.error('❌ Error validating prefix:', error);
    res.status(500).json({
      error: 'Failed to validate prefix',
      code: 'PREFIX_VALIDATION_ERROR'
    });
  }
});

module.exports = router; 