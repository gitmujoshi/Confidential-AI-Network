const MerkleTreeBuilder = require('./MerkleTreeBuilder');
const HashCalculator = require('./HashCalculator');
const ProofGenerator = require('./ProofGenerator');
const { v4: uuidv4 } = require('uuid');

class ProvenanceService {
  constructor() {
    this.merkleTreeBuilder = new MerkleTreeBuilder();
    this.hashCalculator = new HashCalculator();
    this.proofGenerator = new ProofGenerator();
    this.isInitialized = false;
  }

  /**
   * Initialize the provenance service
   */
  async initialize() {
    try {
      // Initialize database connections if needed
      this.isInitialized = true;
      console.log('✅ ProvenanceService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ProvenanceService:', error);
      throw error;
    }
  }

  /**
   * Create a provenance tree for a contract
   * @param {string} contractId - Contract ID
   * @param {Array} data - Array of data items to build tree from
   * @returns {Object} - Created tree with database record
   */
  async createProvenanceTree(contractId, data) {
    if (!this.isInitialized) {
      throw new Error('ProvenanceService not initialized');
    }

    try {
      // Build Merkle tree from contract data
      const tree = this.merkleTreeBuilder.buildTree(data, contractId);
      
      // Optimize tree for performance
      const optimizedTree = this.merkleTreeBuilder.optimizeTree(tree);
      
      // Validate tree integrity
      const validation = this.merkleTreeBuilder.validateTree(optimizedTree);
      if (!validation.isValid) {
        throw new Error(`Tree validation failed: ${validation.errors.join(', ')}`);
      }

      // Store tree in database (this would be implemented with actual database models)
      const treeRecord = await this._storeTree(contractId, optimizedTree);
      
      console.log(`✅ Provenance tree created for contract ${contractId}: ${treeRecord.treeId}`);
      return treeRecord;
    } catch (error) {
      console.error(`❌ Failed to create provenance tree for contract ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Add a new node to an existing provenance tree
   * @param {string} treeId - Tree ID
   * @param {Object} nodeData - New node data
   * @returns {Object} - Added node
   */
  async addProvenanceNode(treeId, nodeData) {
    if (!this.isInitialized) {
      throw new Error('ProvenanceService not initialized');
    }

    try {
      // Retrieve existing tree from database
      const existingTree = await this._getTree(treeId);
      if (!existingTree) {
        throw new Error(`Tree not found: ${treeId}`);
      }

      // Add new node to tree
      const newNode = this.merkleTreeBuilder.addNode(existingTree, nodeData);
      
      // Update tree root hash
      const updatedRootHash = this.merkleTreeBuilder.calculateRootHash(existingTree);
      existingTree.rootHash = updatedRootHash;
      
      // Store updated tree
      await this._updateTree(treeId, existingTree);
      
      console.log(`✅ Node added to tree ${treeId}: ${newNode.nodeId}`);
      return newNode;
    } catch (error) {
      console.error(`❌ Failed to add node to tree ${treeId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a Merkle proof for a specific node
   * @param {string} treeId - Tree ID
   * @param {string} nodeId - Target node ID
   * @returns {Object} - Merkle proof
   */
  async generateMerkleProof(treeId, nodeId) {
    if (!this.isInitialized) {
      throw new Error('ProvenanceService not initialized');
    }

    try {
      // Retrieve tree from database
      const tree = await this._getTree(treeId);
      if (!tree) {
        throw new Error(`Tree not found: ${treeId}`);
      }

      // Generate proof
      const proof = this.proofGenerator.generateProof(tree, nodeId);
      
      // Optimize proof for storage
      const optimizedProof = this.proofGenerator.optimizeProof(proof);
      
      console.log(`✅ Merkle proof generated for node ${nodeId} in tree ${treeId}`);
      return optimizedProof;
    } catch (error) {
      console.error(`❌ Failed to generate proof for node ${nodeId} in tree ${treeId}:`, error);
      throw error;
    }
  }

  /**
   * Verify a provenance proof
   * @param {Object} proof - Merkle proof to verify
   * @param {string} expectedHash - Expected hash value
   * @returns {Object} - Verification result
   */
  async verifyProvenanceProof(proof, expectedHash) {
    if (!this.isInitialized) {
      throw new Error('ProvenanceService not initialized');
    }

    try {
      // Verify proof
      const result = this.proofGenerator.verifyProof(proof, expectedHash);
      
      if (result.isValid) {
        console.log(`✅ Proof verification successful for target hash: ${result.targetHash}`);
      } else {
        console.warn(`⚠️ Proof verification failed for target hash: ${result.targetHash}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to verify provenance proof:', error);
      throw error;
    }
  }

  /**
   * Get a provenance tree by contract ID
   * @param {string} contractId - Contract ID
   * @returns {Object} - Provenance tree
   */
  async getProvenanceTree(contractId) {
    if (!this.isInitialized) {
      throw new Error('ProvenanceService not initialized');
    }

    try {
      // Retrieve tree from database
      const tree = await this._getTreeByContractId(contractId);
      if (!tree) {
        throw new Error(`No provenance tree found for contract: ${contractId}`);
      }

      return tree;
    } catch (error) {
      console.error(`❌ Failed to get provenance tree for contract ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a comprehensive provenance report
   * @param {string} contractId - Contract ID
   * @returns {Object} - Provenance report
   */
  async generateProvenanceReport(contractId) {
    if (!this.isInitialized) {
      throw new Error('ProvenanceService not initialized');
    }

    try {
      // Get provenance tree
      const tree = await this.getProvenanceTree(contractId);
      
      // Get all captures for this contract
      const captures = await this._getCapturesByContractId(contractId);
      
      // Get verification status
      const verifications = await this._getVerificationsByContractId(contractId);
      
      // Generate report
      const report = {
        contractId,
        treeId: tree.treeId,
        rootHash: tree.rootHash,
        nodeCount: tree.nodeCount,
        levels: tree.levels,
        algorithm: tree.hashAlgorithm,
        treeType: tree.treeType,
        captures: captures.map(c => ({
          captureId: c.captureId,
          captureType: c.captureType,
          dataSource: c.dataSource,
          verificationStatus: c.verificationStatus,
          capturedAt: c.capturedAt
        })),
        verifications: verifications.map(v => ({
          verificationId: v.verificationId,
          method: v.verificationMethod,
          status: v.status,
          verifiedAt: v.verifiedAt
        })),
        summary: {
          totalCaptures: captures.length,
          verifiedCaptures: captures.filter(c => c.verificationStatus === 'VERIFIED').length,
          pendingVerifications: captures.filter(c => c.verificationStatus === 'PENDING').length,
          verificationSuccessRate: verifications.length > 0 ? 
            (verifications.filter(v => v.status === 'SUCCESS').length / verifications.length * 100).toFixed(2) + '%' : 'N/A'
        },
        generatedAt: new Date().toISOString()
      };
      
      console.log(`✅ Provenance report generated for contract ${contractId}`);
      return report;
    } catch (error) {
      console.error(`❌ Failed to generate provenance report for contract ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up provenance data for a contract
   * @param {string} contractId - Contract ID
   * @returns {boolean} - Success status
   */
  async cleanupProvenanceData(contractId) {
    if (!this.isInitialized) {
      throw new Error('ProvenanceService not initialized');
    }

    try {
      // This would implement actual cleanup logic
      // For now, just log the cleanup request
      console.log(`🧹 Cleanup requested for contract ${contractId} provenance data`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to cleanup provenance data for contract ${contractId}:`, error);
      throw error;
    }
  }

  // Private helper methods (would be implemented with actual database models)

  /**
   * Store a tree in the database
   * @private
   */
  async _storeTree(contractId, tree) {
    // This would use actual database models
    // For now, return a mock record
    return {
      treeId: tree.treeId,
      contractId: tree.contractId,
      rootHash: tree.rootHash,
      nodeCount: tree.nodeCount,
      storedAt: new Date().toISOString()
    };
  }

  /**
   * Retrieve a tree from the database
   * @private
   */
  async _getTree(treeId) {
    // This would use actual database models
    // For now, return null to simulate not found
    return null;
  }

  /**
   * Retrieve a tree by contract ID
   * @private
   */
  async _getTreeByContractId(contractId) {
    // This would use actual database models
    // For now, return null to simulate not found
    return null;
  }

  /**
   * Update a tree in the database
   * @private
   */
  async _updateTree(treeId, tree) {
    // This would use actual database models
    // For now, just log the update
    console.log(`📝 Tree ${treeId} updated in database`);
  }

  /**
   * Get captures by contract ID
   * @private
   */
  async _getCapturesByContractId(contractId) {
    // This would use actual database models
    // For now, return empty array
    return [];
  }

  /**
   * Get verifications by contract ID
   * @private
   */
  async _getVerificationsByContractId(contractId) {
    // This would use actual database models
    // For now, return empty array
    return [];
  }
}

module.exports = ProvenanceService;
