const express = require('express');
const router = express.Router();
const BlockchainService = require('../services/blockchainService');

const blockchainService = new BlockchainService();

/**
 * @route   GET /api/blockchain/status
 * @desc    Get blockchain service status
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    // Initialize blockchain service if not already done
    if (!blockchainService.initialized) {
      await blockchainService.initialize();
    }

    const status = {
      enabled: blockchainService.blockchainEnabled,
      available: blockchainService.blockchainAvailable,
      mode: blockchainService.mode,
      provider: blockchainService.provider ? 'connected' : 'disconnected',
      contract: blockchainService.contract ? 'loaded' : 'not loaded',
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      status,
      message: `Blockchain service is ${blockchainService.blockchainAvailable ? 'available' : 'unavailable'}`
    });
  } catch (error) {
    console.error('❌ Blockchain status check failed:', error.message);
    res.status(500).json({
      success: false,
      status: {
        enabled: false,
        available: false,
        mode: 'ERROR',
        provider: 'disconnected',
        contract: 'not loaded',
        timestamp: new Date().toISOString()
      },
      message: 'Blockchain service error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/blockchain/health
 * @desc    Get blockchain health check
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const health = await blockchainService.getHealthStatus();
    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Blockchain health check failed:', error.message);
    res.status(500).json({
      success: false,
      health: { status: 'unhealthy', error: error.message },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
