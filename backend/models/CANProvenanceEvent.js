module.exports = (sequelize, Sequelize) => {
  const CANProvenanceEvent = sequelize.define('CANProvenanceEvent', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    stream: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'CAN_JCS'
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
    prevHash: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    hash: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    }
  }, {
    tableName: 'can_provenance_events',
    timestamps: false,
    indexes: [
      { fields: ['jobId', 'seq'], unique: true },
      { fields: ['jobId', 'createdAt'] }
    ]
  });

  return CANProvenanceEvent;
};

