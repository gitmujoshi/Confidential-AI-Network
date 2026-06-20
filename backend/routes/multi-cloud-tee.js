/**
 * Multi-Cloud TEE Provisioning API Routes
 * 
 * Provides endpoints for provisioning and managing TEE environments
 * across multiple cloud providers (AWS, Azure, GCP, OCI).
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const TEEProvisioningService = require('../services/teeProvisioningService');
const ProvenanceTrackingService = require('../services/provenanceTrackingService');

// Initialize services
const teeProvisioningService = new TEEProvisioningService();
const provenanceService = new ProvenanceTrackingService();

/**
 * Get available TEE providers and their capabilities
 * GET /api/multi-cloud-tee/providers
 */
router.get('/providers',
  requireAuth,
  requireRole(['TSP', 'AppAdmin']),
  async (req, res) => {
    try {
      console.log('🔍 Getting available TEE providers');

      const providers = teeProvisioningService.getAvailableProviders();

      res.json({
        success: true,
        message: 'Available TEE providers retrieved successfully',
        data: {
          providers,
          totalProviders: Object.keys(providers).length,
          localModeEnabled: process.env.NODE_ENV === 'development' || process.env.TEE_MODE === 'local'
        }
      });

    } catch (error) {
      console.error('❌ Failed to get TEE providers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get TEE providers',
        error: error.message
      });
    }
  }
);

/**
 * Provision TEE environment in specified cloud provider
 * POST /api/multi-cloud-tee/provision
 */
router.post('/provision',
  requireAuth,
  requireRole(['TSP']),
  [
    body('provider').isIn(['aws', 'azure', 'gcp', 'oci', 'local']).withMessage('Invalid provider'),
    body('contractId').isString().notEmpty().withMessage('Contract ID is required'),
    body('region').optional().isString().withMessage('Region must be a string'),
    body('instanceType').optional().isString().withMessage('Instance type must be a string'),
    body('resources').optional().isObject().withMessage('Resources must be an object'),
    body('security').optional().isObject().withMessage('Security config must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        provider,
        contractId,
        region,
        instanceType,
        resources = {},
        security = {},
        ...otherConfig
      } = req.body;

      const { user } = req;

      console.log(`🚀 Provisioning TEE environment on ${provider} for contract ${contractId}`);

      // Initialize provenance tracking for provisioning
      const sessionId = `tee_provision_${contractId}_${Date.now()}`;
      const provenanceSession = await provenanceService.initializeProvenanceTracking({
        jobId: sessionId,
        contractId,
        environmentId: 'provisioning',
        userId: user.id,
        operation: 'TEE_PROVISIONING'
      });

      // Create provenance node for provisioning request
      await provenanceService.createProvenanceNode({
        nodeId: `tee_provision_request_${sessionId}`,
        type: 'EXECUTION',
        content: {
          operation: 'TEE_PROVISIONING_REQUEST',
          provider,
          contractId,
          region,
          instanceType,
          resources,
          security,
          requestedBy: user.id,
          timestamp: new Date()
        },
        metadata: {
          operation: 'TEE_PROVISIONING',
          provider,
          userRole: user.role
        }
      });

      // Provision environment
      const environment = await teeProvisioningService.provisionEnvironment({
        provider,
        contractId,
        region,
        instanceType,
        userId: user.id,
        resources,
        security,
        provenanceSessionId: provenanceSession.sessionId,
        ...otherConfig
      });

      // Create provenance node for successful provisioning
      await provenanceService.createProvenanceNode({
        nodeId: `tee_provision_complete_${sessionId}`,
        type: 'EXECUTION',
        content: {
          operation: 'TEE_PROVISIONING_COMPLETE',
          environmentId: environment.id,
          provider,
          status: environment.status,
          completedAt: new Date()
        },
        parentNodes: [`tee_provision_request_${sessionId}`],
        metadata: {
          operation: 'TEE_PROVISIONING_COMPLETE',
          environmentId: environment.id,
          success: true
        }
      });

      res.status(201).json({
        success: true,
        message: `TEE environment provisioning started on ${provider}`,
        data: {
          environmentId: environment.id,
          provider: environment.provider,
          status: environment.status,
          region: environment.region,
          instanceType: environment.instanceType || environment.vmSize || environment.machineType || environment.shape,
          estimatedCost: environment.estimatedCost,
          provenanceSessionId: provenanceSession.sessionId,
          monitoring: environment.monitoring,
          security: environment.security,
          createdAt: environment.createdAt
        }
      });

    } catch (error) {
      console.error('❌ TEE environment provisioning failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to provision TEE environment',
        error: error.message
      });
    }
  }
);

/**
 * Get cost estimation for TEE environment
 * POST /api/multi-cloud-tee/cost-estimate
 */
router.post('/cost-estimate',
  requireAuth,
  requireRole(['TSP', 'TDC', 'AppAdmin']),
  [
    body('provider').isIn(['aws', 'azure', 'gcp', 'oci', 'local']).withMessage('Invalid provider'),
    body('instanceType').optional().isString().withMessage('Instance type must be a string'),
    body('region').optional().isString().withMessage('Region must be a string'),
    body('resources').optional().isObject().withMessage('Resources must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { provider, instanceType, region, resources = {} } = req.body;

      console.log(`💰 Calculating cost estimate for ${provider} TEE environment`);

      const costEstimation = await teeProvisioningService.getCostEstimation({
        provider,
        instanceType,
        region,
        ...resources
      });

      res.json({
        success: true,
        message: 'Cost estimation calculated successfully',
        data: costEstimation
      });

    } catch (error) {
      console.error('❌ Cost estimation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate cost estimation',
        error: error.message
      });
    }
  }
);

/**
 * Get TEE environment status across all providers
 * GET /api/multi-cloud-tee/environments/:environmentId
 */
router.get('/environments/:environmentId',
  requireAuth,
  [
    param('environmentId').isString().notEmpty().withMessage('Environment ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { environmentId } = req.params;
      const { user } = req;

      console.log(`🔍 Getting TEE environment status: ${environmentId}`);

      const environment = await teeProvisioningService.getEnvironmentById(environmentId);

      if (!environment) {
        return res.status(404).json({
          success: false,
          message: 'TEE environment not found'
        });
      }

      // Check access permissions
      if (environment.provisionedBy !== user.id && user.role !== 'AppAdmin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this TEE environment'
        });
      }

      res.json({
        success: true,
        message: 'TEE environment status retrieved successfully',
        data: environment
      });

    } catch (error) {
      console.error('❌ Failed to get TEE environment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get TEE environment status',
        error: error.message
      });
    }
  }
);

/**
 * List all TEE environments for current user
 * GET /api/multi-cloud-tee/environments
 */
router.get('/environments',
  requireAuth,
  [
    query('provider').optional().isIn(['aws', 'azure', 'gcp', 'oci', 'local']).withMessage('Invalid provider'),
    query('status').optional().isIn(['PROVISIONING', 'ACTIVE', 'TERMINATED', 'ERROR']).withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { provider, status, limit = 20, offset = 0 } = req.query;
      const { user } = req;

      console.log(`🔍 Listing TEE environments for user: ${user.id}`);

      // Get all environments for the user
      let environments = await teeProvisioningService.getUserEnvironments(user.id);

      // Apply filters
      if (provider) {
        environments = environments.filter(env => env.providerName === provider);
      }

      if (status) {
        environments = environments.filter(env => env.status === status);
      }

      // Apply pagination
      const total = environments.length;
      environments = environments.slice(offset, offset + limit);

      // Format response data
      const formattedEnvironments = environments.map(env => ({
        id: env.id,
        provider: env.providerName,
        status: env.status,
        type: env.type,
        region: env.region,
        contractId: env.contractId,
        resources: env.resources,
        monitoring: env.monitoring,
        security: env.security,
        estimatedCost: env.estimatedCost,
        createdAt: env.createdAt,
        provisionedAt: env.provisionedAt
      }));

      res.json({
        success: true,
        message: 'TEE environments retrieved successfully',
        data: {
          environments: formattedEnvironments,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: offset + limit < total
          }
        }
      });

    } catch (error) {
      console.error('❌ Failed to list TEE environments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list TEE environments',
        error: error.message
      });
    }
  }
);

/**
 * Terminate TEE environment
 * DELETE /api/multi-cloud-tee/environments/:environmentId
 */
router.delete('/environments/:environmentId',
  requireAuth,
  requireRole(['TSP', 'AppAdmin']),
  [
    param('environmentId').isString().notEmpty().withMessage('Environment ID is required'),
    body('reason').optional().isString().withMessage('Termination reason must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { environmentId } = req.params;
      const { reason } = req.body;
      const { user } = req;

      console.log(`🗑️ Terminating TEE environment: ${environmentId}`);

      // Get environment details first
      const environment = await teeProvisioningService.getEnvironmentById(environmentId);

      if (!environment) {
        return res.status(404).json({
          success: false,
          message: 'TEE environment not found'
        });
      }

      // Check permissions
      if (environment.provisionedBy !== user.id && user.role !== 'AppAdmin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this TEE environment'
        });
      }

      // Initialize provenance tracking for termination
      const sessionId = `tee_terminate_${environmentId}_${Date.now()}`;
      const provenanceSession = await provenanceService.initializeProvenanceTracking({
        jobId: sessionId,
        contractId: environment.contractId,
        environmentId,
        userId: user.id,
        operation: 'TEE_TERMINATION'
      });

      // Create provenance node for termination
      await provenanceService.createProvenanceNode({
        nodeId: `tee_terminate_${sessionId}`,
        type: 'EXECUTION',
        content: {
          operation: 'TEE_TERMINATION',
          environmentId,
          provider: environment.provider,
          reason: reason || 'Manual termination',
          terminatedBy: user.id,
          timestamp: new Date()
        },
        metadata: {
          operation: 'TEE_TERMINATION',
          environmentId,
          provider: environment.provider
        }
      });

      // Terminate the environment
      const terminationResult = await teeProvisioningService.terminateEnvironment(environmentId);

      res.json({
        success: true,
        message: 'TEE environment termination initiated',
        data: {
          environmentId,
          provider: environment.provider,
          terminationResult,
          provenanceSessionId: provenanceSession.sessionId,
          terminatedBy: user.id,
          reason: reason || 'Manual termination',
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('❌ TEE environment termination failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to terminate TEE environment',
        error: error.message
      });
    }
  }
);

/**
 * Verify TEE attestation across providers
 * POST /api/multi-cloud-tee/environments/:environmentId/verify-attestation
 */
router.post('/environments/:environmentId/verify-attestation',
  requireAuth,
  [
    param('environmentId').isString().notEmpty().withMessage('Environment ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { environmentId } = req.params;
      const { user } = req;

      console.log(`🔐 Verifying TEE attestation for environment: ${environmentId}`);

      // Get environment details
      const environment = await teeProvisioningService.getEnvironmentById(environmentId);

      if (!environment) {
        return res.status(404).json({
          success: false,
          message: 'TEE environment not found'
        });
      }

      // Check permissions
      if (environment.provisionedBy !== user.id && user.role !== 'AppAdmin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this TEE environment'
        });
      }

      // Get the provider and verify attestation
      const provider = teeProvisioningService.providers[environment.providerName];
      if (!provider) {
        throw new Error(`Provider not found: ${environment.providerName}`);
      }

      const attestationResult = await provider.verifyAttestation(environmentId);

      res.json({
        success: true,
        message: 'TEE attestation verification completed',
        data: {
          environmentId,
          provider: environment.providerName,
          attestation: attestationResult,
          verifiedAt: new Date()
        }
      });

    } catch (error) {
      console.error('❌ TEE attestation verification failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify TEE attestation',
        error: error.message
      });
    }
  }
);

/**
 * Get multi-cloud TEE statistics
 * GET /api/multi-cloud-tee/stats
 */
router.get('/stats',
  requireAuth,
  requireRole(['TSP', 'AppAdmin']),
  async (req, res) => {
    try {
      const { user } = req;

      console.log(`📊 Getting multi-cloud TEE statistics for user: ${user.id}`);

      const environments = await teeProvisioningService.getUserEnvironments(user.id);
      const providers = teeProvisioningService.getAvailableProviders();

      const stats = {
        totalEnvironments: environments.length,
        byProvider: environments.reduce((acc, env) => {
          acc[env.providerName] = (acc[env.providerName] || 0) + 1;
          return acc;
        }, {}),
        byStatus: environments.reduce((acc, env) => {
          acc[env.status] = (acc[env.status] || 0) + 1;
          return acc;
        }, {}),
        totalCost: environments.reduce((sum, env) => sum + (env.estimatedCost || 0), 0),
        averageSecurityScore: environments.length > 0 
          ? Math.round(environments.reduce((sum, env) => sum + (env.security?.score || 0), 0) / environments.length)
          : 0,
        availableProviders: Object.keys(providers).length,
        recentEnvironments: environments
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(env => ({
            id: env.id,
            provider: env.providerName,
            status: env.status,
            createdAt: env.createdAt
          }))
      };

      res.json({
        success: true,
        message: 'Multi-cloud TEE statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('❌ Failed to get TEE statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get TEE statistics',
        error: error.message
      });
    }
  }
);

module.exports = router;
