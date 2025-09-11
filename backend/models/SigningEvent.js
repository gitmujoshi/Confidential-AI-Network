const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SigningEvent = sequelize.define('SigningEvent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      comment: 'Reference to the user who performed the action'
    },
    eventType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'event_type',
      comment: 'Type of signing event (key_generated, key_revoked, contract_signed, etc.)'
    },
    eventData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'event_data',
      comment: 'Additional event data and context'
    },
    contractId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'contract_id',
      comment: 'Reference to contract if event is contract-related'
    },
    keyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'key_id',
      comment: 'Reference to signing key if event is key-related'
    },
    signatureId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'signature_id',
      comment: 'Reference to signature if event is signature-related'
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
      field: 'ip_address',
      comment: 'IP address of the user when event occurred'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
      comment: 'User agent string when event occurred'
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'pending'),
      allowNull: false,
      defaultValue: 'success',
      comment: 'Status of the event'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
      comment: 'Error message if event failed'
    }
  }, {
    tableName: 'signing_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['event_type']
      },
      {
        fields: ['contract_id']
      },
      {
        fields: ['key_id']
      },
      {
        fields: ['signature_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['status']
      }
    ]
  });

  SigningEvent.associate = (models) => {
    // SigningEvent belongs to User
    SigningEvent.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // SigningEvent belongs to Contract (optional)
    SigningEvent.belongsTo(models.Contract, {
      foreignKey: 'contractId',
      as: 'contract'
    });

    // SigningEvent belongs to UserKey (optional)
    SigningEvent.belongsTo(models.UserKey, {
      foreignKey: 'keyId',
      as: 'key'
    });

    // SigningEvent belongs to Signature (optional)
    SigningEvent.belongsTo(models.Signature, {
      foreignKey: 'signatureId',
      as: 'signature'
    });
  };

  return SigningEvent;
};
