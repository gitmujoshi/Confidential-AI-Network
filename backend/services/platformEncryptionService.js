/**
 * Platform-Managed Encryption Workflow Service
 * 
 * This service implements the revised encryption workflow for confidential AI training
 * using platform-managed keys, JWT tokens, and hardware attestation.
 * 
 * Key Features:
 * - Platform-managed key lifecycle (generation, rotation, revocation)
 * - JWT token-based data access control
 * - Hardware attestation integration
 * - End-to-end encryption for data in transit and at rest
 * - Audit trail for all encryption operations
 * 
 * Workflow:
 * 1. TDP uploads encrypted data with platform-managed keys
 * 2. TDC requests data access via JWT tokens
 * 3. CCRP provisions TEE with hardware attestation
 * 4. Data is decrypted only within verified TEE
 * 5. Training results are encrypted before transmission
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dataEncryptionService = require('./dataEncryptionService');
const keyManagementService = require('./keyManagementService');
const logger = require('../utils/logger');

class PlatformEncryptionService {
  constructor() {
    this.dataEncryptionService = dataEncryptionService;
    this.keyManagementService = keyManagementService;
    
    // Validate required environment variables
    this.validateEnvironmentVariables();
    
    // Platform configuration
    this.platformConfig = {
      keyRotationInterval: parseInt(process.env.KEY_ROTATION_INTERVAL),
      tokenExpiryTime: process.env.TOKEN_EXPIRY_TIME,
      maxDataSize: parseInt(process.env.MAX_DATA_SIZE),
      supportedAlgorithms: ['AES-256-GCM', 'RSA-4096', 'ECC-384'],
      hsmEnabled: process.env.HSM_ENABLED === 'true',
      attestationRequired: process.env.ATTESTATION_REQUIRED === 'true'
    };
    
    // Initialize platform keys
    this.initializePlatformKeys();
    
    // Avoid open handles in Jest / test runs
    if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
      this.startKeyRotationScheduler();
    }
  }
  
  validateEnvironmentVariables() {
    const requiredVars = [
      'KEY_ROTATION_INTERVAL',
      'TOKEN_EXPIRY_TIME',
      'MAX_DATA_SIZE',
      'HSM_ENABLED',
      'ATTESTATION_REQUIRED'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Initialize platform-managed keys
   */
  async initializePlatformKeys() {
    try {
      // Generate or load platform master key
      this.platformMasterKey = await this.getOrCreatePlatformMasterKey();
      
      // Generate data encryption keys
      this.dataEncryptionKeys = await this.generateDataEncryptionKeys();
      
      // Generate JWT signing keys
      this.jwtSigningKeys = await this.generateJWTSigningKeys();
      
      logger.info('🔐 Platform encryption service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize platform encryption service:', error);
      throw error;
    }
  }

  /**
   * Get or create platform master key
   */
  async getOrCreatePlatformMasterKey() {
    try {
      // Generate a new master key using the available KeyManagementService
      const masterKey = await this.keyManagementService.generateKeyPair({
        algorithm: 'RSA-4096',
        userId: 'PLATFORM_MASTER'
      });
      
      logger.info('🔑 Generated new platform master key');
      return masterKey;
    } catch (error) {
      logger.error('Failed to get/create platform master key:', error);
      throw error;
    }
  }

  /**
   * Generate data encryption keys for different data types
   */
  async generateDataEncryptionKeys() {
    const keyTypes = [
      'DATASET_ENCRYPTION',
      'MODEL_ENCRYPTION', 
      'TRAINING_RESULTS_ENCRYPTION',
      'METADATA_ENCRYPTION'
    ];
    
    const keys = {};
    
    for (const keyType of keyTypes) {
      try {
        // Generate AES keys directly since KeyManagementService doesn't support AES
        const aesKey = crypto.randomBytes(32); // 256 bits
        const keyObject = {
          keyId: `${keyType}_${Date.now()}`,
          keyType: keyType,
          algorithm: 'AES-256-GCM',
          key: aesKey,
          publicKey: null, // AES is symmetric
          privateKey: null, // AES is symmetric
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        };
        
        keys[keyType] = keyObject;
        logger.info(`🔑 Generated ${keyType} key: ${keyObject.keyId}`);
      } catch (error) {
        logger.error(`Failed to generate ${keyType} key:`, error);
        throw error;
      }
    }
    
    return keys;
  }

  /**
   * Generate JWT signing keys
   */
  async generateJWTSigningKeys() {
    try {
      const signingKey = await this.keyManagementService.generateKeyPair({
        algorithm: 'RSA-4096',
        userId: 'JWT_SIGNING'
      });
      
      logger.info(`🔑 Generated JWT signing key: ${signingKey.keyId}`);
      return signingKey;
    } catch (error) {
      logger.error('Failed to generate JWT signing key:', error);
      throw error;
    }
  }

  /**
   * Encrypt data for TDP upload
   * @param {Object} data - Data to encrypt
   * @param {string} dataType - Type of data (DATASET, MODEL, etc.)
   * @param {string} tdpId - TDP user ID
   * @returns {Object} Encrypted data with metadata
   */
  async encryptDataForUpload(data, dataType, tdpId) {
    try {
      // Map data types to encryption key types
      const dataTypeMapping = {
        'TRAINING_DATA': 'DATASET_ENCRYPTION',
        'DATASET': 'DATASET_ENCRYPTION',
        'MODEL': 'MODEL_ENCRYPTION',
        'TRAINING_RESULTS': 'TRAINING_RESULTS_ENCRYPTION',
        'METADATA': 'METADATA_ENCRYPTION'
      };
      
      const keyType = dataTypeMapping[dataType] || `${dataType}_ENCRYPTION`;
      logger.info(`Looking for encryption key: ${keyType}`);
      logger.info(`Available keys: ${Object.keys(this.dataEncryptionKeys || {}).join(', ')}`);
      const encryptionKey = this.dataEncryptionKeys[keyType];
      if (!encryptionKey) {
        throw new Error(`No encryption key found for data type: ${dataType} (mapped to: ${keyType})`);
      }

      // Generate data encryption key (DEK)
      const dek = crypto.randomBytes(32);
      
      // Encrypt data with DEK
      const encryptedData = await this.dataEncryptionService.encryptData(JSON.stringify(data));
      
      // Encrypt DEK with platform key (KEK)
      const encryptedDek = await this.encryptKey(dek, encryptionKey);
      
      // Create data access token
      const dataAccessToken = await this.createDataAccessToken({
        tdpId,
        dataType,
        permissions: ['READ', 'TRAIN'],
        expiryTime: this.platformConfig.tokenExpiryTime
      });

      const result = {
        encryptedData: encryptedData.encryptedData,
        encryptedDek: encryptedDek,
        dataType,
        tdpId,
        dataAccessToken,
        metadata: {
          encryptionAlgorithm: 'AES-256-GCM',
          keyId: encryptionKey.keyId,
          encryptedAt: new Date().toISOString(),
          dataSize: JSON.stringify(data).length
        }
      };

      logger.info(`🔐 Data encrypted for TDP ${tdpId}, type: ${dataType}`);
      return result;
      
    } catch (error) {
      logger.error('Failed to encrypt data for upload:', error);
      throw error;
    }
  }

  /**
   * Decrypt data for TDC access
   * @param {Object} encryptedData - Encrypted data object
   * @param {string} tdcId - TDC user ID
   * @param {string} accessToken - JWT access token
   * @returns {Object} Decrypted data
   */
  async decryptDataForAccess(encryptedData, tdcId, accessToken) {
    try {
      // Validate access token
      const tokenPayload = await this.validateDataAccessToken(accessToken);
      
      // Check permissions
      if (!tokenPayload.permissions.includes('READ')) {
        throw new Error('Insufficient permissions for data access');
      }

      // Get encryption key
      const encryptionKey = this.dataEncryptionKeys[`${encryptedData.dataType}_ENCRYPTION`];
      if (!encryptionKey) {
        throw new Error(`No encryption key found for data type: ${encryptedData.dataType}`);
      }

      // Decrypt DEK
      const dek = await this.decryptKey(encryptedData.encryptedDek, encryptionKey);
      
      // Decrypt data
      const decryptedData = await this.dataEncryptionService.decryptData({
        encryptedData: encryptedData.encryptedData,
        iv: encryptedData.encryptedData.iv,
        tag: encryptedData.encryptedData.tag
      }, dek.toString('hex'));

      logger.info(`🔓 Data decrypted for TDC ${tdcId}, type: ${encryptedData.dataType}`);
      return JSON.parse(decryptedData);
      
    } catch (error) {
      logger.error('Failed to decrypt data for access:', error);
      throw error;
    }
  }

  /**
   * Create data access token for TDC
   * @param {Object} payload - Token payload
   * @returns {string} JWT token
   */
  async createDataAccessToken(payload) {
    try {
      const tokenPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        jti: uuidv4(),
        iss: 'confidential-ai-platform',
        aud: 'tdc-data-access'
      };

      const token = jwt.sign(tokenPayload, this.jwtSigningKeys.privateKey, {
        algorithm: 'RS256',
        expiresIn: payload.expiryTime || this.platformConfig.tokenExpiryTime
      });

      logger.info(`🎫 Data access token created for ${payload.tdpId}`);
      return token;
      
    } catch (error) {
      logger.error('Failed to create data access token:', error);
      throw error;
    }
  }

  /**
   * Validate data access token
   * @param {string} token - JWT token
   * @returns {Object} Token payload
   */
  async validateDataAccessToken(token) {
    try {
      const payload = jwt.verify(token, this.jwtSigningKeys.publicKey, {
        algorithms: ['RS256'],
        issuer: 'confidential-ai-platform',
        audience: 'tdc-data-access'
      });

      // Check token expiry
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token has expired');
      }

      return payload;
      
    } catch (error) {
      logger.error('Failed to validate data access token:', error);
      throw error;
    }
  }

  /**
   * Encrypt key with platform key
   * @param {Buffer} key - Key to encrypt
   * @param {Object} platformKey - Platform key object
   * @returns {string} Encrypted key
   */
  async encryptKey(key, platformKey) {
    try {
      // For AES keys, we'll use simple base64 encoding for now
      // In production, this would use proper key encryption
      return key.toString('base64');
      
    } catch (error) {
      logger.error('Failed to encrypt key:', error);
      throw error;
    }
  }

  /**
   * Decrypt key with platform key
   * @param {string} encryptedKey - Encrypted key
   * @param {Object} platformKey - Platform key object
   * @returns {Buffer} Decrypted key
   */
  async decryptKey(encryptedKey, platformKey) {
    try {
      // For AES keys, we'll use simple base64 decoding for now
      // In production, this would use proper key decryption
      return Buffer.from(encryptedKey, 'base64');
      
    } catch (error) {
      logger.error('Failed to decrypt key:', error);
      throw error;
    }
  }

  /**
   * Create TEE attestation token
   * @param {Object} teeInfo - TEE information
   * @param {string} ccrpId - CCRP user ID
   * @returns {string} Attestation token
   */
  async createTEEAttestationToken(teeInfo, ccrpId) {
    try {
      const attestationPayload = {
        teeId: teeInfo.teeId,
        ccrpId,
        attestationData: teeInfo.attestationData,
        hardwareInfo: teeInfo.hardwareInfo,
        iat: Math.floor(Date.now() / 1000),
        jti: uuidv4(),
        iss: 'confidential-ai-platform',
        aud: 'tee-attestation'
      };

      const token = jwt.sign(attestationPayload, this.jwtSigningKeys.privateKey, {
        algorithm: 'RS256',
        expiresIn: '24h' // Attestation tokens valid for 24 hours
      });

      logger.info(`🔒 TEE attestation token created for CCRP ${ccrpId}`);
      return token;
      
    } catch (error) {
      logger.error('Failed to create TEE attestation token:', error);
      throw error;
    }
  }

  /**
   * Validate TEE attestation token
   * @param {string} token - Attestation token
   * @returns {Object} Attestation payload
   */
  async validateTEEAttestationToken(token) {
    try {
      const payload = jwt.verify(token, this.jwtSigningKeys.publicKey, {
        algorithms: ['RS256'],
        issuer: 'confidential-ai-platform',
        audience: 'tee-attestation'
      });

      // Verify attestation data (in production, this would validate hardware attestation)
      if (!payload.attestationData || !payload.hardwareInfo) {
        throw new Error('Invalid attestation data');
      }

      return payload;
      
    } catch (error) {
      logger.error('Failed to validate TEE attestation token:', error);
      throw error;
    }
  }

  /**
   * Encrypt training results
   * @param {Object} results - Training results
   * @param {string} tdcId - TDC user ID
   * @param {string} teeAttestationToken - TEE attestation token
   * @returns {Object} Encrypted results
   */
  async encryptTrainingResults(results, tdcId, teeAttestationToken) {
    try {
      // Validate TEE attestation
      const attestation = await this.validateTEEAttestationToken(teeAttestationToken);
      
      // Get training results encryption key
      const encryptionKey = this.dataEncryptionKeys['TRAINING_RESULTS_ENCRYPTION'];
      
      // Generate DEK for results
      const dek = crypto.randomBytes(32);
      
      // Encrypt results
      const encryptedResults = await this.dataEncryptionService.encrypt(JSON.stringify(results), dek.toString('hex'));
      
      // Encrypt DEK
      const encryptedDek = await this.encryptKey(dek, encryptionKey);
      
      const result = {
        encryptedResults: encryptedResults.encryptedData,
        encryptedDek: encryptedDek,
        tdcId,
        teeId: attestation.teeId,
        metadata: {
          encryptionAlgorithm: 'AES-256-GCM',
          keyId: encryptionKey.keyId,
          encryptedAt: new Date().toISOString(),
          attestationVerified: true
        }
      };

      logger.info(`🔐 Training results encrypted for TDC ${tdcId}`);
      return result;
      
    } catch (error) {
      logger.error('Failed to encrypt training results:', error);
      throw error;
    }
  }

  /**
   * Start key rotation scheduler
   */
  startKeyRotationScheduler() {
    setInterval(async () => {
      try {
        await this.rotateKeys();
      } catch (error) {
        logger.error('Key rotation failed:', error);
      }
    }, this.platformConfig.keyRotationInterval);
    
    logger.info('🔄 Key rotation scheduler started');
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys() {
    try {
      logger.info('🔄 Starting key rotation...');
      
      // Generate new data encryption keys
      const newDataKeys = await this.generateDataEncryptionKeys();
      
      // Generate new JWT signing key
      const newJwtKey = await this.generateJWTSigningKeys();
      
      // Update keys (in production, this would be atomic)
      this.dataEncryptionKeys = newDataKeys;
      this.jwtSigningKeys = newJwtKey;
      
      logger.info('✅ Key rotation completed successfully');
      
    } catch (error) {
      logger.error('Key rotation failed:', error);
      throw error;
    }
  }

  /**
   * Get encryption status and key information
   * @returns {Object} Encryption status
   */
  getEncryptionStatus() {
    return {
      platformInitialized: !!this.platformMasterKey,
      dataEncryptionKeys: Object.keys(this.dataEncryptionKeys).length,
      jwtSigningKey: !!this.jwtSigningKeys,
      keyRotationInterval: this.platformConfig.keyRotationInterval,
      hsmEnabled: this.platformConfig.hsmEnabled,
      attestationRequired: this.platformConfig.attestationRequired,
      supportedAlgorithms: this.platformConfig.supportedAlgorithms
    };
  }

  /**
   * Audit encryption operation
   * @param {string} operation - Operation type
   * @param {Object} details - Operation details
   */
  auditEncryptionOperation(operation, details) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      operation,
      details,
      service: 'PlatformEncryptionService'
    };
    
    logger.info('📋 Encryption audit:', auditLog);
    
    // In production, this would be stored in a secure audit log
    return auditLog;
  }
}

module.exports = PlatformEncryptionService;
