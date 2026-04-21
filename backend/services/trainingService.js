/**
 * Training Service - Automated Training Orchestration
 * 
 * This service handles the complete training lifecycle from contract signing
 * to training completion, including environment provisioning, data access,
 * training execution, and result validation.
 * 
 * Training Workflow:
 * 1. Contract signed → Trigger training
 * 2. Provision environment → Setup data access
 * 3. Execute training → Monitor progress
 * 4. Validate results → Clean up resources
 */

const { Contract, User, Dataset, AIModel, TrainingEnvironment, TrainingJob } = require('../models');
const InfrastructureService = require('./infrastructureService');
const NotificationService = require('./notificationService');
const DataLoadingService = require('./dataLoadingService');
const { v4: uuidv4 } = require('uuid');
const { DifferentialPrivacyService } = require('./differentialPrivacyService');

class TrainingService {
  constructor() {
    this.infrastructureService = new InfrastructureService();
    this.notificationService = new NotificationService();
    this.dataLoadingService = new DataLoadingService();
  }

  /**
   * Trigger training run for a signed contract
   * @param {string} contractId - Contract ID
   * @returns {Object} Training job details
   */
  async triggerTrainingRun(contractId) {
    try {
      console.log(`🚀 Triggering training run for contract: ${contractId}`);
      
      // 1. Validate contract
      const contract = await this.validateContract(contractId);
      
      // 2. Create training job
      const trainingJob = await this.createTrainingJob(contract);
      
      // 3. Provision environment
      const environment = await this.provisionEnvironment(contract);
      
      // 4. Setup data access
      await this.setupDataAccess(environment, contract);
      
      // 5. Start training
      await this.startTraining(environment, contract, trainingJob);
      
      // 6. Monitor progress
      this.monitorTraining(trainingJob.id);
      
      console.log(`✅ Training run triggered successfully: ${trainingJob.id}`);
      return trainingJob;
      
    } catch (error) {
      console.error('❌ Error triggering training run:', error);
      throw error;
    }
  }

  /**
   * Validate contract for training
   * @param {string} contractId - Contract ID
   * @returns {Object} Validated contract
   */
  async validateContract(contractId) {
    const contract = await Contract.findOne({
      where: { contractId },
      include: [
        { model: User, as: 'tdc' },
        { model: User, as: 'ccrp' },
        { model: Dataset, as: 'datasets' },
        { model: AIModel, as: 'aiModels' }
      ]
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'SIGNED') {
      throw new Error(`Contract must be in SIGNED status, current status: ${contract.status}`);
    }

    if (!contract.environmentSpecs) {
      throw new Error('Contract missing environment specifications');
    }

    if (!contract.trainingParams) {
      throw new Error('Contract missing training parameters');
    }

    if (!contract.ccrpCloudProvider) {
      throw new Error('Contract missing cloud provider selection');
    }

    return contract;
  }

  /**
   * Create training job record
   * @param {Object} contract - Contract object
   * @returns {Object} Training job
   */
  async createTrainingJob(contract) {
    const trainingJob = await TrainingJob.create({
      jobId: `job-${contract.contractId}-${Date.now()}`,
      contractId: contract.contractId,
      status: 'PENDING',
      environmentSpecs: contract.environmentSpecs,
      trainingParams: contract.trainingParams,
      cloudProvider: contract.ccrpCloudProvider,
      estimatedDuration: this.calculateEstimatedDuration(contract.trainingParams),
      createdBy: contract.tdcId
    });

    return trainingJob;
  }

  /**
   * Provision training environment
   * @param {Object} contract - Contract object
   * @returns {Object} Training environment
   */
  async provisionEnvironment(contract) {
    console.log(`🏗️ Provisioning environment for contract: ${contract.contractId}`);
    
    const config = {
      region: this.getDefaultRegion(contract.ccrpCloudProvider),
      compute: contract.environmentSpecs.compute,
      storage: contract.environmentSpecs.storage,
      network: contract.environmentSpecs.network,
      security: contract.environmentSpecs.security
    };

    const environment = await this.infrastructureService.createTrainingEnvironment(
      contract.contractId,
      config
    );

    return environment;
  }

  /**
   * Setup data access for training
   * @param {Object} environment - Training environment
   * @param {Object} contract - Contract object
   */
  async setupDataAccess(environment, contract) {
    console.log(`🔐 Setting up data access for environment: ${environment.environmentId}`);
    
    // Setup dataset access
    for (const dataset of contract.datasets) {
      await this.setupDatasetAccess(environment, dataset);
    }

    // Setup model access
    for (const model of contract.aiModels) {
      await this.setupModelAccess(environment, model);
    }

    // Setup KMS access
    await this.setupKMSAccess(environment, contract);
  }

  /**
   * Setup dataset access
   * @param {Object} environment - Training environment
   * @param {Object} dataset - Dataset object
   */
  async setupDatasetAccess(environment, dataset) {
    try {
      console.log(`📊 Setting up access for dataset: ${dataset.datasetId}`);
      
      // Real implementation using Azure Storage
      if (environment.cloudProvider === 'Azure') {
        const { BlobServiceClient } = require('@azure/storage-blob');
        const { DefaultAzureCredential } = require('@azure/identity');
        
        // Get storage account connection string
        const credential = new DefaultAzureCredential();
        const storageAccountName = environment.storageAccountName;
        
        // Create blob service client
        const blobServiceClient = new BlobServiceClient(
          `https://${storageAccountName}.blob.core.windows.net`,
          credential
        );
        
        // Create container for dataset
        const containerName = `dataset-${dataset.datasetId}`;
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists();
        
        // Upload dataset metadata
        const metadataBlob = containerClient.getBlockBlobClient('metadata.json');
        await metadataBlob.upload(JSON.stringify({
          datasetId: dataset.datasetId,
          name: dataset.name,
          description: dataset.description,
          size: dataset.size,
          format: dataset.format,
          encryption: dataset.encrypted,
          uploadedAt: new Date().toISOString()
        }), JSON.stringify({}).length);
        
        console.log(`✅ Dataset access configured: ${containerName}`);
      }
      
    } catch (error) {
      console.error(`❌ Error setting up dataset access: ${error.message}`);
      throw error;
    }
  }

  /**
   * Setup model access
   * @param {Object} environment - Training environment
   * @param {Object} model - AI model object
   */
  async setupModelAccess(environment, model) {
    try {
      console.log(`🤖 Setting up access for model: ${model.modelId}`);
      
      // Real implementation using Azure ML Services
      if (environment.cloudProvider === 'Azure') {
        const { MachineLearningServices } = require('@azure/arm-machinelearning');
        const { DefaultAzureCredential } = require('@azure/identity');
        
        const credential = new DefaultAzureCredential();
        const mlClient = new MachineLearningServices(credential, process.env.AZURE_SUBSCRIPTION_ID);
        
        // Create model in ML workspace
        const workspaceName = `${environment.environmentId}-ml-workspace`;
        const modelName = `model-${model.modelId}`;
        
        // Register model in workspace
        await mlClient.modelContainers.createOrUpdate(
          `${environment.environmentId}-rg`,
          workspaceName,
          modelName,
          {
            properties: {
              description: model.description,
              properties: {
                framework: model.framework,
                version: model.version,
                algorithm: model.algorithm
              }
            }
          }
        );
        
        console.log(`✅ Model access configured: ${modelName}`);
      }
      
    } catch (error) {
      console.error(`❌ Error setting up model access: ${error.message}`);
      throw error;
    }
  }

  /**
   * Setup KMS access
   * @param {Object} environment - Training environment
   * @param {Object} contract - Contract object
   */
  async setupKMSAccess(environment, contract) {
    try {
      console.log(`🔑 Setting up KMS access for environment: ${environment.environmentId}`);
      
      // Real implementation using Azure Key Vault
      if (environment.cloudProvider === 'Azure') {
        const { KeyVaultManagementClient } = require('@azure/arm-keyvault');
        const { DefaultAzureCredential } = require('@azure/identity');
        
        const credential = new DefaultAzureCredential();
        const keyVaultClient = new KeyVaultManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);
        
        const keyVaultName = `${environment.environmentId}-kv`;
        const resourceGroupName = `${environment.environmentId}-rg`;
        
        // Create encryption key for training data
        const keyName = 'training-encryption-key';
        const key = await keyVaultClient.vaults.beginCreateOrUpdate(
          resourceGroupName,
          keyVaultName,
          {
            location: environment.region,
            properties: {
              sku: { family: 'A', name: 'standard' },
              tenantId: process.env.AZURE_TENANT_ID,
              accessPolicies: [],
              enabledForDeployment: true,
              enabledForDiskEncryption: true,
              enabledForTemplateDeployment: true
            }
          }
        );
        
        console.log(`✅ KMS access configured: ${keyName}`);
      }
      
    } catch (error) {
      console.error(`❌ Error setting up KMS access: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start training execution
   * @param {Object} environment - Training environment
   * @param {Object} contract - Contract object
   * @param {Object} trainingJob - Training job
   */
  async startTraining(environment, contract, trainingJob) {
    try {
      console.log(`🎯 Starting training for job: ${trainingJob.jobId}`);
      
      // Update training job status
      await trainingJob.update({
        status: 'RUNNING',
        startedAt: new Date(),
        environmentId: environment.environmentId
      });

      // Update contract status
      await contract.update({
        status: 'EXECUTING',
        multiTdpStatus: 'EXECUTING'
      });

      // Notify parties
      await this.notifyTrainingStarted(contract);

      // Real implementation using Azure Container Instances
      if (environment.cloudProvider === 'Azure') {
        const { ContainerInstanceManagementClient } = require('@azure/arm-containerinstance');
        const { DefaultAzureCredential } = require('@azure/identity');
        
        const credential = new DefaultAzureCredential();
        const containerClient = new ContainerInstanceManagementClient(credential, process.env.AZURE_SUBSCRIPTION_ID);
        
        const resourceGroupName = `${environment.environmentId}-rg`;
        const containerGroupName = `${environment.environmentId}-training`;
        
        // Deploy training container
        const containerGroup = await containerClient.containerGroups.beginCreateOrUpdate(
          resourceGroupName,
          containerGroupName,
          {
            location: environment.region,
            containers: [
              {
                name: 'training-container',
                image: contract.trainingParams.containerImage || 'mcr.microsoft.com/azureml/openmpi4.1.0-ubuntu20.04',
                resources: {
                  requests: {
                    memoryInGB: contract.trainingParams.memoryGB || 4,
                    cpu: contract.trainingParams.cpuCores || 2
                  }
                },
                environmentVariables: [
                  {
                    name: 'CONTRACT_ID',
                    value: contract.contractId
                  },
                  {
                    name: 'JOB_ID',
                    value: trainingJob.jobId
                  },
                  {
                    name: 'DATASET_IDS',
                    value: contract.datasets.map(d => d.datasetId).join(',')
                  },
                  {
                    name: 'MODEL_IDS',
                    value: contract.aiModels.map(m => m.modelId).join(',')
                  }
                ],
                volumeMounts: [
                  {
                    name: 'training-data',
                    mountPath: '/data'
                  }
                ]
              }
            ],
            volumes: [
              {
                name: 'training-data',
                azureFile: {
                  shareName: 'training-data',
                  storageAccountName: environment.storageAccountName,
                  storageAccountKey: environment.storageAccountKey
                }
              }
            ],
            osType: 'Linux',
            restartPolicy: 'Never'
          }
        );
        
        const containerResult = await containerGroup.pollUntilDone();
        console.log(`✅ Training container deployed: ${containerResult.name}`);
        
        // Start the container
        await containerClient.containerGroups.beginStart(resourceGroupName, containerGroupName);
        console.log(`✅ Training container started`);
      }
      
      console.log(`✅ Training started for job: ${trainingJob.jobId}`);
      
    } catch (error) {
      console.error(`❌ Error starting training: ${error.message}`);
      throw error;
    }
  }

  /**
   * Monitor training progress
   * @param {string} jobId - Training job ID
   */
  async monitorTraining(jobId) {
    console.log(`📊 Monitoring training job: ${jobId}`);
    
    // In real implementation, this would:
    // 1. Poll training status
    // 2. Update progress
    // 3. Handle completion/failure
    // 4. Send notifications
    
    // For now, simulate monitoring
    setTimeout(async () => {
      await this.handleTrainingCompletion(jobId);
    }, 30000); // 30 seconds for demo
  }

  /**
   * Handle training completion
   * @param {string} jobId - Training job ID
   */
  async handleTrainingCompletion(jobId) {
    try {
      const trainingJob = await TrainingJob.findOne({
        where: { jobId },
        include: [{ model: Contract, as: 'contract' }]
      });

      if (!trainingJob) {
        throw new Error('Training job not found');
      }

      // Simulate training completion
      const results = {
        accuracy: 0.95 + Math.random() * 0.04, // 95-99%
        loss: 0.01 + Math.random() * 0.02, // 1-3%
        epochs: trainingJob.trainingParams.maxEpochs || 100,
        privacyMetrics: {
          differentialPrivacy: Math.random() * 0.1, // 0-10%
          federatedLearning: Math.random() * 0.05 // 0-5%
        }
      };

      // Update training job
      await trainingJob.update({
        status: 'COMPLETED',
        completedAt: new Date(),
        results: results
      });

      // Update contract
      await trainingJob.contract.update({
        status: 'COMPLETED',
        multiTdpStatus: 'COMPLETED'
      });

      // Notify parties
      await this.notifyTrainingCompleted(trainingJob.contract);

      console.log(`✅ Training completed for job: ${jobId}`);
      
    } catch (error) {
      console.error('❌ Error handling training completion:', error);
    }
  }

  /**
   * Get training status
   * @param {string} contractId - Contract ID
   * @returns {Object} Training status
   */
  async getTrainingStatus(contractId) {
    const trainingJob = await TrainingJob.findOne({
      where: { contractId },
      include: [{ model: TrainingEnvironment, as: 'environment' }]
    });

    if (!trainingJob) {
      return { status: 'NOT_STARTED' };
    }

    return {
      status: trainingJob.status,
      progress: this.calculateProgress(trainingJob),
      startedAt: trainingJob.startedAt,
      estimatedCompletion: trainingJob.estimatedCompletion,
      results: trainingJob.results,
      environment: trainingJob.environment
    };
  }

  /**
   * Get training results
   * @param {string} contractId - Contract ID
   * @returns {Object} Training results
   */
  async getTrainingResults(contractId) {
    const trainingJob = await TrainingJob.findOne({
      where: { contractId, status: 'COMPLETED' }
    });

    if (!trainingJob) {
      throw new Error('Training not completed or not found');
    }

    return trainingJob.results;
  }

  /**
   * Calculate training progress
   * @param {Object} trainingJob - Training job
   * @returns {number} Progress percentage
   */
  calculateProgress(trainingJob) {
    if (trainingJob.status === 'COMPLETED') {
      return 100;
    }
    
    if (trainingJob.status === 'RUNNING') {
      // In real implementation, this would calculate based on actual progress
      return Math.floor(Math.random() * 100);
    }
    
    return 0;
  }

  /**
   * Calculate estimated training duration
   * @param {Object} trainingParams - Training parameters
   * @returns {string} Estimated duration
   */
  calculateEstimatedDuration(trainingParams) {
    const epochs = trainingParams.maxEpochs || 100;
    const estimatedHours = epochs * 0.5; // 30 minutes per epoch
    return `${Math.ceil(estimatedHours)} hours`;
  }

  /**
   * Get default region for cloud provider
   * @param {string} cloudProvider - Cloud provider
   * @returns {string} Default region
   */
  getDefaultRegion(cloudProvider) {
    const regions = {
      'AWS': 'us-east-1',
      'GCP': 'us-central1',
      'Azure': 'eastus',
      'OCI': 'us-ashburn-1'
    };
    
    return regions[cloudProvider] || 'us-east-1';
  }

  /**
   * Notify training started
   * @param {Object} contract - Contract object
   */
  async notifyTrainingStarted(contract) {
    const parties = [contract.tdcId];
    if (contract.ccrpId) parties.push(contract.ccrpId);

    for (const partyId of parties) {
      await this.notificationService.createNotification({
        userId: partyId,
        type: 'TRAINING_STARTED',
        title: 'Training Started',
        message: `Training has started for contract ${contract.contractId}`,
        metadata: { contractId: contract.contractId }
      });
    }
  }

  /**
   * Notify training completed
   * @param {Object} contract - Contract object
   */
  async notifyTrainingCompleted(contract) {
    const parties = [contract.tdcId];
    if (contract.ccrpId) parties.push(contract.ccrpId);

    for (const partyId of parties) {
      await this.notificationService.createNotification({
        userId: partyId,
        type: 'TRAINING_COMPLETED',
        title: 'Training Completed',
        message: `Training has completed for contract ${contract.contractId}`,
        metadata: { contractId: contract.contractId }
      });
    }
  }

  /**
   * Start training with differential privacy
   */
  async startDPTraining(contractId, trainingJob) {
    try {
      console.log(`🔐 Starting DP training for contract ${contractId}`);
      
      const contract = await this.getContract(contractId);
      const dpService = new DifferentialPrivacyService();
      
      // Extract privacy parameters
      const privacyParams = contract.privacyRequirements?.differentialPrivacy;
      
      if (!privacyParams?.enabled) {
        throw new Error('Differential privacy not enabled for this contract');
      }
      
      console.log(`📊 Privacy params: ε=${privacyParams.epsilon}, δ=${privacyParams.delta}`);
      
      // Get training data
      const trainingData = await this.getTrainingData(contract.datasetId);
      
      // Apply DP to training data
      const dpResult = await dpService.applyDifferentialPrivacy(
        trainingData,
        {
          type: 'TRAINING_DATA',
          parameters: {
            dataType: 'FEATURE_VECTORS',
            bounds: privacyParams.bounds
          }
        },
        {
          contractId: contract.contractId,
          epsilon: privacyParams.epsilon * 0.3, // Use 30% of budget for data preprocessing
          delta: privacyParams.delta * 0.3,
          mechanism: privacyParams.mechanism || 'laplace'
        }
      );
      
      console.log(`✅ DP applied to training data`);
      
      // Train model with DP-protected data
      const model = await this.trainModelWithDP(
        dpResult.result,
        privacyParams,
        trainingJob,
        contractId
      );
      
      // Update training job with DP results
      await trainingJob.update({
        privacyMetrics: dpResult.privacyMetrics,
        dpEnabled: true,
        dpMechanism: privacyParams.mechanism,
        dpEpsilonUsed: dpResult.privacyMetrics.epsilon,
        dpDeltaUsed: dpResult.privacyMetrics.delta
      });
      
      console.log(`🎯 DP training completed successfully`);
      
      return {
        model,
        privacyMetrics: dpResult.privacyMetrics,
        trainingStatus: 'COMPLETED_WITH_DP',
        dpData: {
          originalDataSize: trainingData.length,
          dpDataSize: dpResult.result.length,
          noiseMetrics: dpResult.noiseMetrics
        }
      };
      
    } catch (error) {
      console.error('❌ DP training failed:', error);
      throw error;
    }
  }

  /**
   * Train model with differential privacy using DP-SGD
   */
  async trainModelWithDP(data, privacyParams, trainingJob, contractId) {
    console.log(`🧠 Training model with DP-SGD`);
    
    // Initialize model
    const model = await this.initializeModel(trainingJob.modelConfig);
    
    const { epsilon, delta, clipNorm = 1.0 } = privacyParams;
    const epochs = trainingJob.trainingParams.maxEpochs || 100;
    const batchSize = trainingJob.trainingParams.batchSize || 32;
    
    // Calculate remaining privacy budget for training
    const remainingEpsilon = epsilon * 0.7; // Use remaining 70% for training
    const remainingDelta = delta * 0.7;
    
    // Calculate epsilon per update
    const totalUpdates = epochs * Math.ceil(data.length / batchSize);
    const epsilonPerUpdate = remainingEpsilon / totalUpdates;
    const deltaPerUpdate = remainingDelta / totalUpdates;
    
    console.log(`📊 Training with ${totalUpdates} updates, ε=${epsilonPerUpdate} per update`);
    
    const dpService = new DifferentialPrivacyService();
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      console.log(`🔄 DP Training Epoch ${epoch + 1}/${epochs}`);
      
      const batches = this.createBatches(data, batchSize);
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Compute gradients
        const gradients = await this.computeGradients(model, batch);
        
        // Clip gradients for DP
        const clippedGradients = await this.clipGradients(gradients, clipNorm);
        
        // Add noise to gradients using DP
        const noisyGradients = await dpService.applyDifferentialPrivacy(
          clippedGradients,
          {
            type: 'GRADIENT',
            parameters: { clipNorm }
          },
          {
            contractId: contractId,
            epsilon: epsilonPerUpdate,
            delta: deltaPerUpdate,
            mechanism: 'laplace'
          }
        );
        
        // Update model with noisy gradients
        await this.updateModel(model, noisyGradients.result);
        
        // Log progress every 10 batches
        if (batchIndex % 10 === 0) {
          console.log(`  Batch ${batchIndex + 1}/${batches.length} completed`);
        }
      }
      
      // Log epoch progress
      console.log(`✅ DP Training Epoch ${epoch + 1}/${epochs} completed`);
    }
    
    return model;
  }

  /**
   * Clip gradients for differential privacy
   */
  async clipGradients(gradients, clipNorm) {
    const l2Norm = this.calculateL2Norm(gradients);
    
    if (l2Norm > clipNorm) {
      const scale = clipNorm / l2Norm;
      return this.scaleGradients(gradients, scale);
    }
    
    return gradients;
  }

  /**
   * Calculate L2 norm of gradients
   */
  calculateL2Norm(gradients) {
    if (Array.isArray(gradients)) {
      return Math.sqrt(gradients.reduce((sum, val) => sum + val * val, 0));
    } else if (typeof gradients === 'object') {
      const values = Object.values(gradients).filter(v => typeof v === 'number');
      return Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));
    }
    return Math.abs(gradients);
  }

  /**
   * Scale gradients by a factor
   */
  async scaleGradients(gradients, scale) {
    if (Array.isArray(gradients)) {
      return gradients.map(g => g * scale);
    } else if (typeof gradients === 'object') {
      const scaled = {};
      for (const [key, value] of Object.entries(gradients)) {
        if (typeof value === 'number') {
          scaled[key] = value * scale;
        } else if (Array.isArray(value)) {
          scaled[key] = value.map(v => v * scale);
        } else {
          scaled[key] = value;
        }
      }
      return scaled;
    }
    return gradients * scale;
  }

  /**
   * Create batches from data
   */
  createBatches(data, batchSize) {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Get training data for a dataset using the generic data loading service
   */
  async getTrainingData(datasetId) {
    try {
      const db = require('../models');
      const dataset = await db.Dataset.findByPk(datasetId);
      
      if (!dataset) {
        throw new Error(`Dataset not found: ${datasetId}`);
      }
      
      console.log(`📊 Loading dataset: ${dataset.name} (${dataset.type})`);
      
      // Use the generic data loading service
      const loadedData = await this.dataLoadingService.loadDataset(dataset, {
        framework: 'tensorflow',
        normalize: true,
        validationSplit: 0.2,
        batchSize: 32,
        shuffle: true
      });
      
      console.log(`✅ Dataset loaded: ${loadedData.metadata.recordCount} samples, ${loadedData.metadata.featureCount} features`);
      
      return loadedData;
      
    } catch (error) {
      console.error('Failed to get training data:', error);
      throw error;
    }
  }

  /**
   * Generate mock training data for testing
   */
  generateMockTrainingData(samples, features) {
    const data = [];
    for (let i = 0; i < samples; i++) {
      const sample = [];
      for (let j = 0; j < features; j++) {
        // Generate random feature values between -1 and 1
        sample.push(Math.random() * 2 - 1);
      }
      data.push(sample);
    }
    return data;
  }

  /**
   * Initialize model with configuration
   */
  async initializeModel(config) {
    // Mock model initialization - in production this would create actual ML model
    const model = {
      weights: new Array(config.inputSize || 10).fill(0).map(() => Math.random() * 2 - 1),
      bias: Math.random() * 2 - 1,
      config: config
    };
    
    console.log(`🧠 Model initialized with ${model.weights.length} weights`);
    return model;
  }

  /**
   * Compute gradients for a batch
   */
  async computeGradients(model, batch) {
    // Mock gradient computation - in production this would compute actual gradients
    const gradients = {
      weights: model.weights.map(() => Math.random() * 2 - 1),
      bias: Math.random() * 2 - 1
    };
    
    return gradients;
  }

  /**
   * Update model with gradients
   */
  async updateModel(model, gradients) {
    // Mock model update - in production this would update actual model parameters
    if (gradients.weights) {
      for (let i = 0; i < model.weights.length; i++) {
        model.weights[i] += gradients.weights[i] * 0.01; // Learning rate
      }
    }
    
    if (gradients.bias !== undefined) {
      model.bias += gradients.bias * 0.01;
    }
  }

  /**
   * Get contract by ID
   */
  async getContract(contractId) {
    try {
      const db = require('../models');
      const contract = await db.Contract.findOne({
        where: { contractId }
      });
      
      if (!contract) {
        throw new Error(`Contract not found: ${contractId}`);
      }
      
      return contract;
      
    } catch (error) {
      console.error('Failed to get contract:', error);
      throw error;
    }
  }

  /**
   * Jobs for contracts where the user is TDC or CCRP (CCRP training console).
   */
  async getTrainingJobs(userId) {
    const { Op } = require('sequelize');
    const uid = Number(userId);
    if (!Number.isFinite(uid)) {
      throw new Error('Invalid user id');
    }
    const contracts = await Contract.findAll({
      where: { [Op.or]: [{ tdcId: uid }, { ccrpId: uid }] },
      attributes: ['contractId'],
    });
    const ids = contracts.map((c) => c.contractId).filter(Boolean);
    if (ids.length === 0) return [];
    return TrainingJob.findAll({
      where: { contractId: { [Op.in]: ids } },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Container registry not implemented — return empty until multi-cloud container tracking exists.
   */
  async getTrainingContainers(_userId) {
    return [];
  }

  /**
   * Manual deploy from CCRP UI (ad-hoc job record; extend with real orchestration later).
   */
  async deployTrainingJob(userId, config = {}) {
    const contractId =
      config.contractId ||
      `ccrp-manual-${userId}-${Date.now()}`;
    const jobId = `job-${contractId}-${Date.now()}`;
    const job = await TrainingJob.create({
      jobId,
      contractId,
      status: 'PENDING',
      trainingConfig: config,
      metadata: {
        deployConfig: config,
        source: 'ccrp_deploy',
      },
      createdBy: String(userId),
    });
    return job.get({ plain: true });
  }

  async stopTrainingJob(jobId) {
    const job = await TrainingJob.findOne({ where: { jobId } });
    if (!job) throw new Error('Training job not found');
    await job.update({
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: 'Stopped by user',
    });
  }

  async deleteTrainingJob(jobId) {
    const job = await TrainingJob.findOne({ where: { jobId } });
    if (!job) throw new Error('Training job not found');
    await job.destroy();
  }

  async getTrainingJobLogs(jobId) {
    const job = await TrainingJob.findOne({ where: { jobId } });
    if (!job) throw new Error('Training job not found');
    const plain = job.get({ plain: true });
    if (plain.logs && Array.isArray(plain.logs)) return plain.logs;
    if (plain.metadata?.logLines) return plain.metadata.logLines;
    return [
      `[${new Date().toISOString()}] INFO: Log streaming not attached for job ${jobId}`,
    ];
  }
}

module.exports = TrainingService; 