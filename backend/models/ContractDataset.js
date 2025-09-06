'use strict';

module.exports = (sequelize, DataTypes) => {
  const ContractDataset = sequelize.define('ContractDataset', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contractId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'contract_id',
      references: {
        model: 'contracts',
        key: 'contract_id'
      }
    },
    datasetId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'dataset_id',
      references: {
        model: 'datasets',
        key: 'dataset_id'
      }
    },
    tdpId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'tdp_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    individualPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'individual_price',
      comment: 'Individual price for this dataset in this contract'
    },
    paymentStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'PENDING',
      field: 'payment_status',
      comment: 'Payment status for this dataset: PENDING, PAID, FAILED'
    }
  }, {
    tableName: 'contract_datasets',
    timestamps: true,
    underscored: true,
    
    // Database indexes for performance optimization
    indexes: [
      {
        unique: true,
        fields: ['contractId', 'datasetId'],
        name: 'unique_contract_dataset'
      },
      {
        fields: ['contractId']
      },
      {
        fields: ['datasetId']
      },
      {
        fields: ['tdpId']
      },
      {
        fields: ['paymentStatus']
      }
    ]
  });

  /**
   * Define associations with other models
   * @param {Object} models - All Sequelize models
   */
  ContractDataset.associate = (models) => {
    // ContractDataset belongs to Contract
    ContractDataset.belongsTo(models.Contract, { 
      foreignKey: 'contractId', 
      as: 'contract' 
    });
    
    // ContractDataset belongs to Dataset
    ContractDataset.belongsTo(models.Dataset, { 
      foreignKey: 'datasetId', 
      as: 'dataset' 
    });
    
    // ContractDataset belongs to TDP User
    ContractDataset.belongsTo(models.User, { 
      foreignKey: 'tdpId', 
      as: 'tdp' 
    });
  };

  return ContractDataset;
};
