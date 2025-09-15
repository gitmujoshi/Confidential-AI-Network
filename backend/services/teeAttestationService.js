/**
 * TEE Attestation Service
 * 
 * This service handles Trusted Execution Environment (TEE) attestation and verification
 * for the confidential AI training platform. It ensures that training only occurs
 * in verified, secure environments.
 * 
 * Features:
 * - Hardware attestation verification (Intel SGX, AMD SEV, ARM TrustZone)
 * - TEE provisioning and validation
 * - Attestation token generation and verification
 * - Integration with platform encryption workflow
 * - Audit logging for attestation operations
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class TEEAttestationService {
  constructor(platformEncryptionService, enhancedJWTService) {
    this.platformEncryptionService = platformEncryptionService;
    this.enhancedJWTService = enhancedJWTService;
    
    // Validate required environment variables
    this.validateEnvironmentVariables();
    
    // TEE configuration
    this.teeConfig = {
      supportedHardware: [
        'INTEL_SGX',
        'AMD_SEV',
        'ARM_TRUSTZONE',
        'MICROSOFT_TPM',
        'AWS_NITRO'
      ],
      
      attestationAlgorithms: [
        'RSA-4096',
        'ECC-384',
        'ECDSA-P256'
      ],
      
      // Attestation validation settings
      validationConfig: {
        maxAttestationAge: 24 * 60 * 60 * 1000, // 24 hours
        requireHardwareAttestation: process.env.REQUIRE_HARDWARE_ATTESTATION === 'true',
        allowSimulatedAttestation: process.env.ALLOW_SIMULATED_ATTESTATION === 'true'
      },
      
      // TEE provisioning settings
      provisioningConfig: {
      maxConcurrentTEEs: parseInt(process.env.MAX_CONCURRENT_TEES),
      defaultTEEImage: process.env.DEFAULT_TEE_IMAGE,
      resourceLimits: {
        cpu: process.env.TEE_CPU_LIMIT,
        memory: process.env.TEE_MEMORY_LIMIT,
        storage: process.env.TEE_STORAGE_LIMIT
      }
      }
    };
    
    // Active TEE instances
    this.activeTEEs = new Map();
    
    // Attestation cache
    this.attestationCache = new Map();
    
    logger.info('🔒 TEE Attestation service initialized');
  }
  
  validateEnvironmentVariables() {
    const requiredVars = [
      'MAX_CONCURRENT_TEES',
      'DEFAULT_TEE_IMAGE',
      'TEE_CPU_LIMIT',
      'TEE_MEMORY_LIMIT',
      'TEE_STORAGE_LIMIT'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Provision TEE environment
   * @param {Object} provisioningRequest - TEE provisioning request
   * @param {string} ccrpId - CCRP user ID
   * @returns {Object} Provisioned TEE information
   */
  async provisionTEE(provisioningRequest, ccrpId) {
    try {
      const teeId = uuidv4();
      const provisioningId = uuidv4();
      
      // Validate provisioning request
      await this.validateProvisioningRequest(provisioningRequest);
      
      // Generate TEE configuration
      const teeConfig = await this.generateTEEConfiguration(provisioningRequest);
      
      // Create TEE instance (in production, this would provision actual hardware)
      const teeInstance = await this.createTEEInstance(teeId, teeConfig);
      
      // Generate attestation data
      const attestationData = await this.generateAttestationData(teeInstance);
      
      // Verify attestation (in production, this would verify hardware attestation)
      const attestationVerified = await this.verifyAttestation(attestationData);
      
      if (!attestationVerified && this.teeConfig.validationConfig.requireHardwareAttestation) {
        throw new Error('Hardware attestation verification failed');
      }
      
      // Create TEE record
      const teeRecord = {
        teeId,
        ccrpId,
        provisioningId,
        status: 'PROVISIONED',
        hardwareType: provisioningRequest.hardwareType,
        attestationData,
        attestationVerified,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.teeConfig.validationConfig.maxAttestationAge),
        configuration: teeConfig,
        metrics: {
          cpuUsage: 0,
          memoryUsage: 0,
          storageUsage: 0,
          networkUsage: 0
        }
      };
      
      // Store TEE record
      this.activeTEEs.set(teeId, teeRecord);
      
      // Create attestation token
      const attestationToken = await this.enhancedJWTService.createTEEAttestationToken(
        {
          teeId,
          hardwareType: provisioningRequest.hardwareType,
          attestationData,
          verifiedAt: new Date().toISOString()
        },
        ccrpId
      );
      
      this.auditAttestationOperation('PROVISION_TEE', {
        teeId,
        ccrpId,
        hardwareType: provisioningRequest.hardwareType,
        attestationVerified
      });
      
      logger.info(`🔒 TEE provisioned: ${teeId} for CCRP ${ccrpId}`);
      
      return {
        teeId,
        attestationToken,
        status: 'PROVISIONED',
        hardwareType: provisioningRequest.hardwareType,
        attestationVerified,
        configuration: teeConfig
      };
      
    } catch (error) {
      logger.error('Failed to provision TEE:', error);
      throw error;
    }
  }

  /**
   * Verify TEE attestation
   * @param {string} attestationToken - Attestation token
   * @returns {Object} Verification result
   */
  async verifyTEEAttestation(attestationToken) {
    try {
      // Validate attestation token
      const tokenPayload = await this.enhancedJWTService.validateToken(
        attestationToken, 
        'tee_attestation'
      );
      
      const teeId = tokenPayload.teeId;
      
      // Get TEE record
      const teeRecord = this.activeTEEs.get(teeId);
      if (!teeRecord) {
        throw new Error('TEE not found or not provisioned');
      }
      
      // Check if TEE is still valid
      if (teeRecord.status !== 'PROVISIONED') {
        throw new Error('TEE is not in provisioned state');
      }
      
      // Check attestation expiry
      if (new Date() > teeRecord.expiresAt) {
        throw new Error('TEE attestation has expired');
      }
      
      // Verify attestation data (in production, this would verify hardware attestation)
      const attestationValid = await this.verifyAttestationData(teeRecord.attestationData);
      
      if (!attestationValid) {
        throw new Error('TEE attestation data verification failed');
      }
      
      // Update last verified time
      teeRecord.lastVerified = new Date();
      
      this.auditAttestationOperation('VERIFY_TEE_ATTESTATION', {
        teeId,
        verified: true,
        lastVerified: teeRecord.lastVerified
      });
      
      logger.info(`🔒 TEE attestation verified: ${teeId}`);
      
      return {
        verified: true,
        teeId,
        hardwareType: teeRecord.hardwareType,
        attestationVerified: teeRecord.attestationVerified,
        lastVerified: teeRecord.lastVerified
      };
      
    } catch (error) {
      logger.error('TEE attestation verification failed:', error);
      throw error;
    }
  }

  /**
   * Validate provisioning request
   * @param {Object} request - Provisioning request
   */
  async validateProvisioningRequest(request) {
    if (!request.hardwareType) {
      throw new Error('Hardware type is required');
    }
    
    if (!this.teeConfig.supportedHardware.includes(request.hardwareType)) {
      throw new Error(`Unsupported hardware type: ${request.hardwareType}`);
    }
    
    if (request.resourceRequirements) {
      const limits = this.teeConfig.provisioningConfig.resourceLimits;
      
      if (request.resourceRequirements.cpu && 
          parseInt(request.resourceRequirements.cpu) > parseInt(limits.cpu)) {
        throw new Error('CPU requirement exceeds limit');
      }
      
      if (request.resourceRequirements.memory && 
          this.parseMemorySize(request.resourceRequirements.memory) > 
          this.parseMemorySize(limits.memory)) {
        throw new Error('Memory requirement exceeds limit');
      }
    }
  }

  /**
   * Generate TEE configuration
   * @param {Object} request - Provisioning request
   * @returns {Object} TEE configuration
   */
  async generateTEEConfiguration(request) {
    const baseConfig = {
      image: this.teeConfig.provisioningConfig.defaultTEEImage,
      resources: {
        ...this.teeConfig.provisioningConfig.resourceLimits,
        ...request.resourceRequirements
      },
      environment: {
        TEE_ID: uuidv4(),
        HARDWARE_TYPE: request.hardwareType,
        ATTESTATION_ENABLED: 'true',
        ENCRYPTION_ENABLED: 'true'
      },
      security: {
        isolationLevel: 'HARDWARE',
        attestationRequired: true,
        encryptionAtRest: true,
        encryptionInTransit: true
      }
    };
    
    // Add hardware-specific configuration
    if (request.hardwareType === 'INTEL_SGX') {
      baseConfig.environment.SGX_ENABLED = 'true';
      baseConfig.environment.SGX_QUOTE_SIZE = '2048';
    } else if (request.hardwareType === 'AMD_SEV') {
      baseConfig.environment.SEV_ENABLED = 'true';
      baseConfig.environment.SEV_GUEST_TYPE = 'SEV';
    } else if (request.hardwareType === 'ARM_TRUSTZONE') {
      baseConfig.environment.TRUSTZONE_ENABLED = 'true';
      baseConfig.environment.TRUSTZONE_NS = 'SECURE';
    }
    
    return baseConfig;
  }

  /**
   * Create TEE instance
   * @param {string} teeId - TEE ID
   * @param {Object} config - TEE configuration
   * @returns {Object} TEE instance
   */
  async createTEEInstance(teeId, config) {
    // In production, this would create actual TEE instances
    // For now, we'll simulate the creation
    
    const instance = {
      id: teeId,
      status: 'RUNNING',
      configuration: config,
      createdAt: new Date(),
      endpoints: {
        training: `https://tee-${teeId}.confidential-ai.com/training`,
        monitoring: `https://tee-${teeId}.confidential-ai.com/monitoring`,
        attestation: `https://tee-${teeId}.confidential-ai.com/attestation`
      },
      metrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        storageUsage: 0,
        networkUsage: 0
      }
    };
    
    logger.info(`🔒 TEE instance created: ${teeId}`);
    return instance;
  }

  /**
   * Generate attestation data
   * @param {Object} teeInstance - TEE instance
   * @returns {Object} Attestation data
   */
  async generateAttestationData(teeInstance) {
    // In production, this would generate actual hardware attestation data
    // For now, we'll simulate the attestation data generation
    
    const attestationData = {
      quote: crypto.randomBytes(256).toString('base64'),
      publicKey: crypto.randomBytes(64).toString('base64'),
      measurement: crypto.createHash('sha256')
        .update(JSON.stringify(teeInstance.configuration))
        .digest('hex'),
      timestamp: new Date().toISOString(),
      hardwareType: teeInstance.configuration.environment.HARDWARE_TYPE,
      version: '1.0'
    };
    
    // Sign the attestation data
    const signature = crypto.createSign('RSA-SHA256')
      .update(JSON.stringify(attestationData))
      .sign(await this.getAttestationKey(), 'base64');
    
    attestationData.signature = signature;
    
    return attestationData;
  }

  /**
   * Verify attestation data
   * @param {Object} attestationData - Attestation data
   * @returns {boolean} Verification result
   */
  async verifyAttestationData(attestationData) {
    try {
      // In production, this would verify actual hardware attestation
      // For now, we'll simulate the verification
      
      if (!attestationData.quote || !attestationData.signature) {
        return false;
      }
      
      // Verify signature
      const publicKey = await this.getAttestationKey();
      const verifier = crypto.createVerify('RSA-SHA256');
      
      const { signature, ...dataToVerify } = attestationData;
      verifier.update(JSON.stringify(dataToVerify));
      
      const isValid = verifier.verify(publicKey, signature, 'base64');
      
      return isValid;
      
    } catch (error) {
      logger.error('Attestation data verification failed:', error);
      return false;
    }
  }

  /**
   * Verify attestation (simplified version)
   * @param {Object} attestationData - Attestation data
   * @returns {boolean} Verification result
   */
  async verifyAttestation(attestationData) {
    // In production, this would perform actual hardware attestation verification
    // For now, we'll simulate the verification
    
    if (this.teeConfig.validationConfig.allowSimulatedAttestation) {
      return true; // Allow simulated attestation in development
    }
    
    return await this.verifyAttestationData(attestationData);
  }

  /**
   * Get attestation key
   * @returns {string} Attestation public key
   */
  async getAttestationKey() {
    // In production, this would get the actual attestation key from HSM
    // For now, we'll generate a temporary key
    
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    return keyPair.publicKey;
  }

  /**
   * Monitor TEE health
   * @param {string} teeId - TEE ID
   * @returns {Object} TEE health status
   */
  async monitorTEEHealth(teeId) {
    try {
      const teeRecord = this.activeTEEs.get(teeId);
      if (!teeRecord) {
        throw new Error('TEE not found');
      }
      
      // In production, this would check actual TEE health
      // For now, we'll simulate health monitoring
      
      const healthStatus = {
        teeId,
        status: 'HEALTHY',
        timestamp: new Date().toISOString(),
        metrics: {
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          storageUsage: Math.random() * 100,
          networkUsage: Math.random() * 100
        },
        attestationStatus: 'VALID',
        lastVerified: teeRecord.lastVerified || teeRecord.createdAt
      };
      
      // Update TEE record with current metrics
      teeRecord.metrics = healthStatus.metrics;
      teeRecord.lastHealthCheck = new Date();
      
      return healthStatus;
      
    } catch (error) {
      logger.error('TEE health monitoring failed:', error);
      throw error;
    }
  }

  /**
   * Decommission TEE
   * @param {string} teeId - TEE ID
   * @param {string} reason - Decommission reason
   */
  async decommissionTEE(teeId, reason = 'Scheduled decommission') {
    try {
      const teeRecord = this.activeTEEs.get(teeId);
      if (!teeRecord) {
        throw new Error('TEE not found');
      }
      
      // Update TEE status
      teeRecord.status = 'DECOMMISSIONED';
      teeRecord.decommissionedAt = new Date();
      teeRecord.decommissionReason = reason;
      
      // Remove from active TEEs
      this.activeTEEs.delete(teeId);
      
      this.auditAttestationOperation('DECOMMISSION_TEE', {
        teeId,
        reason,
        decommissionedAt: teeRecord.decommissionedAt
      });
      
      logger.info(`🔒 TEE decommissioned: ${teeId}, reason: ${reason}`);
      
    } catch (error) {
      logger.error('Failed to decommission TEE:', error);
      throw error;
    }
  }

  /**
   * Parse memory size string to bytes
   * @param {string} sizeStr - Memory size string (e.g., "4Gi", "512Mi")
   * @returns {number} Size in bytes
   */
  parseMemorySize(sizeStr) {
    const units = {
      'Ki': 1024,
      'Mi': 1024 * 1024,
      'Gi': 1024 * 1024 * 1024,
      'Ti': 1024 * 1024 * 1024 * 1024
    };
    
    const match = sizeStr.match(/^(\d+)([A-Za-z]+)$/);
    if (!match) {
      throw new Error(`Invalid memory size format: ${sizeStr}`);
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    if (!units[unit]) {
      throw new Error(`Unknown memory unit: ${unit}`);
    }
    
    return value * units[unit];
  }

  /**
   * Get TEE statistics
   * @returns {Object} TEE statistics
   */
  getTEEStatistics() {
    const stats = {
      totalTEEs: this.activeTEEs.size,
      teesByStatus: {},
      teesByHardwareType: {},
      teesByCCRP: {}
    };
    
    for (const teeRecord of this.activeTEEs.values()) {
      stats.teesByStatus[teeRecord.status] = (stats.teesByStatus[teeRecord.status] || 0) + 1;
      stats.teesByHardwareType[teeRecord.hardwareType] = (stats.teesByHardwareType[teeRecord.hardwareType] || 0) + 1;
      stats.teesByCCRP[teeRecord.ccrpId] = (stats.teesByCCRP[teeRecord.ccrpId] || 0) + 1;
    }
    
    return stats;
  }

  /**
   * Audit attestation operation
   * @param {string} operation - Operation type
   * @param {Object} details - Operation details
   */
  auditAttestationOperation(operation, details) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      operation,
      details,
      service: 'TEEAttestationService'
    };
    
    logger.info('📋 Attestation audit:', auditLog);
    
    // In production, this would be stored in a secure audit log
    return auditLog;
  }
}

module.exports = TEEAttestationService;
