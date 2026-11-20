module.exports = (sequelize, DataTypes) => {
  const DepaPersonalOffer = sequelize.define('DepaPersonalOffer', {
    offerId: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    contractId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    providerUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    purpose: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fields: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    personalData: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'open',
    },
    principalId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    artefactPayload: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    publicKey: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    consentedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    releasedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    withdrawnAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'depa_personal_offers',
    timestamps: true,
  });

  return DepaPersonalOffer;
};
