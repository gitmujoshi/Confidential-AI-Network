/**
 * Unified Secret Management Service
 * 
 * This service provides a cloud-agnostic interface for managing secrets
 * across multiple cloud providers and secret management systems.
 * 
 * Supported Secret Managers:
 * - HashiCorp Vault (recommended for multi-cloud)
 * - AWS Secrets Manager
 * - Azure Key Vault
 * - Google Cloud Secret Manager
 * - OCI Vault
 * 
 * Supported Cloud Providers:
 * - AWS
 * - Azure
 * - GCP
 * - OCI
 */

const crypto = require('crypto');

class SecretManager {
  constructor() {
    this.providers = {
      VAULT: this.createVaultProvider(),
      AWS_SECRETS: this.createAWSSecretsProvider(),
      AZURE_KEYVAULT: this.createAzureKeyVaultProvider(),
      GCP_SECRETS: this.createGCPSecretsProvider(),
      OCI_VAULT: this.createOCIVaultProvider()
    };
  }

  /**
   * Create HashiCorp Vault provider
   */
  createVaultProvider() {
    try {
      const vault = require('node-vault');
      return vault({
        apiVersion: 'v1',
        endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
        token: process.env.VAULT_TOKEN || 'dev-token-12345'
      });
    } catch (error) {
      console.warn('⚠️ Vault provider not available:', error.message);
      return null;
    }
  }

  /**
   * Create AWS Secrets Manager provider
   */
  createAWSSecretsProvider() {
    try {
      const { SecretsManagerClient } = require('@aws-sdk/client-secrets-manager');
      return new SecretsManagerClient({ 
        region: process.env.AWS_REGION || 'us-east-1' 
      });
    } catch (error) {
      console.warn('⚠️ AWS Secrets Manager not available:', error.message);
      return null;
    }
  }

  /**
   * Create Azure Key Vault provider
   */
  createAzureKeyVaultProvider() {
    try {
      const { DefaultAzureCredential } = require('@azure/identity');
      const { SecretClient } = require('@azure/keyvault-secrets');
      
      const credential = new DefaultAzureCredential();
      const vaultName = process.env.AZURE_KEY_VAULT_NAME;
      
      if (!vaultName) {
        throw new Error('AZURE_KEY_VAULT_NAME not configured');
      }
      
      return new SecretClient(
        `https://${vaultName}.vault.azure.net/`,
        credential
      );
    } catch (error) {
      console.warn('⚠️ Azure Key Vault not available:', error.message);
      return null;
    }
  }

  /**
   * Create GCP Secret Manager provider
   */
  createGCPSecretsProvider() {
    try {
      const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
      return new SecretManagerServiceClient();
    } catch (error) {
      console.warn('⚠️ GCP Secret Manager not available:', error.message);
      return null;
    }
  }

  /**
   * Create OCI Vault provider
   */
  createOCIVaultProvider() {
    try {
      // OCI Vault implementation would go here
      // For now, return null as OCI Vault SDK might not be available
      console.warn('⚠️ OCI Vault not implemented yet');
      return null;
    } catch (error) {
      console.warn('⚠️ OCI Vault not available:', error.message);
      return null;
    }
  }

  /**
   * Store credentials for any cloud provider
   * @param {string} secretName - Secret name/identifier
   * @param {string} secretManager - Secret manager type
   * @param {Object} credentials - Credentials to store
   * @param {string} cloudProvider - Cloud provider (AWS, AZURE, GCP, OCI)
   */
  async storeCredentials(secretName, secretManager, credentials, cloudProvider) {
    try {
      console.log(`🔐 Storing credentials for ${cloudProvider} in ${secretManager}: ${secretName}`);
      
      const provider = this.providers[secretManager];
      if (!provider) {
        throw new Error(`Secret manager ${secretManager} not available`);
      }

      const secretData = {
        ...credentials,
        cloudProvider,
        storedAt: new Date().toISOString()
      };

      switch (secretManager) {
        case 'VAULT':
          await provider.write(`secret/data/${secretName}`, secretData);
          break;
          
        case 'AWS_SECRETS':
          const { CreateSecretCommand } = require('@aws-sdk/client-secrets-manager');
          await provider.send(new CreateSecretCommand({
            Name: secretName,
            SecretString: JSON.stringify(secretData)
          }));
          break;
          
        case 'AZURE_KEYVAULT':
          await provider.setSecret(secretName, JSON.stringify(secretData));
          break;
          
        case 'GCP_SECRETS':
          const projectId = process.env.GCP_PROJECT_ID;
          const parent = `projects/${projectId}`;
          await provider.createSecret({
            parent,
            secretId: secretName,
            secret: {
              replication: {
                automatic: {}
              }
            }
          });
          await provider.addSecretVersion({
            parent: `${parent}/secrets/${secretName}`,
            payload: {
              data: Buffer.from(JSON.stringify(secretData)).toString('base64')
            }
          });
          break;
          
        default:
          throw new Error(`Unsupported secret manager: ${secretManager}`);
      }

      console.log(`✅ Credentials stored successfully in ${secretManager}`);
      return { success: true, secretName, secretManager };
      
    } catch (error) {
      console.error(`❌ Error storing credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieve credentials for any cloud provider
   * @param {string} secretName - Secret name/identifier
   * @param {string} secretManager - Secret manager type
   */
  async getCredentials(secretName, secretManager) {
    try {
      console.log(`🔓 Retrieving credentials from ${secretManager}: ${secretName}`);
      
      const provider = this.providers[secretManager];
      if (!provider) {
        throw new Error(`Secret manager ${secretManager} not available`);
      }

      let secretData;

      switch (secretManager) {
        case 'VAULT':
          const vaultResponse = await provider.read(`secret/data/${secretName}`);
          secretData = vaultResponse.data.data;
          break;
          
        case 'AWS_SECRETS':
          const { GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
          const awsResponse = await provider.send(new GetSecretValueCommand({
            SecretId: secretName
          }));
          secretData = JSON.parse(awsResponse.SecretString);
          break;
          
        case 'AZURE_KEYVAULT':
          const azureResponse = await provider.getSecret(secretName);
          secretData = JSON.parse(azureResponse.value);
          break;
          
        case 'GCP_SECRETS':
          const projectId = process.env.GCP_PROJECT_ID;
          const gcpResponse = await provider.accessSecretVersion({
            name: `projects/${projectId}/secrets/${secretName}/versions/latest`
          });
          secretData = JSON.parse(gcpResponse.payload.data.toString());
          break;
          
        default:
          throw new Error(`Unsupported secret manager: ${secretManager}`);
      }

      console.log(`✅ Credentials retrieved successfully from ${secretManager}`);
      return secretData;
      
    } catch (error) {
      console.error(`❌ Error retrieving credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate credentials for a specific cloud provider
   * @param {string} secretName - Secret name/identifier
   * @param {string} secretManager - Secret manager type
   * @param {string} cloudProvider - Cloud provider
   */
  async validateCredentials(secretName, secretManager, cloudProvider) {
    try {
      console.log(`🔍 Validating credentials for ${cloudProvider}`);
      
      const credentials = await this.getCredentials(secretName, secretManager);
      
      // Validate with cloud provider
      const provider = require(`./providers/${cloudProvider.toLowerCase()}Provider`);
      const providerInstance = new provider();
      
      await providerInstance.validateCredentials(credentials);
      
      console.log(`✅ Credentials validated successfully for ${cloudProvider}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Credential validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete credentials
   * @param {string} secretName - Secret name/identifier
   * @param {string} secretManager - Secret manager type
   */
  async deleteCredentials(secretName, secretManager) {
    try {
      console.log(`🗑️ Deleting credentials from ${secretManager}: ${secretName}`);
      
      const provider = this.providers[secretManager];
      if (!provider) {
        throw new Error(`Secret manager ${secretManager} not available`);
      }

      switch (secretManager) {
        case 'VAULT':
          await provider.delete(`secret/cloud/${secretName}`);
          break;
          
        case 'AWS_SECRETS':
          const { DeleteSecretCommand } = require('@aws-sdk/client-secrets-manager');
          await provider.send(new DeleteSecretCommand({
            SecretId: secretName,
            ForceDeleteWithoutRecovery: true
          }));
          break;
          
        case 'AZURE_KEYVAULT':
          await provider.beginDeleteSecret(secretName);
          break;
          
        case 'GCP_SECRETS':
          const projectId = process.env.GCP_PROJECT_ID;
          await provider.deleteSecret({
            name: `projects/${projectId}/secrets/${secretName}`
          });
          break;
          
        default:
          throw new Error(`Unsupported secret manager: ${secretManager}`);
      }

      console.log(`✅ Credentials deleted successfully from ${secretManager}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error deleting credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * List available secret managers
   */
  getAvailableSecretManagers() {
    const available = {};
    
    Object.keys(this.providers).forEach(manager => {
      available[manager] = this.providers[manager] !== null;
    });
    
    return available;
  }

  /**
   * Get recommended secret manager for cloud provider
   * @param {string} cloudProvider - Cloud provider
   */
  getRecommendedSecretManager(cloudProvider) {
    const recommendations = {
      AWS: 'AWS_SECRETS',
      AZURE: 'AZURE_KEYVAULT',
      GCP: 'GCP_SECRETS',
      OCI: 'VAULT' // OCI doesn't have a native secret manager, use Vault
    };
    
    return recommendations[cloudProvider] || 'VAULT';
  }
}

module.exports = SecretManager; 