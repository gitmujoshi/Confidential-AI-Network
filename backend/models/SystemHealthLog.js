/**
 * SystemHealthLog Model
 * 
 * This model represents system health monitoring logs for both
 * Ethereum and SCITT CCF systems.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2025-01-08
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SystemHealthLog = sequelize.define('SystemHealthLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    systemName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Name of the system being monitored (ethereum, scittCcf)'
    },
    healthStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      comment: 'Whether the system is healthy (true) or unhealthy (false)'
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Response time in milliseconds for the health check'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if the health check failed'
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metrics and metadata from the health check'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when the health check was performed'
    }
  }, {
    tableName: 'system_health_log',
    timestamps: false,
    indexes: [
      {
        name: 'idx_system_name',
        fields: ['systemName']
      },
      {
        name: 'idx_health_status',
        fields: ['healthStatus']
      },
      {
        name: 'idx_created_at',
        fields: ['createdAt']
      }
    ],
    comment: 'System health monitoring logs for Ethereum and SCITT CCF systems'
  });

  // Class methods
  SystemHealthLog.findBySystem = function(systemName, limit = 100) {
    return this.findAll({
      where: { systemName: systemName },
      order: [['createdAt', 'DESC']],
      limit: limit
    });
  };

  SystemHealthLog.findByHealthStatus = function(healthStatus, limit = 100) {
    return this.findAll({
      where: { healthStatus: healthStatus },
      order: [['createdAt', 'DESC']],
      limit: limit
    });
  };

  SystemHealthLog.findRecentLogs = function(hours = 24) {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.findAll({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.gte]: cutoffTime
        }
      },
      order: [['createdAt', 'DESC']]
    });
  };

  SystemHealthLog.findSystemUptime = async function(systemName, hours = 24) {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const logs = await this.findAll({
      where: {
        systemName: systemName,
        createdAt: {
          [sequelize.Sequelize.Op.gte]: cutoffTime
        }
      },
      attributes: ['healthStatus']
    });

    if (logs.length === 0) {
      return 0;
    }

    const healthyCount = logs.filter(log => log.healthStatus).length;
    return (healthyCount / logs.length) * 100;
  };

  SystemHealthLog.findAverageResponseTime = async function(systemName, hours = 24) {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const result = await this.findOne({
      where: {
        systemName: systemName,
        createdAt: {
          [sequelize.Sequelize.Op.gte]: cutoffTime
        },
        responseTime: {
          [sequelize.Sequelize.Op.not]: null
        }
      },
      attributes: [
        [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('responseTime')), 'avgResponseTime'],
        [sequelize.Sequelize.fn('MIN', sequelize.Sequelize.col('responseTime')), 'minResponseTime'],
        [sequelize.Sequelize.fn('MAX', sequelize.Sequelize.col('responseTime')), 'maxResponseTime']
      ]
    });

    return {
      avgResponseTime: parseFloat(result?.dataValues?.avgResponseTime || 0),
      minResponseTime: parseFloat(result?.dataValues?.minResponseTime || 0),
      maxResponseTime: parseFloat(result?.dataValues?.maxResponseTime || 0)
    };
  };

  SystemHealthLog.findErrorTrends = async function(systemName, hours = 24) {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const logs = await this.findAll({
      where: {
        systemName: systemName,
        createdAt: {
          [sequelize.Sequelize.Op.gte]: cutoffTime
        }
      },
      attributes: [
        'healthStatus',
        'errorMessage',
        'createdAt'
      ],
      order: [['createdAt', 'ASC']]
    });

    // Group by hour and count errors
    const hourlyErrors = {};
    logs.forEach(log => {
      if (!log.healthStatus) {
        const hour = new Date(log.createdAt).toISOString().slice(0, 13) + ':00:00.000Z';
        hourlyErrors[hour] = (hourlyErrors[hour] || 0) + 1;
      }
    });

    return hourlyErrors;
  };

  SystemHealthLog.cleanupOldLogs = async function(daysToKeep = 30) {
    const cutoffTime = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
    const deletedCount = await this.destroy({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.lt]: cutoffTime
        }
      }
    });

    console.log(`Cleaned up ${deletedCount} old health logs older than ${daysToKeep} days`);
    return deletedCount;
  };

  // Instance methods
  SystemHealthLog.prototype.isRecent = function(minutes = 5) {
    const cutoffTime = new Date(Date.now() - (minutes * 60 * 1000));
    return this.createdAt >= cutoffTime;
  };

  SystemHealthLog.prototype.getResponseTimeCategory = function() {
    if (!this.responseTime) return 'unknown';
    
    if (this.responseTime < 100) return 'excellent';
    if (this.responseTime < 500) return 'good';
    if (this.responseTime < 1000) return 'fair';
    if (this.responseTime < 5000) return 'poor';
    return 'very_poor';
  };

  // Hooks
  SystemHealthLog.beforeCreate((log, options) => {
    if (!log.createdAt) {
      log.createdAt = new Date();
    }
  });

  // Virtual fields
  SystemHealthLog.prototype.getStatusText = function() {
    return this.healthStatus ? 'HEALTHY' : 'UNHEALTHY';
  };

  SystemHealthLog.prototype.getResponseTimeText = function() {
    if (!this.responseTime) return 'N/A';
    return `${this.responseTime}ms`;
  };

  return SystemHealthLog;
};
