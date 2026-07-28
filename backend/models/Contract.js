/**
 * Contract Model with Ricardian Contract Support
 * 
 * This model represents contracts in the Contract Management System with Ricardian contract pattern.
 * Ricardian contracts combine human-readable legal documents with machine-executable smart contracts.
 * 
 * Contract Workflow:
 * 1. DRAFT: Contract created by TDC, can be edited
 * 2. PENDING_TDP: Waiting for all TDPs to sign
 * 3. PENDING_TDC: Waiting for TDC signature
 * 4. PENDING_TSP: Waiting for TSP signature
 * 5. SIGNED: All parties signed, ready for execution
 * 6. EXECUTING: Contract being executed
 * 7. COMPLETED: Contract fulfilled successfully
 * 8. REJECTED: Contract rejected by any party
 * 9. FAILED: Execution failed
 * 
 * Ricardian Contract Features:
 * - Legal document hash for human-readable terms
 * - Cryptographic signature binding legal to smart contract
 * - Smart contract address for automated execution
 * - Attestation verification for confidential computing
 * - Multi-KMS support for data encryption
 * 
 * Parties:
 * - TDP (Training Data Provider): Dataset owner, auto-signs when contract created
 * - TDC (Training Data Consumer): Contract initiator, signs to finalize
 * - TSP (Tech Service Provider): Runtime environment provider who sets up secure environments for data analytics or AI model training based on contracts
 * 
 * Security Features:
 * - Blockchain contract ID tracking
 * - Signature timestamps
 * - Status tracking with audit trail
 * - Foreign key relationships for data integrity
 * - Ricardian cryptographic binding
 * - Attestation verification
 */
module.exports = (sequelize, DataTypes) => {
  const Contract = sequelize.define('Contract', {
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Contract ID (unique identifier)
    contractId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    
    // Ricardian Contract Fields
    legalDocumentHash: {
      field: 'legaldocumenthash',
      type: DataTypes.STRING(66), // SHA-256 hash with 0x prefix (always 66 chars)
      allowNull: true,
      comment: 'Hash of human-readable legal document for Ricardian binding'
    },
    
    ricardianSignature: {
      field: 'ricardiansignature',
      type: DataTypes.STRING(132), // Cryptographic signature
      allowNull: true,
      comment: 'Cryptographic signature binding legal document to smart contract'
    },

    // Contract status in the workflow - Updated to match UML state diagram
    status: {
      type: DataTypes.ENUM(
        'DRAFT',                    // Contract created by TDC, can be edited
        'PENDING_TDP',              // Waiting for all TDPs to sign
        'PENDING_TDP_APPROVAL',     // Waiting for TDP approval (legacy)
        'PENDING_TDC',              // Waiting for TDC signature  
        'PENDING_TSP',              // Waiting for TSP signature
        'PENDING_TSP_APPROVAL',     // Waiting for TSP approval (legacy)
        'PENDING_CCRP',             // Legacy DB value (maps to PENDING_TSP)
        'PENDING_CCRP_APPROVAL',    // Legacy DB value
        'SIGNED',                   // All parties signed, ready for execution
        'EXECUTING',                // Contract being executed
        'COMPLETED',                // Contract fulfilled successfully
        'REJECTED',                 // Contract rejected by any party
        'FAILED'                    // Execution failed
      ),
      defaultValue: 'DRAFT',
      comment: 'Contract status following UML state diagram workflow'
    },
    
    // Contract price in wei (blockchain currency)
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    
    // Contract duration in days
    duration: {
      type: DataTypes.INTEGER, // Duration in days
      allowNull: false
    },
    
    // Contract terms and conditions
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    
    // Contract template reference
    templateId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'contract_templates',
        key: 'template_id'
      },
      comment: 'Reference to the contract template used for this contract'
    },
    
    // Ricardian Contract Legal Document (JSONB)
    legalDocument: {
      field: 'legaldocument',
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Complete legal document with terms, parties, and signatures'
    },
    
    // Environment Specifications for TSP
    environmentSpecs: {
      field: 'environmentspecs',
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'TSP environment specifications including compute, security, and KMS config'
    },
    
    // Training Parameters
    trainingParams: {
      field: 'trainingparams',
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'AI training parameters including model type, privacy techniques, and validation metrics'
    },
    
    // Selected AI Model IDs
    aiModelIds: {
      field: 'aimodelids',
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Array of selected AI model IDs for this contract'
    },
    
    // KMS Configuration
    kmsConfigs: {
      field: 'kmsconfigs',
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Multi-KMS provider configurations for data decryption'
    },

    // TSP signature status
    tspSigned: {
      type: DataTypes.BOOLEAN,
      field: 'ccrp_signed',
      defaultValue: false
    },
    
    tspSignedAt: {
      type: DataTypes.DATE,
      field: 'ccrp_signed_at',
      allowNull: true
    },

    tdpSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    tdpSignedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },

    tdcSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    tdcSignedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Foreign key to TDC user (Training Data Consumer - contract initiator)
    tdcId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // Foreign key to TSP user (Tech Service Provider - optional)
    tspId: {
      type: DataTypes.INTEGER,
      field: 'ccrp_id',
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },

    /** Primary TDP (dataset owner) for single-TDP and backward-compatible queries */
    tdpId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Primary Training Data Provider user id'
    },

    primaryTdpId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Same as tdpId for multi-dataset contracts (first TDP)'
    },

    /** Primary dataset internal id (datasets.id) */
    datasetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'datasets',
        key: 'id'
      },
      comment: 'Primary dataset row id'
    },

    primaryDatasetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'datasets',
        key: 'id'
      },
      comment: 'Same as datasetId for multi-dataset contracts'
    },

    // Selected cloud provider for this contract
    tspCloudProvider: {
      type: DataTypes.STRING,
      field: 'ccrp_cloud_provider',
      allowNull: true,
      comment: 'Selected cloud provider for this contract (AWS, GCP, Azure, OCI)'
    },
    
    tspAzureSubscriptionId: {
      type: DataTypes.STRING,
      field: 'ccrp_azure_subscription_id',
      allowNull: true,
      comment: 'Azure subscription ID for this contract (from TSP credentials)'
    },
    
    tspAzureTenantId: {
      type: DataTypes.STRING,
      field: 'ccrp_azure_tenant_id',
      allowNull: true,
      comment: 'Azure tenant ID for this contract (from TSP credentials)'
    },
    
    tspAzureLocation: {
      type: DataTypes.STRING,
      field: 'ccrp_azure_location',
      allowNull: true,
      defaultValue: 'eastus',
      comment: 'Azure region for this contract deployment'
    },
    
    tspAzureResourceGroupPrefix: {
      type: DataTypes.STRING,
      field: 'ccrp_azure_resource_group_prefix',
      allowNull: true,
      defaultValue: 'training',
      comment: 'Resource group prefix for this contract'
    },
    
    tspAzureVMSize: {
      type: DataTypes.STRING,
      field: 'ccrp_azure_v_m_size',
      allowNull: true,
      defaultValue: 'Standard_D2s_v3',
      comment: 'VM size for compute instances'
    },
    
    tspAzureStorageSku: {
      type: DataTypes.STRING,
      field: 'ccrp_azure_storage_sku',
      allowNull: true,
      defaultValue: 'Standard_LRS',
      comment: 'Storage account SKU'
    },
    
    tspAzureDatabaseSku: {
      type: DataTypes.STRING,
      field: 'ccrp_azure_database_sku',
      allowNull: true,
      defaultValue: 'Basic',
      comment: 'Database SKU'
    },
    
    tspAzureEnableEncryption: {
      type: DataTypes.BOOLEAN,
      field: 'ccrp_azure_enable_encryption',
      allowNull: true,
      defaultValue: true,
      comment: 'Enable encryption for this contract'
    },
    
    tspAzureEnableMonitoring: {
      type: DataTypes.BOOLEAN,
      field: 'ccrp_azure_enable_monitoring',
      allowNull: true,
      defaultValue: true,
      comment: 'Enable monitoring for this contract'
    },
    
    tspAzureBudgetLimit: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'ccrp_azure_budget_limit',
      allowNull: true,
      comment: 'Monthly budget limit for this contract'
    },
    
    // Total number of datasets in this contract
    datasetCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 3
      },
      comment: 'Total number of datasets in this contract (1-3)'
    },
    
    // Total number of TDPs involved
    tdpCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 3
      },
      comment: 'Total number of TDPs involved (1-3, one per dataset)'
    },
    
    // Combined price for all datasets
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Total price for all datasets combined'
    },
    
    // Contract status considering multiple TDPs - Updated to match UML state diagram
    multiTdpStatus: {
      type: DataTypes.ENUM(
        'DRAFT',                    // Contract created by TDC, can be edited
        'PENDING_TDP',              // Waiting for all TDPs to sign
        'PENDING_ALL_TDP_APPROVAL', // Waiting for all TDP approvals (legacy)
        'PENDING_TDC',              // Waiting for TDC signature
        'PENDING_TSP',             // Waiting for TSP signature
        'SIGNED',                   // All parties signed, ready for execution
        'EXECUTING',                // Contract being executed
        'COMPLETED',                // Contract fulfilled successfully
        'REJECTED',                 // Contract rejected by any party
        'FAILED'                    // Execution failed
      ),
      defaultValue: 'DRAFT',
      comment: 'Multi-TDP status following UML state diagram workflow'
    },
    
    // DEPA ID — immutable DEPA-aligned entity ID (India's iSPIRT Data Empowerment and Protection Architecture)
    depaId: {
      type: DataTypes.STRING,
      allowNull: true, // Will be set to false after migration
      unique: true,
      comment: 'System-generated DEPA ID (CONTRACT-<GUID>)'
    },
    
    // Contract datasets - JSON array storing dataset information for multi-dataset contracts
    contractDatasets: {
      field: 'contract_datasets',
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'JSON array storing dataset information for multi-dataset contracts'
    },
    
    // Service account/role for cloud execution
    serviceAccount: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Cloud service account or IAM role for training job execution'
    },
    // Container image for training job
    containerImage: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Custom Docker container image for training environment'
    },
    // Log/monitoring destination (e.g., CloudWatch, Stackdriver, Azure Monitor)
    logDestination: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Log/monitoring destination for training job logs and metrics'
    },

    // Provenance Integration Fields
    provenanceTreeId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Reference to the Merkle provenance tree for this contract'
    },

    provenanceRoot: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Hash of the provenance tree root for verification'
    },

    provenanceStatus: {
      type: DataTypes.ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'FAILED'),
      defaultValue: 'PENDING',
      allowNull: false,
      comment: 'Status of provenance tracking for this contract'
    }
  }, {
    tableName: 'contracts',
    timestamps: true,
    underscored: true,
    
    // Database indexes for performance optimization
    indexes: [
      {
        unique: true,
        fields: ['contract_id']     // Fast contract ID lookups
      },
      {
        fields: ['status']         // Fast status-based queries
      },
      {
        fields: ['tdc_id']          // Fast TDC contract queries
      },
      {
        fields: ['ccrp_id']         // Fast TSP contract queries
      },
      {
        fields: ['depa_id']               // Fast DEPA ID lookups
      },
      {
        fields: ['provenance_tree_id']     // Fast provenance tree lookups
      },
      {
        fields: ['provenance_status']     // Fast provenance status queries
      }
    ]
  });

  /**
   * Define associations with other models
   * @param {Object} models - All Sequelize models
   */
  Contract.associate = (models) => {
    // Contract belongs to TDC (Training Data Consumer)
    Contract.belongsTo(models.User, { foreignKey: 'tdcId', as: 'tdc' });

    Contract.belongsTo(models.User, { foreignKey: 'tdpId', as: 'tdp' });
    Contract.belongsTo(models.User, { foreignKey: 'primaryTdpId', as: 'primaryTdp' });
    
    // Contract belongs to TSP (Tech Service Provider) - optional
    Contract.belongsTo(models.User, { foreignKey: 'tspId', as: 'tsp' });

    Contract.belongsTo(models.Dataset, { foreignKey: 'datasetId', as: 'dataset' });
    Contract.belongsTo(models.Dataset, { foreignKey: 'primaryDatasetId', as: 'primaryDataset' });

    // Note: contractDatasets is stored as JSON field in database, not as association
    
    // Note: TDP relationships are managed through the contractDatasets JSON field

    // Contract belongs to ContractTemplate
    Contract.belongsTo(models.ContractTemplate, { 
      foreignKey: 'templateId', 
      targetKey: 'templateId',
      as: 'template' 
    });
  };

  return Contract;
}; 