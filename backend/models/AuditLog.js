module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true
    },
    eventData: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'JSON string of event data'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      index: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      index: true
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resourceType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resourceId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    action: {
      type: DataTypes.STRING,
      allowNull: true
    },
    outcome: {
      type: DataTypes.ENUM('SUCCESS', 'FAILURE', 'PARTIAL'),
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'AuditLogs',
    timestamps: true,
    indexes: [
      {
        fields: ['eventType', 'timestamp']
      },
      {
        fields: ['userId', 'timestamp']
      },
      {
        fields: ['timestamp']
      }
    ]
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AuditLog;
}; 