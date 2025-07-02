/**
 * Contract Model
 * 
 * This model represents contracts in the Contract Management System.
 * Contracts are created by TDC users and involve TDP (dataset owner) and optionally CCRP.
 * 
 * Contract Workflow:
 * 1. PENDING_TDP_APPROVAL: Contract created by TDC, waiting for TDP auto-sign
 * 2. PENDING_CCRP_APPROVAL: TDP signed, waiting for CCRP (if selected)
 * 3. ACTIVE: All required parties signed, contract is legally binding
 * 4. COMPLETED: Contract execution finished
 * 5. CANCELLED: Contract cancelled by any party
 * 
 * Parties:
 * - TDP (Training Data Provider): Dataset owner, auto-signs when contract created
 * - TDC (Training Data Consumer): Contract initiator, signs to finalize
 * - CCRP (Confidential Clean Room Provider): Optional compliance reviewer
 * 
 * Security Features:
 * - Blockchain contract ID tracking
 * - Signature timestamps
 * - Status tracking with audit trail
 * - Foreign key relationships for data integrity
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
    
    // Model identifier for the training model
    modelId: {
      type: DataTypes.STRING,
      allowNull: false
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