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
      comment: 'Unique identifier for the claim in SCITT CCF'
    },
    contractId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to the contract this claim belongs to'
    },
    claimType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Type of claim (contract_creation, contract_approval, contract_completion, etc.)'
    },
    claimData: {
      type: DataTypes.JSONB,
      allowNull: false,
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
      comment: 'Timestamp when the claim was created'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when the claim was last updated'
    }
  }, {
    tableName: 'scitt_claims',
    timestamps: true,
    indexes: [
      {
        name: 'idx_claim_id',
        fields: ['claimId']
      },
      {
        name: 'idx_contract_id',
        fields: ['contractId']
      },
      {
        name: 'idx_claim_type',
        fields: ['claimType']
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
      foreignKey: 'contractId',
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
