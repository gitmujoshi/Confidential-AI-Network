module.exports = (sequelize, Sequelize) => {
  const CANJcsAttestation = sequelize.define('CANJcsAttestation', {
    ccrSessionId: {
      type: Sequelize.UUID,
      primaryKey: true
    },
    jobId: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true
    },
    reportFormat: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'SIMULATED'
    },
    attestationReport: {
      type: Sequelize.BLOB,
      allowNull: false
    },
    tlsPublicKey: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    enclaveMeasurements: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    keyDeliveryEndpoint: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    platformSignature: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    generatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    expiresAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  }, {
    tableName: 'can_jcs_attestations',
    timestamps: false
  });

  return CANJcsAttestation;
};

