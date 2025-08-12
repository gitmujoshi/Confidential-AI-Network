/**
 * Privacy Operations Log Model
 * Tracks detailed differential privacy operations and their results
 */

module.exports = (sequelize, DataTypes) => {
  const PrivacyOperationsLog = sequelize.define('PrivacyOperationsLog', {
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
    operationType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of privacy operation performed'
    },
    epsilon: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      comment: 'Epsilon value used in the operation'
    },
    delta: {
      type: DataTypes.DECIMAL(20, 15),
      allowNull: false,
      comment: 'Delta value used in the operation'
    },
    mechanism: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Differential privacy mechanism used'
    },
    sensitivity: {
      type: DataTypes.DECIMAL(15, 6),
      allowNull: false,
      comment: 'Calculated sensitivity for the operation'
    },
    dataSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Size of the data processed'
    },
    queryType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Type of query that triggered the operation'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
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
    result: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Operation result and metadata'
    },
    executionTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Execution time in milliseconds'
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the operation was successful'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if operation failed'
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
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Session ID for the request'
    }
  }, {
    tableName: 'PrivacyOperationsLogs',
    timestamps: true,
    indexes: [
      {
        fields: ['contractId']
      },
      {
        fields: ['operationType']
      },
      {
        fields: ['mechanism']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['success']
      },
      {
        fields: ['queryType']
      }
    ]
  });

  PrivacyOperationsLog.associate = (models) => {
    PrivacyOperationsLog.belongsTo(models.Contract, {
      foreignKey: 'contractId',
      as: 'contract'
    });
    
    PrivacyOperationsLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    PrivacyOperationsLog.belongsTo(models.PrivacyBudget, {
      foreignKey: 'contractId',
      as: 'privacyBudget'
    });
  };

  // Instance methods
  PrivacyOperationsLog.prototype.getPrivacyMetrics = function() {
    return {
      epsilon: parseFloat(this.epsilon),
      delta: parseFloat(this.delta),
      mechanism: this.mechanism,
      sensitivity: parseFloat(this.sensitivity)
    };
  };

  PrivacyOperationsLog.prototype.getPerformanceMetrics = function() {
    return {
      executionTime: this.executionTime,
      dataSize: this.dataSize,
      success: this.success
    };
  };

  PrivacyOperationsLog.prototype.getFormattedTimestamp = function() {
    return this.timestamp.toISOString();
  };

  // Class methods
  PrivacyOperationsLog.getByContractId = function(contractId, options = {}) {
    const { limit = 50, offset = 0, order = [['timestamp', 'DESC']] } = options;
    
    return this.findAndCountAll({
      where: { contractId },
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  };

  PrivacyOperationsLog.getByOperationType = function(operationType, options = {}) {
    const { limit = 50, offset = 0, order = [['timestamp', 'DESC']] } = options;
    
    return this.findAndCountAll({
      where: { operationType },
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  };

  PrivacyOperationsLog.getByMechanism = function(mechanism, options = {}) {
    const { limit = 50, offset = 0, order = [['timestamp', 'DESC']] } = options;
    
    return this.findAndCountAll({
      where: { mechanism },
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  };

  PrivacyOperationsLog.getByDateRange = function(startDate, endDate, options = {}) {
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

  PrivacyOperationsLog.getSuccessRate = function(contractId) {
    return this.findAll({
      where: { contractId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOperations'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN success = true THEN 1 END')), 'successfulOperations'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN success = false THEN 1 END')), 'failedOperations']
      ]
    });
  };

  PrivacyOperationsLog.getMechanismPerformance = function(contractId) {
    return this.findAll({
      where: { contractId },
      attributes: [
        'mechanism',
        [sequelize.fn('COUNT', sequelize.col('id')), 'operationCount'],
        [sequelize.fn('AVG', sequelize.col('executionTime')), 'avgExecutionTime'],
        [sequelize.fn('AVG', sequelize.col('epsilon')), 'avgEpsilon'],
        [sequelize.fn('AVG', sequelize.col('delta')), 'avgDelta'],
        [sequelize.fn('AVG', sequelize.col('sensitivity')), 'avgSensitivity']
      ],
      group: ['mechanism']
    });
  };

  PrivacyOperationsLog.getQueryTypeAnalysis = function(contractId) {
    return this.findAll({
      where: { contractId },
      attributes: [
        'queryType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'queryCount'],
        [sequelize.fn('AVG', sequelize.col('epsilon')), 'avgEpsilon'],
        [sequelize.fn('AVG', sequelize.col('delta')), 'avgDelta'],
        [sequelize.fn('AVG', sequelize.col('sensitivity')), 'avgSensitivity'],
        [sequelize.fn('AVG', sequelize.col('executionTime')), 'avgExecutionTime']
      ],
      group: ['queryType']
    });
  };

  PrivacyOperationsLog.getPrivacyBudgetConsumption = function(contractId, startDate, endDate) {
    return this.findAll({
      where: {
        contractId,
        timestamp: {
          [sequelize.Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
        [sequelize.fn('SUM', sequelize.col('epsilon')), 'totalEpsilon'],
        [sequelize.fn('SUM', sequelize.col('delta')), 'totalDelta'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'operationCount']
      ],
      group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'ASC']]
    });
  };

  return PrivacyOperationsLog;
}; 