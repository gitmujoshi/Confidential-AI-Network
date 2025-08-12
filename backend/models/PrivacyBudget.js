/**
 * Privacy Budget Model
 * Tracks differential privacy budget consumption for contracts
 */

module.exports = (sequelize, DataTypes) => {
  const PrivacyBudget = sequelize.define('PrivacyBudget', {
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
    initialEpsilon: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 1.0,
      comment: 'Initial epsilon budget allocated to the contract'
    },
    initialDelta: {
      type: DataTypes.DECIMAL(20, 15),
      allowNull: false,
      defaultValue: 1e-5,
      comment: 'Initial delta budget allocated to the contract'
    },
    remainingEpsilon: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      comment: 'Remaining epsilon budget'
    },
    remainingDelta: {
      type: DataTypes.DECIMAL(20, 15),
      allowNull: false,
      comment: 'Remaining delta budget'
    },
    totalEpsilonConsumed: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total epsilon consumed so far'
    },
    totalDeltaConsumed: {
      type: DataTypes.DECIMAL(20, 15),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total delta consumed so far'
    },
    budgetStatus: {
      type: DataTypes.ENUM('ACTIVE', 'WARNING', 'EXHAUSTED', 'RESET'),
      allowNull: false,
      defaultValue: 'ACTIVE',
      comment: 'Current status of the privacy budget'
    },
    lastResetAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the budget was last reset'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'PrivacyBudgets',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['contractId']
      },
      {
        fields: ['budgetStatus']
      },
      {
        fields: ['createdAt']
      }
    ],
    hooks: {
      beforeUpdate: (instance) => {
        instance.lastUpdated = new Date();
        
        // Update budget status based on remaining budget
        if (instance.remainingEpsilon <= 0 || instance.remainingDelta <= 0) {
          instance.budgetStatus = 'EXHAUSTED';
        } else if (instance.remainingEpsilon < instance.initialEpsilon * 0.1 || 
                   instance.remainingDelta < instance.initialDelta * 0.1) {
          instance.budgetStatus = 'WARNING';
        } else {
          instance.budgetStatus = 'ACTIVE';
        }
      }
    }
  });

  PrivacyBudget.associate = (models) => {
    PrivacyBudget.belongsTo(models.Contract, {
      foreignKey: 'contractId',
      as: 'contract'
    });
    
    PrivacyBudget.hasMany(models.PrivacyBudgetLog, {
      foreignKey: 'contractId',
      as: 'budgetLogs'
    });
  };

  // Instance methods
  PrivacyBudget.prototype.getBudgetUtilization = function() {
    const epsilonUtilization = (this.totalEpsilonConsumed / this.initialEpsilon) * 100;
    const deltaUtilization = (this.totalDeltaConsumed / this.initialDelta) * 100;
    
    return {
      epsilon: {
        consumed: this.totalEpsilonConsumed,
        remaining: this.remainingEpsilon,
        utilization: epsilonUtilization
      },
      delta: {
        consumed: this.totalDeltaConsumed,
        remaining: this.remainingDelta,
        utilization: deltaUtilization
      }
    };
  };

  PrivacyBudget.prototype.canConsume = function(epsilon, delta) {
    return this.remainingEpsilon >= epsilon && this.remainingDelta >= delta;
  };

  PrivacyBudget.prototype.resetBudget = function() {
    this.remainingEpsilon = this.initialEpsilon;
    this.remainingDelta = this.initialDelta;
    this.totalEpsilonConsumed = 0;
    this.totalDeltaConsumed = 0;
    this.budgetStatus = 'ACTIVE';
    this.lastResetAt = new Date();
  };

  // Class methods
  PrivacyBudget.findByContractId = function(contractId) {
    return this.findOne({ where: { contractId } });
  };

  PrivacyBudget.getExhaustedBudgets = function() {
    return this.findAll({ where: { budgetStatus: 'EXHAUSTED' } });
  };

  PrivacyBudget.getWarningBudgets = function() {
    return this.findAll({ where: { budgetStatus: 'WARNING' } });
  };

  return PrivacyBudget;
}; 