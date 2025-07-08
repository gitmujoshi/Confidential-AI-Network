module.exports = (sequelize, DataTypes) => {
  const Grievance = sequelize.define('Grievance', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    grievanceType: {
      type: DataTypes.ENUM('CONSENT_ISSUE', 'DATA_ACCESS', 'DATA_CORRECTION', 'DATA_ERASURE', 'DATA_PORTABILITY', 'BREACH_REPORT', 'OTHER'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('SUBMITTED', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED', 'CLOSED'),
      allowNull: false,
      defaultValue: 'SUBMITTED'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resolutionDetails: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      allowNull: false,
      defaultValue: 'MEDIUM'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'Grievances',
    timestamps: true
  });

  Grievance.associate = (models) => {
    Grievance.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Grievance.belongsTo(models.User, { foreignKey: 'assignedTo', as: 'assignedUser' });
  };

  return Grievance;
}; 