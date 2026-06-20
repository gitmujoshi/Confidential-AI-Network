/**
 * TSP Azure Credentials Service
 * 
 * This service manages Azure credentials for CCRPs and integrates them with contract provisioning.
 * It handles credential storage, validation, and retrieval for contract-specific Azure deployments.
 */

const { TSPAzureCredentials, User } = require('../models');
const crypto = require('crypto');

class TSPAzureCredentialsService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY;
    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
  }

  /**
   * Create or update Azure credentials for a TSP
   * @param {number} tspUserId - TSP user ID
   * @param {Object} credentials - Azure credentials
   * @param {string} credentials.subscriptionId - Azure subscription ID
   * @param {string} credentials.tenantId - Azure tenant ID
   * @param {string} credentials.clientId - Service principal client ID
   * @param {string} credentials.clientSecret - Service principal client secret
   * @param {string} credentials.authMethod - Authentication method
   * @param {Object} config - Default configuration
   * @returns {Object} Created/updated credentials
   */
  async createOrUpdateCredentials(tspUserId, credentials, config = {}) {
    try {
      console.log(`🔐 Creating/updating Azure credentials for TSP: ${tspUserId}`);

      // Validate TSP user
      const tspUser = await User.findOne({
        where: { id: tspUserId, partyType: 'TSP' }
      });

      if (!tspUser) {
        throw new Error('TSP user not found');
      }

      // Check if credentials already exist
      const existingCredentials = await TSPAzureCredentials.findByCCRP(tspUserId);

      const credentialData = {
        tspUserId,
        subscriptionId: credentials.subscriptionId,
        tenantId: credentials.tenantId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        authMethod: credentials.authMethod || 'SERVICE_PRINCIPAL',
        defaultLocation: config.defaultLocation || 'eastus',
        defaultResourceGroupPrefix: config.defaultResourceGroupPrefix || 'training',
        defaultVMSize: config.defaultVMSize || 'Standard_D2s_v3',
        defaultStorageSku: config.defaultStorageSku || 'Standard_LRS',
        defaultDatabaseSku: config.defaultDatabaseSku || 'Basic',
        vnetAddressSpace: config.vnetAddressSpace || '10.0.0.0/16',
        privateSubnetPrefix: config.privateSubnetPrefix || '10.0.1.0/24',
        publicSubnetPrefix: config.publicSubnetPrefix || '10.0.2.0/24',
        enableEncryption: config.enableEncryption !== false,
        enableMonitoring: config.enableMonitoring !== false,
        enableKeyVault: config.enableKeyVault !== false,
        budgetLimit: config.budgetLimit,
        alertThreshold: config.alertThreshold || 0.8,
        isActive: true,
        validationStatus: 'PENDING',
        createdBy: tspUserId
      };

      let result;
      if (existingCredentials) {
        // Update existing credentials
        result = await existingCredentials.update(credentialData);
        console.log(`✅ Updated Azure credentials for TSP: ${tspUserId}`);
      } else {
        // Create new credentials
        result = await TSPAzureCredentials.create(credentialData);
        console.log(`✅ Created Azure credentials for TSP: ${tspUserId}`);
      }

      // Validate credentials
      await this.validateCredentials(result.id);

      return result;
    } catch (error) {
      console.error(`❌ Error creating/updating Azure credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Azure credentials for a TSP
   * @param {number} tspUserId - TSP user ID
   * @returns {Object} Azure credentials
   */
  async getCredentials(tspUserId) {
    try {
      const credentials = await TSPAzureCredentials.findByCCRP(tspUserId);
      
      if (!credentials) {
        throw new Error('Azure credentials not found for this TSP');
      }

      if (!credentials.isActive) {
        throw new Error('Azure credentials are not active');
      }

      return credentials;
    } catch (error) {
      console.error(`❌ Error getting Azure credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate Azure credentials
   * @param {number} credentialId - Credential ID
   * @returns {boolean} Validation result
   */
  async validateCredentials(credentialId) {
    try {
      const credentials = await TSPAzureCredentials.findByPk(credentialId);
      
      if (!credentials) {
        throw new Error('Credentials not found');
      }

      // Test Azure connectivity
      const { DefaultAzureCredential } = require('@azure/identity');
      const { ComputeManagementClient } = require('@azure/arm-compute');
      
      // Create credential based on auth method
      let credential;
      if (credentials.authMethod === 'SERVICE_PRINCIPAL') {
        // Set environment variables for service principal
        process.env.AZURE_SUBSCRIPTION_ID = credentials.subscriptionId;
        process.env.AZURE_TENANT_ID = credentials.tenantId;
        process.env.AZURE_CLIENT_ID = credentials.clientId;
        process.env.AZURE_CLIENT_SECRET = credentials.clientSecret;
        credential = new DefaultAzureCredential();
      } else {
        credential = new DefaultAzureCredential();
      }
      
      // Test credential by listing resource groups
      const computeClient = new ComputeManagementClient(credential, credentials.subscriptionId);
      await computeClient.resourceGroups.list();
      
      // Update validation status
      await credentials.update({
        validationStatus: 'VALID',
        lastValidated: new Date()
      });
      
      console.log(`✅ Azure credentials validated successfully: ${credentialId}`);
      return true;
    } catch (error) {
      console.error(`❌ Azure credentials validation failed: ${error.message}`);
      
      // Update validation status
      if (credentials) {
        await credentials.update({
          validationStatus: 'INVALID',
          lastValidated: new Date()
        });
      }
      
      throw error;
    }
  }

  /**
   * Get Azure configuration for a contract
   * @param {string} contractId - Contract ID
   * @returns {Object} Azure configuration
   */
  async getContractAzureConfig(contractId) {
    try {
      const { Contract } = require('../models');
      
      const contract = await Contract.findOne({
        where: { contractId },
        include: [
          { model: User, as: 'tsp' }
        ]
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      if (!contract.tspId) {
        throw new Error('Contract has no TSP assigned');
      }

      if (contract.tspCloudProvider !== 'Azure') {
        throw new Error('Contract is not configured for Azure');
      }

      // Get TSP credentials
      const credentials = await this.getCredentials(contract.tspId);

      // Build configuration from contract-specific settings and TSP defaults
      const config = {
        subscription: {
          id: contract.tspAzureSubscriptionId || credentials.subscriptionId,
          tenantId: contract.tspAzureTenantId || credentials.tenantId
        },
        auth: {
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          authMethod: credentials.authMethod
        },
        defaults: {
          location: contract.tspAzureLocation || credentials.defaultLocation,
          resourceGroupPrefix: contract.tspAzureResourceGroupPrefix || credentials.defaultResourceGroupPrefix,
          vmSize: contract.tspAzureVMSize || credentials.defaultVMSize,
          storageSku: contract.tspAzureStorageSku || credentials.defaultStorageSku,
          databaseSku: contract.tspAzureDatabaseSku || credentials.defaultDatabaseSku
        },
        network: {
          vnetAddressSpace: credentials.vnetAddressSpace,
          privateSubnetPrefix: credentials.privateSubnetPrefix,
          publicSubnetPrefix: credentials.publicSubnetPrefix
        },
        security: {
          enableEncryption: contract.tspAzureEnableEncryption !== false && credentials.enableEncryption,
          enableKeyVault: credentials.enableKeyVault
        },
        monitoring: {
          enableMonitoring: contract.tspAzureEnableMonitoring !== false && credentials.enableMonitoring
        },
        cost: {
          budgetLimit: contract.tspAzureBudgetLimit || credentials.budgetLimit,
          alertThreshold: credentials.alertThreshold
        }
      };

      console.log(`✅ Azure configuration retrieved for contract: ${contractId}`);
      return config;
    } catch (error) {
      console.error(`❌ Error getting contract Azure config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update contract with TSP Azure configuration
   * @param {string} contractId - Contract ID
   * @param {Object} azureConfig - Azure configuration
   * @returns {Object} Updated contract
   */
  async updateContractAzureConfig(contractId, azureConfig) {
    try {
      const { Contract } = require('../models');
      
      const updateData = {};
      
      if (azureConfig.subscription) {
        updateData.tspAzureSubscriptionId = azureConfig.subscription.id;
        updateData.tspAzureTenantId = azureConfig.subscription.tenantId;
      }
      
      if (azureConfig.defaults) {
        updateData.tspAzureLocation = azureConfig.defaults.location;
        updateData.tspAzureResourceGroupPrefix = azureConfig.defaults.resourceGroupPrefix;
        updateData.tspAzureVMSize = azureConfig.defaults.vmSize;
        updateData.tspAzureStorageSku = azureConfig.defaults.storageSku;
        updateData.tspAzureDatabaseSku = azureConfig.defaults.databaseSku;
      }
      
      if (azureConfig.security) {
        updateData.tspAzureEnableEncryption = azureConfig.security.enableEncryption;
      }
      
      if (azureConfig.monitoring) {
        updateData.tspAzureEnableMonitoring = azureConfig.monitoring.enableMonitoring;
      }
      
      if (azureConfig.cost) {
        updateData.tspAzureBudgetLimit = azureConfig.cost.budgetLimit;
      }

      const contract = await Contract.findOne({ where: { contractId } });
      if (!contract) {
        throw new Error('Contract not found');
      }

      await contract.update(updateData);
      
      console.log(`✅ Contract Azure configuration updated: ${contractId}`);
      return contract;
    } catch (error) {
      console.error(`❌ Error updating contract Azure config: ${error.message}`);
      throw error;
    }
  }

  /**
   * List all CCRPs with Azure credentials
   * @returns {Array} List of CCRPs with credentials
   */
  async listCCRPsWithCredentials() {
    try {
      const ccrps = await User.findAll({
        where: { partyType: 'TSP' },
        include: [
          {
            model: TSPAzureCredentials,
            as: 'azureCredentials',
            where: { isActive: true },
            required: false
          }
        ]
      });

      return ccrps.map(tsp => ({
        id: tsp.id,
        name: tsp.name,
        email: tsp.email,
        hasCredentials: !!tsp.azureCredentials,
        validationStatus: tsp.azureCredentials?.validationStatus || 'NONE',
        lastValidated: tsp.azureCredentials?.lastValidated
      }));
    } catch (error) {
      console.error(`❌ Error listing CCRPs with credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete Azure credentials for a TSP
   * @param {number} tspUserId - TSP user ID
   * @returns {boolean} Deletion result
   */
  async deleteCredentials(tspUserId) {
    try {
      const credentials = await TSPAzureCredentials.findByCCRP(tspUserId);
      
      if (!credentials) {
        throw new Error('Azure credentials not found for this TSP');
      }

      await credentials.update({ isActive: false });
      
      console.log(`✅ Azure credentials deactivated for TSP: ${tspUserId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting Azure credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test Azure connectivity for a TSP
   * @param {number} tspUserId - TSP user ID
   * @returns {Object} Test results
   */
  async testAzureConnectivity(tspUserId) {
    try {
      const credentials = await this.getCredentials(tspUserId);
      
      // Set environment variables for testing
      const originalEnv = {
        AZURE_SUBSCRIPTION_ID: process.env.AZURE_SUBSCRIPTION_ID,
        AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
        AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
        AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET
      };

      process.env.AZURE_SUBSCRIPTION_ID = credentials.subscriptionId;
      process.env.AZURE_TENANT_ID = credentials.tenantId;
      process.env.AZURE_CLIENT_ID = credentials.clientId;
      process.env.AZURE_CLIENT_SECRET = credentials.clientSecret;

      try {
        // Test Azure provider
        const AzureProvider = require('./providers/azureProvider');
        const azureProvider = new AzureProvider();
        
        // Test basic connectivity
        const { ComputeManagementClient } = require('@azure/arm-compute');
        const { DefaultAzureCredential } = require('@azure/identity');
        
        const credential = new DefaultAzureCredential();
        const computeClient = new ComputeManagementClient(credential, credentials.subscriptionId);
        
        // List resource groups to test connectivity
        const resourceGroups = await computeClient.resourceGroups.list();
        
        // Restore original environment
        Object.assign(process.env, originalEnv);
        
        return {
          success: true,
          message: 'Azure connectivity test successful',
          resourceGroupCount: resourceGroups.length,
          subscriptionId: credentials.subscriptionId,
          tenantId: credentials.tenantId
        };
      } catch (error) {
        // Restore original environment
        Object.assign(process.env, originalEnv);
        throw error;
      }
    } catch (error) {
      console.error(`❌ Azure connectivity test failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.code || 'UNKNOWN_ERROR'
      };
    }
  }
}

module.exports = TSPAzureCredentialsService; 