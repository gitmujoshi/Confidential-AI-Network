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
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Infrastructure configuration (compute, storage, network)'
    },
    
    // Security configuration
    securityConfig: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Security configuration (encryption, access control, monitoring)'
    },
    
    // Monitoring configuration
    monitoringConfig: {
      type: DataTypes.JSONB,
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
      type: DataTypes.JSONB,
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
    
    // Provisioning method
    provisioningMethod: {
      type: DataTypes.ENUM('SDK', 'TERRAFORM'),
      defaultValue: 'SDK',
      comment: 'Infrastructure provisioning method'
    },
    
    // Terraform state (for Terraform-provisioned environments)
    terraformState: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Terraform state and outputs for Infrastructure as Code'
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
    underscored: true,
    
    // Database indexes for performance optimization
    indexes: [
      {
        unique: true,
        fields: ['environment_id']   // Fast environment ID lookups
      },
      {
        fields: ['contract_id']      // Fast contract-based queries
      },
      {
        fields: ['status']          // Fast status-based queries
      },
      {
        fields: ['cloud_provider']   // Fast provider-based queries
      },
      {
        fields: ['created_by']       // Fast user-based queries
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