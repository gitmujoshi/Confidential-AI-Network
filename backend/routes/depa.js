/**
 * DEPA ID Configuration API Routes
 * 
 * Provides endpoints for users to view DEPA ID configuration
 * and deployment information.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/depa/configuration
 * Get current deployment configuration for DEPA ID generation
 * Public endpoint for registration page
 */
router.get('/configuration', (req, res) => {
  try {
    const config = {
      deploymentId: process.env.DEPLOYMENT_ID || 'LOCAL',
      prefix: process.env.DEPLOYMENT_PREFIX || 'LOCAL',
      region: process.env.DEPLOYMENT_REGION || 'local',
      country: process.env.DEPLOYMENT_COUNTRY || 'Unknown',
      jurisdiction: process.env.DEPLOYMENT_JURISDICTION || 'LOCAL',
      dataResidency: process.env.DEPLOYMENT_DATA_RESIDENCY || 'LOCAL',
      regulatoryFramework: process.env.DEPLOYMENT_REGULATORY_FRAMEWORK?.split(',') || [],
      timezone: process.env.DEPLOYMENT_TIMEZONE || 'UTC',
      currency: process.env.DEPLOYMENT_CURRENCY || 'USD',
      language: process.env.DEPLOYMENT_LANGUAGE || 'en-US',
      depaIdFormat: `${process.env.DEPLOYMENT_PREFIX || 'LOCAL'}-{ENTITY_TYPE}-{UUID}`,
      entityTypes: ['TDC', 'TDP', 'CCRP', 'CONTRACT', 'DATASET']
    };
    
    res.json({ 
      success: true, 
      config,
      message: 'DEPA ID configuration retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting DEPA configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve DEPA configuration',
      details: error.message
    });
  }
});

/**
 * GET /api/depa/format-explanation
 * Get detailed explanation of DEPA ID format
 * Public endpoint for registration page
 */
router.get('/format-explanation', (req, res) => {
  try {
    const prefix = process.env.DEPLOYMENT_PREFIX || 'LOCAL';
    
    const explanation = {
      format: `${prefix}-{ENTITY_TYPE}-{UUID}`,
      components: [
        {
          name: 'Deployment Prefix',
          value: prefix,
          description: 'Identifies the deployment instance (e.g., LOCAL, PROD, US-EAST)',
          example: prefix
        },
        {
          name: 'Entity Type',
          value: '{ENTITY_TYPE}',
          description: 'Type of entity (TDC, TDP, CCRP, CONTRACT, DATASET)',
          examples: ['TDC', 'TDP', 'CCRP', 'CONTRACT', 'DATASET']
        },
        {
          name: 'UUID',
          value: '{UUID}',
          description: 'Globally unique identifier (36-character UUID)',
          example: '8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b'
        }
      ],
      examples: [
        `${prefix}-TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b`,
        `${prefix}-TDP-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d`,
        `${prefix}-CCRP-1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e`,
        `${prefix}-CONTRACT-2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f`,
        `${prefix}-DATASET-3d4e5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a`
      ]
    };
    
    res.json({ 
      success: true, 
      explanation,
      message: 'DEPA ID format explanation retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting DEPA format explanation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve DEPA format explanation',
      details: error.message
    });
  }
});

/**
 * GET /api/depa/user-info
 * Get user's DEPA ID and related information
 */
router.get('/user-info', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    const prefix = process.env.DEPLOYMENT_PREFIX || 'LOCAL';
    
    const userInfo = {
      userId: user.id,
      username: user.username,
      role: user.role,
      depaId: user.depaId,
      depaIdFormat: user.depaId ? `${prefix}-${user.role}-{UUID}` : null,
      entityType: user.role,
      deploymentPrefix: prefix,
      isGlobalDEPAId: user.depaId && user.depaId.startsWith(prefix),
      assignedAt: user.createdAt,
      lastUpdated: user.updatedAt
    };
    
    res.json({ 
      success: true, 
      userInfo,
      message: 'User DEPA ID information retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user DEPA info:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve user DEPA information',
      details: error.message
    });
  }
});

module.exports = router;
