module.exports = (sequelize, DataTypes) => {
  const DataBreach = sequelize.define('DataBreach', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    breachType: {
      type: DataTypes.ENUM('UNAUTHORIZED_ACCESS', 'DATA_LOSS', 'SYSTEM_BREACH', 'PHISHING', 'MALWARE', 'OTHER'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
      allowNull: false
    },
    affectedUsers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    discoveredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reportedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('DETECTED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'),
      allowNull: false,
      defaultValue: 'DETECTED'
    },
    impactAssessment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mitigationActions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notificationSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    authoritiesNotified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    dpoNotified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'DataBreaches',
    timestamps: true
  });

  return DataBreach;
}; 