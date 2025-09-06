const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProvenanceCapture = sequelize.define('ProvenanceCapture', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    captureId: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      field: 'capture_id'
    },
    contractId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'contract_id'
    },
    captureType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'capture_type'
    },
    dataSource: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'data_source'
    },
    nodeId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'node_id'
    },
    merkleProof: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'merkle_proof'
    },
    verificationStatus: {
      type: DataTypes.STRING(50),
      defaultValue: 'PENDING',
      field: 'verification_status'
    },
    capturedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'captured_at'
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at'
    }
  }, {
    tableName: 'provenance_captures',
    underscored: true,
    timestamps: false
  });

  ProvenanceCapture.associate = (models) => {
    ProvenanceCapture.belongsTo(models.Contract, {
      foreignKey: 'contractId',
      targetKey: 'contractId',
      as: 'contract'
    });

    ProvenanceCapture.belongsTo(models.ProvenanceNode, {
      foreignKey: 'nodeId',
      targetKey: 'nodeId',
      as: 'node'
    });

    ProvenanceCapture.hasMany(models.ProvenanceVerification, {
      foreignKey: 'captureId',
      sourceKey: 'captureId',
      as: 'verifications'
    });
  };

  return ProvenanceCapture;
};
