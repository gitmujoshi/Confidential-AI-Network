/**
 * Enhanced Encryption API Routes
 * 
 * This module provides API endpoints for the enhanced platform encryption workflow,
 * supporting different encryption methods based on file size and type.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const EnhancedPlatformEncryptionService = require('../services/enhancedPlatformEncryptionService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// Initialize service
const enhancedEncryptionService = EnhancedPlatformEncryptionService;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/tmp/encryption-uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024 // 10GB max
  }
});

/**
 * @route GET /api/enhanced-encryption/status
 * @desc Get enhanced encryption service status
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const stats = enhancedEncryptionService.getStatistics();
    
    res.json({
      success: true,
      service: 'Enhanced Platform Encryption',
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get enhanced encryption status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enhanced encryption status',
      message: error.message
    });
  }
});

/**
 * @route POST /api/enhanced-encryption/encrypt-data
 * @desc Encrypt data with automatic method selection
 * @access TDP only
 */
router.post('/encrypt-data', authenticateToken, requireRole(['TDP']), async (req, res) => {
  try {
    const { data, dataType } = req.body;
    const tdpId = req.user.id;
    
    if (!data || !dataType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Data and dataType are required'
      });
    }
    
    const result = await enhancedEncryptionService.encryptData(data, dataType, tdpId);
    
    logger.info(`Data encrypted for TDP ${tdpId}, type: ${dataType}, method: ${result.method}`);
    
    res.json({
      success: true,
      data: result,
      message: 'Data encrypted successfully'
    });
    
  } catch (error) {
    logger.error('Enhanced encryption failed:', error);
    res.status(500).json({
      success: false,
      error: 'Enhanced encryption failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/enhanced-encryption/encrypt-file
 * @desc Encrypt uploaded file with automatic method selection
 * @access TDP only
 */
router.post('/encrypt-file', authenticateToken, requireRole(['TDP']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'File is required'
      });
    }
    
    const { dataType } = req.body;
    const tdpId = req.user.id;
    
    if (!dataType) {
      return res.status(400).json({
        success: false,
        error: 'Missing dataType',
        message: 'dataType is required'
      });
    }
    
    // Encrypt the uploaded file
    const result = await enhancedEncryptionService.encryptData(req.file.path, dataType, tdpId);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    logger.info(`File encrypted for TDP ${tdpId}, type: ${dataType}, method: ${result.method}`);
    
    res.json({
      success: true,
      data: result,
      message: 'File encrypted successfully'
    });
    
  } catch (error) {
    logger.error('File encryption failed:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'File encryption failed',
      message: error.message
    });
  }
});

/**
 * @route POST /api/enhanced-encryption/decrypt-data
 * @desc Decrypt data with automatic method detection
 * @access TDC only
 */
router.post('/decrypt-data', authenticateToken, requireRole(['TDC']), async (req, res) => {
  try {
    const { encryptedData, accessToken } = req.body;
    const tdcId = req.user.id;
    
    if (!encryptedData || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'encryptedData and accessToken are required'
      });
    }
    
    const result = await enhancedEncryptionService.decryptData(encryptedData, tdcId, accessToken);
    
    logger.info(`Data decrypted for TDC ${tdcId}, method: ${result.method}`);
    
    res.json({
      success: true,
      data: result,
      message: 'Data decrypted successfully'
    });
    
  } catch (error) {
    logger.error('Enhanced decryption failed:', error);
    res.status(500).json({
      success: false,
      error: 'Enhanced decryption failed',
      message: error.message
    });
  }
});

/**
 * @route GET /api/enhanced-encryption/methods
 * @desc Get available encryption methods and their capabilities
 * @access Public
 */
router.get('/methods', async (req, res) => {
  try {
    const methods = {
      memory: {
        name: 'In-Memory Encryption',
        description: 'Fast encryption for small files (< 100MB)',
        maxSize: '100MB',
        advantages: ['Fast', 'Simple', 'Low memory overhead'],
        useCases: ['JSON data', 'Small text files', 'Configuration files']
      },
      streaming: {
        name: 'Streaming Encryption',
        description: 'Chunked encryption for medium files (100MB - 1GB)',
        maxSize: '1GB',
        advantages: ['Memory efficient', 'Progress tracking', 'Resumable'],
        useCases: ['CSV files', 'Log files', 'Medium datasets']
      },
      luks: {
        name: 'LUKS Encryption',
        description: 'Hardware-accelerated encryption for large files (> 1GB)',
        maxSize: '10GB+',
        advantages: ['Hardware acceleration', 'Industry standard', 'High performance'],
        useCases: ['Large datasets', 'Model files', 'Binary data']
      }
    };
    
    res.json({
      success: true,
      methods: methods,
      autoSelection: 'The system automatically selects the best method based on file size',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to get encryption methods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get encryption methods',
      message: error.message
    });
  }
});

/**
 * @route POST /api/enhanced-encryption/test-performance
 * @desc Test encryption performance with different methods
 * @access Admin only
 */
router.post('/test-performance', authenticateToken, requireRole(['AppAdmin']), async (req, res) => {
  try {
    const { testSizes } = req.body;
    const sizes = testSizes || [1024, 1024 * 1024, 10 * 1024 * 1024, 100 * 1024 * 1024]; // 1KB, 1MB, 10MB, 100MB
    
    const results = [];
    
    for (const size of sizes) {
      // Generate test data
      const testData = Buffer.alloc(size, 'A');
      const dataType = 'PERFORMANCE_TEST';
      const tdpId = 'test-tdp';
      
      const startTime = Date.now();
      
      try {
        const result = await enhancedEncryptionService.encryptData(testData, dataType, tdpId);
        const endTime = Date.now();
        
        results.push({
          size: size,
          method: result.method,
          duration: endTime - startTime,
          throughput: (size / (endTime - startTime)) * 1000, // bytes per second
          success: true
        });
        
      } catch (error) {
        results.push({
          size: size,
          method: 'unknown',
          duration: 0,
          throughput: 0,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Performance test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Performance test failed',
      message: error.message
    });
  }
});

module.exports = router;
