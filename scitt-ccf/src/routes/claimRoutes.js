const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Mock database for now - would be replaced with actual database models
let claims = [];
let merkleTrees = [];

// Create SCITT claim
router.post('/claims', async (req, res) => {
  try {
    const { contract_id, data_hash, claim_type, metadata } = req.body;
    
    // Validate required fields
    if (!contract_id || !data_hash || !claim_type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CLAIM_DATA',
          message: 'Missing required fields: contract_id, data_hash, claim_type'
        }
      });
    }

    // Generate claim ID
    const claimId = `CLAIM-${uuidv4()}`;
    
    // Create claim
    const claim = {
      claim_id: claimId,
      contract_id,
      claim_type,
      data_hash,
      status: 'CREATED',
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Generate Merkle tree for the claim
    const merkleTree = {
      tree_id: `TREE-${uuidv4()}`,
      contract_id,
      root_hash: `sha256:${data_hash}-${Date.now()}`,
      node_count: 1,
      max_depth: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store claim and tree
    claims.push(claim);
    merkleTrees.push(merkleTree);

    res.status(201).json({
      success: true,
      claim,
      merkle_tree: merkleTree
    });

  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create claim'
      }
    });
  }
});

// Get SCITT claim
router.get('/claims/:claimId', async (req, res) => {
  try {
    const { claimId } = req.params;
    
    const claim = claims.find(c => c.claim_id === claimId);
    if (!claim) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLAIM_NOT_FOUND',
          message: 'Claim not found'
        }
      });
    }

    const merkleTree = merkleTrees.find(t => t.contract_id === claim.contract_id);
    
    res.json({
      success: true,
      claim,
      merkle_tree: merkleTree || null
    });

  } catch (error) {
    console.error('Error retrieving claim:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve claim'
      }
    });
  }
});

// List claims by contract
router.get('/contracts/:contractId/claims', async (req, res) => {
  try {
    const { contractId } = req.params;
    const { limit = 20, offset = 0, status, claim_type } = req.query;
    
    let filteredClaims = claims.filter(c => c.contract_id === contractId);
    
    // Apply filters
    if (status) {
      filteredClaims = filteredClaims.filter(c => c.status === status);
    }
    
    if (claim_type) {
      filteredClaims = filteredClaims.filter(c => c.claim_type === claim_type);
    }
    
    // Apply pagination
    const total = filteredClaims.length;
    const paginatedClaims = filteredClaims.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      claims: paginatedClaims,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: offset + parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Error listing claims:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list claims'
      }
    });
  }
});

// Verify Merkle proof
router.post('/claims/:claimId/verify', async (req, res) => {
  try {
    const { claimId } = req.params;
    const { data_hash, merkle_proof } = req.body;
    
    const claim = claims.find(c => c.claim_id === claimId);
    if (!claim) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLAIM_NOT_FOUND',
          message: 'Claim not found'
        }
      });
    }

    // Mock verification - in real implementation, this would verify the Merkle proof
    const verificationId = `VERIFY-${uuidv4()}`;
    const isVerified = data_hash === claim.data_hash; // Simple hash comparison for now
    
    const verification = {
      verification_id: verificationId,
      status: isVerified ? 'VERIFIED' : 'FAILED',
      verified_at: new Date().toISOString(),
      details: {
        proof_valid: isVerified,
        root_hash_matches: isVerified,
        verification_time_ms: Math.floor(Math.random() * 50) + 10
      }
    };

    res.json({
      success: true,
      verification
    });

  } catch (error) {
    console.error('Error verifying claim:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to verify claim'
      }
    });
  }
});

// Get all claims (for debugging)
router.get('/claims', async (req, res) => {
  try {
    res.json({
      success: true,
      claims: claims,
      total: claims.length
    });
  } catch (error) {
    console.error('Error listing all claims:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list claims'
      }
    });
  }
});

module.exports = router;
