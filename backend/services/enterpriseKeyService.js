/**
 * Enterprise Key Management Service
 * Handles enterprise public key registration and management
 */

const { User, EnterpriseKey, SigningRequest } = require('../models');
const crypto = require('crypto');

class EnterpriseKeyService {
  constructor() {
    this.supportedAlgorithms = ['ECDSA_P256', 'ECDSA_P384', 'ECDSA_P521', 'RSA_2048', 'RSA_4096'];
  }

  /**
   * Register an enterprise public key
   * @param {Object} keyData - Public key data
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Registration result
   */
  async registerPublicKey(keyData, userId) {
    const { publicKey, algorithm, keyId, provider, metadata } = keyData;

    try {
      // Validate public key format
      this.validatePublicKey(publicKey, algorithm);

      // Check if key already exists
      const existingKey = await EnterpriseKey.findOne({
        where: { keyId: keyId, userId: userId }
      });

      if (existingKey) {
        throw new Error('Key with this ID already exists for this user');
      }

      // Create enterprise key record
      const enterpriseKey = await EnterpriseKey.create({
        userId: userId,
        keyId: keyId,
        publicKey: publicKey,
        algorithm: algorithm,
        provider: provider,
        metadata: metadata || {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        keyId: enterpriseKey.keyId,
        algorithm: enterpriseKey.algorithm,
        provider: enterpriseKey.provider,
        message: 'Enterprise key registered successfully'
      };

    } catch (error) {
      console.error('Error registering enterprise key:', error);
      throw new Error(`Failed to register enterprise key: ${error.message}`);
    }
  }

  /**
   * Get enterprise keys for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - List of enterprise keys
   */
  async getUserEnterpriseKeys(userId) {
    try {
      const keys = await EnterpriseKey.findAll({
        where: { userId: userId, isActive: true },
        attributes: ['id', 'keyId', 'algorithm', 'provider', 'metadata', 'createdAt']
      });

      return keys.map(key => ({
        id: key.id,
        keyId: key.keyId,
        algorithm: key.algorithm,
        provider: key.provider,
        metadata: key.metadata,
        createdAt: key.createdAt
      }));

    } catch (error) {
      console.error('Error fetching enterprise keys:', error);
      throw new Error(`Failed to fetch enterprise keys: ${error.message}`);
    }
  }

  /**
   * Get enterprise key by ID
   * @param {string} keyId - Key ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Enterprise key data
   */
  async getEnterpriseKey(keyId, userId) {
    try {
      const key = await EnterpriseKey.findOne({
        where: { keyId: keyId, userId: userId, isActive: true }
      });

      if (!key) {
        throw new Error('Enterprise key not found');
      }

      return {
        id: key.id,
        keyId: key.keyId,
        publicKey: key.publicKey,
        algorithm: key.algorithm,
        provider: key.provider,
        metadata: key.metadata,
        createdAt: key.createdAt
      };

    } catch (error) {
      console.error('Error fetching enterprise key:', error);
      throw new Error(`Failed to fetch enterprise key: ${error.message}`);
    }
  }

  /**
   * Deactivate an enterprise key
   * @param {string} keyId - Key ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Deactivation result
   */
  async deactivateKey(keyId, userId) {
    try {
      const key = await EnterpriseKey.findOne({
        where: { keyId: keyId, userId: userId }
      });

      if (!key) {
        throw new Error('Enterprise key not found');
      }

      await key.update({
        isActive: false,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: 'Enterprise key deactivated successfully'
      };

    } catch (error) {
      console.error('Error deactivating enterprise key:', error);
      throw new Error(`Failed to deactivate enterprise key: ${error.message}`);
    }
  }

  /**
   * Validate public key format
   * @param {string} publicKey - Public key in PEM format
   * @param {string} algorithm - Key algorithm
   */
  validatePublicKey(publicKey, algorithm) {
    try {
      // Try to create a public key object
      const key = crypto.createPublicKey({
        key: publicKey,
        format: 'pem'
      });

      // Validate algorithm compatibility
      const keyType = key.asymmetricKeyType;
      const keySize = key.asymmetricKeySize;

      switch (algorithm) {
        case 'ECDSA_P256':
          if (keyType !== 'ec' || keySize !== 32) {
            throw new Error('Invalid ECDSA P-256 key');
          }
          break;
        case 'ECDSA_P384':
          if (keyType !== 'ec' || keySize !== 48) {
            throw new Error('Invalid ECDSA P-384 key');
          }
          break;
        case 'ECDSA_P521':
          if (keyType !== 'ec' || keySize !== 66) {
            throw new Error('Invalid ECDSA P-521 key');
          }
          break;
        case 'RSA_2048':
          if (keyType !== 'rsa' || keySize !== 256) {
            throw new Error('Invalid RSA 2048 key');
          }
          break;
        case 'RSA_4096':
          if (keyType !== 'rsa' || keySize !== 512) {
            throw new Error('Invalid RSA 4096 key');
          }
          break;
        default:
          throw new Error(`Unsupported algorithm: ${algorithm}`);
      }

    } catch (error) {
      throw new Error(`Invalid public key format: ${error.message}`);
    }
  }

  /**
   * Get supported algorithms
   * @returns {Array} - List of supported algorithms
   */
  getSupportedAlgorithms() {
    return this.supportedAlgorithms;
  }
}

module.exports = EnterpriseKeyService;
