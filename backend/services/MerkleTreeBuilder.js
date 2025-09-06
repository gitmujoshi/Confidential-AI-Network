const HashCalculator = require('./HashCalculator');
const { v4: uuidv4 } = require('uuid');

class MerkleTreeBuilder {
  constructor(hashAlgorithm = 'sha256') {
    this.hashCalculator = new HashCalculator(hashAlgorithm);
    this.maxDepth = 32;
  }

  /**
   * Build a complete Merkle tree from data
   * @param {Array} data - Array of data items to build tree from
   * @param {string} contractId - Contract ID for the tree
   * @returns {Object} - Complete tree structure
   */
  buildTree(data, contractId) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be a non-empty array');
    }

    const treeId = `TREE-${uuidv4()}`;
    const leaves = data.map(item => this.hashCalculator.calculateHash(item));
    
    const tree = {
      treeId,
      contractId,
      treeType: 'BINARY_MERKLE_TREE',
      hashAlgorithm: this.hashCalculator.getAlgorithm(),
      maxDepth: this.maxDepth,
      rootHash: this.hashCalculator.calculateRootHash(leaves),
      nodeCount: leaves.length,
      nodes: this._buildNodes(leaves, treeId),
      levels: this._calculateLevels(leaves.length)
    };

    return tree;
  }

  /**
   * Build individual nodes for the tree
   * @param {string[]} leaves - Leaf hashes
   * @param {string} treeId - Tree ID
   * @returns {Array} - Array of node objects
   */
  _buildNodes(leaves, treeId) {
    const nodes = [];
    let currentLevel = leaves;
    let levelIndex = 0;

    // Add leaf nodes
    leaves.forEach((hash, index) => {
      nodes.push({
        nodeId: `NODE-${uuidv4()}`,
        treeId,
        nodeType: 'LEAF',
        dataHash: hash,
        level: levelIndex,
        position: index,
        metadata: {
          originalIndex: index,
          isLeaf: true
        }
      });
    });

    // Build internal nodes
    while (currentLevel.length > 1) {
      const nextLevel = [];
      const levelNodes = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const leftHash = currentLevel[i];
        const rightHash = currentLevel[i + 1] || currentLevel[i]; // Duplicate if odd
        
        const nodeHash = this.hashCalculator.calculateNodeHash(leftHash, rightHash);
        nextLevel.push(nodeHash);

        // Find left and right child nodes
        const leftNode = nodes.find(n => n.dataHash === leftHash && n.level === levelIndex);
        const rightNode = nodes.find(n => n.dataHash === rightHash && n.level === levelIndex);

        levelNodes.push({
          nodeId: `NODE-${uuidv4()}`,
          treeId,
          nodeType: 'INTERNAL',
          dataHash: nodeHash,
          parentHash: null, // Will be set in next iteration
          leftChildHash: leftHash,
          rightChildHash: rightHash,
          level: levelIndex + 1,
          position: Math.floor(i / 2),
          metadata: {
            isInternal: true,
            hasLeftChild: !!leftNode,
            hasRightChild: !!rightNode
          }
        });
      }

      // Update parent hashes for current level
      currentLevel.forEach((hash, index) => {
        const node = nodes.find(n => n.dataHash === hash && n.level === levelIndex);
        if (node) {
          const parentNode = levelNodes[Math.floor(index / 2)];
          if (parentNode) {
            node.parentHash = parentNode.dataHash;
          }
        }
      });

      nodes.push(...levelNodes);
      currentLevel = nextLevel;
      levelIndex++;
    }

    return nodes;
  }

  /**
   * Calculate the number of levels in the tree
   * @param {number} leafCount - Number of leaves
   * @returns {number} - Number of levels
   */
  _calculateLevels(leafCount) {
    return Math.ceil(Math.log2(leafCount)) + 1;
  }

  /**
   * Add a new node to an existing tree
   * @param {Object} tree - Existing tree structure
   * @param {Object} nodeData - New node data
   * @returns {Object} - Updated tree
   */
  addNode(tree, nodeData) {
    if (!tree || !tree.nodes) {
      throw new Error('Invalid tree structure');
    }

    const newHash = this.hashCalculator.calculateHash(nodeData);
    const newNode = {
      nodeId: `NODE-${uuidv4()}`,
      treeId: tree.treeId,
      nodeType: 'LEAF',
      dataHash: newHash,
      level: 0,
      position: tree.nodeCount,
      metadata: {
        originalIndex: tree.nodeCount,
        isLeaf: true,
        addedAt: new Date().toISOString()
      }
    };

    // Add new leaf
    tree.nodes.push(newNode);
    tree.nodeCount++;

    // Recalculate tree structure
    const leaves = tree.nodes
      .filter(n => n.level === 0)
      .sort((a, b) => a.position - b.position)
      .map(n => n.dataHash);

    // Rebuild internal nodes
    tree.nodes = tree.nodes.filter(n => n.level === 0); // Keep only leaves
    const internalNodes = this._buildNodes(leaves, tree.treeId);
    tree.nodes = internalNodes;

    // Update root hash
    tree.rootHash = this.hashCalculator.calculateRootHash(leaves);
    tree.levels = this._calculateLevels(leaves.length);

    return newNode;
  }

  /**
   * Calculate root hash for the tree
   * @param {Object} tree - Tree structure
   * @returns {string} - Root hash
   */
  calculateRootHash(tree) {
    if (!tree || !tree.nodes) {
      throw new Error('Invalid tree structure');
    }

    const leaves = tree.nodes
      .filter(n => n.level === 0)
      .sort((a, b) => a.position - b.position)
      .map(n => n.dataHash);

    return this.hashCalculator.calculateRootHash(leaves);
  }

  /**
   * Optimize tree structure for better performance
   * @param {Object} tree - Tree to optimize
   * @returns {Object} - Optimized tree
   */
  optimizeTree(tree) {
    if (!tree || !tree.nodes) {
      return tree;
    }

    // Sort nodes by level and position for better traversal
    tree.nodes.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return a.position - b.position;
    });

    // Add indexes for faster lookups
    tree.nodeIndex = {};
    tree.nodes.forEach(node => {
      tree.nodeIndex[node.nodeId] = node;
    });

    return tree;
  }

  /**
   * Validate tree structure and integrity
   * @param {Object} tree - Tree to validate
   * @returns {Object} - Validation result
   */
  validateTree(tree) {
    if (!tree || !tree.nodes) {
      return { isValid: false, errors: ['Invalid tree structure'] };
    }

    const errors = [];
    const leaves = tree.nodes.filter(n => n.level === 0);

    // Check if root hash matches calculated root
    const calculatedRoot = this.calculateRootHash(tree);
    if (calculatedRoot !== tree.rootHash) {
      errors.push('Root hash mismatch');
    }

    // Check node relationships
    tree.nodes.forEach(node => {
      if (node.level > 0) {
        if (!node.leftChildHash || !node.rightChildHash) {
          errors.push(`Internal node ${node.nodeId} missing child hashes`);
        }
      }
    });

    // Check leaf count
    if (leaves.length !== tree.nodeCount) {
      errors.push('Leaf count mismatch');
    }

    return {
      isValid: errors.length === 0,
      errors,
      leafCount: leaves.length,
      calculatedRoot,
      expectedRoot: tree.rootHash
    };
  }
}

module.exports = MerkleTreeBuilder;
