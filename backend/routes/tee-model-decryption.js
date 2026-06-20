/**
 * TEE Model Decryption API Routes
 * 
 * Handles secure AI model decryption within Trusted Execution Environments (TEE)
 * for intellectual property protection and secure model access.
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const TEEModelDecryptionService = require('../services/teeModelDecryptionService');

// Initialize TEE decryption service
const teeDecryptionService = new TEEModelDecryptionService();

/**
 * Create TEE model decryption session
 * POST /api/tee/models/decrypt/session
 */
router.post('/models/decrypt/session',
  requireAuth,
  requireRole(['TDC', 'TDP', 'TSP']),
  [
    body('modelId').isString().notEmpty().withMessage('Model ID is required'),
    body('teeEnvironmentId').isString().notEmpty().withMessage('TEE environment ID is required'),
    body('contractId').optional().isString().withMessage('Contract ID must be a string'),
    body('purposes').optional().isArray().withMessage('Purposes must be an array'),
    body('timeLimit').optional().isInt({ min: 3600000, max: 86400000 }).withMessage('Time limit must be between 1 hour and 24 hours')
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
        modelId,
        teeEnvironmentId,
        contractId,
        purposes = ['training'],
        timeLimit = 24 * 60 * 60 * 1000 // 24 hours default
      } = req.body;

      const { user } = req;

      console.log(`🔐 Creating TEE decryption session for model ${modelId} by user ${user.id}`);

      // Create decryption session
      const session = await teeDecryptionService.createDecryptionSession({
        modelId,
        contractId,
        userId: user.id,
        teeEnvironmentId,
        requestedBy: user.name || user.email,
        purposes,
        timeLimit
      });

      res.status(201).json({
        success: true,
        message: 'TEE decryption session created successfully',
        data: session
      });

    } catch (error) {
      console.error('❌ TEE decryption session creation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create TEE decryption session',
        error: error.message
      });
    }
  }
);

/**
 * Decrypt model in TEE environment
 * POST /api/tee/models/decrypt/:sessionId
 */
router.post('/models/decrypt/:sessionId',
  requireAuth,
  [
    param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
    body('decryptionParams').optional().isObject().withMessage('Decryption params must be an object')
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

      const { sessionId } = req.params;
      const { decryptionParams = {} } = req.body;
      const { user } = req;

      console.log(`🔓 Decrypting model in TEE for session ${sessionId}`);

      // Verify user has access to this session
      const sessionStatus = teeDecryptionService.getSessionStatus(sessionId);
      if (!sessionStatus.found) {
        return res.status(404).json({
          success: false,
          message: 'Decryption session not found'
        });
      }

      if (sessionStatus.userId !== user.id && user.role !== 'AppAdmin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this decryption session'
        });
      }

      // Perform decryption
      const decryptionResult = await teeDecryptionService.decryptModelInTEE(sessionId, decryptionParams);

      res.json({
        success: true,
        message: 'Model decrypted successfully in TEE',
        data: decryptionResult
      });

    } catch (error) {
      console.error('❌ TEE model decryption failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to decrypt model in TEE',
        error: error.message
      });
    }
  }
);

/**
 * Get decryption session status
 * GET /api/tee/models/decrypt/:sessionId/status
 */
router.get('/models/decrypt/:sessionId/status',
  requireAuth,
  [
    param('sessionId').isString().notEmpty().withMessage('Session ID is required')
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

      const { sessionId } = req.params;
      const { user } = req;

      const sessionStatus = teeDecryptionService.getSessionStatus(sessionId);
      
      if (!sessionStatus.found) {
        return res.status(404).json({
          success: false,
          message: 'Decryption session not found'
        });
      }

      // Check access permissions
      if (sessionStatus.userId !== user.id && user.role !== 'AppAdmin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this decryption session'
        });
      }

      res.json({
        success: true,
        message: 'Session status retrieved successfully',
        data: sessionStatus
      });

    } catch (error) {
      console.error('❌ Failed to get session status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get session status',
        error: error.message
      });
    }
  }
);

/**
 * Cleanup decryption session
 * DELETE /api/tee/models/decrypt/:sessionId
 */
router.delete('/models/decrypt/:sessionId',
  requireAuth,
  [
    param('sessionId').isString().notEmpty().withMessage('Session ID is required')
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

      const { sessionId } = req.params;
      const { user } = req;

      // Verify user has access to this session
      const sessionStatus = teeDecryptionService.getSessionStatus(sessionId);
      if (!sessionStatus.found) {
        return res.status(404).json({
          success: false,
          message: 'Decryption session not found'
        });
      }

      if (sessionStatus.userId !== user.id && user.role !== 'AppAdmin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this decryption session'
        });
      }

      console.log(`🧹 Cleaning up TEE decryption session ${sessionId}`);

      // Perform cleanup
      const cleanupResult = await teeDecryptionService.cleanupDecryptionSession(sessionId);

      res.json({
        success: true,
        message: 'Decryption session cleaned up successfully',
        data: cleanupResult
      });

    } catch (error) {
      console.error('❌ Failed to cleanup decryption session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup decryption session',
        error: error.message
      });
    }
  }
);

/**
 * List active decryption sessions
 * GET /api/tee/models/decrypt/sessions
 */
router.get('/models/decrypt/sessions',
  requireAuth,
  [
    query('modelId').optional().isString().withMessage('Model ID must be a string'),
    query('status').optional().isIn(['INITIALIZED', 'DECRYPTING', 'DECRYPTED', 'FAILED', 'CLEANED_UP']).withMessage('Invalid status'),
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

      const { modelId, status, limit = 20, offset = 0 } = req.query;
      const { user } = req;

      // Build filters
      const filters = {};
      if (user.role !== 'AppAdmin') {
        filters.userId = user.id; // Regular users can only see their own sessions
      }
      if (modelId) filters.modelId = modelId;
      if (status) filters.status = status;

      // Get sessions
      let sessions = teeDecryptionService.listActiveSessions(filters);

      // Apply pagination
      const total = sessions.length;
      sessions = sessions.slice(offset, offset + limit);

      res.json({
        success: true,
        message: 'Active decryption sessions retrieved successfully',
        data: {
          sessions,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: offset + limit < total
          }
        }
      });

    } catch (error) {
      console.error('❌ Failed to list decryption sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list decryption sessions',
        error: error.message
      });
    }
  }
);

/**
 * Verify TEE environment
 * POST /api/tee/environments/:environmentId/verify
 */
router.post('/environments/:environmentId/verify',
  requireAuth,
  requireRole(['TDC', 'TDP', 'TSP', 'AppAdmin']),
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

      console.log(`🔍 Verifying TEE environment: ${environmentId}`);

      // Verify TEE environment
      const verification = await teeDecryptionService.verifyTEEEnvironment(environmentId);

      res.json({
        success: true,
        message: 'TEE environment verification completed',
        data: verification
      });

    } catch (error) {
      console.error('❌ TEE environment verification failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify TEE environment',
        error: error.message
      });
    }
  }
);

/**
 * Check model access permissions
 * GET /api/tee/models/:modelId/access
 */
router.get('/models/:modelId/access',
  requireAuth,
  [
    param('modelId').isString().notEmpty().withMessage('Model ID is required'),
    query('contractId').optional().isString().withMessage('Contract ID must be a string'),
    query('purposes').optional().isString().withMessage('Purposes must be a string')
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

      const { modelId } = req.params;
      const { contractId, purposes } = req.query;
      const { user } = req;

      const purposesArray = purposes ? purposes.split(',') : ['training'];

      console.log(`🔐 Checking model access for model ${modelId}, user ${user.id}`);

      // Check access permissions
      const accessCheck = await teeDecryptionService.checkModelAccess(
        modelId,
        user.id,
        contractId,
        purposesArray
      );

      res.json({
        success: true,
        message: 'Model access check completed',
        data: accessCheck
      });

    } catch (error) {
      console.error('❌ Model access check failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check model access',
        error: error.message
      });
    }
  }
);

/**
 * Get TEE decryption service health
 * GET /api/tee/health
 */
router.get('/health',
  requireAuth,
  async (req, res) => {
    try {
      const activeSessions = teeDecryptionService.listActiveSessions();
      const healthMetrics = {
        serviceName: 'TEE Model Decryption Service',
        status: 'healthy',
        timestamp: new Date(),
        metrics: {
          activeSessions: activeSessions.length,
          sessionsByStatus: activeSessions.reduce((acc, session) => {
            acc[session.status] = (acc[session.status] || 0) + 1;
            return acc;
          }, {}),
          cacheSize: teeDecryptionService.teeVerificationCache.size
        }
      };

      res.json({
        success: true,
        message: 'TEE service health check completed',
        data: healthMetrics
      });

    } catch (error) {
      console.error('❌ TEE service health check failed:', error);
      res.status(500).json({
        success: false,
        message: 'TEE service health check failed',
        error: error.message
      });
    }
  }
);

module.exports = router;
