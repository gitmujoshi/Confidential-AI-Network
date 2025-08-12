/**
 * Privacy Budget Log Model
 * Tracks individual privacy budget consumption events for auditing
 */

module.exports = (sequelize, DataTypes) => {
  const PrivacyBudgetLog = sequelize.define('PrivacyBudgetLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    contractId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Contracts',
        key: 'contractId'
      },
      comment: 'Reference to the contract'
    },
    epsilonConsumed: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      comment: 'Amount of epsilon consumed in this operation'
    },
    deltaConsumed: {
      type: DataTypes.DECIMAL(20, 15),
      allowNull: false,
      comment: 'Amount of delta consumed in this operation'
    },
    operation: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of operation that consumed the budget'
    },
    operationId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Unique identifier for the operation'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'User who initiated the operation'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional operation metadata'
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'IP address of the request'
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User agent of the request'
    }
  }, {
    tableName: 'PrivacyBudgetLogs',
    timestamps: true,
    indexes: [
      {
        fields: ['contractId']
      },
      {
        fields: ['operation']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['operationId']
      }
    ]
  });

  PrivacyBudgetLog.associate = (models) => {
    PrivacyBudgetLog.belongsTo(models.Contract, {
      foreignKey: 'contractId',
      as: 'contract'
    });
    
    PrivacyBudgetLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    PrivacyBudgetLog.belongsTo(models.PrivacyBudget, {
      foreignKey: 'contractId',
      as: 'privacyBudget'
    });
  };

  // Instance methods
  PrivacyBudgetLog.prototype.getTotalConsumption = function() {
    return {
      epsilon: parseFloat(this.epsilonConsumed),
      delta: parseFloat(this.deltaConsumed)
    };
  };

  PrivacyBudgetLog.prototype.getFormattedTimestamp = function() {
    return this.timestamp.toISOString();
  };

  // Class methods
  PrivacyBudgetLog.getByContractId = function(contractId, options = {}) {
    const { limit = 50, offset = 0, order = [['timestamp', 'DESC']] } = options;
    
    return this.findAndCountAll({
      where: { contractId },
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  };

  PrivacyBudgetLog.getByOperation = function(operation, options = {}) {
    const { limit = 50, offset = 0, order = [['timestamp', 'DESC']] } = options;
    
    return this.findAndCountAll({
      where: { operation },
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  };

  PrivacyBudgetLog.getByDateRange = function(startDate, endDate, options = {}) {
    const { limit = 50, offset = 0, order = [['timestamp', 'DESC']] } = options;
    
    return this.findAndCountAll({
      where: {
        timestamp: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  };

  PrivacyBudgetLog.getTotalConsumptionByContract = function(contractId) {
    return this.sum('epsilonConsumed', {
      where: { contractId },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('epsilonConsumed')), 'totalEpsilon'],
        [sequelize.fn('SUM', sequelize.col('deltaConsumed')), 'totalDelta']
      ]
    });
  };

  PrivacyBudgetLog.getConsumptionSummary = function(contractId) {
    return this.findAll({
      where: { contractId },
      attributes: [
        'operation',
        [sequelize.fn('COUNT', sequelize.col('id')), 'operationCount'],
        [sequelize.fn('SUM', sequelize.col('epsilonConsumed')), 'totalEpsilon'],
        [sequelize.fn('SUM', sequelize.col('deltaConsumed')), 'totalDelta'],
        [sequelize.fn('AVG', sequelize.col('epsilonConsumed')), 'avgEpsilon'],
        [sequelize.fn('AVG', sequelize.col('deltaConsumed')), 'avgDelta']
      ],
      group: ['operation']
    });
  };

  return PrivacyBudgetLog;
}; 