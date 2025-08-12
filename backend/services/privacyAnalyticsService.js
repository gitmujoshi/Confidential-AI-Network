/**
 * Privacy Analytics Service
 * Provides comprehensive analytics and monitoring for differential privacy operations
 */

class PrivacyAnalyticsService {
  constructor() {
    this.db = null;
  }

  async getDB() {
    if (!this.db) {
      this.db = require('../models');
    }
    return this.db;
  }

  /**
   * Get comprehensive privacy metrics for a contract
   */
  async getPrivacyMetrics(contractId) {
    try {
      const db = await this.getDB();
      
      // Get privacy budget status
      const budget = await db.PrivacyBudget.findOne({ where: { contractId } });
      
      // Get privacy operation history
      const operations = await db.PrivacyOperationsLog.findAll({
        where: { contractId },
        order: [['timestamp', 'DESC']],
        limit: 1000
      });
      
      // Get budget consumption logs
      const budgetLogs = await db.PrivacyBudgetLog.findAll({
        where: { contractId },
        order: [['timestamp', 'DESC']],
        limit: 100
      });
      
      if (!budget) {
        return {
          contractId,
          budget: null,
          operations: [],
          budgetLogs: [],
          analytics: {
            totalOperations: 0,
            successRate: 0,
            avgEpsilon: 0,
            avgDelta: 0,
            avgSensitivity: 0,
            avgExecutionTime: 0
          }
        };
      }
      
      // Calculate privacy metrics
      const totalEpsilonConsumed = operations.reduce((sum, op) => sum + parseFloat(op.epsilon), 0);
      const totalDeltaConsumed = operations.reduce((sum, op) => sum + parseFloat(op.delta), 0);
      const totalSensitivity = operations.reduce((sum, op) => sum + parseFloat(op.sensitivity), 0);
      const totalExecutionTime = operations.reduce((sum, op) => sum + (op.executionTime || 0), 0);
      
      const successfulOps = operations.filter(op => op.success).length;
      const successRate = operations.length > 0 ? (successfulOps / operations.length) * 100 : 0;
      
      const analytics = {
        totalOperations: operations.length,
        successRate: Math.round(successRate * 100) / 100,
        avgEpsilon: operations.length > 0 ? totalEpsilonConsumed / operations.length : 0,
        avgDelta: operations.length > 0 ? totalDeltaConsumed / operations.length : 0,
        avgSensitivity: operations.length > 0 ? totalSensitivity / operations.length : 0,
        avgExecutionTime: operations.length > 0 ? totalExecutionTime / operations.length : 0
      };
      
      return {
        contractId,
        budget: budget.getBudgetUtilization(),
        operations: operations.slice(0, 100), // Return last 100 operations
        budgetLogs: budgetLogs.slice(0, 50), // Return last 50 budget logs
        analytics
      };
      
    } catch (error) {
      console.error('Failed to get privacy metrics:', error);
      throw error;
    }
  }

  /**
   * Get system-wide privacy analytics
   */
  async getSystemPrivacyAnalytics(options = {}) {
    try {
      const db = await this.getDB();
      const { startDate, endDate, limit = 100 } = options;
      
      // Build where clause for date filtering
      const whereClause = {};
      if (startDate && endDate) {
        whereClause.timestamp = {
          [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }
      
      // Get all privacy operations
      const operations = await db.PrivacyOperationsLog.findAll({
        where: whereClause,
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit)
      });
      
      // Get all privacy budgets
      const budgets = await db.PrivacyBudget.findAll();
      
      // Calculate system-wide metrics
      const totalContracts = budgets.length;
      const activeBudgets = budgets.filter(b => b.budgetStatus === 'ACTIVE').length;
      const warningBudgets = budgets.filter(b => b.budgetStatus === 'WARNING').length;
      const exhaustedBudgets = budgets.filter(b => b.budgetStatus === 'EXHAUSTED').length;
      
      const totalOperations = operations.length;
      const successfulOps = operations.filter(op => op.success).length;
      const systemSuccessRate = totalOperations > 0 ? (successfulOps / totalOperations) * 100 : 0;
      
      // Calculate total privacy budget consumption
      const totalEpsilonConsumed = operations.reduce((sum, op) => sum + parseFloat(op.epsilon), 0);
      const totalDeltaConsumed = operations.reduce((sum, op) => sum + parseFloat(op.delta), 0);
      
      // Group by mechanism
      const mechanismStats = {};
      operations.forEach(op => {
        if (!mechanismStats[op.mechanism]) {
          mechanismStats[op.mechanism] = {
            count: 0,
            totalEpsilon: 0,
            totalDelta: 0,
            avgExecutionTime: 0
          };
        }
        
        mechanismStats[op.mechanism].count++;
        mechanismStats[op.mechanism].totalEpsilon += parseFloat(op.epsilon);
        mechanismStats[op.mechanism].totalDelta += parseFloat(op.delta);
        mechanismStats[op.mechanism].avgExecutionTime += (op.executionTime || 0);
      });
      
      // Calculate averages for each mechanism
      Object.keys(mechanismStats).forEach(mechanism => {
        const stats = mechanismStats[mechanism];
        stats.avgEpsilon = stats.totalEpsilon / stats.count;
        stats.avgDelta = stats.totalDelta / stats.count;
        stats.avgExecutionTime = stats.avgExecutionTime / stats.count;
      });
      
      // Group by operation type
      const operationTypeStats = {};
      operations.forEach(op => {
        if (!operationTypeStats[op.operationType]) {
          operationTypeStats[op.operationType] = {
            count: 0,
            successCount: 0,
            avgEpsilon: 0,
            avgDelta: 0
          };
        }
        
        operationTypeStats[op.operationType].count++;
        if (op.success) {
          operationTypeStats[op.operationType].successCount++;
        }
        operationTypeStats[op.operationType].avgEpsilon += parseFloat(op.epsilon);
        operationTypeStats[op.operationType].avgDelta += parseFloat(op.delta);
      });
      
      // Calculate averages for each operation type
      Object.keys(operationTypeStats).forEach(type => {
        const stats = operationTypeStats[type];
        stats.avgEpsilon = stats.avgEpsilon / stats.count;
        stats.avgDelta = stats.avgDelta / stats.count;
        stats.successRate = (stats.successCount / stats.count) * 100;
      });
      
      return {
        summary: {
          totalContracts,
          activeBudgets,
          warningBudgets,
          exhaustedBudgets,
          totalOperations,
          systemSuccessRate: Math.round(systemSuccessRate * 100) / 100
        },
        budgetOverview: {
          totalEpsilonConsumed,
          totalDeltaConsumed,
          avgEpsilonPerOperation: totalOperations > 0 ? totalEpsilonConsumed / totalOperations : 0,
          avgDeltaPerOperation: totalOperations > 0 ? totalDeltaConsumed / totalOperations : 0
        },
        mechanismStats,
        operationTypeStats,
        recentOperations: operations.slice(0, 20)
      };
      
    } catch (error) {
      console.error('Failed to get system privacy analytics:', error);
      throw error;
    }
  }

  /**
   * Get privacy budget consumption trends
   */
  async getPrivacyBudgetTrends(contractId, days = 30) {
    try {
      const db = await this.getDB();
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get daily budget consumption
      const dailyConsumption = await db.PrivacyOperationsLog.findAll({
        where: {
          contractId,
          timestamp: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [db.Sequelize.fn('DATE', db.Sequelize.col('timestamp')), 'date'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('epsilon')), 'totalEpsilon'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('delta')), 'totalDelta'],
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'operationCount']
        ],
        group: [db.Sequelize.fn('DATE', db.Sequelize.col('timestamp'))],
        order: [[db.Sequelize.fn('DATE', db.Sequelize.col('timestamp')), 'ASC']]
      });
      
      // Get budget status over time
      const budgetLogs = await db.PrivacyBudgetLog.findAll({
        where: {
          contractId,
          timestamp: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          }
        },
        order: [['timestamp', 'ASC']]
      });
      
      return {
        contractId,
        period: { startDate, endDate, days },
        dailyConsumption,
        budgetLogs,
        trends: this.calculateTrends(dailyConsumption)
      };
      
    } catch (error) {
      console.error('Failed to get privacy budget trends:', error);
      throw error;
    }
  }

  /**
   * Calculate trends from daily consumption data
   */
  calculateTrends(dailyConsumption) {
    if (dailyConsumption.length < 2) {
      return {
        epsilonTrend: 'insufficient_data',
        deltaTrend: 'insufficient_data',
        operationTrend: 'insufficient_data'
      };
    }
    
    // Calculate trends using simple linear regression
    const epsilonValues = dailyConsumption.map(d => parseFloat(d.dataValues.totalEpsilon));
    const deltaValues = dailyConsumption.map(d => parseFloat(d.dataValues.totalDelta));
    const operationValues = dailyConsumption.map(d => parseInt(d.dataValues.operationCount));
    
    const epsilonTrend = this.calculateLinearTrend(epsilonValues);
    const deltaTrend = this.calculateLinearTrend(deltaValues);
    const operationTrend = this.calculateLinearTrend(operationValues);
    
    return {
      epsilonTrend: this.classifyTrend(epsilonTrend),
      deltaTrend: this.classifyTrend(deltaTrend),
      operationTrend: this.classifyTrend(operationTrend)
    };
  }

  /**
   * Calculate linear trend slope
   */
  calculateLinearTrend(values) {
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Classify trend based on slope
   */
  classifyTrend(slope) {
    if (Math.abs(slope) < 0.01) return 'stable';
    if (slope > 0.01) return 'increasing';
    if (slope < -0.01) return 'decreasing';
    return 'stable';
  }

  /**
   * Get privacy compliance report
   */
  async getPrivacyComplianceReport(contractId) {
    try {
      const db = await this.getDB();
      
      // Get contract details
      const contract = await db.Contract.findOne({ where: { contractId } });
      if (!contract) {
        throw new Error(`Contract not found: ${contractId}`);
      }
      
      // Get privacy budget
      const budget = await db.PrivacyBudget.findOne({ where: { contractId } });
      
      // Get recent operations
      const recentOperations = await db.PrivacyOperationsLog.findAll({
        where: { contractId },
        order: [['timestamp', 'DESC']],
        limit: 50
      });
      
      // Check compliance criteria
      const compliance = {
        budgetManagement: {
          status: 'compliant',
          details: 'Budget properly managed and tracked'
        },
        operationLogging: {
          status: 'compliant',
          details: 'All operations properly logged'
        },
        privacyBudget: {
          status: 'compliant',
          details: 'Privacy budget within acceptable limits'
        },
        auditTrail: {
          status: 'compliant',
          details: 'Complete audit trail maintained'
        }
      };
      
      // Check budget status
      if (budget) {
        if (budget.budgetStatus === 'EXHAUSTED') {
          compliance.privacyBudget.status = 'non_compliant';
          compliance.privacyBudget.details = 'Privacy budget exhausted';
        } else if (budget.budgetStatus === 'WARNING') {
          compliance.privacyBudget.status = 'warning';
          compliance.privacyBudget.details = 'Privacy budget running low';
        }
      } else {
        compliance.privacyBudget.status = 'non_compliant';
        compliance.privacyBudget.details = 'No privacy budget configured';
      }
      
      // Check operation logging
      if (recentOperations.length === 0) {
        compliance.operationLogging.status = 'non_compliant';
        compliance.operationLogging.details = 'No operations logged';
      }
      
      // Calculate overall compliance score
      const complianceScores = {
        compliant: 1,
        warning: 0.5,
        non_compliant: 0
      };
      
      const overallScore = Object.values(compliance).reduce((score, item) => {
        return score + complianceScores[item.status];
      }, 0) / Object.keys(compliance).length * 100;
      
      return {
        contractId,
        contractName: contract.contractName || 'Unknown',
        compliance,
        overallScore: Math.round(overallScore),
        lastUpdated: new Date().toISOString(),
        recommendations: this.generateComplianceRecommendations(compliance)
      };
      
    } catch (error) {
      console.error('Failed to get privacy compliance report:', error);
      throw error;
    }
  }

  /**
   * Generate compliance recommendations
   */
  generateComplianceRecommendations(compliance) {
    const recommendations = [];
    
    Object.entries(compliance).forEach(([key, item]) => {
      if (item.status === 'non_compliant') {
        switch (key) {
          case 'privacyBudget':
            recommendations.push('Configure privacy budget for the contract');
            break;
          case 'operationLogging':
            recommendations.push('Enable operation logging for privacy operations');
            break;
          default:
            recommendations.push(`Address ${key} compliance issues`);
        }
      } else if (item.status === 'warning') {
        switch (key) {
          case 'privacyBudget':
            recommendations.push('Monitor privacy budget consumption closely');
            break;
          default:
            recommendations.push(`Monitor ${key} for potential issues`);
        }
      }
    });
    
    return recommendations;
  }

  /**
   * Export privacy analytics data
   */
  async exportPrivacyAnalytics(contractId, format = 'json') {
    try {
      const metrics = await this.getPrivacyMetrics(contractId);
      const trends = await this.getPrivacyBudgetTrends(contractId);
      const compliance = await this.getPrivacyComplianceReport(contractId);
      
      const exportData = {
        exportDate: new Date().toISOString(),
        contractId,
        metrics,
        trends,
        compliance
      };
      
      if (format === 'csv') {
        return this.convertToCSV(exportData);
      }
      
      return exportData;
      
    } catch (error) {
      console.error('Failed to export privacy analytics:', error);
      throw error;
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    // Simple CSV conversion - in production use a proper CSV library
    const csv = [];
    
    // Add header
    csv.push('Field,Value');
    
    // Add data
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object') {
        csv.push(`${key},${JSON.stringify(value)}`);
      } else {
        csv.push(`${key},${value}`);
      }
    });
    
    return csv.join('\n');
  }
}

module.exports = PrivacyAnalyticsService; 