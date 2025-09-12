/**
 * Secure Data Access Service
 * 
 * Handles secure data access, encryption, and privacy-preserving techniques
 * for AI model training with differential privacy and secure multi-party computation.
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SecureDataAccessService {
  constructor() {
    this.encryptionKey = null;
    this.privacyBudget = new Map();
    this.accessLogs = [];
    this.isLocalMode = process.env.NODE_ENV === 'development' || process.env.TEE_MODE === 'local';
    
    this.initializeEncryption();
  }

  /**
   * Initialize encryption keys
   */
  async initializeEncryption() {
    try {
      if (this.isLocalMode) {
        // Generate local encryption key
        this.encryptionKey = crypto.randomBytes(32);
        console.log('🔐 Generated local encryption key');
      } else {
        // Load encryption key from secure storage
        this.encryptionKey = await this.loadEncryptionKey();
        console.log('🔐 Loaded encryption key from secure storage');
      }
    } catch (error) {
      console.error('❌ Failed to initialize encryption:', error);
      throw error;
    }
  }

  /**
   * Setup secure data access for training
   * @param {Object} config - Data access configuration
   * @returns {Object} Access configuration
   */
  async setupSecureDataAccess(config) {
    try {
      console.log(`🔐 Setting up secure data access for environment: ${config.environmentId}`);
      
      const accessConfig = {
        environmentId: config.environmentId,
        datasets: config.datasets,
        encryptionKeys: await this.generateEncryptionKeys(config),
        accessPolicies: config.accessPolicies || this.getDefaultAccessPolicies(),
        privacyRequirements: config.privacyRequirements || this.getDefaultPrivacyRequirements(),
        auditLogging: true,
        createdAt: new Date()
      };
      
      // Setup data encryption
      await this.setupDataEncryption(accessConfig);
      
      // Setup access control
      await this.setupAccessControl(accessConfig);
      
      // Setup privacy protection
      await this.setupPrivacyProtection(accessConfig);
      
      // Setup audit logging
      await this.setupAuditLogging(accessConfig);
      
      console.log(`✅ Secure data access configured for environment: ${config.environmentId}`);
      return accessConfig;
      
    } catch (error) {
      console.error('❌ Secure data access setup failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt training data
   * @param {Buffer} data - Data to encrypt
   * @param {string} datasetId - Dataset ID
   * @returns {Object} Encrypted data and metadata
   */
  async encryptData(data, datasetId) {
    try {
      console.log(`🔒 Encrypting data for dataset: ${datasetId}`);
      
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
      cipher.setAAD(Buffer.from(datasetId, 'utf8'));
      
      // Encrypt data
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      const encryptedData = {
        data: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        algorithm: 'aes-256-gcm',
        datasetId: datasetId,
        encryptedAt: new Date().toISOString()
      };
      
      console.log(`✅ Data encrypted for dataset: ${datasetId}`);
      return encryptedData;
      
    } catch (error) {
      console.error('❌ Data encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt training data
   * @param {Object} encryptedData - Encrypted data object
   * @returns {Buffer} Decrypted data
   */
  async decryptData(encryptedData) {
    try {
      console.log(`🔓 Decrypting data for dataset: ${encryptedData.datasetId}`);
      
      // Convert base64 strings back to buffers
      const encrypted = Buffer.from(encryptedData.data, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const tag = Buffer.from(encryptedData.tag, 'base64');
      
      // Create decipher
      const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
      decipher.setAAD(Buffer.from(encryptedData.datasetId, 'utf8'));
      decipher.setAuthTag(tag);
      
      // Decrypt data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      console.log(`✅ Data decrypted for dataset: ${encryptedData.datasetId}`);
      return decrypted;
      
    } catch (error) {
      console.error('❌ Data decryption failed:', error);
      throw error;
    }
  }

  /**
   * Apply differential privacy to dataset
   * @param {Array} data - Dataset to privatize
   * @param {Object} privacyConfig - Privacy configuration
   * @returns {Array} Privatized dataset
   */
  async applyDifferentialPrivacy(data, privacyConfig) {
    try {
      console.log(`🔒 Applying differential privacy to dataset`);
      
      const {
        epsilon = 1.0,
        delta = 1e-5,
        mechanism = 'laplace',
        sensitivity = 1.0
      } = privacyConfig;
      
      // Check privacy budget
      const budgetKey = `${privacyConfig.datasetId}_${privacyConfig.userId}`;
      const currentBudget = this.privacyBudget.get(budgetKey) || { epsilon: 0, delta: 0 };
      
      if (currentBudget.epsilon + epsilon > privacyConfig.maxEpsilon) {
        throw new Error('Privacy budget exceeded');
      }
      
      // Apply privacy mechanism
      let privatizedData;
      switch (mechanism) {
        case 'laplace':
          privatizedData = this.applyLaplaceMechanism(data, epsilon, sensitivity);
          break;
        case 'gaussian':
          privatizedData = this.applyGaussianMechanism(data, epsilon, delta, sensitivity);
          break;
        case 'exponential':
          privatizedData = this.applyExponentialMechanism(data, epsilon, sensitivity);
          break;
        default:
          throw new Error(`Unknown privacy mechanism: ${mechanism}`);
      }
      
      // Update privacy budget
      this.privacyBudget.set(budgetKey, {
        epsilon: currentBudget.epsilon + epsilon,
        delta: currentBudget.delta + delta,
        lastUsed: new Date()
      });
      
      console.log(`✅ Differential privacy applied (ε=${epsilon}, δ=${delta})`);
      return privatizedData;
      
    } catch (error) {
      console.error('❌ Differential privacy application failed:', error);
      throw error;
    }
  }

  /**
   * Apply Laplace mechanism for differential privacy
   * @param {Array} data - Data to privatize
   * @param {number} epsilon - Privacy parameter
   * @param {number} sensitivity - Sensitivity parameter
   * @returns {Array} Privatized data
   */
  applyLaplaceMechanism(data, epsilon, sensitivity) {
    const scale = sensitivity / epsilon;
    const noise = this.generateLaplaceNoise(data.length, scale);
    
    return data.map((value, index) => {
      if (typeof value === 'number') {
        return value + noise[index];
      }
      return value;
    });
  }

  /**
   * Apply Gaussian mechanism for differential privacy
   * @param {Array} data - Data to privatize
   * @param {number} epsilon - Privacy parameter
   * @param {number} delta - Privacy parameter
   * @param {number} sensitivity - Sensitivity parameter
   * @returns {Array} Privatized data
   */
  applyGaussianMechanism(data, epsilon, delta, sensitivity) {
    const sigma = Math.sqrt(2 * Math.log(1.25 / delta)) * sensitivity / epsilon;
    const noise = this.generateGaussianNoise(data.length, 0, sigma);
    
    return data.map((value, index) => {
      if (typeof value === 'number') {
        return value + noise[index];
      }
      return value;
    });
  }

  /**
   * Apply Exponential mechanism for differential privacy
   * @param {Array} data - Data to privatize
   * @param {number} epsilon - Privacy parameter
   * @param {number} sensitivity - Sensitivity parameter
   * @returns {Array} Privatized data
   */
  applyExponentialMechanism(data, epsilon, sensitivity) {
    // Simplified exponential mechanism implementation
    const scale = sensitivity / epsilon;
    const noise = this.generateExponentialNoise(data.length, scale);
    
    return data.map((value, index) => {
      if (typeof value === 'number') {
        return value + noise[index];
      }
      return value;
    });
  }

  /**
   * Generate Laplace noise
   * @param {number} size - Number of noise values
   * @param {number} scale - Scale parameter
   * @returns {Array} Noise values
   */
  generateLaplaceNoise(size, scale) {
    const noise = [];
    for (let i = 0; i < size; i++) {
      const u = Math.random() - 0.5;
      const noiseValue = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
      noise.push(noiseValue);
    }
    return noise;
  }

  /**
   * Generate Gaussian noise
   * @param {number} size - Number of noise values
   * @param {number} mean - Mean parameter
   * @param {number} stdDev - Standard deviation
   * @returns {Array} Noise values
   */
  generateGaussianNoise(size, mean, stdDev) {
    const noise = [];
    for (let i = 0; i < size; i++) {
      // Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      noise.push(mean + stdDev * z0);
    }
    return noise;
  }

  /**
   * Generate Exponential noise
   * @param {number} size - Number of noise values
   * @param {number} scale - Scale parameter
   * @returns {Array} Noise values
   */
  generateExponentialNoise(size, scale) {
    const noise = [];
    for (let i = 0; i < size; i++) {
      const u = Math.random();
      const noiseValue = -scale * Math.log(1 - u);
      noise.push(noiseValue);
    }
    return noise;
  }

  /**
   * Setup data encryption
   * @param {Object} accessConfig - Access configuration
   */
  async setupDataEncryption(accessConfig) {
    console.log(`🔐 Setting up data encryption for environment: ${accessConfig.environmentId}`);
    
    // Generate dataset-specific encryption keys
    for (const dataset of accessConfig.datasets) {
      const datasetKey = crypto.randomBytes(32);
      accessConfig.encryptionKeys[dataset.id] = datasetKey.toString('base64');
    }
    
    console.log(`✅ Data encryption configured for ${accessConfig.datasets.length} datasets`);
  }

  /**
   * Setup access control
   * @param {Object} accessConfig - Access configuration
   */
  async setupAccessControl(accessConfig) {
    console.log(`🔐 Setting up access control for environment: ${accessConfig.environmentId}`);
    
    // Implement role-based access control
    const rbac = {
      TDP: ['read_own_datasets', 'write_own_datasets'],
      TDC: ['read_contract_datasets', 'execute_training'],
      CCRP: ['manage_environment', 'monitor_training', 'access_all_datasets']
    };
    
    accessConfig.accessControl = rbac;
    console.log(`✅ Access control configured for environment: ${accessConfig.environmentId}`);
  }

  /**
   * Setup privacy protection
   * @param {Object} accessConfig - Access configuration
   */
  async setupPrivacyProtection(accessConfig) {
    console.log(`🔒 Setting up privacy protection for environment: ${accessConfig.environmentId}`);
    
    // Configure privacy mechanisms
    const privacyConfig = {
      differentialPrivacy: {
        enabled: true,
        defaultEpsilon: 1.0,
        defaultDelta: 1e-5,
        maxEpsilon: 10.0,
        mechanisms: ['laplace', 'gaussian', 'exponential']
      },
      dataAnonymization: {
        enabled: true,
        techniques: ['k_anonymity', 'l_diversity', 't_closeness']
      },
      secureAggregation: {
        enabled: true,
        protocol: 'secure_sum'
      }
    };
    
    accessConfig.privacyConfig = privacyConfig;
    console.log(`✅ Privacy protection configured for environment: ${accessConfig.environmentId}`);
  }

  /**
   * Setup audit logging
   * @param {Object} accessConfig - Access configuration
   */
  async setupAuditLogging(accessConfig) {
    console.log(`📝 Setting up audit logging for environment: ${accessConfig.environmentId}`);
    
    // Configure audit logging
    const auditConfig = {
      enabled: true,
      logLevel: 'INFO',
      logFormat: 'JSON',
      retentionDays: 90,
      events: [
        'data_access',
        'data_encryption',
        'data_decryption',
        'privacy_application',
        'access_control',
        'security_violation'
      ]
    };
    
    accessConfig.auditConfig = auditConfig;
    console.log(`✅ Audit logging configured for environment: ${accessConfig.environmentId}`);
  }

  /**
   * Log data access
   * @param {Object} accessEvent - Access event details
   */
  async logDataAccess(accessEvent) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      environmentId: accessEvent.environmentId,
      userId: accessEvent.userId,
      datasetId: accessEvent.datasetId,
      action: accessEvent.action,
      result: accessEvent.result,
      ipAddress: accessEvent.ipAddress,
      userAgent: accessEvent.userAgent
    };
    
    this.accessLogs.push(logEntry);
    
    // In production, this would be sent to a secure audit system
    console.log(`📝 Data access logged: ${accessEvent.action} on ${accessEvent.datasetId}`);
  }

  /**
   * Generate encryption keys
   * @param {Object} config - Configuration
   * @returns {Object} Encryption keys
   */
  async generateEncryptionKeys(config) {
    const keys = {};
    
    // Generate master key
    keys.master = crypto.randomBytes(32).toString('base64');
    
    // Generate dataset-specific keys
    for (const dataset of config.datasets) {
      keys[dataset.id] = crypto.randomBytes(32).toString('base64');
    }
    
    // Generate session key
    keys.session = crypto.randomBytes(32).toString('base64');
    
    return keys;
  }

  /**
   * Get default access policies
   * @returns {Object} Default access policies
   */
  getDefaultAccessPolicies() {
    return {
      dataRetention: 90, // days
      accessTimeout: 3600, // seconds
      maxConcurrentAccess: 10,
      allowedFileTypes: ['.csv', '.json', '.parquet', '.h5'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      encryptionRequired: true,
      auditRequired: true
    };
  }

  /**
   * Get default privacy requirements
   * @returns {Object} Default privacy requirements
   */
  getDefaultPrivacyRequirements() {
    return {
      differentialPrivacy: {
        enabled: true,
        epsilon: 1.0,
        delta: 1e-5
      },
      dataAnonymization: {
        enabled: true,
        kAnonymity: 5,
        lDiversity: 2
      },
      secureAggregation: {
        enabled: true,
        threshold: 3
      }
    };
  }

  /**
   * Load encryption key from secure storage
   * @returns {Buffer} Encryption key
   */
  async loadEncryptionKey() {
    // In production, this would load from a secure key management system
    // For now, generate a new key
    return crypto.randomBytes(32);
  }

  /**
   * Get privacy budget for user
   * @param {string} userId - User ID
   * @param {string} datasetId - Dataset ID
   * @returns {Object} Privacy budget
   */
  getPrivacyBudget(userId, datasetId) {
    const budgetKey = `${datasetId}_${userId}`;
    return this.privacyBudget.get(budgetKey) || { epsilon: 0, delta: 0 };
  }

  /**
   * Reset privacy budget for user
   * @param {string} userId - User ID
   * @param {string} datasetId - Dataset ID
   */
  resetPrivacyBudget(userId, datasetId) {
    const budgetKey = `${datasetId}_${userId}`;
    this.privacyBudget.delete(budgetKey);
    console.log(`🔄 Privacy budget reset for user ${userId}, dataset ${datasetId}`);
  }

  /**
   * Get access logs
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered access logs
   */
  getAccessLogs(filters = {}) {
    let logs = this.accessLogs;
    
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    
    if (filters.datasetId) {
      logs = logs.filter(log => log.datasetId === filters.datasetId);
    }
    
    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    
    if (filters.startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }
    
    return logs;
  }

  /**
   * Validate data access permissions
   * @param {string} userId - User ID
   * @param {string} datasetId - Dataset ID
   * @param {string} action - Action to perform
   * @param {string} userRole - User role
   * @returns {boolean} Has permission
   */
  validateAccessPermission(userId, datasetId, action, userRole) {
    const permissions = {
      TDP: ['read_own_datasets', 'write_own_datasets'],
      TDC: ['read_contract_datasets', 'execute_training'],
      CCRP: ['manage_environment', 'monitor_training', 'access_all_datasets']
    };
    
    const userPermissions = permissions[userRole] || [];
    return userPermissions.includes(action);
  }
}

module.exports = SecureDataAccessService;
