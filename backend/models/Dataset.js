module.exports = (sequelize, DataTypes) => {
  const Dataset = sequelize.define('Dataset', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    datasetId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('Computer Vision', 'Natural Language Processing', 'Audio', 'Tabular', 'Multimodal'),
      allowNull: false
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Domain or industry category (e.g., Healthcare, Finance, Retail)'
    },
    size: {
      type: DataTypes.INTEGER, // Size in MB
      allowNull: false
    },
    recordCount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    license: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    confidentialComputingRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indicates if this dataset requires confidential computing for processing'
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    depaId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    // Security and encryption fields
    encryption_key_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Reference to encryption key for this dataset'
    },
    attestation_policy: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Attestation requirements for accessing this dataset'
    },
    access_control_policy: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Fine-grained access control policy for this dataset'
    },
    data_classification: {
      type: DataTypes.ENUM('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'TOP_SECRET'),
      allowNull: false,
      defaultValue: 'INTERNAL',
      comment: 'Data sensitivity classification level'
    },
    retention_policy: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Data retention and deletion policy'
    },
    audit_configuration: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Audit logging configuration for this dataset'
    },
    data_residency_region: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Geographic region where data is stored'
    },
    processing_location: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Allowed geographic regions for data processing'
    },
    cross_border_transfer_allowed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether cross-border data transfer is allowed'
    },
    encryption_algorithm: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Encryption algorithm used for this dataset'
    },
    key_rotation_schedule: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Key rotation policy and schedule'
    },
    encryption_at_rest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether data is encrypted at rest'
    },
    encryption_in_transit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether data is encrypted in transit'
    },
    secure_enclave_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this dataset requires secure enclave processing'
    },
    attestation_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether attestation is required for accessing this dataset'
    },
    storageBackend: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'none',
      comment: 'none | local (Phase A); future cloud backends'
    },
    artifactFileCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'artifact_file_count'
    },
    artifactTotalBytes: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: 'artifact_total_bytes'
    },
    contentFormat: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'content_format',
      comment: 'csv | parquet | image_folder — trainer hint'
    },
    artifactsUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'artifacts_updated_at'
    }
  }, {
    tableName: 'datasets',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['dataset_id']
      },
      {
        fields: ['category']
      },
      {
        fields: ['owner_id']
      },
      {
        fields: ['is_public']
      },
      {
        fields: ['confidential_computing_required']
      },
      {
        fields: ['data_classification']
      },
      {
        fields: ['secure_enclave_required']
      },
      {
        fields: ['attestation_required']
      },
      {
        fields: ['data_residency_region']
      }
    ]
  });

  Dataset.associate = (models) => {
    Dataset.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
    Dataset.hasMany(models.Contract, { foreignKey: 'datasetId', as: 'contracts' });
  };

  return Dataset;
}; 