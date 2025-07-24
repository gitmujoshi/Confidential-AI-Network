/**
 * Migration: Add CCRP Azure Configuration Fields to Contracts
 * 
 * This migration adds Azure-specific configuration fields to the contracts table
 * to support CCRP-specific Azure credentials and settings.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

async function addCcrpAzureFields() {
  try {
    console.log('🔧 Adding CCRP Azure configuration fields to contracts table...');

    // Add CCRP Azure configuration fields
    const fields = [
      {
        name: 'ccrpAzureSubscriptionId',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Azure subscription ID for this contract (from CCRP credentials)'
      },
      {
        name: 'ccrpAzureTenantId',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Azure tenant ID for this contract (from CCRP credentials)'
      },
      {
        name: 'ccrpAzureLocation',
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'eastus',
        comment: 'Azure region for this contract deployment'
      },
      {
        name: 'ccrpAzureResourceGroupPrefix',
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'training',
        comment: 'Resource group prefix for this contract'
      },
      {
        name: 'ccrpAzureVMSize',
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Standard_D2s_v3',
        comment: 'VM size for compute instances'
      },
      {
        name: 'ccrpAzureStorageSku',
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Standard_LRS',
        comment: 'Storage account SKU'
      },
      {
        name: 'ccrpAzureDatabaseSku',
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Basic',
        comment: 'Database SKU'
      },
      {
        name: 'ccrpAzureEnableEncryption',
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
        comment: 'Enable encryption for this contract'
      },
      {
        name: 'ccrpAzureEnableMonitoring',
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
        comment: 'Enable monitoring for this contract'
      },
      {
        name: 'ccrpAzureBudgetLimit',
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Monthly budget limit for this contract'
      }
    ];

    // Add each field to the contracts table
    for (const field of fields) {
      await sequelize.getQueryInterface().addColumn('contracts', field.name, {
        type: field.type,
        allowNull: field.allowNull,
        defaultValue: field.defaultValue,
        comment: field.comment
      });
      console.log(`✅ Added field: ${field.name}`);
    }

    console.log('✅ Successfully added all CCRP Azure configuration fields to contracts table');

    // Create the ccrp_azure_credentials table
    console.log('🔧 Creating ccrp_azure_credentials table...');
    
    await sequelize.getQueryInterface().createTable('ccrp_azure_credentials', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ccrpUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      subscriptionId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tenantId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      clientId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      clientSecret: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      authMethod: {
        type: Sequelize.ENUM('SERVICE_PRINCIPAL', 'MANAGED_IDENTITY', 'AZURE_CLI'),
        allowNull: false,
        defaultValue: 'SERVICE_PRINCIPAL'
      },
      defaultLocation: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'eastus'
      },
      defaultResourceGroupPrefix: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'training'
      },
      defaultVMSize: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Standard_D2s_v3'
      },
      defaultStorageSku: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Standard_LRS'
      },
      defaultDatabaseSku: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Basic'
      },
      vnetAddressSpace: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '10.0.0.0/16'
      },
      privateSubnetPrefix: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '10.0.1.0/24'
      },
      publicSubnetPrefix: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '10.0.2.0/24'
      },
      enableEncryption: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      enableMonitoring: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      enableKeyVault: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      budgetLimit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      alertThreshold: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.8
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      lastValidated: {
        type: Sequelize.DATE,
        allowNull: true
      },
      validationStatus: {
        type: Sequelize.ENUM('PENDING', 'VALID', 'INVALID', 'EXPIRED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await sequelize.getQueryInterface().addIndex('ccrp_azure_credentials', ['ccrpUserId'], {
      unique: true,
      name: 'ccrp_azure_credentials_ccrpUserId_unique'
    });

    await sequelize.getQueryInterface().addIndex('ccrp_azure_credentials', ['subscriptionId'], {
      name: 'ccrp_azure_credentials_subscriptionId'
    });

    await sequelize.getQueryInterface().addIndex('ccrp_azure_credentials', ['isActive'], {
      name: 'ccrp_azure_credentials_isActive'
    });

    await sequelize.getQueryInterface().addIndex('ccrp_azure_credentials', ['validationStatus'], {
      name: 'ccrp_azure_credentials_validationStatus'
    });

    console.log('✅ Successfully created ccrp_azure_credentials table with indexes');

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
if (require.main === module) {
  addCcrpAzureFields().catch(console.error);
}

module.exports = { addCcrpAzureFields }; 