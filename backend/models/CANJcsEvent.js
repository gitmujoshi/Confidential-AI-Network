module.exports = (sequelize, Sequelize) => {
  const CANJcsEvent = sequelize.define('CANJcsEvent', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    jobId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    seq: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    eventType: {
      type: Sequelize.STRING,
      allowNull: false
    },
    payload: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }, {
    tableName: 'can_jcs_events',
    timestamps: false,
    indexes: [
      { fields: ['jobId', 'seq'], unique: true },
      { fields: ['jobId', 'createdAt'] }
    ]
  });

  return CANJcsEvent;
};

