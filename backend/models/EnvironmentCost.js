const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EnvironmentCost = sequelize.define('EnvironmentCost', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    environmentId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'training_environments',
        key: 'environmentId'
      }
    },
    resourceId: {
      type: DataTypes.STRING,
      comment: 'Associated resource ID if cost is resource-specific'
    },
    costType: {
      type: DataTypes.ENUM(
        'COMPUTE',
        'STORAGE',
        'NETWORK',
        'DATABASE',
        'SECURITY',
        'MONITORING',
        'LICENSING',
        'SUPPORT',
        'OTHER'
      ),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'USD'
    },
    billingPeriod: {
      type: DataTypes.ENUM('HOURLY', 'DAILY', 'MONTHLY', 'ONE_TIME'),
      defaultValue: 'MONTHLY'
    },
    billingDate: {
      type: DataTypes.DATE,
      comment: 'Date for which this cost is billed'
    },
    description: {
      type: DataTypes.TEXT,
      comment: 'Detailed description of the cost'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'environment_costs',
    timestamps: false,
    indexes: [
      {
        fields: ['environmentId']
      },
      {
        fields: ['costType']
      },
      {
        fields: ['billingDate']
      },
      {
        fields: ['resourceId']
      }
    ]
  });

  EnvironmentCost.associate = (models) => {
    EnvironmentCost.belongsTo(models.TrainingEnvironment, {
      foreignKey: 'environmentId',
      targetKey: 'environmentId',
      as: 'environment'
    });
  };

  return EnvironmentCost;
}; 