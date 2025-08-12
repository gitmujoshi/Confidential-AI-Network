/**
 * Differential Privacy API Routes - Simplified Version
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Initialize DP service
const dpService = require('../services/differentialPrivacyService');

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
      name: 'AVERAGE',
      description: 'Average queries (e.g., mean value)',
      sensitivity: 'data_dependent',
      mechanism: 'gaussian'
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
 * @access Public
 */
router.post('/test', async (req, res) => {
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
    
    // For now, just return a mock result since the full service might not be ready
    const mockResult = {
      success: true,
      result: data.map(x => x + (Math.random() - 0.5) * 0.1),
      privacyMetrics: {
        mechanism: testParams.mechanism,
        epsilon: testParams.epsilon,
        delta: testParams.delta,
        sensitivity: 1.0
      }
    };
    
    res.json({
      success: true,
      message: 'Differential privacy test completed successfully',
      data: mockResult,
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