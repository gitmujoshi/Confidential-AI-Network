const crypto = require('crypto');

class HashCalculator {
  constructor(algorithm = 'sha256') {
    this.algorithm = algorithm;
  }

  /**
   * Calculate hash for given data
   * @param {string|Buffer} data - Data to hash
   * @returns {string} - Hexadecimal hash string
   */
  calculateHash(data) {
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }
    
    if (typeof data !== 'string' && !Buffer.isBuffer(data)) {
      data = String(data);
    }

    return crypto.createHash(this.algorithm).update(data).digest('hex');
  }

  /**
   * Calculate hash for a node with left and right child hashes
   * @param {string} leftHash - Left child hash
   * @param {string} rightHash - Right child hash
   * @returns {string} - Parent node hash
   */
  calculateNodeHash(leftHash, rightHash) {
    const combined = leftHash + rightHash;
    return this.calculateHash(combined);
  }

  /**
   * Calculate root hash from leaf hashes
   * @param {string[]} leaves - Array of leaf hashes
   * @returns {string} - Root hash
   */
  calculateRootHash(leaves) {
    if (leaves.length === 0) {
      throw new Error('Cannot calculate root hash from empty leaves array');
    }

    if (leaves.length === 1) {
      return leaves[0];
    }

    // Ensure even number of leaves by duplicating last leaf if necessary
    if (leaves.length % 2 !== 0) {
      leaves.push(leaves[leaves.length - 1]);
    }

    const nextLevel = [];
    for (let i = 0; i < leaves.length; i += 2) {
      const nodeHash = this.calculateNodeHash(leaves[i], leaves[i + 1]);
      nextLevel.push(nodeHash);
    }

    return this.calculateRootHash(nextLevel);
  }

  /**
   * Verify hash for given data
   * @param {string|Buffer} data - Data to verify
   * @param {string} expectedHash - Expected hash value
   * @returns {boolean} - True if hash matches
   */
  verifyHash(data, expectedHash) {
    const actualHash = this.calculateHash(data);
    return actualHash === expectedHash;
  }

  /**
   * Generate a unique hash for a combination of values
   * @param {...any} values - Values to combine and hash
   * @returns {string} - Combined hash
   */
  generateCombinedHash(...values) {
    const combined = values.map(v => 
      typeof v === 'object' ? JSON.stringify(v) : String(v)
    ).join('|');
    
    return this.calculateHash(combined);
  }

  /**
   * Get the hash algorithm being used
   * @returns {string} - Hash algorithm name
   */
  getAlgorithm() {
    return this.algorithm;
  }
}

module.exports = HashCalculator;
