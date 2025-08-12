/**
 * Differential Privacy API Routes
 * Handles all differential privacy operations
 */

const express = require('express');
const router = express.Router();
const { DifferentialPrivacyService } = require('../services/differentialPrivacyService');
const auth = require('../middleware/auth');

// Initialize DP service
const dpService = new DifferentialPrivacyService();

/**
 * @route POST /api/dp/apply
 * @desc Apply differential privacy to data
 * @access Private
 */
router.post('/apply', auth, async (req, res) => {
  try {
    const { data, query, privacyParams } = req.body;
    
    // Validate required fields
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    if (!query || !query.type) {
      return res.status(400).json({ error: 'Query type is required' });
    }
    if (!privacyParams || !privacyParams.contractId) {
      return res.status(400).json({ error: 'Privacy parameters with contract ID are required' });
    }
    
    // Add user ID to privacy params for logging
    privacyParams.userId = req.user.id;
    privacyParams.ipAddress = req.ip;
    privacyParams.userAgent = req.get('User-Agent');
    
    console.log(`🔐 Applying DP to ${query.type} query for contract ${privacyParams.contractId}`);
    
    const result = await dpService.applyDifferentialPrivacy(data, query, privacyParams);
    
    res.json({
      success: true,
      message: 'Differential privacy applied successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ DP application failed:', error);
    res.status(400).json({ 
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * @route GET /api/dp/budget/:contractId
 * @desc Get privacy budget for a contract
 * @access Private
 */
router.get('/budget/:contractId', auth, async (req, res) => {
  try {
    const { contractId } = req.params;
    
    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }
    
    console.log(`📊 Getting privacy budget for contract ${contractId}`);
    
    const budget = await dpService.getPrivacyBudget(contractId);
    
    if (!budget) {
      return res.status(404).json({ 
        success: false,
        error: 'Privacy budget not found for this contract' 
      });
    }
    
    res.json({
      success: true,
      data: {
        budget,
        utilization: budget.getBudgetUtilization()
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get privacy budget:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route GET /api/dp/history/:contractId
 * @desc Get privacy operation history for a contract
 * @access Private
 */
router.get('/history/:contractId', auth, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { limit = 50, offset = 0, operationType, mechanism, startDate, endDate } = req.query;
    
    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }
    
    console.log(`📋 Getting privacy history for contract ${contractId}`);
    
    const operations = await dpService.getPrivacyHistory(
      contractId, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: operations,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: operations.count
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get privacy history:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route GET /api/dp/analytics/:contractId
 * @desc Get privacy analytics and metrics for a contract
 * @access Private
 */
router.get('/analytics/:contractId', auth, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }
    
    console.log(`📈 Getting privacy analytics for contract ${contractId}`);
    
    // Get privacy budget
    const budget = await dpService.getPrivacyBudget(contractId);
    
    // Get operation history for analytics
    const operations = await dpService.getPrivacyHistory(contractId, 1000, 0);
    
    // Calculate analytics
    const analytics = {
      budget: budget ? budget.getBudgetUtilization() : null,
      operations: {
        total: operations.count,
        byType: {},
        byMechanism: {},
        byDate: {},
        successRate: 0
      },
      performance: {
        avgExecutionTime: 0,
        avgEpsilon: 0,
        avgDelta: 0,
        avgSensitivity: 0
      }
    };
    
    if (operations.rows.length > 0) {
      // Calculate success rate
      const successfulOps = operations.rows.filter(op => op.success).length;
      analytics.operations.successRate = (successfulOps / operations.rows.length) * 100;
      
      // Calculate averages
      const totalExecutionTime = operations.rows.reduce((sum, op) => sum + (op.executionTime || 0), 0);
      const totalEpsilon = operations.rows.reduce((sum, op) => sum + parseFloat(op.epsilon), 0);
      const totalDelta = operations.rows.reduce((sum, op) => sum + parseFloat(op.delta), 0);
      const totalSensitivity = operations.rows.reduce((sum, op) => sum + parseFloat(op.sensitivity), 0);
      
      analytics.performance.avgExecutionTime = totalExecutionTime / operations.rows.length;
      analytics.performance.avgEpsilon = totalEpsilon / operations.rows.length;
      analytics.performance.avgDelta = totalDelta / operations.rows.length;
      analytics.performance.avgSensitivity = totalSensitivity / operations.rows.length;
      
      // Group by operation type
      operations.rows.forEach(op => {
        if (!analytics.operations.byType[op.operationType]) {
          analytics.operations.byType[op.operationType] = 0;
        }
        analytics.operations.byType[op.operationType]++;
        
        if (!analytics.operations.byMechanism[op.mechanism]) {
          analytics.operations.byMechanism[op.mechanism] = 0;
        }
        analytics.operations.byMechanism[op.mechanism]++;
      });
    }
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('❌ Failed to get privacy analytics:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route POST /api/dp/budget/:contractId/reset
 * @desc Reset privacy budget for a contract (admin only)
 * @access Private (Admin)
 */
router.post('/budget/:contractId/reset', auth, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { reason } = req.body;
    
    if (!contractId) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }
    
    // Check if user is admin or contract owner
    if (req.user.role !== 'ADMIN') {
      // Check if user owns the contract
      const db = require('../models');
      const contract = await db.Contract.findOne({
        where: { contractId, userId: req.user.id }
      });
      
      if (!contract) {
        return res.status(403).json({ error: 'Insufficient permissions to reset budget' });
      }
    }
    
    console.log(`🔄 Resetting privacy budget for contract ${contractId}`);
    
    const budget = await dpService.getPrivacyBudget(contractId);
    
    if (!budget) {
      return res.status(404).json({ 
        success: false,
        error: 'Privacy budget not found for this contract' 
      });
    }
    
    // Reset the budget
    budget.resetBudget();
    await budget.save();
    
    // Log the reset operation
    const db = require('../models');
    await db.PrivacyBudgetLog.create({
      contractId,
      epsilonConsumed: 0,
      deltaConsumed: 0,
      operation: 'BUDGET_RESET',
      operationId: `reset_${Date.now()}`,
      userId: req.user.id,
      timestamp: new Date(),
      metadata: { reason: reason || 'Manual reset' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      success: true,
      message: 'Privacy budget reset successfully',
      data: {
        budget: budget.getBudgetUtilization()
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to reset privacy budget:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * @route GET /api/dp/mechanisms
 * @desc Get available differential privacy mechanisms
 * @access Public
 */
router.get('/mechanisms', (req, res) => {
  const mechanisms = [
    {
      name: 'laplace',
      description: 'Laplace mechanism for continuous data',
      bestFor: ['GRADIENT', 'CONTINUOUS_VALUES', 'REAL_NUMBERS'],
      parameters: ['epsilon', 'sensitivity']
    },
    {
      name: 'gaussian',
      description: 'Gaussian mechanism for continuous data with better utility',
      bestFor: ['AVERAGE', 'CONTINUOUS_VALUES', 'REAL_NUMBERS'],
      parameters: ['epsilon', 'delta', 'sensitivity']
    },
    {
      name: 'exponential',
      description: 'Exponential mechanism for discrete selection',
      bestFor: ['DISCRETE_SELECTION', 'CATEGORICAL_DATA'],
      parameters: ['epsilon', 'utility_function']
    },
    {
      name: 'geometric',
      description: 'Geometric mechanism for integer-valued queries',
      bestFor: ['COUNT', 'INTEGER_VALUES', 'DISCRETE_COUNTS'],
      parameters: ['epsilon', 'sensitivity']
    }
  ];
  
  res.json({
    success: true,
    data: mechanisms
  });
});

/**
 * @route GET /api/dp/query-types
 * @desc Get supported query types for differential privacy
 * @access Public
 */
router.get('/query-types', (req, res) => {
  const queryTypes = [
    {
      name: 'COUNT',
      description: 'Count queries (e.g., number of records)',
      sensitivity: 1,
      mechanism: 'geometric'
    },
    {
      name: 'SUM',
      description: 'Sum queries (e.g., total value)',
      sensitivity: 'data_dependent',
      mechanism: 'laplace'
    },
    {
      name: 'AVERAGE',
      description: 'Average queries (e.g., mean value)',
      sensitivity: 'data_dependent',
      mechanism: 'gaussian'
    },
    {
      name: 'GRADIENT',
      description: 'Gradient queries (e.g., machine learning)',
      sensitivity: 'data_dependent',
      mechanism: 'laplace'
    },
    {
      name: 'HISTOGRAM',
      description: 'Histogram queries (e.g., distribution)',
      sensitivity: 2,
      mechanism: 'laplace'
    },
    {
      name: 'PERCENTILE',
      description: 'Percentile queries (e.g., median, 95th percentile)',
      sensitivity: 'data_dependent',
      mechanism: 'laplace'
    },
    {
      name: 'TRAINING_DATA',
      description: 'Training data queries (e.g., feature vectors)',
      sensitivity: 'data_dependent',
      mechanism: 'laplace'
    }
  ];
  
  res.json({
    success: true,
    data: queryTypes
  });
});

/**
 * @route POST /api/dp/test
 * @desc Test differential privacy with sample data
 * @access Private
 */
router.post('/test', auth, async (req, res) => {
  try {
    const { data, query, privacyParams } = req.body;
    
    // Use test contract ID for testing
    const testParams = {
      ...privacyParams,
      contractId: 'test-contract-' + Date.now(),
      epsilon: privacyParams.epsilon || 0.1,
      delta: privacyParams.delta || 1e-5,
      mechanism: privacyParams.mechanism || 'laplace'
    };
    
    console.log(`🧪 Testing DP with ${testParams.mechanism} mechanism`);
    
    const result = await dpService.applyDifferentialPrivacy(data, query, testParams);
    
    res.json({
      success: true,
      message: 'Differential privacy test completed successfully',
      data: result,
      testInfo: {
        contractId: testParams.contractId,
        note: 'This was a test operation - no actual budget was consumed'
      }
    });
    
  } catch (error) {
    console.error('❌ DP test failed:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router; 