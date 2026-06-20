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
          { model: db.User, as: 'tsp' },
          { model: db.Dataset, as: 'dataset' }
        ]
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      if (!contract.tspCloudProvider) {
        throw new Error('No cloud provider selected for this contract');
      }

      // Get TSP-specific Azure configuration if using Azure
      let azureConfig = null;
      if (contract.tspCloudProvider === 'Azure') {
        const TSPAzureCredentialsService = require('./tspAzureCredentialsService');
        const ccrpCredentialsService = new TSPAzureCredentialsService();
        
        try {
          azureConfig = await ccrpCredentialsService.getContractAzureConfig(contractId);
          console.log(`✅ Retrieved TSP Azure configuration for contract: ${contractId}`);
        } catch (error) {
          console.error(`❌ Error getting TSP Azure config: ${error.message}`);
          throw new Error(`Azure configuration not available: ${error.message}`);
        }
      }

      // Generate unique environment ID
      const environmentId = `env-${contractId}-${Date.now()}`;
      
      // Create training environment record
      const trainingEnvironment = await db.TrainingEnvironment.create({
        contractId,
        environmentId,
        cloudProvider: contract.tspCloudProvider,
        region: config.region || this.getDefaultRegion(contract.tspCloudProvider),
        status: 'PENDING',
        infrastructureConfig: this.buildInfrastructureConfig(contract, config),
        securityConfig: this.buildSecurityConfig(contract, config),
        monitoringConfig: this.buildMonitoringConfig(contract, config),
        costEstimate: this.estimateCost(contract, config),
        createdBy: contract.tdcId
      });

      // Get the appropriate cloud provider
      let provider;
      if (contract.tspCloudProvider === 'Azure' && azureConfig) {
        // Create Azure provider with TSP-specific configuration
        const AzureProvider = require('./providers/azureProvider');
        provider = new AzureProvider(azureConfig);
      } else {
        provider = this.providers[contract.tspCloudProvider];
      }
      
      if (!provider) {
        throw new Error(`Unsupported cloud provider: ${contract.tspCloudProvider}`);
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
          { model: db.User, as: 'tsp' },
          { model: db.Dataset, as: 'dataset' }
        ]
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      if (!contract.tspCloudProvider) {
        throw new Error('No cloud provider selected for this contract');
      }

      // Get TSP-specific Azure configuration if using Azure
      let azureConfig = null;
      if (contract.tspCloudProvider === 'Azure') {
        const TSPAzureCredentialsService = require('./tspAzureCredentialsService');
        const ccrpCredentialsService = new TSPAzureCredentialsService();
        
        try {
          azureConfig = await ccrpCredentialsService.getContractAzureConfig(contractId);
          console.log(`✅ Retrieved TSP Azure configuration for contract: ${contractId}`);
        } catch (error) {
          console.error(`❌ Error getting TSP Azure config: ${error.message}`);
          throw new Error(`Azure configuration not available: ${error.message}`);
        }
      }

      // Generate unique environment ID
      const environmentId = `env-${contractId}-${Date.now()}`;
      
      // Create training environment record
      const trainingEnvironment = await db.TrainingEnvironment.create({
        contractId,
        environmentId,
        cloudProvider: contract.tspCloudProvider,
        region: config.region || this.getDefaultRegion(contract.tspCloudProvider),
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
    console.log('🏗️ Building infrastructure configuration for contract:', contract.contractId);
    
    // Get dataset information to check for confidential computing requirements
    const contractDatasets = contract.contractDatasets || [];
    const hasConfidentialComputingDatasets = contractDatasets.some(dataset => 
      dataset.confidentialComputingRequired === true
    );
    
    console.log('🔍 Infrastructure analysis:', {
      totalDatasets: contractDatasets.length,
      confidentialComputingDatasets: contractDatasets.filter(d => d.confidentialComputingRequired === true).length,
      hasConfidentialComputingDatasets,
      cloudProvider: contract.tspCloudProvider
    });

    const baseConfig = {
      compute: {
        instanceType: config.compute?.instanceType || this.getDefaultInstanceType(contract.tspCloudProvider),
        cpuCores: config.compute?.cpuCores || 4,
        memoryGB: config.compute?.memoryGB || 16,
        gpuEnabled: config.compute?.gpuEnabled || false,
        gpuType: config.compute?.gpuType || 'V100',
        gpuCount: config.compute?.gpuCount || 1,
        autoScaling: config.compute?.autoScaling || false,
        minInstances: config.compute?.minInstances || 1,
        maxInstances: config.compute?.maxInstances || 3
      },
      
      storage: {
        type: config.storage?.type || 'SSD',
        sizeGB: config.storage?.sizeGB || 100,
        backupEnabled: config.storage?.backupEnabled || true,
        encryptionEnabled: config.storage?.encryptionEnabled || true,
        dataRetention: config.storage?.dataRetention || 90 // days
      },
      
      network: {
        vpcEnabled: config.network?.vpcEnabled || true,
        privateSubnet: config.network?.privateSubnet || true,
        loadBalancer: config.network?.loadBalancer || false,
        cdnEnabled: config.network?.cdnEnabled || false,
        bandwidth: config.network?.bandwidth || '1Gbps'
      },
      
      database: {
        type: config.database?.type || 'PostgreSQL',
        version: config.database?.version || '13',
        sizeGB: config.database?.sizeGB || 20,
        backupEnabled: config.database?.backupEnabled || true,
        encryptionEnabled: config.database?.encryptionEnabled || true,
        highAvailability: config.database?.highAvailability || false
      },
      
      monitoring: {
        enabled: config.monitoring?.enabled || true,
        metrics: config.monitoring?.metrics || ['CPU', 'Memory', 'Network', 'Storage'],
        alerts: config.monitoring?.alerts || true,
        logRetention: config.monitoring?.logRetention || 30 // days
      }
    };

    // Enhanced infrastructure for confidential computing datasets
    if (hasConfidentialComputingDatasets) {
      console.log('🛡️ Applying enhanced infrastructure for confidential computing datasets');
      
      return {
        ...baseConfig,
        
        compute: {
          ...baseConfig.compute,
          // Enhanced compute for confidential computing
          instanceType: this.getConfidentialComputingInstanceType(contract.tspCloudProvider),
          cpuCores: Math.max(baseConfig.compute.cpuCores, 8),
          memoryGB: Math.max(baseConfig.compute.memoryGB, 32),
          gpuEnabled: true, // Often needed for ML workloads
          gpuType: 'V100', // High-end GPU for ML
          gpuCount: Math.max(baseConfig.compute.gpuCount, 2),
          autoScaling: true,
          minInstances: 2,
          maxInstances: 5,
          // Confidential computing specific
          confidentialComputing: true,
          secureEnclave: true,
          trustedExecutionEnvironment: true
        },
        
        storage: {
          ...baseConfig.storage,
          // Enhanced storage for confidential computing
          type: 'Premium SSD',
          sizeGB: Math.max(baseConfig.storage.sizeGB, 500),
          backupEnabled: true,
          encryptionEnabled: true,
          encryptionAlgorithm: 'AES-256-GCM',
          dataRetention: 365, // 1 year for compliance
          // Additional security
          accessLogging: true,
          versioning: true,
          replication: true
        },
        
        network: {
          ...baseConfig.network,
          // Enhanced network for confidential computing
          vpcEnabled: true,
          privateSubnet: true,
          loadBalancer: true,
          cdnEnabled: false, // Keep data private
          bandwidth: '10Gbps',
          // Additional security
          firewall: true,
          networkSecurityGroup: true,
          vpnRequired: true,
          privateLink: true
        },
        
        database: {
          ...baseConfig.database,
          // Enhanced database for confidential computing
          type: 'PostgreSQL',
          version: '13',
          sizeGB: Math.max(baseConfig.database.sizeGB, 100),
          backupEnabled: true,
          encryptionEnabled: true,
          highAvailability: true,
          // Additional security
          sslRequired: true,
          auditLogging: true,
          connectionPooling: true
        },
        
        monitoring: {
          ...baseConfig.monitoring,
          // Enhanced monitoring for confidential computing
          enabled: true,
          metrics: [
            'CPU', 'Memory', 'Network', 'Storage',
            'Security', 'Compliance', 'Attestation'
          ],
          alerts: true,
          logRetention: 365, // 1 year for compliance
          // Additional monitoring
          securityMonitoring: true,
          complianceMonitoring: true,
          realTimeAlerts: true,
          anomalyDetection: true
        },
        
        // Additional infrastructure for confidential computing
        security: {
          keyManagement: true,
          certificateManagement: true,
          identityProvider: true,
          accessControl: true
        },
        
        compliance: {
          auditTrail: true,
          complianceReporting: true,
          regularAudits: true,
          breachNotification: true
        }
      };
    }

    // Standard infrastructure for non-confidential datasets
    console.log('🏗️ Applying standard infrastructure configuration');
    return baseConfig;
  }

  /**
   * Build security configuration based on contract requirements
   */
  buildSecurityConfig(contract, config) {
    console.log('🔒 Building security configuration for contract:', contract.contractId);
    
    // Get dataset information to check for confidential computing requirements
    const contractDatasets = contract.contractDatasets || [];
    const hasConfidentialComputingDatasets = contractDatasets.some(dataset => 
      dataset.confidentialComputingRequired === true
    );
    
    console.log('🔍 Dataset analysis:', {
      totalDatasets: contractDatasets.length,
      confidentialComputingDatasets: contractDatasets.filter(d => d.confidentialComputingRequired === true).length,
      hasConfidentialComputingDatasets
    });

    const baseSecurityConfig = {
      // Encryption settings
      encryptionAtRest: true,
      encryptionInTransit: true,
      encryptionAlgorithm: 'AES-256-GCM',
      
      // Network security
      networkIsolation: true,
      privateSubnet: true,
      vpnRequired: false,
      
      // Access control
      roleBasedAccess: true,
      multiFactorAuth: false,
      sessionTimeout: 3600, // 1 hour
      
      // Monitoring and logging
      auditLogging: true,
      securityMonitoring: true,
      threatDetection: true,
      
      // Compliance
      dataResidency: config.dataResidency || 'US',
      regulatoryCompliance: config.regulatoryCompliance || ['GDPR', 'HIPAA'],
      
      // Attestation and verification
      attestationRequired: false,
      hardwareSecurityModule: false,
      secureEnclave: false
    };

    // Enhanced security for confidential computing datasets
    if (hasConfidentialComputingDatasets) {
      console.log('🛡️ Applying enhanced security for confidential computing datasets');
      
      return {
        ...baseSecurityConfig,
        
        // Enhanced encryption
        encryptionAlgorithm: 'AES-256-GCM',
        keyRotation: true,
        keyRotationInterval: 30, // days
        
        // Enhanced network security
        networkIsolation: true,
        privateSubnet: true,
        vpnRequired: true,
        networkSecurityGroup: true,
        
        // Enhanced access control
        roleBasedAccess: true,
        multiFactorAuth: true,
        sessionTimeout: 1800, // 30 minutes
        privilegedAccess: false,
        
        // Enhanced monitoring
        auditLogging: true,
        securityMonitoring: true,
        threatDetection: true,
        realTimeAlerts: true,
        anomalyDetection: true,
        
        // Enhanced compliance
        dataResidency: config.dataResidency || 'US',
        regulatoryCompliance: [
          'GDPR', 
          'HIPAA', 
          'SOX', 
          'FedRAMP',
          'ISO-27001'
        ],
        
        // Confidential computing features
        attestationRequired: true,
        hardwareSecurityModule: true,
        secureEnclave: true,
        confidentialComputing: true,
        trustedExecutionEnvironment: true,
        
        // Additional security measures
        dataLossPrevention: true,
        endpointProtection: true,
        intrusionDetection: true,
        vulnerabilityScanning: true,
        
        // Compliance monitoring
        complianceMonitoring: true,
        regularAudits: true,
        breachNotification: true
      };
    }

    // Standard security for non-confidential datasets
    console.log('🔒 Applying standard security configuration');
    return baseSecurityConfig;
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
    const computeCost = this.getComputeCost(contract.tspCloudProvider, infrastructureConfig.compute);
    
    // Storage costs
    const storageCost = this.getStorageCost(contract.tspCloudProvider, infrastructureConfig.storage);
    
    // Network costs
    const networkCost = this.getNetworkCost(contract.tspCloudProvider, infrastructureConfig.network);
    
    // Database costs
    const databaseCost = infrastructureConfig.database.enabled ? 
      this.getDatabaseCost(contract.tspCloudProvider, infrastructureConfig.database) : 0;
    
    // ML service costs
    const mlCost = infrastructureConfig.mlServices.gpuEnabled ?
      this.getMLServiceCost(contract.tspCloudProvider, infrastructureConfig.mlServices) : 0;
    
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
    const defaultTypes = {
      'AWS': 't3.medium',
      'GCP': 'n1-standard-2',
      'Azure': 'Standard_D2s_v3',
      'OCI': 'VM.Standard2.2'
    };
    return defaultTypes[cloudProvider] || 't3.medium';
  }

  /**
   * Get confidential computing instance type for cloud provider
   */
  getConfidentialComputingInstanceType(cloudProvider) {
    const confidentialTypes = {
      'AWS': 'c6i.2xlarge', // Nitro Enclaves support
      'GCP': 'n2d-standard-8', // Confidential Computing
      'Azure': 'Standard_DC8s_v3', // DC-series for confidential computing
      'OCI': 'VM.Standard3.Flex' // Flexible with confidential computing
    };
    return confidentialTypes[cloudProvider] || this.getDefaultInstanceType(cloudProvider);
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