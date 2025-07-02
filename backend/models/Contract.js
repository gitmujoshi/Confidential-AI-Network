module.exports = (sequelize, DataTypes) => {
  const Contract = sequelize.define('Contract', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contractId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    blockchainContractId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(
        'PENDING_TDP_APPROVAL',
        'PENDING_CCRP_APPROVAL',
        'ACTIVE',
        'COMPLETED',
        'CANCELLED'
      ),
      defaultValue: 'PENDING_TDP_APPROVAL'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER, // Duration in days
      allowNull: false
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    modelId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tdpSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    ccrpSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    tdpSignedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ccrpSignedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    tdpId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tdcId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    ccrpId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    datasetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'datasets',
        key: 'id'
      }
    }
  }, {
    tableName: 'contracts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['contractId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['tdpId']
      },
      {
        fields: ['tdcId']
      },
      {
        fields: ['ccrpId']
      },
      {
        fields: ['datasetId']
      }
    ]
  });

  Contract.associate = (models) => {
    Contract.belongsTo(models.User, { foreignKey: 'tdpId', as: 'tdp' });
    Contract.belongsTo(models.User, { foreignKey: 'tdcId', as: 'tdc' });
    Contract.belongsTo(models.User, { foreignKey: 'ccrpId', as: 'ccrp' });
    Contract.belongsTo(models.Dataset, { foreignKey: 'datasetId', as: 'dataset' });
  };

  return Contract;
}; 