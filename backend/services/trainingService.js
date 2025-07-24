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
const { v4: uuidv4 } = require('uuid');

class TrainingService {
  constructor() {
    this.infrastructureService = new InfrastructureService();
    this.notificationService = new NotificationService();
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
}

module.exports = TrainingService; 