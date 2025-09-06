const crypto = require('crypto');

class MerkleTreeService {
  constructor() {
    this.hashAlgorithm = 'sha256';
  }

  async initializeMerkleTreeService() {
    try {
      // Test Merkle tree generation with sample data
      const testData = ['test1', 'test2', 'test3', 'test4'];
      const testTree = this.generateMerkleTree(testData);
      
      if (testTree && testTree.rootHash) {
        console.log('✅ Merkle tree service initialized successfully');
        return true;
      } else {
        throw new Error('Merkle tree generation test failed');
      }
    } catch (error) {
      console.error('❌ Merkle tree service initialization failed:', error.message);
      throw error;
    }
  }

  generateMerkleTree(data) {
    try {
      if (!data || data.length === 0) {
        throw new Error('Data array cannot be empty');
      }

      // Convert data to leaf hashes
      const leaves = data.map(item => this.hashData(item));
      
      // Build the tree
      const tree = this.buildTree(leaves);
      
      return {
        rootHash: tree[0],
        nodeCount: leaves.length,
        maxDepth: Math.ceil(Math.log2(leaves.length)) + 1,
        leaves: leaves
      };
    } catch (error) {
      console.error('❌ Merkle tree generation failed:', error.message);
      throw error;
    }
  }

  buildTree(leaves) {
    if (leaves.length === 1) {
      return leaves;
    }

    const tree = [...leaves];
    let level = leaves;

    while (level.length > 1) {
      const nextLevel = [];
      
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : level[i];
        
        const combined = left + right;
        const hash = this.hashData(combined);
        nextLevel.push(hash);
      }
      
      level = nextLevel;
      tree.push(...nextLevel);
    }

    return tree;
  }

  generateMerkleProof(data, targetIndex) {
    try {
      if (targetIndex < 0 || targetIndex >= data.length) {
        throw new Error('Invalid target index');
      }

      const leaves = data.map(item => this.hashData(item));
      const proof = this.buildProof(leaves, targetIndex);
      
      return {
        targetHash: leaves[targetIndex],
        proof: proof,
        targetIndex: targetIndex
      };
    } catch (error) {
      console.error('❌ Merkle proof generation failed:', error.message);
      throw error;
    }
  }

  buildProof(leaves, targetIndex) {
    const proof = [];
    let level = [...leaves];
    let currentIndex = targetIndex;

    while (level.length > 1) {
      const nextLevel = [];
      const nextIndex = Math.floor(currentIndex / 2);
      
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : left;
        
        if (i === currentIndex || i === currentIndex - 1) {
          // Add sibling to proof
          const siblingIndex = i === currentIndex ? i + 1 : i - 1;
          if (siblingIndex < level.length) {
            proof.push({
              hash: level[siblingIndex],
              position: i === currentIndex ? 'right' : 'left'
            });
          }
        }
        
        const combined = left + right;
        const hash = this.hashData(combined);
        nextLevel.push(hash);
      }
      
      level = nextLevel;
      currentIndex = nextIndex;
    }

    return proof;
  }

  verifyMerkleProof(targetHash, proof, rootHash) {
    try {
      let currentHash = targetHash;
      
      for (const proofElement of proof) {
        if (proofElement.position === 'left') {
          currentHash = this.hashData(proofElement.hash + currentHash);
        } else {
          currentHash = this.hashData(currentHash + proofElement.hash);
        }
      }
      
      return currentHash === rootHash;
    } catch (error) {
      console.error('❌ Merkle proof verification failed:', error.message);
      return false;
    }
  }

  hashData(data) {
    return crypto.createHash(this.hashAlgorithm).update(data).digest('hex');
  }

  async benchmarkMerkleTreeGeneration(dataSizes = [100, 1000, 10000]) {
    const results = {};
    
    for (const size of dataSizes) {
      const data = Array.from({ length: size }, (_, i) => `data-${i}`);
      
      const startTime = Date.now();
      const tree = this.generateMerkleTree(data);
      const endTime = Date.now();
      
      results[size] = {
        dataSize: size,
        generationTime: endTime - startTime,
        rootHash: tree.rootHash,
        nodeCount: tree.nodeCount
      };
    }
    
    return results;
  }
}

module.exports = new MerkleTreeService();
