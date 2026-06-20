/**
 * Multi-Cloud Credentials Model
 * 
 * This model stores cloud provider credentials and configurations for CCRPs.
 * Sensitive credentials are stored in external secret management systems.
 * 
 * Security Features:
 * - No sensitive data in database
 * - Cloud-agnostic secret management
 * - Audit trail for credential changes
 * - Multi-cloud support (AWS, Azure, GCP, OCI)
 * 
 * Relationships:
 * - Belongs to User (TSP)
 * - Referenced by Contracts for infrastructure provisioning
 */

module.exports = (sequelize, DataTypes) => {
  const TSPAzureCredentials = sequelize.define('TSPAzureCredentials', {
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Reference to TSP user
    tspUserId: {
      type: DataTypes.INTEGER,
      field: 'ccrpUserId',
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Reference to TSP user'
    },
    
    // Cloud Provider Configuration
    cloudProvider: {
      type: DataTypes.ENUM('AWS', 'AZURE', 'GCP', 'OCI'),
      allowNull: false,
      comment: 'Cloud service provider'
    },
    
    // Cloud-specific identifiers (non-sensitive)
    subscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Azure subscription ID or AWS account ID'
    },
    
    tenantId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Azure tenant ID'
    },
    
    projectId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'GCP project ID'
    },
    
    compartmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'OCI compartment ID'
    },
    
    // Secret Management Configuration
    secretName: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Reference to secret in external secret manager'
    },
    
    secretManager: {
      type: DataTypes.ENUM('VAULT', 'AWS_SECRETS', 'AZURE_KEYVAULT', 'GCP_SECRETS', 'OCI_VAULT'),
      allowNull: false,
      defaultValue: 'VAULT',
      comment: 'External secret management system'
    },
    
    // Authentication Method
    authMethod: {
      type: DataTypes.ENUM('SERVICE_PRINCIPAL', 'MANAGED_IDENTITY', 'IAM_ROLE', 'API_KEY'),
      allowNull: false,
      defaultValue: 'SERVICE_PRINCIPAL',
      comment: 'Authentication method for cloud provider'
    },
    
    // Default Infrastructure Configuration
    defaultLocation: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'eastus',
      comment: 'Default cloud region for resource deployment'
    },
    
    defaultResourceGroupPrefix: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'training',
      comment: 'Default prefix for resource groups'
    },
    
    defaultVMSize: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Standard_D2s_v3',
      comment: 'Default VM size for compute instances'
    },
    
    defaultStorageSku: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Standard_LRS',
      comment: 'Default storage account SKU'
    },
    
    defaultDatabaseSku: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Basic',
      comment: 'Default database SKU'
    },
    
    // Network Configuration
    vnetAddressSpace: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '10.0.0.0/16',
      comment: 'Default VNet address space'
    },
    
    privateSubnetPrefix: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '10.0.1.0/24',
      comment: 'Default private subnet prefix'
    },
    
    publicSubnetPrefix: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '10.0.2.0/24',
      comment: 'Default public subnet prefix'
    },
    
    // Security Configuration
    enableEncryption: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Enable storage and disk encryption'
    },
    
    enableMonitoring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Enable cloud monitoring and logging'
    },
    
    enableKeyVault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Enable cloud key management service'
    },
    
    // Cost Management
    budgetLimit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Monthly budget limit in USD'
    },
    
    alertThreshold: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0.8,
      comment: 'Budget alert threshold (0.8 = 80%)'
    },
    
    // Status and Metadata
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether these credentials are active'
    },
    
    lastValidated: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time credentials were validated'
    },
    
    validationStatus: {
      type: DataTypes.ENUM('PENDING', 'VALID', 'INVALID', 'EXPIRED'),
      allowNull: false,
      defaultValue: 'PENDING',
      comment: 'Credential validation status'
    },
    
    // Audit fields
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who created these credentials'
    },
    
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'ccrp_cloud_credentials', // Updated table name
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['ccrpUserId', 'cloudProvider']
      },
      {
        fields: ['cloudProvider']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['validationStatus']
      }
    ]
  });

  // Instance methods
  TSPAzureCredentials.prototype.validateCredentials = async function() {
    try {
      // This would now call the appropriate cloud provider's validation
      const secretManager = require('../services/secretManager');
      const credentials = await secretManager.getCredentials(this.secretName, this.secretManager);
      
      // Validate with cloud provider
      const provider = require(`../services/providers/${this.cloudProvider.toLowerCase()}Provider`);
      const providerInstance = new provider();
      await providerInstance.validateCredentials(credentials);
      
      // Update validation status
      await this.update({
        validationStatus: 'VALID',
        lastValidated: new Date()
      });
      
      return true;
    } catch (error) {
      await this.update({
        validationStatus: 'INVALID',
        lastValidated: new Date()
      });
      throw error;
    }
  };

  TSPAzureCredentials.prototype.getCloudConfig = function() {
    return {
      cloudProvider: this.cloudProvider,
      subscription: {
        id: this.subscriptionId,
        tenantId: this.tenantId,
        projectId: this.projectId,
        compartmentId: this.compartmentId
      },
      secretManagement: {
        secretName: this.secretName,
        secretManager: this.secretManager,
        authMethod: this.authMethod
      },
      defaults: {
        location: this.defaultLocation,
        resourceGroupPrefix: this.defaultResourceGroupPrefix,
        vmSize: this.defaultVMSize,
        storageSku: this.defaultStorageSku,
        databaseSku: this.defaultDatabaseSku
      },
      network: {
        vnetAddressSpace: this.vnetAddressSpace,
        privateSubnetPrefix: this.privateSubnetPrefix,
        publicSubnetPrefix: this.publicSubnetPrefix
      },
      security: {
        enableEncryption: this.enableEncryption,
        enableKeyVault: this.enableKeyVault
      },
      monitoring: {
        enableMonitoring: this.enableMonitoring
      },
      cost: {
        budgetLimit: this.budgetLimit,
        alertThreshold: this.alertThreshold
      }
    };
  };

  // Class methods
  TSPAzureCredentials.findByCCRP = async function(tspUserId) {
    return await this.findAll({
      where: {
        tspUserId,
        isActive: true
      }
    });
  };

  TSPAzureCredentials.findByCCRPAndProvider = async function(tspUserId, cloudProvider) {
    return await this.findOne({
      where: {
        tspUserId,
        cloudProvider,
        isActive: true
      }
    });
  };

  TSPAzureCredentials.findValidCredentials = async function() {
    return await this.findAll({
      where: {
        isActive: true,
        validationStatus: 'VALID'
      }
    });
  };

  return TSPAzureCredentials;
}; 