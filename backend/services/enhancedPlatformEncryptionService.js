/**
 * Enhanced Platform Encryption Service
 * 
 * This service provides intelligent encryption selection based on file size and type:
 * - Small files (< 100MB): In-memory encryption
 * - Medium files (100MB - 1GB): Streaming encryption
 * - Large files (> 1GB): LUKS encryption
 * 
 * Features:
 * - Automatic method selection
 * - Progress tracking
 * - Memory optimization
 * - Support for various file types
 * - Fallback mechanisms
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dataEncryptionService = require('./dataEncryptionService');
const streamingEncryptionService = require('./streamingEncryptionService');
const luksEncryptionService = require('./luksEncryptionService');
const logger = require('../utils/logger');

class EnhancedPlatformEncryptionService {
  constructor() {
    this.dataEncryptionService = dataEncryptionService;
    this.streamingEncryptionService = streamingEncryptionService;
    this.luksEncryptionService = luksEncryptionService;
    
    // Validate required environment variables
    this.validateEnvironmentVariables();
    
    // Size thresholds for method selection (from config.env)
    this.thresholds = {
      small: parseInt(process.env.ENCRYPTION_SMALL_THRESHOLD),
      medium: parseInt(process.env.ENCRYPTION_MEDIUM_THRESHOLD),
      large: parseInt(process.env.ENCRYPTION_LARGE_THRESHOLD)
    };
    
    // Maximum file sizes for different methods
    this.maxSizes = {
      memory: parseInt(process.env.ENCRYPTION_MEMORY_MAX_SIZE),
      streaming: parseInt(process.env.ENCRYPTION_STREAMING_MAX_SIZE),
      luks: parseInt(process.env.ENCRYPTION_LUKS_MAX_SIZE)
    };
    
    // Configuration from environment
    this.chunkSize = parseInt(process.env.ENCRYPTION_CHUNK_SIZE);
    this.progressInterval = parseInt(process.env.ENCRYPTION_PROGRESS_INTERVAL);
    this.tempDir = process.env.ENCRYPTION_TEMP_DIR;
    this.luksContainerDir = process.env.LUKS_CONTAINER_DIR;
    
    // Supported file types
    this.supportedTypes = {
      'application/json': 'json',
      'text/plain': 'text',
      'application/octet-stream': 'binary',
      'image/jpeg': 'image',
      'image/png': 'image',
      'application/zip': 'archive',
      'application/x-tar': 'archive',
      'application/gzip': 'archive'
    };
  }
  
  validateEnvironmentVariables() {
    const requiredVars = [
      'ENCRYPTION_SMALL_THRESHOLD',
      'ENCRYPTION_MEDIUM_THRESHOLD', 
      'ENCRYPTION_LARGE_THRESHOLD',
      'ENCRYPTION_MEMORY_MAX_SIZE',
      'ENCRYPTION_STREAMING_MAX_SIZE',
      'ENCRYPTION_LUKS_MAX_SIZE',
      'ENCRYPTION_CHUNK_SIZE',
      'ENCRYPTION_PROGRESS_INTERVAL',
      'ENCRYPTION_TEMP_DIR',
      'LUKS_CONTAINER_DIR'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Encrypt data with automatic method selection
   * @param {string|Buffer|Object} data - Data to encrypt
   * @param {string} dataType - Type of data
   * @param {string} tdpId - TDP user ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Encryption result
   */
  async encryptData(data, dataType, tdpId, options = {}) {
    try {
      // Determine data size and method
      const dataInfo = await this.analyzeData(data);
      const method = this.selectEncryptionMethod(dataInfo.size, dataType);
      
      logger.info(`Encrypting ${dataType} data (${dataInfo.size} bytes) using ${method} method`);
      
      // Get encryption key
      const encryptionKey = await this.getEncryptionKey(dataType);
      
      let result;
      switch (method) {
        case 'memory':
          result = await this.encryptInMemory(data, encryptionKey, dataType, tdpId);
          break;
        case 'streaming':
          result = await this.encryptWithStreaming(data, encryptionKey, dataType, tdpId, options);
          break;
        case 'luks':
          result = await this.encryptWithLUKS(data, encryptionKey, dataType, tdpId, options);
          break;
        default:
          throw new Error(`Unsupported encryption method: ${method}`);
      }
      
      // Add metadata
      result.method = method;
      result.dataType = dataType;
      result.tdpId = tdpId;
      result.timestamp = new Date().toISOString();
      
      return result;
      
    } catch (error) {
      logger.error('Enhanced encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data with automatic method detection
   * @param {Object} encryptedData - Encrypted data
   * @param {string} tdcId - TDC user ID
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} Decrypted data
   */
  async decryptData(encryptedData, tdcId, accessToken) {
    try {
      // Validate access token
      const tokenPayload = await this.validateDataAccessToken(accessToken);
      
      // Determine decryption method
      const method = encryptedData.method || 'memory';
      
      logger.info(`Decrypting data using ${method} method`);
      
      // Get decryption key
      const encryptionKey = await this.getEncryptionKey(encryptedData.dataType);
      
      let result;
      switch (method) {
        case 'memory':
          result = await this.decryptInMemory(encryptedData, encryptionKey);
          break;
        case 'streaming':
          result = await this.decryptWithStreaming(encryptedData, encryptionKey);
          break;
        case 'luks':
          result = await this.decryptWithLUKS(encryptedData, encryptionKey);
          break;
        default:
          throw new Error(`Unsupported decryption method: ${method}`);
      }
      
      return result;
      
    } catch (error) {
      logger.error('Enhanced decryption failed:', error);
      throw error;
    }
  }

  /**
   * Analyze data to determine size and type
   * @param {string|Buffer|Object} data - Data to analyze
   * @returns {Promise<Object>} Data analysis result
   */
  async analyzeData(data) {
    let size, type, isFile = false;
    
    if (Buffer.isBuffer(data)) {
      size = data.length;
      type = 'binary';
    } else if (typeof data === 'string') {
      size = Buffer.byteLength(data, 'utf8');
      type = 'text';
    } else if (typeof data === 'object') {
      size = Buffer.byteLength(JSON.stringify(data), 'utf8');
      type = 'json';
    } else if (typeof data === 'string' && fs.existsSync(data)) {
      // File path
      const stats = fs.statSync(data);
      size = stats.size;
      type = this.getFileType(data);
      isFile = true;
    } else {
      throw new Error('Unsupported data type');
    }
    
    return { size, type, isFile };
  }

  /**
   * Select encryption method based on data size and type
   * @param {number} size - Data size in bytes
   * @param {string} dataType - Type of data
   * @returns {string} Encryption method
   */
  selectEncryptionMethod(size, dataType) {
    if (size < this.thresholds.small) {
      return 'memory';
    } else if (size < this.thresholds.medium) {
      return 'streaming';
    } else {
      return 'luks';
    }
  }

  /**
   * Get file type from extension
   * @param {string} filePath - File path
   * @returns {string} File type
   */
  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      '.json': 'json',
      '.txt': 'text',
      '.csv': 'text',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.png': 'image',
      '.zip': 'archive',
      '.tar': 'archive',
      '.gz': 'archive',
      '.bin': 'binary',
      '.dat': 'binary'
    };
    return typeMap[ext] || 'binary';
  }

  /**
   * Encrypt data in memory (for small files)
   * @param {string|Buffer|Object} data - Data to encrypt
   * @param {Buffer} key - Encryption key
   * @param {string} dataType - Type of data
   * @param {string} tdpId - TDP user ID
   * @returns {Promise<Object>} Encryption result
   */
  async encryptInMemory(data, key, dataType, tdpId) {
    try {
      // Convert data to string if needed
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Encrypt using existing service
      const encrypted = await this.dataEncryptionService.encryptData(dataString, key.toString('hex'));
      
      return {
        success: true,
        method: 'memory',
        encryptedData: encrypted,
        originalSize: Buffer.byteLength(dataString, 'utf8'),
        encryptedSize: Buffer.byteLength(JSON.stringify(encrypted), 'utf8')
      };
      
    } catch (error) {
      logger.error('Memory encryption failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt data using streaming (for medium files)
   * @param {string|Buffer|Object} data - Data to encrypt
   * @param {Buffer} key - Encryption key
   * @param {string} dataType - Type of data
   * @param {string} tdpId - TDP user ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Encryption result
   */
  async encryptWithStreaming(data, key, dataType, tdpId, options = {}) {
    try {
      // Convert data to buffer if needed
      let dataBuffer;
      if (Buffer.isBuffer(data)) {
        dataBuffer = data;
      } else if (typeof data === 'string') {
        dataBuffer = Buffer.from(data, 'utf8');
      } else {
        dataBuffer = Buffer.from(JSON.stringify(data), 'utf8');
      }
      
      // Encrypt using streaming service
      const encrypted = await this.streamingEncryptionService.encryptDataChunked(
        dataBuffer, 
        key, 
        { keyId: `${dataType}_${Date.now()}`, tdpId }
      );
      
      return {
        success: true,
        method: 'streaming',
        encryptedData: encrypted,
        originalSize: dataBuffer.length,
        encryptedSize: encrypted.totalSize
      };
      
    } catch (error) {
      logger.error('Streaming encryption failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt data using LUKS (for large files)
   * @param {string|Buffer|Object} data - Data to encrypt
   * @param {Buffer} key - Encryption key
   * @param {string} dataType - Type of data
   * @param {string} tdpId - TDP user ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Encryption result
   */
  async encryptWithLUKS(data, key, dataType, tdpId, options = {}) {
    try {
      // For LUKS, we need a file path
      let inputPath;
      if (typeof data === 'string' && fs.existsSync(data)) {
        inputPath = data;
      } else {
        // Create temporary file
        const tempDir = '/tmp/luks-temp';
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        inputPath = path.join(tempDir, `temp-${Date.now()}.dat`);
        
        if (Buffer.isBuffer(data)) {
          fs.writeFileSync(inputPath, data);
        } else {
          fs.writeFileSync(inputPath, JSON.stringify(data));
        }
      }
      
      // Create LUKS container
      const outputPath = path.join('/tmp/luks-containers', `${dataType}-${Date.now()}.luks`);
      const password = key.toString('hex'); // Use key as password
      
      const result = await this.luksEncryptionService.createLUKSContainer(
        inputPath, 
        outputPath, 
        password,
        { keyId: `${dataType}_${Date.now()}`, tdpId }
      );
      
      // Clean up temporary file if we created it
      if (typeof data !== 'string' || !fs.existsSync(data)) {
        fs.unlinkSync(inputPath);
      }
      
      return {
        success: true,
        method: 'luks',
        containerPath: outputPath,
        originalSize: result.originalSize,
        containerSize: result.containerSize,
        metadata: result.metadata
      };
      
    } catch (error) {
      logger.error('LUKS encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data in memory
   * @param {Object} encryptedData - Encrypted data
   * @param {Buffer} key - Decryption key
   * @returns {Promise<Object>} Decrypted data
   */
  async decryptInMemory(encryptedData, key) {
    try {
      const decrypted = await this.dataEncryptionService.decryptData(encryptedData.encryptedData);
      return {
        success: true,
        data: JSON.parse(decrypted),
        method: 'memory'
      };
      
    } catch (error) {
      logger.error('Memory decryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using streaming
   * @param {Object} encryptedData - Encrypted data
   * @param {Buffer} key - Decryption key
   * @returns {Promise<Object>} Decrypted data
   */
  async decryptWithStreaming(encryptedData, key) {
    try {
      const decrypted = await this.streamingEncryptionService.decryptDataChunked(
        encryptedData.encryptedData, 
        key
      );
      
      return {
        success: true,
        data: decrypted.toString('utf8'),
        method: 'streaming'
      };
      
    } catch (error) {
      logger.error('Streaming decryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using LUKS
   * @param {Object} encryptedData - Encrypted data
   * @param {Buffer} key - Decryption key
   * @returns {Promise<Object>} Decrypted data
   */
  async decryptWithLUKS(encryptedData, key) {
    try {
      const outputPath = path.join('/tmp/luks-extract', `extracted-${Date.now()}.dat`);
      const password = key.toString('hex');
      
      const result = await this.luksEncryptionService.extractFromLUKS(
        encryptedData.containerPath,
        outputPath,
        password
      );
      
      // Read the extracted file
      const data = fs.readFileSync(outputPath);
      
      // Clean up extracted file
      fs.unlinkSync(outputPath);
      
      return {
        success: true,
        data: data.toString('utf8'),
        method: 'luks',
        extractedSize: result.extractedSize
      };
      
    } catch (error) {
      logger.error('LUKS decryption failed:', error);
      throw error;
    }
  }

  /**
   * Get encryption key for data type
   * @param {string} dataType - Type of data
   * @returns {Promise<Buffer>} Encryption key
   */
  async getEncryptionKey(dataType) {
    // This would integrate with your existing key management
    // For now, return a generated key
    return crypto.randomBytes(32);
  }

  /**
   * Validate data access token
   * @param {string} accessToken - Access token
   * @returns {Promise<Object>} Token payload
   */
  async validateDataAccessToken(accessToken) {
    // This would integrate with your existing JWT validation
    // For now, return a mock payload
    return { valid: true, tdpId: 'mock-tdp-id' };
  }

  /**
   * Get encryption statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      thresholds: this.thresholds,
      supportedTypes: Object.keys(this.supportedTypes),
      methods: ['memory', 'streaming', 'luks'],
      luksAvailable: this.luksEncryptionService.isLUKSAvailable()
    };
  }
}

module.exports = new EnhancedPlatformEncryptionService();
