/**
 * Enterprise Key Model
 * Stores enterprise public keys for contract signing
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EnterpriseKey = sequelize.define('EnterpriseKey', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    publicKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Public key in PEM format'
    },
    algorithm: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Key algorithm (ECDSA_P256, RSA_2048, etc.)'
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Cloud provider (azure, aws, gcp, oci)'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional key metadata'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the key is active'
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
    tableName: 'enterprise_keys',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['keyId', 'userId'],
        unique: true
      },
      {
        fields: ['provider']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  // Define associations
  EnterpriseKey.associate = (models) => {
    EnterpriseKey.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    // Note: keyId is a string field, not a foreign key
    // Associations will be handled manually in the service layer
  };

  return EnterpriseKey;
};
