const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EnvironmentResource = sequelize.define('EnvironmentResource', {
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
    resourceType: {
      type: DataTypes.ENUM(
        'COMPUTE',
        'STORAGE',
        'NETWORK',
        'DATABASE',
        'SECURITY',
        'MONITORING',
        'CONTAINER',
        'ML_SERVICE'
      ),
      allowNull: false
    },
    resourceId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Cloud provider resource ID'
    },
    resourceName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    resourceConfig: {
      type: DataTypes.JSONB,
      comment: 'Resource-specific configuration'
    },
    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'CREATING',
        'ACTIVE',
        'ERROR',
        'DESTROYING',
        'DESTROYED'
      ),
      defaultValue: 'PENDING'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    destroyedAt: {
      type: DataTypes.DATE,
      comment: 'Timestamp when resource was destroyed'
    }
  }, {
    tableName: 'environment_resources',
    timestamps: true,
    indexes: [
      {
        fields: ['environmentId']
      },
      {
        fields: ['resourceType']
      },
      {
        fields: ['status']
      },
      {
        fields: ['resourceId']
      }
    ]
  });

  EnvironmentResource.associate = (models) => {
    EnvironmentResource.belongsTo(models.TrainingEnvironment, {
      foreignKey: 'environmentId',
      targetKey: 'environmentId',
      as: 'environment'
    });
  };

  return EnvironmentResource;
}; 