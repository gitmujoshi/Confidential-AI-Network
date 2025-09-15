/**
 * ScittClaim Model
 * 
 * This model represents SCITT CCF claims stored locally for tracking
 * and fallback purposes.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2025-01-08
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ScittClaim = sequelize.define('ScittClaim', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    claimId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'claim_id',
      comment: 'Unique identifier for the claim in SCITT CCF'
    },
    contractId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'contract_id',
      comment: 'Reference to the contract this claim belongs to (can be string or integer)'
    },
    claimType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'claim_type',
      comment: 'Type of claim (contract_creation, contract_approval, contract_completion, etc.)'
    },
    claimData: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'claim_data',
      comment: 'Complete claim data as submitted to SCITT CCF'
    },
    receipt: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Receipt received from SCITT CCF after claim submission'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'PENDING',
      comment: 'Current status of the claim'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
      comment: 'Timestamp when the claim was created'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
      comment: 'Timestamp when the claim was last updated'
    },
    provenanceTreeId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'provenance_tree_id',
      comment: 'ID of the provenance tree for this claim'
    },
    provenanceRoot: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'provenance_root',
      comment: 'Root hash of the provenance tree for this claim'
    }
  }, {
    tableName: 'scitt_claims',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_claim_id',
        fields: ['claim_id']
      },
      {
        name: 'idx_contract_id',
        fields: ['contract_id']
      },
      {
        name: 'idx_claim_type',
        fields: ['claim_type']  // Use the database column name (with underscore)
      },
      {
        name: 'idx_status',
        fields: ['status']
      }
    ],
    comment: 'SCITT CCF claims stored locally for tracking and fallback'
  });

  // Define associations
  ScittClaim.associate = (models) => {
    ScittClaim.belongsTo(models.Contract, {
      foreignKey: 'contractId',  // This matches the model attribute name
      targetKey: 'contractId',   // Reference Contract.contractId (STRING), not Contract.id
      as: 'contract',
      onDelete: 'CASCADE'
    });
  };

  // Instance methods
  ScittClaim.prototype.updateStatus = async function(newStatus) {
    this.status = newStatus;
    this.updatedAt = new Date();
    return await this.save();
  };

  ScittClaim.prototype.addReceipt = async function(receipt) {
    this.receipt = receipt;
    this.updatedAt = new Date();
    return await this.save();
  };

  // Class methods
  ScittClaim.findByContractId = function(contractId) {
    return this.findAll({
      where: { contractId: contractId },
      order: [['createdAt', 'ASC']]
    });
  };

  ScittClaim.findByClaimType = function(claimType) {
    return this.findAll({
      where: { claimType: claimType },
      order: [['createdAt', 'DESC']]
    });
  };

  ScittClaim.findByStatus = function(status) {
    return this.findAll({
      where: { status: status },
      order: [['createdAt', 'DESC']]
    });
  };

  ScittClaim.findPendingClaims = function() {
    return this.findAll({
      where: { status: 'PENDING' },
      order: [['createdAt', 'ASC']]
    });
  };

  // Hooks
  ScittClaim.beforeCreate((claim, options) => {
    if (!claim.claimId) {
      claim.claimId = `CLAIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  });

  ScittClaim.beforeUpdate((claim, options) => {
    claim.updatedAt = new Date();
  });

  return ScittClaim;
};
