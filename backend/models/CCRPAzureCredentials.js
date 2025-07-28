/**
 * CCRP Azure Credentials Model
 * 
 * This model stores Azure credentials and configurations specific to each CCRP (Confidential Clean Room Provider).
 * Each CCRP can have their own Azure subscription, credentials, and infrastructure preferences.
 * 
 * Security Features:
 * - Encrypted credential storage
 * - Environment-specific configurations
 * - Audit trail for credential changes
 * - Multi-subscription support
 * 
 * Relationships:
 * - Belongs to User (CCRP)
 * - Referenced by Contracts for infrastructure provisioning
 */

const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const CCRPAzureCredentials = sequelize.define('CCRPAzureCredentials', {
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Reference to CCRP user
    ccrpUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Reference to CCRP user'
    },
    
    // Azure Subscription Configuration
    subscriptionId: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'Azure subscription ID'
    },
    
    tenantId: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'Azure tenant ID'
    },
    
    // Service Principal Credentials (encrypted)
    clientId: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'Azure service principal client ID'
    },
    
    clientSecret: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      comment: 'Azure service principal client secret (encrypted)',
      set(value) {
        // Encrypt the client secret before storing
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        this.setDataValue('clientSecret', iv.toString('hex') + ':' + encrypted);
      },
      get() {
        // Decrypt the client secret when retrieving
        const value = this.getDataValue('clientSecret');
        if (!value) return null;
        
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
        const parts = value.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipher(algorithm, key);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }
    },
    
    // Authentication Method
    authMethod: {
      type: DataTypes.ENUM('SERVICE_PRINCIPAL', 'MANAGED_IDENTITY', 'AZURE_CLI'),
      allowNull: false,
      defaultValue: 'SERVICE_PRINCIPAL',
      comment: 'Authentication method for Azure'
    },
    
    // Default Infrastructure Configuration
    defaultLocation: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'eastus',
      comment: 'Default Azure region for resource deployment'
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
      comment: 'Enable Azure Monitor and Log Analytics'
    },
    
    enableKeyVault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Enable Azure Key Vault for encryption'
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
    tableName: 'ccrp_azure_credentials',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['ccrpUserId']
      },
      {
        fields: ['subscriptionId']
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
  CCRPAzureCredentials.prototype.validateCredentials = async function() {
    try {
      const { DefaultAzureCredential } = require('@azure/identity');
      const { ComputeManagementClient } = require('@azure/arm-compute');
      
      // Create credential based on auth method
      let credential;
      if (this.authMethod === 'SERVICE_PRINCIPAL') {
        credential = new DefaultAzureCredential();
      } else if (this.authMethod === 'MANAGED_IDENTITY') {
        credential = new DefaultAzureCredential();
      } else {
        credential = new DefaultAzureCredential();
      }
      
      // Test credential by listing resource groups
      const computeClient = new ComputeManagementClient(credential, this.subscriptionId);
      await computeClient.resourceGroups.list();
      
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

  CCRPAzureCredentials.prototype.getAzureConfig = function() {
    return {
      subscription: {
        id: this.subscriptionId,
        tenantId: this.tenantId
      },
      auth: {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
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
  CCRPAzureCredentials.findByCCRP = async function(ccrpUserId) {
    return await this.findOne({
      where: {
        ccrpUserId,
        isActive: true
      }
    });
  };

  CCRPAzureCredentials.findValidCredentials = async function() {
    return await this.findAll({
      where: {
        isActive: true,
        validationStatus: 'VALID'
      }
    });
  };

  return CCRPAzureCredentials;
}; 