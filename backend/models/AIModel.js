const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AIModel = sequelize.define('AIModel', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    modelId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique identifier for the AI model'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Human-readable name of the AI model'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Detailed description of the AI model'
    },
    type: {
      type: DataTypes.ENUM('transformer', 'cnn', 'rnn', 'gan', 'other'),
      allowNull: false,
      comment: 'Type of AI model architecture'
    },
    architecture: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Specific architecture variant (e.g., resnet-50, bert-base)'
    },
    parameters: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Number of parameters in the model (e.g., 175B, 110M)'
    },
    framework: {
      type: DataTypes.ENUM('PyTorch', 'TensorFlow', 'JAX', 'Other'),
      allowNull: false,
      comment: 'Primary framework used for the model'
    },
    privacyTechnique: {
      type: DataTypes.ENUM(
        'federated-learning',
        'differential-privacy',
        'homomorphic-encryption',
        'secure-multi-party-computation',
        'zero-knowledge-proofs',
        'none'
      ),
      allowNull: false,
      comment: 'Privacy-preserving technique used with this model'
    },
    validationMetrics: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Array of validation metrics used for this model'
    },
    maxEpochs: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Maximum number of training epochs'
    },
    batchSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Recommended batch size for training'
    },
    learningRate: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      comment: 'Recommended learning rate for training'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this model is available for use in contracts'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional model-specific metadata'
    },
    // DEPA ID (Decentralized Entity Provider Architecture ID) - immutable identifier
    depaId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'System-generated DEPA ID (AIMODEL-<GUID> or {PREFIX}-AIMODEL-<GUID>)'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'ai_models',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['model_id']
      },
      {
        unique: true,
        fields: ['depa_id'],
        where: {
          depa_id: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['type']
      },
      {
        fields: ['framework']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  AIModel.associate = (models) => {
    // AI models are independent entities with no contract associations
    // AIModel.hasMany(models.Contract, {
    //   foreignKey: 'modelId',
    //   sourceKey: 'modelId',
    //   as: 'contracts'
    // });
  };

  return AIModel;
}; 