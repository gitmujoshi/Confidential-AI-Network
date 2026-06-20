/**
 * Provenance API Routes
 * 
 * Handles Merkle tree provenance tracking, verification, and audit capabilities
 * for AI model training with cryptographic verification and cross-cloud support.
 */

const express = require('express');
const router = express.Router();
const ProvenanceTrackingService = require('../services/provenanceTrackingService');
const ScittIntegrationService = require('../services/scittIntegrationService');
const { requireAuth, requireRole } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Initialize services
const provenanceService = new ProvenanceTrackingService();
const scittService = new ScittIntegrationService();

/**
 * Initialize provenance tracking for a training job
 * POST /api/provenance/initialize
 */
router.post('/initialize',
  requireAuth,
  [
    body('jobId').isString().notEmpty().withMessage('Job ID is required'),
    body('contractId').isString().notEmpty().withMessage('Contract ID is required'),
    body('environmentId').isString().notEmpty().withMessage('Environment ID is required'),
    body('config').optional().isObject().withMessage('Config must be an object')
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

      const { jobId, contractId, environmentId, config = {} } = req.body;

      console.log(`🌳 Initializing provenance tracking for job: ${jobId}`);

      // Initialize provenance tracking session
      const session = await provenanceService.initializeProvenanceTracking({
        jobId,
        contractId,
        environmentId,
        userId: req.user.id,
        ...config
      });

      // Create SCITT CCF provenance record
      const scittRecord = await scittService.createProvenanceRecord(
        contractId,
        session.rootHash,
        'PROVENANCE_INITIALIZATION',
        {
          sessionId: session.sessionId,
          jobId,
          environmentId,
          createdBy: req.user.id,
          timestamp: new Date()
        }
      );

      res.json({
        success: true,
        message: 'Provenance tracking initialized successfully',
        data: {
          sessionId: session.sessionId,
          rootHash: session.rootHash,
          scittClaimId: scittRecord.claimId,
          status: session.status,
          createdAt: session.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Provenance initialization failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize provenance tracking',
        error: error.message
      });
    }
  }
);

/**
 * Create a new provenance node
 * POST /api/provenance/nodes
 */
router.post('/nodes',
  requireAuth,
  [
    body('nodeId').isString().notEmpty().withMessage('Node ID is required'),
    body('type').isIn(['DATA', 'CODE', 'MODEL', 'EXECUTION', 'CONTRACT']).withMessage('Invalid node type'),
    body('content').notEmpty().withMessage('Node content is required'),
    body('sessionId').optional().isString().withMessage('Session ID must be a string'),
    body('parentNodes').optional().isArray().withMessage('Parent nodes must be an array'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
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

      const { nodeId, type, content, sessionId, parentNodes = [], metadata = {} } = req.body;

      console.log(`📝 Creating provenance node: ${nodeId} of type: ${type}`);

      // Create provenance node
      const node = await provenanceService.createProvenanceNode({
        nodeId,
        type,
        content,
        parentNodes,
        metadata: {
          ...metadata,
          createdBy: req.user.id,
          userRole: req.user.role
        }
      });

      // Add to Merkle tree if session specified
      let merkleProof = null;
      if (sessionId) {
        merkleProof = await provenanceService.addNodeToMerkleTree(sessionId, nodeId);
      }

      // Create SCITT CCF record for the node
      const scittRecord = await scittService.createProvenanceRecord(
        metadata.contractId || 'unknown',
        node.hash,
        `PROVENANCE_NODE_${type}`,
        {
          nodeId,
          type,
          sessionId,
          parentNodes,
          createdBy: req.user.id,
          timestamp: node.createdAt
        }
      );

      res.status(201).json({
        success: true,
        message: 'Provenance node created successfully',
        data: {
          nodeId: node.nodeId,
          type: node.type,
          hash: node.hash,
          signature: node.signature,
          timestamp: node.timestamp,
          merkleProof,
          scittClaimId: scittRecord.claimId,
          verificationStatus: node.verificationStatus,
          createdAt: node.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Provenance node creation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create provenance node',
        error: error.message
      });
    }
  }
);

/**
 * Verify a provenance node
 * POST /api/provenance/nodes/:nodeId/verify
 */
router.post('/nodes/:nodeId/verify',
  requireAuth,
  [
    param('nodeId').isString().notEmpty().withMessage('Node ID is required'),
    body('verificationConfig').optional().isObject().withMessage('Verification config must be an object')
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

      const { nodeId } = req.params;
      const { verificationConfig = {} } = req.body;

      console.log(`🔍 Verifying provenance node: ${nodeId}`);

      // Perform node verification
      const verification = await provenanceService.verifyProvenanceNode(nodeId, {
        ...verificationConfig,
        verifiedBy: req.user.id,
        timestamp: new Date()
      });

      // Create SCITT CCF verification record
      const scittRecord = await scittService.createProvenanceRecord(
        verificationConfig.contractId || 'unknown',
        verification.nodeId,
        'PROVENANCE_VERIFICATION',
        {
          nodeId,
          verificationResults: verification.results,
          overallStatus: verification.overallStatus,
          verifiedBy: req.user.id,
          timestamp: verification.timestamp
        }
      );

      res.json({
        success: true,
        message: 'Node verification completed',
        data: {
          nodeId: verification.nodeId,
          overallStatus: verification.overallStatus,
          results: verification.results,
          scittClaimId: scittRecord.claimId,
          timestamp: verification.timestamp
        }
      });

    } catch (error) {
      console.error('❌ Node verification failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify provenance node',
        error: error.message
      });
    }
  }
);

/**
 * Verify complete provenance chain
 * POST /api/provenance/sessions/:sessionId/verify-chain
 */
router.post('/sessions/:sessionId/verify-chain',
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

      console.log(`🔗 Verifying complete provenance chain: ${sessionId}`);

      // Verify entire provenance chain
      const chainVerification = await provenanceService.verifyProvenanceChain(sessionId);

      // Create SCITT CCF chain verification record
      const scittRecord = await scittService.createProvenanceRecord(
        chainVerification.contractId || 'unknown',
        sessionId,
        'PROVENANCE_CHAIN_VERIFICATION',
        {
          sessionId,
          chainIntegrity: chainVerification.chainIntegrity,
          overallStatus: chainVerification.overallStatus,
          nodeCount: chainVerification.nodeVerifications.length,
          verifiedBy: req.user.id,
          timestamp: chainVerification.timestamp
        }
      );

      res.json({
        success: true,
        message: 'Provenance chain verification completed',
        data: {
          sessionId: chainVerification.sessionId,
          overallStatus: chainVerification.overallStatus,
          chainIntegrity: chainVerification.chainIntegrity,
          nodeVerifications: chainVerification.nodeVerifications,
          scittClaimId: scittRecord.claimId,
          timestamp: chainVerification.timestamp
        }
      });

    } catch (error) {
      console.error('❌ Chain verification failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify provenance chain',
        error: error.message
      });
    }
  }
);

/**
 * Get provenance report
 * GET /api/provenance/sessions/:sessionId/report
 */
router.get('/sessions/:sessionId/report',
  requireAuth,
  [
    param('sessionId').isString().notEmpty().withMessage('Session ID is required'),
    query('includeNodes').optional().isBoolean().withMessage('Include nodes must be boolean'),
    query('includeVerifications').optional().isBoolean().withMessage('Include verifications must be boolean')
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
      const { includeNodes = true, includeVerifications = true } = req.query;

      console.log(`📊 Generating provenance report for session: ${sessionId}`);

      // Get comprehensive provenance report
      const report = await provenanceService.getProvenanceReport(sessionId);

      // Get SCITT CCF verification claims
      const scittClaims = await scittService.listContractClaims(report.contractId, {
        claimType: 'PROVENANCE_',
        sessionId,
        limit: 100
      });

      const responseData = {
        sessionId: report.sessionId,
        jobId: report.jobId,
        contractId: report.contractId,
        status: report.status,
        rootHash: report.rootHash,
        nodeCount: report.nodeCount,
        chainIntegrity: report.chainIntegrity,
        createdAt: report.createdAt,
        scittClaimsCount: scittClaims.claims.length,
        recommendations: report.recommendations
      };

      if (includeNodes) {
        responseData.nodes = report.nodes;
      }

      if (includeVerifications) {
        responseData.scittClaims = scittClaims.claims;
      }

      res.json({
        success: true,
        message: 'Provenance report generated successfully',
        data: responseData
      });

    } catch (error) {
      console.error('❌ Report generation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate provenance report',
        error: error.message
      });
    }
  }
);

/**
 * Get provenance node details
 * GET /api/provenance/nodes/:nodeId
 */
router.get('/nodes/:nodeId',
  requireAuth,
  [
    param('nodeId').isString().notEmpty().withMessage('Node ID is required')
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

      const { nodeId } = req.params;

      // Get node from in-memory store (in production, this would come from database)
      const node = provenanceService.provenanceNodes.get(nodeId);
      if (!node) {
        return res.status(404).json({
          success: false,
          message: 'Provenance node not found'
        });
      }

      res.json({
        success: true,
        message: 'Provenance node retrieved successfully',
        data: {
          nodeId: node.nodeId,
          type: node.type,
          parentNodes: node.parentNodes,
          childNodes: node.childNodes,
          metadata: node.metadata,
          hash: node.hash,
          signature: node.signature,
          timestamp: node.timestamp,
          merkleProof: node.merkleProof,
          verificationStatus: node.verificationStatus,
          createdAt: node.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Failed to get provenance node:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve provenance node',
        error: error.message
      });
    }
  }
);

/**
 * List provenance sessions
 * GET /api/provenance/sessions
 */
router.get('/sessions',
  requireAuth,
  requireRole(['AppAdmin', 'TDP', 'TDC', 'TSP']),
  [
    query('contractId').optional().isString().withMessage('Contract ID must be a string'),
    query('jobId').optional().isString().withMessage('Job ID must be a string'),
    query('status').optional().isIn(['INITIALIZED', 'ACTIVE', 'COMPLETED', 'FAILED']).withMessage('Invalid status'),
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

      const { contractId, jobId, status, limit = 20, offset = 0 } = req.query;

      // Filter sessions based on query parameters
      let sessions = Array.from(provenanceService.provenanceTrees.values());

      if (contractId) {
        sessions = sessions.filter(s => s.contractId === contractId);
      }

      if (jobId) {
        sessions = sessions.filter(s => s.jobId === jobId);
      }

      if (status) {
        sessions = sessions.filter(s => s.status === status);
      }

      // Apply pagination
      const total = sessions.length;
      sessions = sessions.slice(offset, offset + limit);

      const sessionData = sessions.map(session => ({
        sessionId: session.sessionId,
        jobId: session.jobId,
        contractId: session.contractId,
        environmentId: session.environmentId,
        status: session.status,
        rootHash: session.rootHash,
        nodeCount: session.nodes.size,
        createdAt: session.createdAt
      }));

      res.json({
        success: true,
        message: 'Provenance sessions retrieved successfully',
        data: {
          sessions: sessionData,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: offset + limit < total
          }
        }
      });

    } catch (error) {
      console.error('❌ Failed to list provenance sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list provenance sessions',
        error: error.message
      });
    }
  }
);

/**
 * Generate Merkle proof for a specific node
 * GET /api/provenance/nodes/:nodeId/proof
 */
router.get('/nodes/:nodeId/proof',
  requireAuth,
  [
    param('nodeId').isString().notEmpty().withMessage('Node ID is required')
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

      const { nodeId } = req.params;

      // Find the session containing this node
      const session = provenanceService.findSessionByNodeId(nodeId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Node not found in any session'
        });
      }

      // Generate Merkle proof
      const merkleProof = await provenanceService.generateMerkleProof(session.sessionId, nodeId);

      res.json({
        success: true,
        message: 'Merkle proof generated successfully',
        data: merkleProof
      });

    } catch (error) {
      console.error('❌ Failed to generate Merkle proof:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate Merkle proof',
        error: error.message
      });
    }
  }
);

module.exports = router;