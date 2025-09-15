/**
 * CCRP Azure Credentials Service
 * 
 * This service manages Azure credentials for CCRPs and integrates them with contract provisioning.
 * It handles credential storage, validation, and retrieval for contract-specific Azure deployments.
 */

const { CCRPAzureCredentials, User } = require('../models');
const crypto = require('crypto');

class CCRPAzureCredentialsService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY;
    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
  }

  /**
   * Create or update Azure credentials for a CCRP
   * @param {number} ccrpUserId - CCRP user ID
   * @param {Object} credentials - Azure credentials
   * @param {string} credentials.subscriptionId - Azure subscription ID
   * @param {string} credentials.tenantId - Azure tenant ID
   * @param {string} credentials.clientId - Service principal client ID
   * @param {string} credentials.clientSecret - Service principal client secret
   * @param {string} credentials.authMethod - Authentication method
   * @param {Object} config - Default configuration
   * @returns {Object} Created/updated credentials
   */
  async createOrUpdateCredentials(ccrpUserId, credentials, config = {}) {
    try {
      console.log(`🔐 Creating/updating Azure credentials for CCRP: ${ccrpUserId}`);

      // Validate CCRP user
      const ccrpUser = await User.findOne({
        where: { id: ccrpUserId, partyType: 'CCRP' }
      });

      if (!ccrpUser) {
        throw new Error('CCRP user not found');
      }

      // Check if credentials already exist
      const existingCredentials = await CCRPAzureCredentials.findByCCRP(ccrpUserId);

      const credentialData = {
        ccrpUserId,
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
        createdBy: ccrpUserId
      };

      let result;
      if (existingCredentials) {
        // Update existing credentials
        result = await existingCredentials.update(credentialData);
        console.log(`✅ Updated Azure credentials for CCRP: ${ccrpUserId}`);
      } else {
        // Create new credentials
        result = await CCRPAzureCredentials.create(credentialData);
        console.log(`✅ Created Azure credentials for CCRP: ${ccrpUserId}`);
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
   * Get Azure credentials for a CCRP
   * @param {number} ccrpUserId - CCRP user ID
   * @returns {Object} Azure credentials
   */
  async getCredentials(ccrpUserId) {
    try {
      const credentials = await CCRPAzureCredentials.findByCCRP(ccrpUserId);
      
      if (!credentials) {
        throw new Error('Azure credentials not found for this CCRP');
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
      const credentials = await CCRPAzureCredentials.findByPk(credentialId);
      
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
          { model: User, as: 'ccrp' }
        ]
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      if (!contract.ccrpId) {
        throw new Error('Contract has no CCRP assigned');
      }

      if (contract.ccrpCloudProvider !== 'Azure') {
        throw new Error('Contract is not configured for Azure');
      }

      // Get CCRP credentials
      const credentials = await this.getCredentials(contract.ccrpId);

      // Build configuration from contract-specific settings and CCRP defaults
      const config = {
        subscription: {
          id: contract.ccrpAzureSubscriptionId || credentials.subscriptionId,
          tenantId: contract.ccrpAzureTenantId || credentials.tenantId
        },
        auth: {
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          authMethod: credentials.authMethod
        },
        defaults: {
          location: contract.ccrpAzureLocation || credentials.defaultLocation,
          resourceGroupPrefix: contract.ccrpAzureResourceGroupPrefix || credentials.defaultResourceGroupPrefix,
          vmSize: contract.ccrpAzureVMSize || credentials.defaultVMSize,
          storageSku: contract.ccrpAzureStorageSku || credentials.defaultStorageSku,
          databaseSku: contract.ccrpAzureDatabaseSku || credentials.defaultDatabaseSku
        },
        network: {
          vnetAddressSpace: credentials.vnetAddressSpace,
          privateSubnetPrefix: credentials.privateSubnetPrefix,
          publicSubnetPrefix: credentials.publicSubnetPrefix
        },
        security: {
          enableEncryption: contract.ccrpAzureEnableEncryption !== false && credentials.enableEncryption,
          enableKeyVault: credentials.enableKeyVault
        },
        monitoring: {
          enableMonitoring: contract.ccrpAzureEnableMonitoring !== false && credentials.enableMonitoring
        },
        cost: {
          budgetLimit: contract.ccrpAzureBudgetLimit || credentials.budgetLimit,
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
   * Update contract with CCRP Azure configuration
   * @param {string} contractId - Contract ID
   * @param {Object} azureConfig - Azure configuration
   * @returns {Object} Updated contract
   */
  async updateContractAzureConfig(contractId, azureConfig) {
    try {
      const { Contract } = require('../models');
      
      const updateData = {};
      
      if (azureConfig.subscription) {
        updateData.ccrpAzureSubscriptionId = azureConfig.subscription.id;
        updateData.ccrpAzureTenantId = azureConfig.subscription.tenantId;
      }
      
      if (azureConfig.defaults) {
        updateData.ccrpAzureLocation = azureConfig.defaults.location;
        updateData.ccrpAzureResourceGroupPrefix = azureConfig.defaults.resourceGroupPrefix;
        updateData.ccrpAzureVMSize = azureConfig.defaults.vmSize;
        updateData.ccrpAzureStorageSku = azureConfig.defaults.storageSku;
        updateData.ccrpAzureDatabaseSku = azureConfig.defaults.databaseSku;
      }
      
      if (azureConfig.security) {
        updateData.ccrpAzureEnableEncryption = azureConfig.security.enableEncryption;
      }
      
      if (azureConfig.monitoring) {
        updateData.ccrpAzureEnableMonitoring = azureConfig.monitoring.enableMonitoring;
      }
      
      if (azureConfig.cost) {
        updateData.ccrpAzureBudgetLimit = azureConfig.cost.budgetLimit;
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
        where: { partyType: 'CCRP' },
        include: [
          {
            model: CCRPAzureCredentials,
            as: 'azureCredentials',
            where: { isActive: true },
            required: false
          }
        ]
      });

      return ccrps.map(ccrp => ({
        id: ccrp.id,
        name: ccrp.name,
        email: ccrp.email,
        hasCredentials: !!ccrp.azureCredentials,
        validationStatus: ccrp.azureCredentials?.validationStatus || 'NONE',
        lastValidated: ccrp.azureCredentials?.lastValidated
      }));
    } catch (error) {
      console.error(`❌ Error listing CCRPs with credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete Azure credentials for a CCRP
   * @param {number} ccrpUserId - CCRP user ID
   * @returns {boolean} Deletion result
   */
  async deleteCredentials(ccrpUserId) {
    try {
      const credentials = await CCRPAzureCredentials.findByCCRP(ccrpUserId);
      
      if (!credentials) {
        throw new Error('Azure credentials not found for this CCRP');
      }

      await credentials.update({ isActive: false });
      
      console.log(`✅ Azure credentials deactivated for CCRP: ${ccrpUserId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting Azure credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test Azure connectivity for a CCRP
   * @param {number} ccrpUserId - CCRP user ID
   * @returns {Object} Test results
   */
  async testAzureConnectivity(ccrpUserId) {
    try {
      const credentials = await this.getCredentials(ccrpUserId);
      
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

module.exports = CCRPAzureCredentialsService; 