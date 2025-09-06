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
      }
    ]
  });

  Dataset.associate = (models) => {
    Dataset.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
    Dataset.hasMany(models.Contract, { foreignKey: 'datasetId', as: 'contracts' });
  };

  return Dataset;
}; 