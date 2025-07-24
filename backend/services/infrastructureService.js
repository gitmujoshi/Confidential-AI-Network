const { v4: uuidv4 } = require('uuid');
const db = require('../models');

/**
 * Infrastructure Provisioning Service
 * 
 * Handles creation, management, and destruction of training environments
 * across different cloud providers (AWS, GCP, Azure, OCI)
 * Now includes Terraform integration for Infrastructure as Code
 */
class InfrastructureService {
  constructor() {
    this.providers = {
      AWS: require('./providers/awsProvider'),
      GCP: require('./providers/gcpProvider'),
      Azure: require('./providers/azureProvider'),
      OCI: require('./providers/ociProvider')
    };
    
    // Add Terraform service for Infrastructure as Code
    this.terraformService = require('./terraformService');
  }

  /**
   * Create training environment based on contract configuration
   */
  async createTrainingEnvironment(contractId, config) {
    try {
      console.log(`🏗️ Creating training environment for contract: ${contractId}`);
      
      const contract = await db.Contract.findOne({
        where: { contractId },
        include: [
          { model: db.User, as: 'tdp' },
          { model: db.User, as: 'tdc' },
          { model: db.User, as: 'ccrp' },
          { model: db.Dataset, as: 'dataset' }
        ]
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      if (!contract.ccrpCloudProvider) {
        throw new Error('No cloud provider selected for this contract');
      }

      // Get CCRP-specific Azure configuration if using Azure
      let azureConfig = null;
      if (contract.ccrpCloudProvider === 'Azure') {
        const CCRPAzureCredentialsService = require('./ccrpAzureCredentialsService');
        const ccrpCredentialsService = new CCRPAzureCredentialsService();
        
        try {
          azureConfig = await ccrpCredentialsService.getContractAzureConfig(contractId);
          console.log(`✅ Retrieved CCRP Azure configuration for contract: ${contractId}`);
        } catch (error) {
          console.error(`❌ Error getting CCRP Azure config: ${error.message}`);
          throw new Error(`Azure configuration not available: ${error.message}`);
        }
      }

      // Generate unique environment ID
      const environmentId = `env-${contractId}-${Date.now()}`;
      
      // Create training environment record
      const trainingEnvironment = await db.TrainingEnvironment.create({
        contractId,
        environmentId,
        cloudProvider: contract.ccrpCloudProvider,
        region: config.region || this.getDefaultRegion(contract.ccrpCloudProvider),
        status: 'PENDING',
        infrastructureConfig: this.buildInfrastructureConfig(contract, config),
        securityConfig: this.buildSecurityConfig(contract, config),
        monitoringConfig: this.buildMonitoringConfig(contract, config),
        costEstimate: this.estimateCost(contract, config),
        createdBy: contract.tdcId
      });

      // Get the appropriate cloud provider
      let provider;
      if (contract.ccrpCloudProvider === 'Azure' && azureConfig) {
        // Create Azure provider with CCRP-specific configuration
        const AzureProvider = require('./providers/azureProvider');
        provider = new AzureProvider(azureConfig);
      } else {
        provider = this.providers[contract.ccrpCloudProvider];
      }
      
      if (!provider) {
        throw new Error(`Unsupported cloud provider: ${contract.ccrpCloudProvider}`);
      }

      // Update status to provisioning
      await trainingEnvironment.update({ status: 'PROVISIONING' });

      // Provision infrastructure
      const provisionResult = await provider.provisionInfrastructure(
        environmentId,
        trainingEnvironment.infrastructureConfig,
        trainingEnvironment.securityConfig,
        trainingEnvironment.monitoringConfig
      );

      // Update environment with provisioned resources
      await trainingEnvironment.update({
        status: 'ACTIVE',
        environmentUrl: provisionResult.environmentUrl,
        provisioningLogs: provisionResult.logs,
        actualCost: provisionResult.estimatedCost
      });

      // Create resource records
      await this.createResourceRecords(environmentId, provisionResult.resources);

      // Update contract with environment info
      await contract.update({
        environmentStatus: 'ACTIVE',
        environmentId,
        environmentUrl: provisionResult.environmentUrl,
        environmentCreatedAt: new Date(),
        infrastructureConfig: trainingEnvironment.infrastructureConfig,
        securityConfig: trainingEnvironment.securityConfig,
        monitoringConfig: trainingEnvironment.monitoringConfig,
        costEstimate: trainingEnvironment.costEstimate
      });

      console.log(`✅ Training environment created successfully: ${environmentId}`);
      return trainingEnvironment;

    } catch (error) {
      console.error('❌ Error creating training environment:', error);
      throw error;
    }
  }

  /**
   * Create training environment using Terraform (Infrastructure as Code)
   */
  async createTrainingEnvironmentWithTerraform(contractId, config) {
    try {
      console.log(`🏗️ Creating training environment with Terraform for contract: ${contractId}`);
      
      const contract = await db.Contract.findOne({
        where: { contractId },
        include: [
          { model: db.User, as: 'tdp' },
          { model: db.User, as: 'tdc' },
          { model: db.User, as: 'ccrp' },
          { model: db.Dataset, as: 'dataset' }
        ]
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      if (!contract.ccrpCloudProvider) {
        throw new Error('No cloud provider selected for this contract');
      }

      // Get CCRP-specific Azure configuration if using Azure
      let azureConfig = null;
      if (contract.ccrpCloudProvider === 'Azure') {
        const CCRPAzureCredentialsService = require('./ccrpAzureCredentialsService');
        const ccrpCredentialsService = new CCRPAzureCredentialsService();
        
        try {
          azureConfig = await ccrpCredentialsService.getContractAzureConfig(contractId);
          console.log(`✅ Retrieved CCRP Azure configuration for contract: ${contractId}`);
        } catch (error) {
          console.error(`❌ Error getting CCRP Azure config: ${error.message}`);
          throw new Error(`Azure configuration not available: ${error.message}`);
        }
      }

      // Generate unique environment ID
      const environmentId = `env-${contractId}-${Date.now()}`;
      
      // Create training environment record
      const trainingEnvironment = await db.TrainingEnvironment.create({
        contractId,
        environmentId,
        cloudProvider: contract.ccrpCloudProvider,
        region: config.region || this.getDefaultRegion(contract.ccrpCloudProvider),
        status: 'PENDING',
        infrastructureConfig: this.buildInfrastructureConfig(contract, config),
        securityConfig: this.buildSecurityConfig(contract, config),
        monitoringConfig: this.buildMonitoringConfig(contract, config),
        costEstimate: this.estimateCost(contract, config),
        createdBy: contract.tdcId,
        provisioningMethod: 'TERRAFORM' // Mark as Terraform-provisioned
      });

      // Update status to provisioning
      await trainingEnvironment.update({ status: 'PROVISIONING' });

      // Initialize Terraform service
      const terraformService = new this.terraformService();

      // Generate Terraform configuration
      const terraformDir = await terraformService.generateTerraformConfig(
        contractId,
        environmentId,
        trainingEnvironment.infrastructureConfig,
        azureConfig
      );

      // Initialize Terraform
      await terraformService.initialize(terraformDir);

      // Validate Terraform configuration
      await terraformService.validate(terraformDir);

      // Plan Terraform deployment
      const planOutput = await terraformService.plan(terraformDir);

      // Apply Terraform deployment
      const applyOutput = await terraformService.apply(terraformDir);

      // Get Terraform outputs
      const outputs = await terraformService.getOutputs(terraformDir);

      // Get Terraform state
      const state = await terraformService.getState(terraformDir);

      // Calculate actual cost
      const actualCost = terraformService.calculateEstimatedCost(outputs);

      // Update environment with provisioned resources
      await trainingEnvironment.update({
        status: 'ACTIVE',
        environmentUrl: outputs.environment_url?.value,
        provisioningLogs: `Terraform Plan Output:\n${planOutput}\n\nTerraform Apply Output:\n${applyOutput}`,
        actualCost: actualCost,
        terraformState: {
          terraformDir,
          outputs: outputs,
          state: state
        }
      });

      // Create resource records from Terraform outputs
      await this.createResourceRecordsFromTerraform(environmentId, outputs);

      console.log(`✅ Training environment created successfully with Terraform: ${environmentId}`);
      return trainingEnvironment;

    } catch (error) {
      console.error('❌ Error creating training environment with Terraform:', error);
      throw error;
    }
  }

  /**
   * Destroy training environment using Terraform
   */
  async destroyTrainingEnvironmentWithTerraform(environmentId) {
    try {
      console.log(`🗑️ Destroying training environment with Terraform: ${environmentId}`);
      
      const trainingEnvironment = await db.TrainingEnvironment.findOne({
        where: { environmentId }
      });

      if (!trainingEnvironment) {
        throw new Error('Training environment not found');
      }

      if (trainingEnvironment.provisioningMethod !== 'TERRAFORM') {
        throw new Error('Environment was not provisioned with Terraform');
      }

      // Update status to destroying
      await trainingEnvironment.update({ status: 'DESTROYING' });

      // Get Terraform directory from state
      const terraformDir = trainingEnvironment.terraformState?.terraformDir;
      
      if (!terraformDir) {
        throw new Error('Terraform state not found');
      }

      // Initialize Terraform service
      const terraformService = new this.terraformService();

      // Destroy Terraform resources
      const destroyOutput = await terraformService.destroy(terraformDir);

      // Clean up Terraform files
      await terraformService.cleanup(terraformDir);

      // Update environment status
      await trainingEnvironment.update({
        status: 'DESTROYED',
        provisioningLogs: `Terraform Destroy Output:\n${destroyOutput}`,
        terraformState: null
      });

      console.log(`✅ Training environment destroyed successfully with Terraform: ${environmentId}`);
      return trainingEnvironment;

    } catch (error) {
      console.error('❌ Error destroying training environment with Terraform:', error);
      throw error;
    }
  }

  /**
   * Create resource records from Terraform outputs
   */
  async createResourceRecordsFromTerraform(environmentId, outputs) {
    try {
      const resources = [];

      // Add VMs
      if (outputs.virtual_machine_names?.value) {
        outputs.virtual_machine_names.value.forEach((vmName, index) => {
          resources.push({
            environmentId,
            resourceType: 'COMPUTE',
            resourceName: vmName,
            resourceId: outputs.virtual_machine_names?.value?.[index] || '',
            status: 'ACTIVE',
            metadata: {
              privateIp: outputs.virtual_machine_private_ips?.value?.[index] || '',
              publicIp: outputs.virtual_machine_public_ips?.value?.[index] || '',
              vmSize: outputs.vm_size?.value || '',
              location: outputs.resource_group_location?.value || ''
            }
          });
        });
      }

      // Add Storage Account
      if (outputs.storage_account_name?.value) {
        resources.push({
          environmentId,
          resourceType: 'STORAGE',
          resourceName: outputs.storage_account_name.value,
          resourceId: outputs.storage_account_name.value,
          status: 'ACTIVE',
          metadata: {
            accountType: 'StorageV2',
            replicationType: 'LRS',
            location: outputs.resource_group_location?.value || ''
          }
        });
      }

      // Add Key Vault
      if (outputs.key_vault_name?.value) {
        resources.push({
          environmentId,
          resourceType: 'SECURITY',
          resourceName: outputs.key_vault_name.value,
          resourceId: outputs.key_vault_uri?.value || '',
          status: 'ACTIVE',
          metadata: {
            vaultUri: outputs.key_vault_uri?.value || '',
            sku: 'standard',
            location: outputs.resource_group_location?.value || ''
          }
        });
      }

      // Add SQL Database
      if (outputs.sql_database_name?.value) {
        resources.push({
          environmentId,
          resourceType: 'DATABASE',
          resourceName: outputs.sql_database_name.value,
          resourceId: outputs.sql_server_name?.value || '',
          status: 'ACTIVE',
          metadata: {
            serverName: outputs.sql_server_name?.value || '',
            databaseName: outputs.sql_database_name.value,
            location: outputs.resource_group_location?.value || ''
          }
        });
      }

      // Add Container Group
      if (outputs.container_group_name?.value) {
        resources.push({
          environmentId,
          resourceType: 'CONTAINER',
          resourceName: outputs.container_group_name.value,
          resourceId: outputs.container_group_name.value,
          status: 'ACTIVE',
          metadata: {
            containerType: 'Azure Container Instances',
            location: outputs.resource_group_location?.value || ''
          }
        });
      }

      // Add Log Analytics
      if (outputs.log_analytics_workspace_name?.value) {
        resources.push({
          environmentId,
          resourceType: 'MONITORING',
          resourceName: outputs.log_analytics_workspace_name.value,
          resourceId: outputs.log_analytics_workspace_name.value,
          status: 'ACTIVE',
          metadata: {
            workspaceType: 'Log Analytics',
            location: outputs.resource_group_location?.value || ''
          }
        });
      }

      // Create resource records
      await this.createResourceRecords(environmentId, resources);

    } catch (error) {
      console.error('❌ Error creating resource records from Terraform outputs:', error);
      throw error;
    }
  }

  /**
   * Build infrastructure configuration based on contract requirements
   */
  buildInfrastructureConfig(contract, config) {
    const baseConfig = {
      compute: {
        instanceType: config.compute?.instanceType || this.getDefaultInstanceType(contract.ccrpCloudProvider),
        instanceCount: config.compute?.instanceCount || 1,
        maxInstances: config.compute?.maxInstances || 3,
        autoScaling: config.compute?.autoScaling || true
      },
      storage: {
        type: config.storage?.type || 'SSD',
        sizeGB: config.storage?.sizeGB || 100,
        encrypted: config.storage?.encrypted !== false,
        backupEnabled: config.storage?.backupEnabled || true
      },
      networking: {
        vpcEnabled: config.networking?.vpcEnabled !== false,
        publicSubnet: config.networking?.publicSubnet || false,
        privateSubnet: config.networking?.privateSubnet || true,
        loadBalancer: config.networking?.loadBalancer || false
      },
      database: {
        enabled: config.database?.enabled || false,
        type: config.database?.type || 'PostgreSQL',
        sizeGB: config.database?.sizeGB || 20
      },
      mlServices: {
        gpuEnabled: config.mlServices?.gpuEnabled || false,
        gpuType: config.mlServices?.gpuType || 'T4',
        gpuCount: config.mlServices?.gpuCount || 1,
        mlFramework: config.mlServices?.mlFramework || 'TensorFlow'
      }
    };

    // Add contract-specific configurations
    if (contract.environmentSpecs) {
      const specs = JSON.parse(contract.environmentSpecs);
      baseConfig.compute = { ...baseConfig.compute, ...specs.compute };
      baseConfig.storage = { ...baseConfig.storage, ...specs.storage };
      baseConfig.networking = { ...baseConfig.networking, ...specs.networking };
    }

    return baseConfig;
  }

  /**
   * Build security configuration
   */
  buildSecurityConfig(contract, config) {
    return {
      encryption: {
        atRest: config.security?.encryption?.atRest !== false,
        inTransit: config.security?.encryption?.inTransit !== false,
        algorithm: config.security?.encryption?.algorithm || 'AES-256'
      },
      accessControl: {
        iamEnabled: config.security?.accessControl?.iamEnabled !== false,
        roleBasedAccess: config.security?.accessControl?.roleBasedAccess || true,
        mfaEnabled: config.security?.accessControl?.mfaEnabled || false
      },
      networkSecurity: {
        firewallEnabled: config.security?.networkSecurity?.firewallEnabled !== false,
        vpcEnabled: config.security?.networkSecurity?.vpcEnabled !== false,
        privateSubnet: config.security?.networkSecurity?.privateSubnet || true
      },
      compliance: {
        dataResidency: config.security?.compliance?.dataResidency || 'US',
        auditLogging: config.security?.compliance?.auditLogging !== false,
        encryptionStandards: config.security?.compliance?.encryptionStandards || ['AES-256', 'TLS-1.3']
      }
    };
  }

  /**
   * Build monitoring configuration
   */
  buildMonitoringConfig(contract, config) {
    return {
      logging: {
        enabled: config.monitoring?.logging?.enabled !== false,
        retentionDays: config.monitoring?.logging?.retentionDays || 30,
        logTypes: config.monitoring?.logging?.logTypes || ['application', 'system', 'security']
      },
      metrics: {
        enabled: config.monitoring?.metrics?.enabled !== false,
        collectionInterval: config.monitoring?.metrics?.collectionInterval || 60,
        metricsTypes: config.monitoring?.metrics?.metricsTypes || ['cpu', 'memory', 'network', 'storage']
      },
      alerting: {
        enabled: config.monitoring?.alerting?.enabled || false,
        thresholds: config.monitoring?.alerting?.thresholds || {
          cpu: 80,
          memory: 85,
          disk: 90
        }
      }
    };
  }

  /**
   * Estimate infrastructure costs
   */
  estimateCost(contract, config) {
    const infrastructureConfig = this.buildInfrastructureConfig(contract, config);
    
    // Base cost estimation logic
    let estimatedCost = 0;
    
    // Compute costs
    const computeCost = this.getComputeCost(contract.ccrpCloudProvider, infrastructureConfig.compute);
    
    // Storage costs
    const storageCost = this.getStorageCost(contract.ccrpCloudProvider, infrastructureConfig.storage);
    
    // Network costs
    const networkCost = this.getNetworkCost(contract.ccrpCloudProvider, infrastructureConfig.networking);
    
    // Database costs
    const databaseCost = infrastructureConfig.database.enabled ? 
      this.getDatabaseCost(contract.ccrpCloudProvider, infrastructureConfig.database) : 0;
    
    // ML service costs
    const mlCost = infrastructureConfig.mlServices.gpuEnabled ?
      this.getMLServiceCost(contract.ccrpCloudProvider, infrastructureConfig.mlServices) : 0;
    
    estimatedCost = computeCost + storageCost + networkCost + databaseCost + mlCost;
    
    return parseFloat(estimatedCost.toFixed(2));
  }

  /**
   * Get default region for cloud provider
   */
  getDefaultRegion(cloudProvider) {
    const defaultRegions = {
      AWS: 'us-east-1',
      GCP: 'us-central1',
      Azure: 'eastus',
      OCI: 'us-ashburn-1'
    };
    return defaultRegions[cloudProvider] || 'us-east-1';
  }

  /**
   * Get default instance type for cloud provider
   */
  getDefaultInstanceType(cloudProvider) {
    const defaultInstances = {
      AWS: 't3.medium',
      GCP: 'n1-standard-2',
      Azure: 'Standard_D2s_v3',
      OCI: 'VM.Standard2.2'
    };
    return defaultInstances[cloudProvider] || 't3.medium';
  }

  /**
   * Create resource records for tracking
   */
  async createResourceRecords(environmentId, resources) {
    const resourceRecords = resources.map(resource => ({
      environmentId,
      resourceType: resource.type,
      resourceId: resource.id,
      resourceName: resource.name,
      resourceConfig: resource.config,
      status: resource.status
    }));

    await db.EnvironmentResource.bulkCreate(resourceRecords);
  }

  /**
   * Cost estimation helper methods
   */
  getComputeCost(provider, config) {
    const hourlyRates = {
      AWS: { 't3.medium': 0.0416, 't3.large': 0.0832, 'c5.large': 0.085 },
      GCP: { 'n1-standard-2': 0.095, 'n1-standard-4': 0.19 },
      Azure: { 'Standard_D2s_v3': 0.096, 'Standard_D4s_v3': 0.192 },
      OCI: { 'VM.Standard2.2': 0.03, 'VM.Standard2.4': 0.06 }
    };
    
    const rate = hourlyRates[provider]?.[config.instanceType] || 0.05;
    return rate * 24 * 30 * config.instanceCount; // Monthly cost
  }

  getStorageCost(provider, config) {
    const gbRates = {
      AWS: 0.023, // EBS SSD
      GCP: 0.17,  // Persistent SSD
      Azure: 0.12, // Managed Disk
      OCI: 0.0255  // Block Volume
    };
    
    const rate = gbRates[provider] || 0.05;
    return rate * config.sizeGB;
  }

  getNetworkCost(provider, config) {
    // Simplified network cost estimation
    return 10; // Base monthly network cost
  }

  getDatabaseCost(provider, config) {
    const dbRates = {
      AWS: 0.017, // RDS PostgreSQL
      GCP: 0.02,  // Cloud SQL
      Azure: 0.015, // Azure Database
      OCI: 0.01    // Oracle Database
    };
    
    const rate = dbRates[provider] || 0.02;
    return rate * config.sizeGB;
  }

  getMLServiceCost(provider, config) {
    const gpuRates = {
      AWS: { 'T4': 0.35, 'V100': 2.48 },
      GCP: { 'T4': 0.35, 'V100': 2.48 },
      Azure: { 'T4': 0.35, 'V100': 2.48 },
      OCI: { 'T4': 0.30, 'V100': 2.40 }
    };
    
    const rate = gpuRates[provider]?.[config.gpuType] || 0.35;
    return rate * 24 * 30 * config.gpuCount; // Monthly cost
  }

  /**
   * Destroy training environment
   */
  async destroyTrainingEnvironment(environmentId) {
    try {
      console.log(`🗑️ Destroying training environment: ${environmentId}`);
      
      const environment = await db.TrainingEnvironment.findOne({
        where: { environmentId }
      });

      if (!environment) {
        throw new Error('Training environment not found');
      }

      // Update status to destroying
      await environment.update({ status: 'DESTROYING' });

      // Get the appropriate cloud provider
      const provider = this.providers[environment.cloudProvider];
      if (!provider) {
        throw new Error(`Unsupported cloud provider: ${environment.cloudProvider}`);
      }

      // Destroy infrastructure
      await provider.destroyInfrastructure(environmentId);

      // Update environment status
      await environment.update({
        status: 'DESTROYED',
        destroyedAt: new Date()
      });

      // Update contract
      await db.Contract.update({
        environmentStatus: 'DESTROYED',
        environmentDestroyedAt: new Date()
      }, {
        where: { contractId: environment.contractId }
      });

      console.log(`✅ Training environment destroyed successfully: ${environmentId}`);
      return environment;

    } catch (error) {
      console.error('❌ Error destroying training environment:', error);
      throw error;
    }
  }

  /**
   * Get environment status and details
   */
  async getEnvironmentStatus(environmentId) {
    const environment = await db.TrainingEnvironment.findOne({
      where: { environmentId },
      include: [
        { model: db.EnvironmentResource, as: 'resources' },
        { model: db.EnvironmentCost, as: 'costs' }
      ]
    });

    return environment;
  }

  /**
   * Update environment configuration
   */
  async updateEnvironmentConfig(environmentId, config) {
    const environment = await db.TrainingEnvironment.findOne({
      where: { environmentId }
    });

    if (!environment) {
      throw new Error('Training environment not found');
    }

    // Update configuration
    await environment.update({
      infrastructureConfig: { ...environment.infrastructureConfig, ...config.infrastructure },
      securityConfig: { ...environment.securityConfig, ...config.security },
      monitoringConfig: { ...environment.monitoringConfig, ...config.monitoring }
    });

    return environment;
  }
}

module.exports = InfrastructureService; 