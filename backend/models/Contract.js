/**
 * Contract Model with Ricardian Contract Support
 * 
 * This model represents contracts in the Contract Management System with Ricardian contract pattern.
 * Ricardian contracts combine human-readable legal documents with machine-executable smart contracts.
 * 
 * Contract Workflow:
 * 1. PENDING_TDP_APPROVAL: Contract created by TDC, waiting for TDP auto-sign
 * 2. PENDING_CCRP_APPROVAL: TDP signed, waiting for CCRP (if selected)
 * 3. ACTIVE: All required parties signed, contract is legally binding
 * 4. COMPLETED: Contract execution finished
 * 5. CANCELLED: Contract cancelled by any party
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
 * - CCRP (Confidential Clean Room Provider): Runtime environment provider who sets up secure environments for data analytics or AI model training based on contracts
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
    
    // Unique contract identifier (human-readable)
    contractId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    
    // Blockchain contract ID (from smart contract)
    blockchainContractId: {
      type: DataTypes.INTEGER,
      allowNull: true
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
    
    smartContractAddress: {
      field: 'smartcontractaddress',
      type: DataTypes.STRING(42), // Ethereum address format
      allowNull: true,
      comment: 'Smart contract address for automated execution'
    },
    
    smartContractNetwork: {
      field: 'smartcontractnetwork',
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'goerli',
      comment: 'Blockchain network (goerli, mainnet, etc.)'
    },
    
    // Contract status in the workflow
    status: {
      type: DataTypes.ENUM(
        'PENDING_TDP_APPROVAL',    // TDC created, waiting for TDP auto-sign
        'PENDING_CCRP_APPROVAL',   // TDP signed, waiting for CCRP (if selected)
        'ACTIVE',                  // All required parties signed
        'COMPLETED',               // Contract execution finished
        'CANCELLED'                // Contract cancelled
      ),
      defaultValue: 'PENDING_TDP_APPROVAL'
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
    
    // Model identifier for the training model (removed - AI models are independent)
    // modelId: {
    //   type: DataTypes.STRING,
    //   allowNull: false
    // },
    
    // Ricardian Contract Legal Document (JSON)
    legalDocument: {
      field: 'legaldocument',
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Complete legal document with terms, parties, and signatures'
    },
    
    // Environment Specifications for CCRP
    environmentSpecs: {
      field: 'environmentspecs',
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'CCRP environment specifications including compute, security, and KMS config'
    },
    
    // Training Parameters
    trainingParams: {
      field: 'trainingparams',
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'AI training parameters including model type, privacy techniques, and validation metrics'
    },
    
    // Attestation Verification
    attestationVerified: {
      field: 'attestationverified',
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether Azure attestation has been verified'
    },
    
    attestationReport: {
      field: 'attestationreport',
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Azure Confidential Computing attestation report'
    },
    
    // KMS Configuration
    kmsConfigs: {
      field: 'kmsconfigs',
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Multi-KMS provider configurations for data decryption'
    },
    
    // TDP signature status
    tdpSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // CCRP signature status
    ccrpSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    
    // Timestamp when TDP signed (auto-signed when contract created)
    tdpSignedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Timestamp when CCRP signed (manual review and sign)
    ccrpSignedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Foreign key to TDP user (Training Data Provider)
    tdpId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
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
    
    // Foreign key to CCRP user (Confidential Clean Room Provider - optional)
    ccrpId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // Foreign key to dataset being contracted
    datasetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'datasets',
        key: 'id'
      }
    }
  }, {
    tableName: 'contracts',
    timestamps: true,
    
    // Database indexes for performance optimization
    indexes: [
      {
        unique: true,
        fields: ['contractId']     // Fast contract ID lookups
      },
      {
        fields: ['status']         // Fast status-based queries
      },
      {
        fields: ['tdpId']          // Fast TDP contract queries
      },
      {
        fields: ['tdcId']          // Fast TDC contract queries
      },
      {
        fields: ['ccrpId']         // Fast CCRP contract queries
      },
      {
        fields: ['blockchainContractId']  // Fast blockchain ID lookups
      },
      {
        fields: ['legaldocumenthash']     // Fast legal document hash lookups
      },
      {
        fields: ['smartcontractaddress']  // Fast smart contract address lookups
      },
      {
        fields: ['attestationverified']   // Fast attestation verification queries
      }
    ]
  });

  /**
   * Define associations with other models
   * @param {Object} models - All Sequelize models
   */
  Contract.associate = (models) => {
    // Contract belongs to TDP (Training Data Provider)
    Contract.belongsTo(models.User, { foreignKey: 'tdpId', as: 'tdp' });
    
    // Contract belongs to TDC (Training Data Consumer)
    Contract.belongsTo(models.User, { foreignKey: 'tdcId', as: 'tdc' });
    
    // Contract belongs to CCRP (Confidential Clean Room Provider) - optional
    Contract.belongsTo(models.User, { foreignKey: 'ccrpId', as: 'ccrp' });
    
    // Contract belongs to dataset
    Contract.belongsTo(models.Dataset, { foreignKey: 'datasetId', as: 'dataset' });
  };

  return Contract;
}; 