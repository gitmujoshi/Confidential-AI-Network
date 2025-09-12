/**
 * Signing Request Model
 * Tracks contract signing requests with enterprise KMS
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SigningRequest = sequelize.define('SigningRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contractId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'contracts',
        key: 'contractId'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    keyId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Enterprise key identifier'
    },
    contractHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'SHA-256 hash of contract data'
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING',
      comment: 'Signing request status'
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Generated signature (base64 encoded)'
    },
    kmsConfig: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'KMS configuration for signing'
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if signing failed'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When signing was completed'
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When signing failed'
    }
  }, {
    tableName: 'signing_requests',
    timestamps: true,
    indexes: [
      {
        fields: ['contractId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['keyId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Define associations
  SigningRequest.associate = (models) => {
    SigningRequest.belongsTo(models.Contract, {
      foreignKey: 'contractId',
      as: 'contract'
    });
    
    SigningRequest.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    SigningRequest.belongsTo(models.EnterpriseKey, {
      foreignKey: 'keyId',
      as: 'enterpriseKey'
    });
  };

  return SigningRequest;
};
