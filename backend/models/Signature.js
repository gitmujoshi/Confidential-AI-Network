const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Signature = sequelize.define('Signature', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contractId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'contract_id',
      comment: 'Reference to the contract being signed'
    },
    signerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'signer_id',
      comment: 'ID of the user who signed the contract'
    },
    signatureData: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'signature_data',
      comment: 'JSON containing signature, algorithm, timestamp, and contract hash'
    },
    signatureAlgorithm: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'signature_algorithm',
      comment: 'Algorithm used for signing (e.g., ECDSA-P256, RSA-2048)'
    },
    signatureTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'signature_timestamp',
      comment: 'When the signature was created'
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'failed', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'verification_status',
      comment: 'Status of signature verification'
    },
    verificationTimestamp: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verification_timestamp',
      comment: 'When the signature was verified'
    },
    blockchainTxHash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      field: 'blockchain_tx_hash',
      comment: 'Blockchain transaction hash if stored on blockchain'
    },
    keyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'key_id',
      comment: 'Reference to the signing key used'
    }
  }, {
    tableName: 'signatures',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['contract_id']
      },
      {
        fields: ['signer_id']
      },
      {
        fields: ['signature_timestamp']
      },
      {
        fields: ['verification_status']
      },
      {
        fields: ['blockchain_tx_hash']
      }
    ]
  });

  Signature.associate = (models) => {
    // Signature belongs to Contract
    Signature.belongsTo(models.Contract, {
      foreignKey: 'contractId',
      as: 'contract'
    });

    // Signature belongs to User (signer)
    Signature.belongsTo(models.User, {
      foreignKey: 'signerId',
      as: 'signer'
    });

    // Signature belongs to UserKey (signing key)
    Signature.belongsTo(models.UserKey, {
      foreignKey: 'keyId',
      as: 'signingKey'
    });
  };

  return Signature;
};
