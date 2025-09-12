/**
 * Training Job Model
 * 
 * Tracks AI model training jobs including status, progress, and metadata
 * for the complete training workflow.
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
      comment: 'Associated contract ID'
    },
    
    // Job status
    status: {
      type: DataTypes.ENUM(
        'PENDING',      // Job created, waiting to start
        'PROVISIONING', // TEE environment being provisioned
        'RUNNING',      // Training in progress
        'COMPLETED',    // Training completed successfully
        'FAILED',       // Training failed
        'CANCELLED',    // Training cancelled
        'STALLED'       // Training appears to be stalled
      ),
      defaultValue: 'PENDING',
      comment: 'Current job status'
    },
    
    // Priority level
    priority: {
      type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL'),
      defaultValue: 'NORMAL',
      comment: 'Job priority level'
    },
    
    // Retry configuration
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of retry attempts'
    },
    
    maxRetries: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      comment: 'Maximum number of retry attempts'
    },
    
    // Environment details
    environmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'TEE environment ID'
    },
    
    containerId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Training container ID'
    },
    
    // Provenance tracking
    provenanceSessionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Provenance tracking session ID'
    },
    
    // Training configuration
    trainingConfig: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Training parameters and configuration'
    },
    
    // Environment configuration
    environmentConfig: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'TEE environment configuration'
    },
    
    // Datasets used for training
    datasets: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'List of datasets used for training'
    },
    
    // AI models used for training
    aiModels: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'List of AI models used for training'
    },
    
    // Parties involved in training
    parties: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'List of parties involved in training'
    },
    
    // Job metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional job metadata'
    },
    
    // Error information
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if job failed'
    },
    
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for job cancellation'
    },
    
    // Timestamps
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Job creation timestamp'
    },
    
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Job start timestamp'
    },
    
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Job completion timestamp'
    },
    
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Job failure timestamp'
    },
    
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Job cancellation timestamp'
    },
    
    // Created by
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User who created the job'
    }
  }, {
    tableName: 'training_jobs',
    timestamps: true,
    indexes: [
      {
        fields: ['jobId']
      },
      {
        fields: ['contractId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['environmentId']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['status', 'createdAt']
      }
    ],
    comment: 'AI model training jobs tracking'
  });

  // Define associations
  TrainingJob.associate = (models) => {
    // Training job belongs to a contract (string reference)
    // Note: This is a string reference, not a foreign key
    // The actual relationship is handled in the service layer
  };

  return TrainingJob;
};