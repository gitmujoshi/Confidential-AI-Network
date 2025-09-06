/**
 * Training Job Model
 * 
 * Tracks training job execution, status, and results for contracts.
 * Each training job is associated with a contract and tracks the complete
 * training lifecycle from provisioning to completion.
 */

module.exports = (sequelize, DataTypes) => {
  const TrainingJob = sequelize.define('TrainingJob', {
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Unique job identifier
    jobId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique training job identifier'
    },
    
    // Associated contract ID
    contractId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'contracts',
        key: 'contract_id'
      },
      comment: 'Associated contract ID'
    },
    
    // Training job status
    status: {
      type: DataTypes.ENUM(
        'PENDING',      // Job created, waiting to start
        'PROVISIONING', // Environment being provisioned
        'RUNNING',      // Training in progress
        'COMPLETED',    // Training completed successfully
        'FAILED',       // Training failed
        'CANCELLED'     // Training cancelled
      ),
      defaultValue: 'PENDING',
      comment: 'Training job status'
    },
    
    // Cloud provider for this training job
    cloudProvider: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Cloud provider (AWS, GCP, Azure, OCI)'
    },
    
    // Environment specifications from contract
    environmentSpecs: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Environment specifications from contract'
    },
    
    // Training parameters from contract
    trainingParams: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Training parameters from contract'
    },
    
    // Estimated training duration
    estimatedDuration: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Estimated training duration (e.g., "50 hours")'
    },
    
    // Training progress (0-100)
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Training progress percentage (0-100)'
    },
    
    // Training results
    results: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Training results including accuracy, loss, privacy metrics'
    },
    
    // Environment ID (if using external environment service)
    environmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'External environment ID'
    },
    
    // Training logs
    logs: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Training execution logs'
    },
    
    // Error details if training failed
    errorDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error details if training failed'
    },
    
    // User who created the training job
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who created the training job'
    },
    
    // Timestamps
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When training started'
    },
    
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When training completed'
    },
    
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When training was cancelled'
    }
  }, {
    tableName: 'training_jobs',
    timestamps: true,
    underscored: true,
    
    // Database indexes for performance optimization
    indexes: [
      {
        unique: true,
        fields: ['job_id']           // Fast job ID lookups
      },
      {
        fields: ['contract_id']      // Fast contract-based queries
      },
      {
        fields: ['status']          // Fast status-based queries
      },
      {
        fields: ['created_by']       // Fast user-based queries
      },
      {
        fields: ['cloud_provider']   // Fast provider-based queries
      },
      {
        fields: ['started_at']       // Fast time-based queries
      }
    ]
  });

  /**
   * Define associations with other models
   * @param {Object} models - All Sequelize models
   */
  TrainingJob.associate = (models) => {
    // Training job belongs to a contract
    TrainingJob.belongsTo(models.Contract, { 
      foreignKey: 'contractId', 
      targetKey: 'contractId',
      as: 'contract'
    });
    
    // Training job belongs to a user (creator)
    TrainingJob.belongsTo(models.User, { 
      foreignKey: 'createdBy', 
      as: 'creator'
    });
    
    // Training job has one environment
    TrainingJob.hasOne(models.TrainingEnvironment, { 
      foreignKey: 'contractId', 
      sourceKey: 'contractId',
      as: 'environment'
    });
  };

  return TrainingJob;
}; 