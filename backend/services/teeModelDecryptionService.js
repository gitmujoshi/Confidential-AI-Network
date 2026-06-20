/**
 * TEE Model Decryption Service
 * 
 * Provides secure AI model decryption within Trusted Execution Environments (TEE)
 * ensuring intellectual property protection and secure model access for training.
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AttestationService = require('./attestationService');
const PlatformEncryptionService = require('./platformEncryptionService');
const EnhancedPlatformEncryptionService = require('./enhancedPlatformEncryptionService');
const ProvenanceTrackingService = require('./provenanceTrackingService');
const ScittIntegrationService = require('./scittIntegrationService');

class TEEModelDecryptionService {
  constructor() {
    this.attestationService = new AttestationService();
    this.encryptionService = new PlatformEncryptionService();
    this.enhancedEncryptionService = new EnhancedPlatformEncryptionService();
    this.provenanceService = new ProvenanceTrackingService();
    this.scittService = ScittIntegrationService; // Already an instance
    
    // Active decryption sessions
    this.activeDecryptionSessions = new Map();
    
    // TEE environment verification cache
    this.teeVerificationCache = new Map();
    
    // Model access policies
    this.accessPolicies = new Map();
    
    this.initializeService();
  }

  /**
   * Initialize the TEE Model Decryption Service
   */
  async initializeService() {
    console.log('🔐 Initializing TEE Model Decryption Service...');
    
    try {
      // Initialize attestation service
      await this.attestationService.initialize();
      
      // Load access policies
      await this.loadAccessPolicies();
      
      // Set up TEE environment monitoring
      this.setupTEEMonitoring();
      
      console.log('✅ TEE Model Decryption Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize TEE Model Decryption Service:', error);
      throw error;
    }
  }

  /**
   * Create a secure model decryption session
   * @param {Object} config - Decryption session configuration
   * @returns {Object} Decryption session details
   */
  async createDecryptionSession(config) {
    try {
      const {
        modelId,
        contractId,
        userId,
        teeEnvironmentId,
        requestedBy,
        purposes = [],
        timeLimit = 24 * 60 * 60 * 1000 // 24 hours default
      } = config;

      console.log(`🔐 Creating TEE decryption session for model ${modelId}`);

      // Generate unique session ID
      const sessionId = `tee_decrypt_${modelId}_${Date.now()}_${uuidv4().slice(0, 8)}`;

      // Verify TEE environment
      const teeVerification = await this.verifyTEEEnvironment(teeEnvironmentId);
      if (!teeVerification.verified) {
        throw new Error(`TEE environment verification failed: ${teeVerification.error}`);
      }

      // Check access permissions
      const accessCheck = await this.checkModelAccess(modelId, userId, contractId, purposes);
      if (!accessCheck.allowed) {
        throw new Error(`Model access denied: ${accessCheck.reason}`);
      }

      // Initialize provenance tracking for decryption
      const provenanceSession = await this.provenanceService.initializeProvenanceTracking({
        jobId: sessionId,
        contractId,
        environmentId: teeEnvironmentId,
        userId,
        modelId,
        operation: 'MODEL_DECRYPTION'
      });

      // Create decryption session
      const session = {
        sessionId,
        modelId,
        contractId,
        userId,
        teeEnvironmentId,
        requestedBy,
        purposes,
        status: 'INITIALIZED',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + timeLimit),
        teeVerification,
        accessPermissions: accessCheck.permissions,
        provenanceSessionId: provenanceSession.sessionId,
        securityMetrics: {
          encryptionMaintained: true,
          accessLogged: true,
          attestationVerified: true,
          integrityChecked: false
        },
        decryptedModelPath: null,
        cleanupScheduled: false
      };

      // Store session
      this.activeDecryptionSessions.set(sessionId, session);

      // Create provenance node for session creation
      await this.provenanceService.createProvenanceNode({
        nodeId: `decrypt_session_${sessionId}`,
        type: 'EXECUTION',
        content: {
          operation: 'TEE_DECRYPTION_SESSION_CREATED',
          sessionId,
          modelId,
          teeEnvironmentId,
          requestedBy,
          purposes,
          securityLevel: 'HIGH'
        },
        metadata: {
          operation: 'DECRYPTION_SESSION_INIT',
          teeEnvironment: teeEnvironmentId,
          verificationLevel: teeVerification.attestationLevel
        }
      });

      await this.provenanceService.addNodeToMerkleTree(provenanceSession.sessionId, `decrypt_session_${sessionId}`);

      // Create SCITT CCF claim
      const scittClaim = await this.scittService.createProvenanceRecord(
        contractId || `model_${modelId}`,
        provenanceSession.rootHash,
        'TEE_MODEL_DECRYPTION_SESSION',
        {
          sessionId,
          modelId,
          userId,
          teeEnvironmentId,
          purposes,
          attestationLevel: teeVerification.attestationLevel,
          createdAt: new Date()
        }
      );

      // Schedule automatic cleanup
      this.scheduleSessionCleanup(sessionId, timeLimit);

      console.log(`✅ TEE decryption session created: ${sessionId}`);

      return {
        sessionId,
        status: session.status,
        expiresAt: session.expiresAt,
        teeVerified: teeVerification.verified,
        attestationLevel: teeVerification.attestationLevel,
        provenanceSessionId: provenanceSession.sessionId,
        scittClaimId: scittClaim.claimId,
        accessPermissions: accessCheck.permissions
      };

    } catch (error) {
      console.error('❌ Failed to create decryption session:', error);
      throw error;
    }
  }

  /**
   * Decrypt model within TEE environment
   * @param {string} sessionId - Decryption session ID
   * @param {Object} decryptionParams - Decryption parameters
   * @returns {Object} Decrypted model access details
   */
  async decryptModelInTEE(sessionId, decryptionParams = {}) {
    try {
      const session = this.activeDecryptionSessions.get(sessionId);
      if (!session) {
        throw new Error('Decryption session not found');
      }

      if (session.status !== 'INITIALIZED') {
        throw new Error(`Invalid session status: ${session.status}`);
      }

      if (new Date() > session.expiresAt) {
        throw new Error('Decryption session has expired');
      }

      console.log(`🔓 Decrypting model ${session.modelId} in TEE environment ${session.teeEnvironmentId}`);

      // Re-verify TEE environment before decryption
      const teeReVerification = await this.verifyTEEEnvironment(session.teeEnvironmentId);
      if (!teeReVerification.verified) {
        throw new Error(`TEE re-verification failed: ${teeReVerification.error}`);
      }

      // Update session status
      session.status = 'DECRYPTING';
      session.decryptionStartedAt = new Date();

      // Get encrypted model metadata
      const { AIModel } = require('../models');
      const aiModel = await AIModel.findByPk(session.modelId);
      if (!aiModel) {
        throw new Error('AI model not found');
      }

      if (!aiModel.encryptionEnabled) {
        throw new Error('Model is not encrypted - TEE decryption not required');
      }

      // Verify model integrity before decryption
      const integrityCheck = await this.verifyModelIntegrity(aiModel);
      if (!integrityCheck.verified) {
        throw new Error(`Model integrity verification failed: ${integrityCheck.error}`);
      }

      session.securityMetrics.integrityChecked = true;

      // Create provenance node for decryption operation
      await this.provenanceService.createProvenanceNode({
        nodeId: `model_decrypt_${sessionId}`,
        type: 'EXECUTION',
        content: {
          operation: 'TEE_MODEL_DECRYPTION_START',
          modelId: session.modelId,
          encryptionAlgorithm: aiModel.encryptionAlgorithm,
          teeEnvironmentId: session.teeEnvironmentId,
          integrityVerified: integrityCheck.verified,
          decryptionStartedAt: session.decryptionStartedAt
        },
        parentNodes: [`decrypt_session_${sessionId}`],
        metadata: {
          operation: 'MODEL_DECRYPTION_START',
          securityLevel: 'CRITICAL',
          teeAttestation: teeReVerification.attestationLevel
        }
      });

      // Select appropriate decryption service
      const decryptionService = aiModel.encryptionAlgorithm === 'AES-256-GCM' 
        ? this.enhancedEncryptionService 
        : this.encryptionService;

      // Decrypt model file within TEE
      const decryptionResult = await decryptionService.decryptFile(
        aiModel.filePath,
        {
          algorithm: aiModel.encryptionAlgorithm,
          metadata: aiModel.encryptionMetadata,
          teeEnvironmentId: session.teeEnvironmentId,
          sessionId,
          verifyIntegrity: true,
          ...decryptionParams
        }
      );

      // Verify decrypted model
      const modelVerification = await this.verifyDecryptedModel(decryptionResult.decryptedFilePath);
      if (!modelVerification.verified) {
        // Clean up decrypted file
        await this.secureFileCleanup(decryptionResult.decryptedFilePath);
        throw new Error(`Decrypted model verification failed: ${modelVerification.error}`);
      }

      // Update session with decryption results
      session.status = 'DECRYPTED';
      session.decryptedModelPath = decryptionResult.decryptedFilePath;
      session.decryptionCompletedAt = new Date();
      session.decryptionDuration = session.decryptionCompletedAt - session.decryptionStartedAt;
      session.modelVerification = modelVerification;

      // Create provenance node for successful decryption
      await this.provenanceService.createProvenanceNode({
        nodeId: `model_decrypt_complete_${sessionId}`,
        type: 'EXECUTION',
        content: {
          operation: 'TEE_MODEL_DECRYPTION_COMPLETE',
          sessionId,
          modelId: session.modelId,
          decryptionDuration: session.decryptionDuration,
          modelVerified: modelVerification.verified,
          decryptedAt: session.decryptionCompletedAt
        },
        parentNodes: [`model_decrypt_${sessionId}`],
        metadata: {
          operation: 'MODEL_DECRYPTION_COMPLETE',
          successLevel: 'HIGH',
          verificationStatus: 'VERIFIED'
        }
      });

      // Add to Merkle tree
      const provenanceSession = this.provenanceService.provenanceTrees.get(session.provenanceSessionId);
      if (provenanceSession) {
        await this.provenanceService.addNodeToMerkleTree(session.provenanceSessionId, `model_decrypt_complete_${sessionId}`);
      }

      // Create SCITT CCF claim for successful decryption
      await this.scittService.createProvenanceRecord(
        session.contractId || `model_${session.modelId}`,
        provenanceSession?.rootHash || 'unknown',
        'TEE_MODEL_DECRYPTION_SUCCESS',
        {
          sessionId,
          modelId: session.modelId,
          teeEnvironmentId: session.teeEnvironmentId,
          decryptionDuration: session.decryptionDuration,
          verificationStatus: 'VERIFIED',
          completedAt: session.decryptionCompletedAt
        }
      );

      console.log(`✅ Model decrypted successfully in TEE: ${sessionId}`);

      return {
        sessionId,
        status: session.status,
        decryptedModelPath: session.decryptedModelPath,
        modelVerification: session.modelVerification,
        decryptionDuration: session.decryptionDuration,
        teeEnvironmentId: session.teeEnvironmentId,
        expiresAt: session.expiresAt,
        securityMetrics: session.securityMetrics,
        accessInstructions: {
          modelPath: session.decryptedModelPath,
          accessMode: 'READ_ONLY',
          allowedOperations: session.accessPermissions.operations,
          restrictions: session.accessPermissions.restrictions
        }
      };

    } catch (error) {
      console.error('❌ TEE model decryption failed:', error);
      
      // Update session status on failure
      const session = this.activeDecryptionSessions.get(sessionId);
      if (session) {
        session.status = 'FAILED';
        session.error = error.message;
        session.failedAt = new Date();
      }

      throw error;
    }
  }

  /**
   * Secure cleanup of decryption session
   * @param {string} sessionId - Decryption session ID
   * @returns {Object} Cleanup result
   */
  async cleanupDecryptionSession(sessionId) {
    try {
      const session = this.activeDecryptionSessions.get(sessionId);
      if (!session) {
        throw new Error('Decryption session not found');
      }

      console.log(`🧹 Cleaning up TEE decryption session: ${sessionId}`);

      // Secure deletion of decrypted model file
      if (session.decryptedModelPath) {
        await this.secureFileCleanup(session.decryptedModelPath);
      }

      // Create provenance node for cleanup
      await this.provenanceService.createProvenanceNode({
        nodeId: `session_cleanup_${sessionId}`,
        type: 'EXECUTION',
        content: {
          operation: 'TEE_DECRYPTION_SESSION_CLEANUP',
          sessionId,
          cleanupAt: new Date(),
          filesDeleted: session.decryptedModelPath ? 1 : 0,
          secureWipe: true
        },
        metadata: {
          operation: 'SESSION_CLEANUP',
          securityLevel: 'HIGH'
        }
      });

      // Update session status
      session.status = 'CLEANED_UP';
      session.cleanedUpAt = new Date();
      session.cleanupScheduled = false;

      // Remove from active sessions after a delay (for audit purposes)
      setTimeout(() => {
        this.activeDecryptionSessions.delete(sessionId);
      }, 60000); // Keep for 1 minute after cleanup

      console.log(`✅ TEE decryption session cleaned up: ${sessionId}`);

      return {
        sessionId,
        status: 'CLEANED_UP',
        cleanedUpAt: session.cleanedUpAt,
        filesDeleted: session.decryptedModelPath ? 1 : 0
      };

    } catch (error) {
      console.error('❌ Failed to cleanup decryption session:', error);
      throw error;
    }
  }

  /**
   * Verify TEE environment integrity and attestation
   * @param {string} teeEnvironmentId - TEE environment ID
   * @returns {Object} Verification result
   */
  async verifyTEEEnvironment(teeEnvironmentId) {
    try {
      // Check cache first
      const cacheKey = `tee_verify_${teeEnvironmentId}`;
      const cached = this.teeVerificationCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minute cache
        return cached.result;
      }

      console.log(`🔍 Verifying TEE environment: ${teeEnvironmentId}`);

      // Perform hardware attestation
      const attestationResult = await this.attestationService.verifyHardwareAttestation(teeEnvironmentId);
      
      // Check TEE configuration
      const configVerification = await this.verifyTEEConfiguration(teeEnvironmentId);
      
      // Verify enclave integrity
      const enclaveVerification = await this.verifyEnclaveIntegrity(teeEnvironmentId);

      const result = {
        verified: attestationResult.verified && configVerification.verified && enclaveVerification.verified,
        attestationLevel: attestationResult.attestationLevel,
        enclaveId: enclaveVerification.enclaveId,
        teeProvider: attestationResult.teeProvider,
        securityFeatures: {
          memoryEncryption: attestationResult.memoryEncryption,
          codeIntegrity: enclaveVerification.codeIntegrity,
          networkIsolation: configVerification.networkIsolation,
          debugDisabled: configVerification.debugDisabled
        },
        verifiedAt: new Date(),
        error: !attestationResult.verified ? attestationResult.error : 
               !configVerification.verified ? configVerification.error :
               !enclaveVerification.verified ? enclaveVerification.error : null
      };

      // Cache result
      this.teeVerificationCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('❌ TEE environment verification failed:', error);
      return {
        verified: false,
        error: error.message,
        verifiedAt: new Date()
      };
    }
  }

  /**
   * Check model access permissions
   * @param {string} modelId - Model ID
   * @param {string} userId - User ID
   * @param {string} contractId - Contract ID
   * @param {Array} purposes - Intended purposes
   * @returns {Object} Access check result
   */
  async checkModelAccess(modelId, userId, contractId, purposes) {
    try {
      console.log(`🔐 Checking model access: Model ${modelId}, User ${userId}, Contract ${contractId}`);

      const { AIModel, Contract } = require('../models');
      
      // Get model details
      const aiModel = await AIModel.findByPk(modelId);
      if (!aiModel) {
        return {
          allowed: false,
          reason: 'Model not found'
        };
      }

      // Check IP protection requirements
      if (aiModel.intellectualPropertyProtection && !aiModel.teeRequired) {
        return {
          allowed: false,
          reason: 'Model requires TEE access but TEE not configured'
        };
      }

      // If contract is specified, verify contract access
      if (contractId) {
        const contract = await Contract.findByPk(contractId);
        if (!contract) {
          return {
            allowed: false,
            reason: 'Contract not found'
          };
        }

        // Check if user is authorized for this contract
        const isAuthorized = contract.tdcId === userId || 
                           contract.tdpId === userId || 
                           contract.tspId === userId;

        if (!isAuthorized) {
          return {
            allowed: false,
            reason: 'User not authorized for this contract'
          };
        }

        // Check contract status
        if (contract.status !== 'SIGNED') {
          return {
            allowed: false,
            reason: 'Contract is not signed'
          };
        }
      }

      // Check if user owns the model
      if (aiModel.ownerId === userId) {
        return {
          allowed: true,
          reason: 'Model owner access',
          permissions: {
            operations: ['read', 'train', 'inference', 'modify'],
            restrictions: [],
            accessLevel: 'FULL'
          }
        };
      }

      // Check contract-based access
      if (contractId) {
        return {
          allowed: true,
          reason: 'Contract-based access',
          permissions: {
            operations: ['read', 'train', 'inference'],
            restrictions: ['no_modification', 'training_only'],
            accessLevel: 'LIMITED'
          }
        };
      }

      return {
        allowed: false,
        reason: 'No valid access permissions found'
      };

    } catch (error) {
      console.error('❌ Model access check failed:', error);
      return {
        allowed: false,
        reason: `Access check error: ${error.message}`
      };
    }
  }

  /**
   * Verify model integrity
   * @param {Object} aiModel - AI model record
   * @returns {Object} Integrity verification result
   */
  async verifyModelIntegrity(aiModel) {
    try {
      console.log(`🔍 Verifying model integrity for model ${aiModel.id}`);

      // Check if file exists
      const fileExists = await fs.access(aiModel.filePath).then(() => true).catch(() => false);
      if (!fileExists) {
        return {
          verified: false,
          error: 'Model file not found'
        };
      }

      // Calculate current file hash
      const fileBuffer = await fs.readFile(aiModel.filePath);
      const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Compare with stored hash
      if (currentHash !== aiModel.fileHash) {
        return {
          verified: false,
          error: 'File hash mismatch - model may have been tampered with'
        };
      }

      return {
        verified: true,
        fileHash: currentHash,
        verifiedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Model integrity verification failed:', error);
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Verify decrypted model
   * @param {string} decryptedFilePath - Path to decrypted model file
   * @returns {Object} Verification result
   */
  async verifyDecryptedModel(decryptedFilePath) {
    try {
      // Check if decrypted file exists and is readable
      const fileExists = await fs.access(decryptedFilePath).then(() => true).catch(() => false);
      if (!fileExists) {
        return {
          verified: false,
          error: 'Decrypted model file not found'
        };
      }

      // Basic structure validation (this would be more sophisticated in production)
      const stats = await fs.stat(decryptedFilePath);
      if (stats.size === 0) {
        return {
          verified: false,
          error: 'Decrypted model file is empty'
        };
      }

      // Additional model-specific validations could be added here
      // e.g., checking file format, model architecture, etc.

      return {
        verified: true,
        fileSize: stats.size,
        verifiedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Decrypted model verification failed:', error);
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Verify TEE configuration
   * @param {string} teeEnvironmentId - TEE environment ID
   * @returns {Object} Configuration verification result
   */
  async verifyTEEConfiguration(teeEnvironmentId) {
    try {
      // This would integrate with actual TEE configuration APIs
      // For now, returning mock verification
      return {
        verified: true,
        networkIsolation: true,
        debugDisabled: true,
        encryptionEnabled: true,
        attestationEnabled: true,
        verifiedAt: new Date()
      };
    } catch (error) {
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Verify enclave integrity
   * @param {string} teeEnvironmentId - TEE environment ID
   * @returns {Object} Enclave verification result
   */
  async verifyEnclaveIntegrity(teeEnvironmentId) {
    try {
      // This would integrate with actual enclave verification APIs
      // For now, returning mock verification
      return {
        verified: true,
        enclaveId: `enclave_${teeEnvironmentId}`,
        codeIntegrity: true,
        memoryProtection: true,
        signatureValid: true,
        verifiedAt: new Date()
      };
    } catch (error) {
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Secure file cleanup with multiple overwrites
   * @param {string} filePath - File path to clean up
   */
  async secureFileCleanup(filePath) {
    try {
      console.log(`🗑️ Performing secure cleanup of file: ${filePath}`);

      // Get file size for overwrite operations
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;

      // Perform multiple overwrite passes
      const overwritePasses = 3;
      for (let pass = 0; pass < overwritePasses; pass++) {
        const randomData = crypto.randomBytes(fileSize);
        await fs.writeFile(filePath, randomData);
      }

      // Final zero overwrite
      const zeroData = Buffer.alloc(fileSize, 0);
      await fs.writeFile(filePath, zeroData);

      // Delete the file
      await fs.unlink(filePath);

      console.log(`✅ Secure cleanup completed for: ${filePath}`);

    } catch (error) {
      console.error('❌ Secure cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic session cleanup
   * @param {string} sessionId - Session ID
   * @param {number} timeLimit - Time limit in milliseconds
   */
  scheduleSessionCleanup(sessionId, timeLimit) {
    const session = this.activeDecryptionSessions.get(sessionId);
    if (session) {
      session.cleanupScheduled = true;
      
      setTimeout(async () => {
        try {
          await this.cleanupDecryptionSession(sessionId);
        } catch (error) {
          console.error(`❌ Scheduled cleanup failed for session ${sessionId}:`, error);
        }
      }, timeLimit);
    }
  }

  /**
   * Load access policies
   */
  async loadAccessPolicies() {
    // Default access policies
    this.accessPolicies.set('default', {
      requireTEE: true,
      requireAttestation: true,
      maxSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      allowedOperations: ['read', 'train', 'inference'],
      restrictedOperations: ['modify', 'export']
    });
  }

  /**
   * Setup TEE environment monitoring
   */
  setupTEEMonitoring() {
    // Periodic verification of active TEE environments
    setInterval(async () => {
      for (const [sessionId, session] of this.activeDecryptionSessions) {
        if (session.status === 'DECRYPTED') {
          try {
            const verification = await this.verifyTEEEnvironment(session.teeEnvironmentId);
            if (!verification.verified) {
              console.warn(`⚠️ TEE environment verification failed for active session ${sessionId}`);
              await this.cleanupDecryptionSession(sessionId);
            }
          } catch (error) {
            console.error(`❌ TEE monitoring error for session ${sessionId}:`, error);
          }
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Get session status
   * @param {string} sessionId - Session ID
   * @returns {Object} Session status
   */
  getSessionStatus(sessionId) {
    const session = this.activeDecryptionSessions.get(sessionId);
    if (!session) {
      return {
        found: false,
        message: 'Session not found'
      };
    }

    return {
      found: true,
      sessionId: session.sessionId,
      status: session.status,
      modelId: session.modelId,
      teeEnvironmentId: session.teeEnvironmentId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      securityMetrics: session.securityMetrics,
      error: session.error
    };
  }

  /**
   * List active sessions
   * @param {Object} filters - Filter criteria
   * @returns {Array} Active sessions
   */
  listActiveSessions(filters = {}) {
    const sessions = Array.from(this.activeDecryptionSessions.values());
    
    if (filters.userId) {
      return sessions.filter(s => s.userId === filters.userId);
    }
    
    if (filters.modelId) {
      return sessions.filter(s => s.modelId === filters.modelId);
    }
    
    if (filters.status) {
      return sessions.filter(s => s.status === filters.status);
    }
    
    return sessions.map(s => ({
      sessionId: s.sessionId,
      status: s.status,
      modelId: s.modelId,
      userId: s.userId,
      teeEnvironmentId: s.teeEnvironmentId,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt
    }));
  }
}

module.exports = TEEModelDecryptionService;
