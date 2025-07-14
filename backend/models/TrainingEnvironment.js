const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TrainingEnvironment = sequelize.define('TrainingEnvironment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contractId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'contracts',
        key: 'contractId'
      }
    },
    environmentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    cloudProvider: {
      type: DataTypes.ENUM('AWS', 'GCP', 'Azure', 'OCI'),
      allowNull: false
    },
    region: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'PROVISIONING',
        'ACTIVE',
        'PAUSED',
        'ERROR',
        'DESTROYING',
        'DESTROYED'
      ),
      defaultValue: 'PENDING'
    },
    infrastructureConfig: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Infrastructure configuration including compute, storage, networking'
    },
    securityConfig: {
      type: DataTypes.JSONB,
      comment: 'Security configurations including IAM, encryption, VPC settings'
    },
    monitoringConfig: {
      type: DataTypes.JSONB,
      comment: 'Monitoring and logging configurations'
    },
    costEstimate: {
      type: DataTypes.DECIMAL(10, 2),
      comment: 'Estimated monthly cost in USD'
    },
    actualCost: {
      type: DataTypes.DECIMAL(10, 2),
      comment: 'Actual cost incurred'
    },
    provisioningLogs: {
      type: DataTypes.TEXT,
      comment: 'Detailed logs from infrastructure provisioning'
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
      comment: 'Timestamp when environment was destroyed'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'training_environments',
    timestamps: true,
    indexes: [
      {
        fields: ['contractId']
      },
      {
        fields: ['environmentId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['cloudProvider']
      }
    ]
  });

  TrainingEnvironment.associate = (models) => {
    TrainingEnvironment.belongsTo(models.Contract, {
      foreignKey: 'contractId',
      targetKey: 'contractId',
      as: 'contract'
    });
    
    TrainingEnvironment.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    TrainingEnvironment.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updater'
    });
    
    TrainingEnvironment.hasMany(models.EnvironmentResource, {
      foreignKey: 'environmentId',
      sourceKey: 'environmentId',
      as: 'resources'
    });
    
    TrainingEnvironment.hasMany(models.EnvironmentCost, {
      foreignKey: 'environmentId',
      sourceKey: 'environmentId',
      as: 'costs'
    });
  };

  return TrainingEnvironment;
}; 