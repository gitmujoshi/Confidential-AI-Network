const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, Contract, Signature, SigningEvent, UserKey, EnterpriseKey, SigningRequest } = require('../models');
const keyManagementService = require('./keyManagementService');
const scittCcfService = require('./scittCcfService');
const auditService = require('./auditService');
class ContractSigningService {
  constructor() {
    this.loadConfiguration();
  }

  /**
   * Load signing configuration from environment variables
   */
  loadConfiguration() {
    // Validate required environment variables
    this.validateEnvironmentVariables();
    
    // Parse supported algorithms from environment
    const algorithmsEnv = process.env.SIGNING_ALGORITHMS;
    this.supportedAlgorithms = algorithmsEnv.split(',').map(alg => alg.trim());
    this.defaultAlgorithm = process.env.DEFAULT_SIGNING_ALGORITHM;
  }
  
  validateEnvironmentVariables() {
    const requiredVars = [
      'SIGNING_ALGORITHMS',
      'DEFAULT_SIGNING_ALGORITHM'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Generate a new signing key pair for a user
   */
  async generateSigningKey(userId, algorithm = null) {
    try {
      const selectedAlgorithm = algorithm || this.defaultAlgorithm;
      
      if (!this.supportedAlgorithms.includes(selectedAlgorithm)) {
        throw new Error(`Unsupported algorithm: ${selectedAlgorithm}`);
      }

      const keyPair = await keyManagementService.generateKeyPair({
        algorithm: selectedAlgorithm,
        userId
      });
      
      await UserKey.create({
        userId,
        keyId: keyPair.keyId,
        keyType: selectedAlgorithm,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        keyStatus: 'active',
        metadata: {
          generatedAt: new Date().toISOString(),
          algorithm: selectedAlgorithm
        }
      });

      await auditService.log('SIGNING_KEY_GENERATED', {
        userId,
        keyId: keyPair.keyId,
        algorithm: selectedAlgorithm
      });

      return {
        success: true,
        keyId: keyPair.keyId,
        algorithm: selectedAlgorithm,
        keyType: selectedAlgorithm,
        publicKey: keyPair.publicKey,
        message: 'Signing key generated successfully'
      };
    } catch (error) {
      console.error('Error generating signing key:', error);
      throw new Error(`Failed to generate signing key: ${error.message}`);
    }
  }

  /**
   * True when the user has at least one active party signing key.
   */
  async hasActiveSigningKey(userId) {
    const count = await UserKey.count({
      where: { userId, keyStatus: 'active' }
    });
    return count > 0;
  }

  /**
   * Get all signing keys for a user
   */
  async getUserSigningKeys(userId) {
    try {
      const keys = await UserKey.findAll({
        where: { userId, keyStatus: 'active' },
        attributes: ['keyId', 'keyType', 'publicKey', 'keyStatus', 'metadata', 'createdAt', 'lastUsedAt'],
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        keys: keys.map(key => ({
          keyId: key.keyId,
          algorithm: key.keyType,
          keyType: key.keyType,
          publicKey: key.publicKey,
          status: key.keyStatus,
          keyStatus: key.keyStatus,
          metadata: key.metadata,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt
        }))
      };
    } catch (error) {
      console.error('Error fetching user signing keys:', error);
      throw new Error(`Failed to fetch signing keys: ${error.message}`);
    }
  }

  /**
   * Get signing configuration
   */
  getSigningConfig() {
    return {
      success: true,
      config: {
        supportedAlgorithms: this.supportedAlgorithms,
        defaultAlgorithm: this.defaultAlgorithm,
        keyTypes: {
          'ECDSA-P256': {
            name: 'ECDSA',
            curve: 'P-256',
            keySize: 256,
            description: 'Elliptic Curve Digital Signature Algorithm with P-256 curve'
          },
          'RSA-2048': {
            name: 'RSA',
            keySize: 2048,
            description: 'RSA with 2048-bit key size'
          },
          'RSA-4096': {
            name: 'RSA',
            keySize: 4096,
            description: 'RSA with 4096-bit key size'
          }
        }
      }
    };
  }

  /**
   * Sign a contract using a user's key
   */
  async signContract(contractId, userId, keyId, contractHash) {
    try {
      // Verify the contract exists
      const contract = await Contract.findByPk(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      // Get the user's signing key
      const userKey = await UserKey.findOne({
        where: { userId, keyId, keyStatus: 'active' }
      });

      if (!userKey) {
        throw new Error('Signing key not found or inactive');
      }

      // Generate signature (privateKey stored as PEM)
      const privateKey = userKey.privateKey;
      const algorithm = userKey.keyType;
      const signature = await keyManagementService.generateSignature(
        contractHash,
        privateKey,
        algorithm
      );

      // Store signature in database
      const signatureRecord = await Signature.create({
        contractId,
        userId,
        keyId,
        signature,
        algorithm,
        status: 'ACTIVE',
        metadata: {
          signedAt: new Date().toISOString(),
          contractHash
        }
      });

      // Log signing event
      await SigningEvent.create({
        contractId,
        userId,
        keyId,
        eventType: 'SIGNED',
        status: 'SUCCESS',
        metadata: {
          signatureId: signatureRecord.id,
          contractHash
        }
      });

      // Store in SCITT CCF ledger
      try {
        await scittCcfService.storeSignature(contractId, signature, {
          userId,
          keyId,
          algorithm,
          contractHash
        });
      } catch (scittError) {
        console.warn('Failed to store signature in SCITT CCF:', scittError);
        // Continue even if SCITT CCF fails
      }

      await auditService.log('CONTRACT_SIGNED', {
        contractId,
        userId,
        keyId,
        signatureId: signatureRecord.id
      });

      return {
        success: true,
        signatureId: signatureRecord.id,
        signature,
        message: 'Contract signed successfully'
      };
    } catch (error) {
      console.error('Error signing contract:', error);
      
      // Log failed signing event
      try {
        await SigningEvent.create({
          contractId,
          userId,
          keyId,
          eventType: 'SIGN_FAILED',
          status: 'FAILED',
          metadata: {
            error: error.message
          }
        });
      } catch (logError) {
        console.error('Failed to log signing event:', logError);
      }

      throw new Error(`Failed to sign contract: ${error.message}`);
    }
  }

  /**
   * Verify a contract signature
   */
  async verifySignature(contractId, signature, keyId, contractHash) {
    try {
      // Get the signing key
      const userKey = await UserKey.findOne({
        where: { keyId, status: 'ACTIVE' }
      });

      if (!userKey) {
        throw new Error('Signing key not found or inactive');
      }

      // Verify signature
      const publicKey = JSON.parse(userKey.publicKey);
      const isValid = await keyManagementService.verifySignature(
        contractHash,
        signature,
        publicKey,
        userKey.algorithm
      );

      if (!isValid) {
        throw new Error('Invalid signature');
      }

      await auditService.log('SIGNATURE_VERIFIED', {
        contractId,
        keyId,
        signature
      });

      return {
        success: true,
        valid: true,
        message: 'Signature is valid'
      };
    } catch (error) {
      console.error('Error verifying signature:', error);
      throw new Error(`Failed to verify signature: ${error.message}`);
    }
  }

  /**
   * Get all signatures for a contract
   */
  async getContractSignatures(contractId) {
    try {
      const signatures = await Signature.findAll({
        where: { contractId, status: 'ACTIVE' },
        include: [
          {
            model: User,
            as: 'signer',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      return {
        success: true,
        signatures: signatures.map(sig => ({
          id: sig.id,
          userId: sig.userId,
          keyId: sig.keyId,
          signature: sig.signature,
          algorithm: sig.algorithm,
          status: sig.status,
          metadata: sig.metadata,
          createdAt: sig.createdAt,
          signer: sig.signer
        }))
      };
    } catch (error) {
      console.error('Error fetching contract signatures:', error);
      throw new Error(`Failed to fetch contract signatures: ${error.message}`);
    }
  }

  /**
   * Get signing events for a contract
   */
  async getSigningEvents(contractId) {
    try {
      const events = await SigningEvent.findAll({
        where: { contractId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        events: events.map(event => ({
          id: event.id,
          contractId: event.contractId,
          userId: event.userId,
          keyId: event.keyId,
          eventType: event.eventType,
          status: event.status,
          metadata: event.metadata,
          createdAt: event.createdAt,
          user: event.user
        }))
      };
    } catch (error) {
      console.error('Error fetching signing events:', error);
      throw new Error(`Failed to fetch signing events: ${error.message}`);
    }
  }

  /**
   * Revoke a signing key
   */
  async revokeSigningKey(userId, keyId) {
    try {
      const userKey = await UserKey.findOne({
        where: { userId, keyId }
      });

      if (!userKey) {
        throw new Error('Signing key not found');
      }

      await userKey.update({ keyStatus: 'revoked' });

      await auditService.log('SIGNING_KEY_REVOKED', {
        userId,
        keyId
      });

      return {
        success: true,
        message: 'Signing key revoked successfully'
      };
    } catch (error) {
      console.error('Error revoking signing key:', error);
      throw new Error(`Failed to revoke signing key: ${error.message}`);
    }
  }

  /**
   * Get signing statistics for a user
   */
  async getSigningStats(userId) {
    try {
      const totalKeys = await UserKey.count({
        where: { userId }
      });

      const activeKeys = await UserKey.count({
        where: { userId, keyStatus: 'active' }
      });

      const totalSignatures = await Signature.count({
        where: { userId }
      });

      const recentSignatures = await Signature.count({
        where: { 
          userId,
          createdAt: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      return {
        success: true,
        stats: {
          totalKeys,
          activeKeys,
          totalSignatures,
          recentSignatures
        }
      };
    } catch (error) {
      console.error('Error fetching signing stats:', error);
      throw new Error(`Failed to fetch signing stats: ${error.message}`);
    }
  }
}

module.exports = new ContractSigningService();
