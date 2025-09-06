const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProvenanceVerification = sequelize.define('ProvenanceVerification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    verificationId: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      field: 'verification_id'
    },
    captureId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'capture_id'
    },
    verificationMethod: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'verification_method'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    verifiedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'verified_at'
    }
  }, {
    tableName: 'provenance_verifications',
    underscored: true,
    timestamps: false
  });

  ProvenanceVerification.associate = (models) => {
    ProvenanceVerification.belongsTo(models.ProvenanceCapture, {
      foreignKey: 'captureId',
      targetKey: 'captureId',
      as: 'capture'
    });
  };

  return ProvenanceVerification;
};
