module.exports = (sequelize, Sequelize) => {
  const CANCcrSession = sequelize.define('CANCcrSession', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    contractId: {
      type: Sequelize.STRING,
      allowNull: false
    },
    state: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'REQUESTED'
    },
    ccrNodeId: {
      type: Sequelize.STRING,
      allowNull: true
    },
    tdImageHash: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    attestationRef: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    dekReceived: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    mekReceived: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    startedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    completedAt: {
      type: Sequelize.DATE,
      allowNull: true
    },
    destroyedAt: {
      type: Sequelize.DATE,
      allowNull: true
    }
  }, {
    tableName: 'can_ccr_sessions',
    timestamps: false
  });

  return CANCcrSession;
};

