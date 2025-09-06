const HashCalculator = require('./HashCalculator');

class ProofGenerator {
  constructor(hashAlgorithm = 'sha256') {
    this.hashCalculator = new HashCalculator(hashAlgorithm);
  }

  /**
   * Generate a Merkle proof for a specific node
   * @param {Object} tree - Merkle tree structure
   * @param {string} targetNodeId - ID of the target node
   * @returns {Object} - Merkle proof object
   */
  generateProof(tree, targetNodeId) {
    if (!tree || !tree.nodes) {
      throw new Error('Invalid tree structure');
    }

    const targetNode = tree.nodes.find(n => n.nodeId === targetNodeId);
    if (!targetNode) {
      throw new Error('Target node not found');
    }

    const proof = {
      targetNodeId,
      targetHash: targetNode.dataHash,
      targetLevel: targetNode.level,
      targetPosition: targetNode.position,
      proofPath: [],
      rootHash: tree.rootHash,
      treeId: tree.treeId,
      algorithm: this.hashCalculator.getAlgorithm(),
      generatedAt: new Date().toISOString()
    };

    // Build proof path from target to root
    let currentNode = targetNode;
    let currentLevel = targetNode.level;
    let currentPosition = targetNode.position;

    while (currentLevel < tree.levels - 1) {
      const siblingPosition = currentPosition % 2 === 0 ? currentPosition + 1 : currentPosition - 1;
      const siblingNode = tree.nodes.find(n => 
        n.level === currentLevel && n.position === siblingPosition
      );

      if (siblingNode) {
        proof.proofPath.push({
          level: currentLevel,
          position: siblingPosition,
          hash: siblingNode.dataHash,
          isLeft: siblingPosition < currentPosition,
          isRight: siblingPosition > currentPosition
        });
      }

      // Move to parent level
      const parentNode = tree.nodes.find(n => 
        n.level === currentLevel + 1 && 
        (n.leftChildHash === currentNode.dataHash || n.rightChildHash === currentNode.dataHash)
      );

      if (parentNode) {
        currentNode = parentNode;
        currentLevel = parentNode.level;
        currentPosition = parentNode.position;
      } else {
        break;
      }
    }

    return proof;
  }

  /**
   * Verify a Merkle proof against a root hash
   * @param {Object} proof - Merkle proof object
   * @param {string} rootHash - Expected root hash
   * @returns {Object} - Verification result
   */
  verifyProof(proof, rootHash) {
    if (!proof || !proof.proofPath || !proof.targetHash) {
      return { isValid: false, error: 'Invalid proof structure' };
    }

    if (proof.rootHash !== rootHash) {
      return { isValid: false, error: 'Root hash mismatch' };
    }

    try {
      let currentHash = proof.targetHash;

      // Reconstruct the path to root
      for (const proofStep of proof.proofPath) {
        if (proofStep.isLeft) {
          // Sibling is to the left, so current hash goes right
          currentHash = this.hashCalculator.calculateNodeHash(proofStep.hash, currentHash);
        } else if (proofStep.isRight) {
          // Sibling is to the right, so current hash goes left
          currentHash = this.hashCalculator.calculateNodeHash(currentHash, proofStep.hash);
        }
      }

      const isValid = currentHash === rootHash;
      
      return {
        isValid,
        calculatedRoot: currentHash,
        expectedRoot: rootHash,
        proofLength: proof.proofPath.length,
        targetHash: proof.targetHash,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Generate a compact proof representation
   * @param {Object} proof - Full proof object
   * @returns {Object} - Compact proof
   */
  optimizeProof(proof) {
    if (!proof || !proof.proofPath) {
      return proof;
    }

    // Remove unnecessary metadata for storage/transmission
    const compactProof = {
      targetHash: proof.targetHash,
      proofPath: proof.proofPath.map(step => ({
        hash: step.hash,
        isLeft: step.isLeft,
        isRight: step.isRight
      })),
      rootHash: proof.rootHash,
      algorithm: proof.algorithm
    };

    return compactProof;
  }

  /**
   * Serialize proof for storage or transmission
   * @param {Object} proof - Proof object
   * @returns {string} - Serialized proof
   */
  serializeProof(proof) {
    try {
      return JSON.stringify(proof);
    } catch (error) {
      throw new Error(`Failed to serialize proof: ${error.message}`);
    }
  }

  /**
   * Deserialize proof from storage or transmission
   * @param {string} serializedProof - Serialized proof string
   * @returns {Object} - Deserialized proof object
   */
  deserializeProof(serializedProof) {
    try {
      return JSON.parse(serializedProof);
    } catch (error) {
      throw new Error(`Failed to deserialize proof: ${error.message}`);
    }
  }

  /**
   * Generate a batch proof for multiple nodes
   * @param {Object} tree - Merkle tree structure
   * @param {string[]} targetNodeIds - Array of target node IDs
   * @returns {Object} - Batch proof object
   */
  generateBatchProof(tree, targetNodeIds) {
    if (!Array.isArray(targetNodeIds) || targetNodeIds.length === 0) {
      throw new Error('Target node IDs must be a non-empty array');
    }

    const batchProof = {
      treeId: tree.treeId,
      rootHash: tree.rootHash,
      algorithm: this.hashCalculator.getAlgorithm(),
      targetCount: targetNodeIds.length,
      proofs: [],
      generatedAt: new Date().toISOString()
    };

    // Generate individual proofs for each target
    for (const nodeId of targetNodeIds) {
      try {
        const proof = this.generateProof(tree, nodeId);
        batchProof.proofs.push(proof);
      } catch (error) {
        console.warn(`Failed to generate proof for node ${nodeId}:`, error.message);
      }
    }

    return batchProof;
  }

  /**
   * Verify a batch proof
   * @param {Object} batchProof - Batch proof object
   * @param {string} rootHash - Expected root hash
   * @returns {Object} - Batch verification result
   */
  verifyBatchProof(batchProof, rootHash) {
    if (!batchProof || !batchProof.proofs) {
      return { isValid: false, error: 'Invalid batch proof structure' };
    }

    const results = [];
    let allValid = true;

    for (const proof of batchProof.proofs) {
      const result = this.verifyProof(proof, rootHash);
      results.push({
        targetHash: proof.targetHash,
        ...result
      });

      if (!result.isValid) {
        allValid = false;
      }
    }

    return {
      isValid: allValid,
      totalProofs: batchProof.proofs.length,
      validProofs: results.filter(r => r.isValid).length,
      invalidProofs: results.filter(r => !r.isValid).length,
      results,
      verifiedAt: new Date().toISOString()
    };
  }
}

module.exports = ProofGenerator;
