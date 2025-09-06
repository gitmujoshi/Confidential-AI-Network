const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');
const ProvenanceService = require('../services/ProvenanceService');

// Initialize provenance service
const provenanceService = new ProvenanceService();

// Initialize service on route load
provenanceService.initialize().catch(console.error);

/**
 * @route   POST /api/provenance/tree
 * @desc    Create a new provenance tree for a contract
 * @access  Private (TDC, TDP, CCRP, AppAdmin)
 */
router.post('/tree', requireRole(['TDC', 'TDP', 'CCRP', 'AppAdmin']), async (req, res) => {
  try {
    const { contractId, data } = req.body;

    if (!contractId || !data) {
      return res.status(400).json({
        success: false,
        message: 'Contract ID and data are required'
      });
    }

    const tree = await provenanceService.createProvenanceTree(contractId, data);
    
    res.status(201).json({
      success: true,
      message: 'Provenance tree created successfully',
      data: tree
    });
  } catch (error) {
    console.error('❌ Error creating provenance tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create provenance tree',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/provenance/node
 * @desc    Add a new node to an existing provenance tree
 * @access  Private (TDC, TDP, CCRP, AppAdmin)
 */
router.post('/node', requireRole(['TDC', 'TDP', 'CCRP', 'AppAdmin']), async (req, res) => {
  try {
    const { treeId, nodeData } = req.body;

    if (!treeId || !nodeData) {
      return res.status(400).json({
        success: false,
        message: 'Tree ID and node data are required'
      });
    }

    const newNode = await provenanceService.addProvenanceNode(treeId, nodeData);
    
    res.status(201).json({
      success: true,
      message: 'Node added to provenance tree successfully',
      data: newNode
    });
  } catch (error) {
    console.error('❌ Error adding node to provenance tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add node to provenance tree',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/provenance/proof
 * @desc    Generate a Merkle proof for a specific node
 * @access  Private (TDC, TDP, CCRP, AppAdmin)
 */
router.post('/proof', requireRole(['TDC', 'TDP', 'CCRP', 'AppAdmin']), async (req, res) => {
  try {
    const { treeId, nodeId } = req.body;

    if (!treeId || !nodeId) {
      return res.status(400).json({
        success: false,
        message: 'Tree ID and node ID are required'
      });
    }

    const proof = await provenanceService.generateMerkleProof(treeId, nodeId);
    
    res.status(200).json({
      success: true,
      message: 'Merkle proof generated successfully',
      data: proof
    });
  } catch (error) {
    console.error('❌ Error generating Merkle proof:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Merkle proof',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/provenance/verify
 * @desc    Verify a provenance proof
 * @access  Private (TDC, TDP, CCRP, AppAdmin)
 */
router.post('/verify', requireRole(['TDC', 'TDP', 'CCRP', 'AppAdmin']), async (req, res) => {
  try {
    const { proof, expectedHash } = req.body;

    if (!proof || !expectedHash) {
      return res.status(400).json({
        success: false,
        message: 'Proof and expected hash are required'
      });
    }

    const result = await provenanceService.verifyProvenanceProof(proof, expectedHash);
    
    res.status(200).json({
      success: true,
      message: 'Proof verification completed',
      data: result
    });
  } catch (error) {
    console.error('❌ Error verifying provenance proof:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify provenance proof',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/provenance/tree/:contractId
 * @desc    Get provenance tree for a contract
 * @access  Private (TDC, TDP, CCRP, AppAdmin)
 */
router.get('/tree/:contractId', requireRole(['TDC', 'TDP', 'CCRP', 'AppAdmin']), async (req, res) => {
  try {
    const { contractId } = req.params;

    const tree = await provenanceService.getProvenanceTree(contractId);
    
    res.status(200).json({
      success: true,
      message: 'Provenance tree retrieved successfully',
      data: tree
    });
  } catch (error) {
    console.error('❌ Error retrieving provenance tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve provenance tree',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/provenance/report/:contractId
 * @desc    Generate provenance report for a contract
 * @access  Private (TDC, TDP, CCRP, AppAdmin)
 */
router.get('/report/:contractId', requireRole(['TDC', 'TDP', 'CCRP', 'AppAdmin']), async (req, res) => {
  try {
    const { contractId } = req.params;

    const report = await provenanceService.generateProvenanceReport(contractId);
    
    res.status(200).json({
      success: true,
      message: 'Provenance report generated successfully',
      data: report
    });
  } catch (error) {
    console.error('❌ Error generating provenance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate provenance report',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/provenance/cleanup/:contractId
 * @desc    Clean up provenance data for a contract
 * @access  Private (AppAdmin only)
 */
router.delete('/cleanup/:contractId', requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { contractId } = req.params;

    const result = await provenanceService.cleanupProvenanceData(contractId);
    
    res.status(200).json({
      success: true,
      message: 'Provenance data cleanup completed',
      data: { contractId, cleanupStatus: result }
    });
  } catch (error) {
    console.error('❌ Error cleaning up provenance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup provenance data',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/provenance/health
 * @desc    Get provenance service health status
 * @access  Private (All authenticated users)
 */
router.get('/health', requireRole(['TDC', 'TDP', 'CCRP', 'AppAdmin']), async (req, res) => {
  try {
    const healthStatus = {
      service: 'ProvenanceService',
      status: provenanceService.isInitialized ? 'HEALTHY' : 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      features: [
        'Merkle Tree Building',
        'Hash Calculation',
        'Proof Generation',
        'Proof Verification',
        'Provenance Reporting'
      ]
    };
    
    res.status(200).json({
      success: true,
      message: 'Provenance service health check completed',
      data: healthStatus
    });
  } catch (error) {
    console.error('❌ Error checking provenance service health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check provenance service health',
      error: error.message
    });
  }
});

module.exports = router;
