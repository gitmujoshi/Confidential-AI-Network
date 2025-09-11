const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserKey = sequelize.define('UserKey', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      comment: 'Reference to the user who owns this key'
    },
    keyId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'key_id',
      comment: 'Unique identifier for this key'
    },
    keyType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'key_type',
      comment: 'Type of key (ECDSA-P256, RSA-2048, RSA-4096)'
    },
    publicKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'public_key',
      comment: 'Public key in PEM or JWK format'
    },
    privateKey: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'private_key',
      comment: 'Private key (encrypted in production)'
    },
    keyStatus: {
      type: DataTypes.ENUM('active', 'inactive', 'revoked', 'expired'),
      allowNull: false,
      defaultValue: 'active',
      field: 'key_status',
      comment: 'Current status of the key'
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_used_at',
      comment: 'When the key was last used for signing'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
      comment: 'When the key expires (if applicable)'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional key metadata'
    }
  }, {
    tableName: 'user_keys',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['key_id'],
        unique: true
      },
      {
        fields: ['key_status']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  UserKey.associate = (models) => {
    // UserKey belongs to User
    UserKey.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // UserKey has many Signatures
    UserKey.hasMany(models.Signature, {
      foreignKey: 'keyId',
      as: 'signatures'
    });
  };

  return UserKey;
};
