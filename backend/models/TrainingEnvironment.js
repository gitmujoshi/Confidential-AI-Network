/**
 * Training Environment Model
 * 
 * Tracks training environment provisioning, configuration, and lifecycle
 * for contracts. Each environment is associated with a contract and
 * manages the infrastructure resources needed for training.
 */

module.exports = (sequelize, DataTypes) => {
  const TrainingEnvironment = sequelize.define('TrainingEnvironment', {
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Unique environment identifier
    environmentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique training environment identifier'
    },
    
    // Associated contract ID
    contractId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Associated contract ID'
    },
    
    // Environment status
    status: {
      type: DataTypes.ENUM(
        'PENDING',      // Environment creation requested
        'PROVISIONING', // Infrastructure being provisioned
        'ACTIVE',       // Environment ready for training
        'RUNNING',      // Training in progress
        'COMPLETED',    // Training completed
        'FAILED',       // Environment creation failed
        'DESTROYING',   // Environment being destroyed
        'DESTROYED'     // Environment destroyed
      ),
      defaultValue: 'PENDING',
      comment: 'Environment status'
    },
    
    // Cloud provider
    cloudProvider: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Cloud provider (AWS, GCP, Azure, OCI)'
    },
    
    // Region
    region: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Cloud region'
    },
    
    // Infrastructure configuration
    infrastructureConfig: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Infrastructure configuration (compute, storage, network)'
    },
    
    // Security configuration
    securityConfig: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Security configuration (encryption, access control, monitoring)'
    },
    
    // Monitoring configuration
    monitoringConfig: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Monitoring and logging configuration'
    },
    
    // Environment URL (if applicable)
    environmentUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Environment access URL'
    },
    
    // Provisioning logs
    provisioningLogs: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Infrastructure provisioning logs'
    },
    
    // Cost estimate
    costEstimate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Estimated cost for environment'
    },
    
    // Actual cost
    actualCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Actual cost incurred'
    },
    
    // Error details if provisioning failed
    errorDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error details if environment creation failed'
    },
    
    // User who created the environment
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who created the environment'
    },
    
    // Timestamps
    provisionedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When environment was provisioned'
    },
    
    destroyedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When environment was destroyed'
    }
  }, {
    tableName: 'training_environments',
    timestamps: true,
    
    // Database indexes for performance optimization
    indexes: [
      {
        unique: true,
        fields: ['environmentId']   // Fast environment ID lookups
      },
      {
        fields: ['contractId']      // Fast contract-based queries
      },
      {
        fields: ['status']          // Fast status-based queries
      },
      {
        fields: ['cloudProvider']   // Fast provider-based queries
      },
      {
        fields: ['createdBy']       // Fast user-based queries
      },
      // Removed problematic index - column doesn't exist yet
    ]
  });

  /**
   * Define associations with other models
   * @param {Object} models - All Sequelize models
   */
  TrainingEnvironment.associate = (models) => {
    // Training environment belongs to a contract
    TrainingEnvironment.belongsTo(models.Contract, { 
      foreignKey: 'contractId', 
      targetKey: 'contractId',
      as: 'contract'
    });
    
    // Training environment belongs to a user (creator)
    TrainingEnvironment.belongsTo(models.User, { 
      foreignKey: 'createdBy', 
      as: 'creator'
    });
    
    // Training environment has one training job
    TrainingEnvironment.hasOne(models.TrainingJob, { 
      foreignKey: 'contractId', 
      sourceKey: 'contractId',
      as: 'trainingJob'
    });
  };

  return TrainingEnvironment;
}; 