/**
 * Training Orchestration Service
 * 
 * Main service responsible for coordinating the complete AI model training workflow
 * including TEE provisioning, data access, training execution, and monitoring.
 */

const ContractService = require('./contractService');
const TEEProvisioningService = require('./teeProvisioningService');
const AttestationService = require('./attestationService');
const TrainingMonitoringService = require('./trainingMonitoringService');
const ProvenanceService = require('./provenanceService');
const NotificationService = require('./notificationService');
const SecureDataAccessService = require('./secureDataAccessService');
const PrivacyPreservingTrainingService = require('./privacyPreservingTrainingService');
const AdvancedMonitoringService = require('./advancedMonitoringService');
const ProvenanceTrackingService = require('./provenanceTrackingService');
const TrainingContainerService = require('./trainingContainerService');

class TrainingOrchestrationService {
  constructor() {
    this.contractService = new ContractService();
    this.teeProvisioningService = new TEEProvisioningService();
    this.attestationService = new AttestationService();
    this.monitoringService = new TrainingMonitoringService();
    this.provenanceService = new ProvenanceService();
    this.notificationService = new NotificationService();
    
    // New services for complete implementation
    this.secureDataAccessService = new SecureDataAccessService();
    this.privacyPreservingTrainingService = new PrivacyPreservingTrainingService();
    this.advancedMonitoringService = new AdvancedMonitoringService();
    this.provenanceTrackingService = new ProvenanceTrackingService();
    this.trainingContainerService = new TrainingContainerService();
    
    // Training job tracking
    this.activeJobs = new Map();
    this.jobHistory = new Map();
  }

  /**
   * Execute complete training workflow for a signed contract
   * @param {string} contractId - Contract ID
   * @param {Object} options - Training options
   * @returns {Object} Training job details
   */
  async executeTrainingWorkflow(contractId, options = {}) {
    try {
      console.log(`🚀 Starting training workflow for contract: ${contractId}`);
      
      // 1. Validate contract and get all parties
      const contract = await this.validateContract(contractId);
      
      // 2. Create training job
      const trainingJob = await this.createTrainingJob(contract, options);
      
      // 3. Initialize provenance tracking
      const provenanceSession = await this.provenanceService.initializeProvenanceSession(contractId);
      trainingJob.provenanceSessionId = provenanceSession.sessionId;
      
      // 4. Provision TEE environment
      const teeEnvironment = await this.provisionTEEEnvironment(contract, trainingJob);
      trainingJob.environmentId = teeEnvironment.id;
      
      // 5. Setup secure data access
      await this.setupSecureDataAccess(teeEnvironment, contract, trainingJob);
      
      // 6. Deploy training container
      const containerDeployment = await this.deployTrainingContainer(teeEnvironment, contract, trainingJob);
      trainingJob.containerId = containerDeployment.id;
      
      // 7. Start training execution
      await this.startTrainingExecution(containerDeployment, contract, trainingJob);
      
      // 8. Start monitoring
      await this.startTrainingMonitoring(trainingJob);
      
      // 9. Update job status
      trainingJob.status = 'RUNNING';
      trainingJob.startedAt = new Date();
      await this.updateTrainingJob(trainingJob);
      
      // 10. Notify parties
      await this.notifyTrainingStarted(contract, trainingJob);
      
      console.log(`✅ Training workflow started successfully: ${trainingJob.jobId}`);
      return trainingJob;
      
    } catch (error) {
      console.error('❌ Training workflow failed:', error);
      await this.handleTrainingFailure(contractId, error);
      throw error;
    }
  }

  /**
   * Validate contract for training execution
   * @param {string} contractId - Contract ID
   * @returns {Object} Validated contract
   */
  async validateContract(contractId) {
    try {
      console.log(`🔍 Validating contract: ${contractId}`);
      
      const contract = await this.contractService.getContract(contractId);
      
      if (!contract) {
        throw new Error(`Contract not found: ${contractId}`);
      }
      
      if (contract.status !== 'SIGNED') {
        throw new Error(`Contract not signed: ${contract.status}`);
      }
      
      // Validate all required parties are present
      const requiredParties = ['TDP', 'TDC', 'TSP'];
      const presentParties = contract.parties.map(p => p.role);
      const missingParties = requiredParties.filter(role => !presentParties.includes(role));
      
      if (missingParties.length > 0) {
        throw new Error(`Missing required parties: ${missingParties.join(', ')}`);
      }
      
      // Validate training environment requirements
      if (!contract.trainingEnvironment) {
        throw new Error('Training environment not specified in contract');
      }
      
      // Validate datasets are available
      if (!contract.datasets || contract.datasets.length === 0) {
        throw new Error('No datasets specified for training');
      }
      
      // Validate AI models are available
      if (!contract.aiModels || contract.aiModels.length === 0) {
        throw new Error('No AI models specified for training');
      }
      
      console.log(`✅ Contract validation successful: ${contractId}`);
      return contract;
      
    } catch (error) {
      console.error(`❌ Contract validation failed: ${contractId}`, error);
      throw error;
    }
  }

  /**
   * Create training job record
   * @param {Object} contract - Contract details
   * @param {Object} options - Training options
   * @returns {Object} Training job
   */
  async createTrainingJob(contract, options) {
    try {
      console.log(`📝 Creating training job for contract: ${contract.contractId}`);
      
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const trainingJob = {
        jobId,
        contractId: contract.contractId,
        status: 'PENDING',
        priority: options.priority || 'NORMAL',
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
        createdAt: new Date(),
        createdBy: options.createdBy || 'system',
        trainingConfig: {
          epochs: contract.trainingParams?.epochs || 10,
          batchSize: contract.trainingParams?.batchSize || 32,
          learningRate: contract.trainingParams?.learningRate || 0.001,
          algorithm: contract.trainingParams?.algorithm || 'adam',
          privacyTechniques: contract.privacyRequirements?.techniques || [],
          differentialPrivacy: contract.privacyRequirements?.differentialPrivacy || null
        },
        environmentConfig: contract.trainingEnvironment,
        datasets: contract.datasets,
        aiModels: contract.aiModels,
        parties: contract.parties,
        metadata: {
          contractVersion: contract.version,
          contractHash: contract.hash,
          trainingType: contract.trainingType || 'FEDERATED',
          estimatedDuration: this.estimateTrainingDuration(contract),
          resourceRequirements: this.calculateResourceRequirements(contract)
        }
      };
      
      // Store job in memory and database
      this.activeJobs.set(jobId, trainingJob);
      await this.storeTrainingJob(trainingJob);
      
      console.log(`✅ Training job created: ${jobId}`);
      return trainingJob;
      
    } catch (error) {
      console.error('❌ Failed to create training job:', error);
      throw error;
    }
  }

  /**
   * Provision TEE environment for training
   * @param {Object} contract - Contract details
   * @param {Object} trainingJob - Training job
   * @returns {Object} TEE environment
   */
  async provisionTEEEnvironment(contract, trainingJob) {
    try {
      console.log(`🏗️ Provisioning TEE environment for job: ${trainingJob.jobId}`);
      
      const environmentConfig = {
        contractId: contract.contractId,
        jobId: trainingJob.jobId,
        provider: contract.trainingEnvironment.provider,
        region: contract.trainingEnvironment.region,
        instanceType: contract.trainingEnvironment.instanceType,
        securityLevel: contract.trainingEnvironment.securityLevel,
        resourceRequirements: trainingJob.metadata.resourceRequirements,
        privacyRequirements: contract.privacyRequirements,
        complianceRequirements: contract.complianceRequirements
      };
      
      const teeEnvironment = await this.teeProvisioningService.provisionEnvironment(environmentConfig);
      
      console.log(`✅ TEE environment provisioned: ${teeEnvironment.id}`);
      return teeEnvironment;
      
    } catch (error) {
      console.error('❌ TEE environment provisioning failed:', error);
      throw error;
    }
  }

  /**
   * Setup secure data access for training
   * @param {Object} teeEnvironment - TEE environment
   * @param {Object} contract - Contract details
   * @param {Object} trainingJob - Training job
   */
  async setupSecureDataAccess(teeEnvironment, contract, trainingJob) {
    try {
      console.log(`🔐 Setting up secure data access for job: ${trainingJob.jobId}`);
      
      // 1. Verify TEE attestation
      const attestationResult = await this.attestationService.verifyTEEAttestation(
        teeEnvironment.id,
        teeEnvironment.attestationDocument
      );
      
      if (!attestationResult.isValid) {
        throw new Error('TEE attestation verification failed');
      }
      
      // 2. Setup encrypted data access
      const dataAccessConfig = {
        environmentId: teeEnvironment.id,
        datasets: contract.datasets,
        aiModels: contract.aiModels,
        encryptionKeys: await this.getEncryptionKeys(contract),
        accessPolicies: contract.accessPolicies,
        privacyRequirements: contract.privacyRequirements
      };
      
      await this.teeProvisioningService.setupSecureDataAccess(dataAccessConfig);
      
      console.log(`✅ Secure data access configured for job: ${trainingJob.jobId}`);
      
    } catch (error) {
      console.error('❌ Secure data access setup failed:', error);
      throw error;
    }
  }

  /**
   * Deploy training container to TEE environment
   * @param {Object} teeEnvironment - TEE environment
   * @param {Object} contract - Contract details
   * @param {Object} trainingJob - Training job
   * @returns {Object} Container deployment
   */
  async deployTrainingContainer(teeEnvironment, contract, trainingJob) {
    try {
      console.log(`📦 Deploying training container for job: ${trainingJob.jobId}`);
      
      const containerConfig = {
        environmentId: teeEnvironment.id,
        jobId: trainingJob.jobId,
        contractId: contract.contractId,
        image: contract.trainingEnvironment.containerImage || 'training-container:latest',
        resources: {
          cpu: contract.trainingEnvironment.cpuCores || 2,
          memory: contract.trainingEnvironment.memoryGB || 4,
          gpu: contract.trainingEnvironment.gpuCount || 0
        },
        environment: {
          CONTRACT_ID: contract.contractId,
          JOB_ID: trainingJob.jobId,
          ENVIRONMENT_ID: teeEnvironment.id,
          TRAINING_EPOCHS: trainingJob.trainingConfig.epochs,
          BATCH_SIZE: trainingJob.trainingConfig.batchSize,
          LEARNING_RATE: trainingJob.trainingConfig.learningRate,
          PRIVACY_TECHNIQUES: trainingJob.trainingConfig.privacyTechniques.join(','),
          PROVENANCE_SESSION_ID: trainingJob.provenanceSessionId
        },
        volumes: [
          {
            name: 'training-data',
            mountPath: '/data',
            readOnly: true
          },
          {
            name: 'training-output',
            mountPath: '/output',
            readOnly: false
          }
        ]
      };
      
      const containerDeployment = await this.teeProvisioningService.deployContainer(containerConfig);
      
      console.log(`✅ Training container deployed: ${containerDeployment.id}`);
      return containerDeployment;
      
    } catch (error) {
      console.error('❌ Training container deployment failed:', error);
      throw error;
    }
  }

  /**
   * Start training execution
   * @param {Object} containerDeployment - Container deployment
   * @param {Object} contract - Contract details
   * @param {Object} trainingJob - Training job
   */
  async startTrainingExecution(containerDeployment, contract, trainingJob) {
    try {
      console.log(`▶️ Starting training execution for job: ${trainingJob.jobId}`);
      
      // Start the training container
      await this.teeProvisioningService.startContainer(containerDeployment.id);
      
      // Update job status
      trainingJob.status = 'RUNNING';
      trainingJob.containerId = containerDeployment.id;
      trainingJob.startedAt = new Date();
      
      await this.updateTrainingJob(trainingJob);
      
      console.log(`✅ Training execution started for job: ${trainingJob.jobId}`);
      
    } catch (error) {
      console.error('❌ Training execution start failed:', error);
      throw error;
    }
  }

  /**
   * Start monitoring training progress
   * @param {Object} trainingJob - Training job
   */
  async startTrainingMonitoring(trainingJob) {
    try {
      console.log(`📊 Starting monitoring for job: ${trainingJob.jobId}`);
      
      await this.monitoringService.startMonitoring(trainingJob);
      
      console.log(`✅ Monitoring started for job: ${trainingJob.jobId}`);
      
    } catch (error) {
      console.error('❌ Monitoring start failed:', error);
      // Don't throw error - monitoring failure shouldn't stop training
    }
  }

  /**
   * Get training job status
   * @param {string} jobId - Job ID
   * @returns {Object} Job status
   */
  async getTrainingJobStatus(jobId) {
    try {
      const job = this.activeJobs.get(jobId) || await this.getTrainingJobFromDB(jobId);
      
      if (!job) {
        throw new Error(`Training job not found: ${jobId}`);
      }
      
      // Get current progress from monitoring service
      const progress = await this.monitoringService.getJobProgress(jobId);
      
      return {
        jobId: job.jobId,
        contractId: job.contractId,
        status: job.status,
        progress: progress,
        environmentId: job.environmentId,
        containerId: job.containerId,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        metadata: job.metadata
      };
      
    } catch (error) {
      console.error(`❌ Failed to get job status: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Cancel training job
   * @param {string} jobId - Job ID
   * @param {string} reason - Cancellation reason
   */
  async cancelTrainingJob(jobId, reason = 'User requested cancellation') {
    try {
      console.log(`🛑 Cancelling training job: ${jobId}`);
      
      const job = this.activeJobs.get(jobId);
      if (!job) {
        throw new Error(`Training job not found: ${jobId}`);
      }
      
      // Stop container
      if (job.containerId) {
        await this.teeProvisioningService.stopContainer(job.containerId);
      }
      
      // Stop monitoring
      await this.monitoringService.stopMonitoring(jobId);
      
      // Update job status
      job.status = 'CANCELLED';
      job.cancelledAt = new Date();
      job.cancellationReason = reason;
      
      await this.updateTrainingJob(job);
      
      // Move to history
      this.activeJobs.delete(jobId);
      this.jobHistory.set(jobId, job);
      
      // Notify parties
      await this.notifyTrainingCancelled(job, reason);
      
      console.log(`✅ Training job cancelled: ${jobId}`);
      
    } catch (error) {
      console.error(`❌ Failed to cancel training job: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Handle training failure
   * @param {string} contractId - Contract ID
   * @param {Error} error - Error details
   */
  async handleTrainingFailure(contractId, error) {
    try {
      console.log(`💥 Handling training failure for contract: ${contractId}`);
      
      // Find active jobs for this contract
      const activeJobs = Array.from(this.activeJobs.values())
        .filter(job => job.contractId === contractId);
      
      for (const job of activeJobs) {
        job.status = 'FAILED';
        job.failedAt = new Date();
        job.errorMessage = error.message;
        
        await this.updateTrainingJob(job);
        
        // Move to history
        this.activeJobs.delete(job.jobId);
        this.jobHistory.set(job.jobId, job);
      }
      
      // Notify parties
      await this.notifyTrainingFailed(contractId, error);
      
    } catch (notificationError) {
      console.error('❌ Failed to handle training failure:', notificationError);
    }
  }

  /**
   * Estimate training duration
   * @param {Object} contract - Contract details
   * @returns {number} Estimated duration in minutes
   */
  estimateTrainingDuration(contract) {
    const baseDuration = 60; // 1 hour base
    const datasetSize = contract.datasets?.length || 1;
    const modelComplexity = contract.aiModels?.length || 1;
    const epochs = contract.trainingParams?.epochs || 10;
    
    return baseDuration * datasetSize * modelComplexity * (epochs / 10);
  }

  /**
   * Calculate resource requirements
   * @param {Object} contract - Contract details
   * @returns {Object} Resource requirements
   */
  calculateResourceRequirements(contract) {
    return {
      cpu: contract.trainingEnvironment?.cpuCores || 2,
      memory: contract.trainingEnvironment?.memoryGB || 4,
      gpu: contract.trainingEnvironment?.gpuCount || 0,
      storage: contract.trainingEnvironment?.storageGB || 50,
      network: contract.trainingEnvironment?.networkBandwidth || 'standard'
    };
  }

  /**
   * Get encryption keys for contract
   * @param {Object} contract - Contract details
   * @returns {Object} Encryption keys
   */
  async getEncryptionKeys(contract) {
    // This would integrate with the key management service
    // For now, return mock keys
    return {
      dataEncryptionKey: 'mock_data_key',
      modelEncryptionKey: 'mock_model_key',
      sessionKey: 'mock_session_key'
    };
  }

  /**
   * Store training job in database
   * @param {Object} trainingJob - Training job
   */
  async storeTrainingJob(trainingJob) {
    // This would integrate with the database service
    // For now, just log
    console.log(`💾 Storing training job: ${trainingJob.jobId}`);
  }

  /**
   * Update training job in database
   * @param {Object} trainingJob - Training job
   */
  async updateTrainingJob(trainingJob) {
    // This would integrate with the database service
    // For now, just log
    console.log(`💾 Updating training job: ${trainingJob.jobId}`);
  }

  /**
   * Get training job from database
   * @param {string} jobId - Job ID
   * @returns {Object} Training job
   */
  async getTrainingJobFromDB(jobId) {
    // This would integrate with the database service
    // For now, return null
    return null;
  }

  /**
   * Notify parties that training started
   * @param {Object} contract - Contract details
   * @param {Object} trainingJob - Training job
   */
  async notifyTrainingStarted(contract, trainingJob) {
    try {
      const message = {
        type: 'TRAINING_STARTED',
        contractId: contract.contractId,
        jobId: trainingJob.jobId,
        environmentId: trainingJob.environmentId,
        estimatedDuration: trainingJob.metadata.estimatedDuration
      };
      
      for (const party of contract.parties) {
        await this.notificationService.sendNotification(party.userId, message);
      }
    } catch (error) {
      console.error('❌ Failed to send training started notification:', error);
    }
  }

  /**
   * Notify parties that training was cancelled
   * @param {Object} trainingJob - Training job
   * @param {string} reason - Cancellation reason
   */
  async notifyTrainingCancelled(trainingJob, reason) {
    try {
      const message = {
        type: 'TRAINING_CANCELLED',
        contractId: trainingJob.contractId,
        jobId: trainingJob.jobId,
        reason: reason
      };
      
      for (const party of trainingJob.parties) {
        await this.notificationService.sendNotification(party.userId, message);
      }
    } catch (error) {
      console.error('❌ Failed to send training cancelled notification:', error);
    }
  }

  /**
   * Notify parties that training failed
   * @param {string} contractId - Contract ID
   * @param {Error} error - Error details
   */
  async notifyTrainingFailed(contractId, error) {
    try {
      const message = {
        type: 'TRAINING_FAILED',
        contractId: contractId,
        error: error.message
      };
      
      // Get contract parties
      const contract = await this.contractService.getContract(contractId);
      if (contract && contract.parties) {
        for (const party of contract.parties) {
          await this.notificationService.sendNotification(party.userId, message);
        }
      }
    } catch (notificationError) {
      console.error('❌ Failed to send training failed notification:', notificationError);
    }
  }
}

module.exports = TrainingOrchestrationService;
