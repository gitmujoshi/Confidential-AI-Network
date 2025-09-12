/**
 * Training Progress Model
 * 
 * Tracks real-time progress of AI model training jobs including
 * metrics, performance data, and compliance status.
 */

module.exports = (sequelize, DataTypes) => {
  const TrainingProgress = sequelize.define('TrainingProgress', {
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Associated job ID
    jobId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Associated training job ID'
    },
    
    // Progress percentage
    progressPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      comment: 'Training progress percentage (0-100)'
    },
    
    // Current epoch
    currentEpoch: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Current training epoch'
    },
    
    // Total epochs
    totalEpochs: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of training epochs'
    },
    
    // Current loss
    currentLoss: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
      comment: 'Current training loss'
    },
    
    // Validation accuracy
    validationAccuracy: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      comment: 'Current validation accuracy'
    },
    
    // Training accuracy
    trainingAccuracy: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      comment: 'Current training accuracy'
    },
    
    // Performance metrics
    performanceMetrics: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'System performance metrics (CPU, memory, etc.)'
    },
    
    // Compliance status
    complianceStatus: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Current compliance status'
    },
    
    // Alerts and warnings
    alerts: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Active alerts and warnings'
    },
    
    // Additional metrics
    additionalMetrics: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional training metrics'
    },
    
    // Timestamp
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Progress update timestamp'
    }
  }, {
    tableName: 'training_progress',
    timestamps: false, // We use custom timestamp field
    indexes: [
      {
        fields: ['jobId']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['jobId', 'timestamp']
      }
    ],
    comment: 'Training progress tracking'
  });

  // Define associations
  TrainingProgress.associate = (models) => {
    // Training progress belongs to a training job (string reference)
    // Note: This is a string reference, not a foreign key
    // The actual relationship is handled in the service layer
  };

  return TrainingProgress;
};
