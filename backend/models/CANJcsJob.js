module.exports = (sequelize, Sequelize) => {
  const CANJcsJob = sequelize.define('CANJcsJob', {
    jobId: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    contractId: {
      type: Sequelize.STRING,
      allowNull: false
    },
    ccrSessionId: {
      type: Sequelize.UUID,
      allowNull: true
    },
    escrowState: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'OPEN'
    },
    dekReceivedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    mekReceivedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    escrowDeadline: {
      type: Sequelize.DATE,
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    },
    resolvedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    ccrProvider: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'local'
    },
    trainingJobId: {
      type: Sequelize.STRING,
      allowNull: true
    }
  }, {
    tableName: 'can_jcs_jobs',
    timestamps: false
  });

  CANJcsJob.associate = (db) => {
    CANJcsJob.hasMany(db.CANJcsEvent, { foreignKey: 'jobId', sourceKey: 'jobId', as: 'events' });
    CANJcsJob.hasOne(db.CANJcsAttestation, { foreignKey: 'jobId', sourceKey: 'jobId', as: 'attestation' });
  };

  return CANJcsJob;
};

