/**
 * CCRP Cloud Credentials Model
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
 * - Belongs to User (CCRP)
 * - Referenced by Contract (for training environment)
 * 
 * @module models/CCRPCloudCredentials
 */

module.exports = (sequelize, DataTypes) => {
  const CCRPCloudCredentials = sequelize.define('CCRPCloudCredentials', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Foreign Key to CCRP User
    ccrpUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      comment: 'Reference to CCRP user'
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
    
    // Infrastructure Configuration
    defaultLocation: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'eastus',
      comment: 'Default cloud region for resource deployment'
    },
    
    defaultResourceGroupPrefix: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'training',
      comment: 'Prefix for resource group names'
    },
    
    defaultVMSize: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Standard_D2s_v3',
      comment: 'Default VM size for training instances'
    },
    
    defaultStorageSku: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Standard_LRS',
      comment: 'Default storage SKU'
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
      comment: 'Virtual network address space'
    },
    
    privateSubnetPrefix: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '10.0.1.0/24',
      comment: 'Private subnet address prefix'
    },
    
    publicSubnetPrefix: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '10.0.2.0/24',
      comment: 'Public subnet address prefix'
    },
    
    // Security Configuration
    enableEncryption: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Enable encryption at rest'
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
      comment: 'Budget alert threshold (0.0 to 1.0)'
    },
    
    // Status and Validation
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether credentials are active'
    },
    
    lastValidated: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last validation timestamp'
    },
    
    validationStatus: {
      type: DataTypes.ENUM('PENDING', 'VALID', 'INVALID', 'EXPIRED'),
      allowNull: false,
      defaultValue: 'PENDING',
      comment: 'Credential validation status'
    },
    
    // Audit Fields
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who created this record'
    }
  }, {
    tableName: 'ccrp_cloud_credentials',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['ccrp_user_id', 'cloud_provider']
      },
      {
        fields: ['cloud_provider']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['validation_status']
      }
    ]
  });

  // Instance methods
  CCRPCloudCredentials.prototype.validateCredentials = async function() {
    try {
      // This would now call the appropriate cloud provider's validation
      const secretManager = require('../services/secretManager');
      const credentials = await secretManager.getCredentials(this.secretName, this.secretManager);
      
      // Validate with cloud provider
      const provider = require(`../services/providers/${this.cloudProvider.toLowerCase()}Provider`);
      const providerInstance = new provider();
      await providerInstance.validateCredentials(credentials);
      
      // Update validation status
      this.validationStatus = 'VALID';
      this.lastValidated = new Date();
      await this.save();
      
      return true;
    } catch (error) {
      this.validationStatus = 'INVALID';
      this.lastValidated = new Date();
      await this.save();
      throw error;
    }
  };

  CCRPCloudCredentials.prototype.getCloudConfig = function() {
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
      infrastructure: {
        defaultLocation: this.defaultLocation,
        defaultResourceGroupPrefix: this.defaultResourceGroupPrefix,
        defaultVMSize: this.defaultVMSize,
        defaultStorageSku: this.defaultStorageSku,
        defaultDatabaseSku: this.defaultDatabaseSku,
        vnetAddressSpace: this.vnetAddressSpace,
        privateSubnetPrefix: this.privateSubnetPrefix,
        publicSubnetPrefix: this.publicSubnetPrefix
      },
      security: {
        enableEncryption: this.enableEncryption,
        enableMonitoring: this.enableMonitoring,
        enableKeyVault: this.enableKeyVault
      },
      costManagement: {
        budgetLimit: this.budgetLimit,
        alertThreshold: this.alertThreshold
      }
    };
  };

  // Class methods
  CCRPCloudCredentials.findByCCRP = async function(ccrpUserId) {
    return await this.findAll({
      where: {
        ccrpUserId,
        isActive: true
      }
    });
  };

  CCRPCloudCredentials.findByCCRPAndProvider = async function(ccrpUserId, cloudProvider) {
    return await this.findOne({
      where: {
        ccrpUserId,
        cloudProvider,
        isActive: true
      }
    });
  };

  CCRPCloudCredentials.findValidCredentials = async function() {
    return await this.findAll({
      where: {
        isActive: true,
        validationStatus: 'VALID'
      }
    });
  };

  // Associations
  CCRPCloudCredentials.associate = function(models) {
    CCRPCloudCredentials.belongsTo(models.User, {
      foreignKey: 'ccrpUserId',
      as: 'ccrpUser'
    });
    
    CCRPCloudCredentials.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return CCRPCloudCredentials;
}; 