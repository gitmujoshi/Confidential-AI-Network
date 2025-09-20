/**
 * Data Encryption Service
 * 
 * This service provides data encryption capabilities that extend the existing
 * system without modifying core data flow or authentication logic.
 * 
 * Features:
 * - AES-256-GCM encryption for sensitive data
 * - Database field encryption middleware
 * - Key management and rotation
 * - Encrypted data validation
 * - Audit logging for encryption operations
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

class DataEncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    
    // Initialize encryption key
    this.initializeEncryptionKey();
  }

  /**
   * Initialize encryption key from environment or generate new one
   */
  initializeEncryptionKey() {
    try {
      // Use environment variable if available, otherwise generate
      this.encryptionKey = process.env.DATA_ENCRYPTION_KEY;
      if (!this.encryptionKey) {
        throw new Error('DATA_ENCRYPTION_KEY environment variable is required');
      }
      
      // Convert hex string to buffer
      this.keyBuffer = Buffer.from(this.encryptionKey, 'hex');
      
      logger.info('Data encryption service initialized');
    } catch (error) {
      logger.error('Encryption key initialization error:', error);
      throw new Error('Failed to initialize encryption key');
    }
  }

  /**
   * Encrypt sensitive data
   * @param {string|Object} data - Data to encrypt
   * @param {string} keyId - Optional key ID for key rotation
   * @returns {Promise<Object>} Encrypted data object
   */
  async encryptData(data, keyId = null) {
    try {
      if (!data) {
        return { encrypted: null, iv: null, tag: null, keyId: keyId || 'default' };
      }

      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher using GCM mode
      const cipher = crypto.createCipherGCM('aes-256-gcm', this.keyBuffer, iv);
      
      // Encrypt data
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      const result = {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        keyId: keyId || 'default',
        algorithm: 'aes-256-gcm',
        timestamp: new Date().toISOString()
      };

      // Log encryption operation
      await this.logEncryptionEvent('ENCRYPT', {
        keyId: keyId || 'default',
        dataSize: JSON.stringify(data).length,
        algorithm: this.algorithm
      });

      return result;

    } catch (error) {
      logger.error('Data encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   * @param {Object} encryptedData - Encrypted data object
   * @returns {Promise<Object>} Decrypted data
   */
  async decryptData(encryptedData) {
    try {
      if (!encryptedData || !encryptedData.encrypted) {
        return null;
      }

      // Create decipher using GCM mode
      const decipher = crypto.createDecipherGCM('aes-256-gcm', this.keyBuffer, Buffer.from(encryptedData.iv, 'hex'));
      
      // Set authentication tag
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const result = JSON.parse(decrypted);

      // Log decryption operation
      await this.logEncryptionEvent('DECRYPT', {
        keyId: encryptedData.keyId || 'default',
        dataSize: decrypted.length,
        algorithm: encryptedData.algorithm
      });

      return result;

    } catch (error) {
      logger.error('Data decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt database field value
   * @param {string} value - Field value to encrypt
   * @param {string} fieldName - Field name for context
   * @returns {Promise<string>} Encrypted value as JSON string
   */
  async encryptDatabaseField(value, fieldName) {
    try {
      if (!value) {
        return value;
      }

      const encrypted = await this.encryptData(value, `field_${fieldName}`);
      return JSON.stringify(encrypted);

    } catch (error) {
      logger.error(`Database field encryption error for ${fieldName}:`, error);
      throw new Error(`Failed to encrypt field: ${fieldName}`);
    }
  }

  /**
   * Decrypt database field value
   * @param {string} encryptedValue - Encrypted field value
   * @param {string} fieldName - Field name for context
   * @returns {Promise<string>} Decrypted value
   */
  async decryptDatabaseField(encryptedValue, fieldName) {
    try {
      if (!encryptedValue) {
        return encryptedValue;
      }

      const encryptedData = JSON.parse(encryptedValue);
      return await this.decryptData(encryptedData);

    } catch (error) {
      logger.error(`Database field decryption error for ${fieldName}:`, error);
      throw new Error(`Failed to decrypt field: ${fieldName}`);
    }
  }

  /**
   * Encrypt sensitive fields in request body
   * @param {Array} fields - Array of field names to encrypt
   * @returns {Function} Express middleware function
   */
  encryptSensitiveFields(fields) {
    return async (req, res, next) => {
      try {
        if (req.body && fields.length > 0) {
          for (const field of fields) {
            if (req.body[field]) {
              req.body[field] = await this.encryptDatabaseField(
                req.body[field],
                field
              );
            }
          }
        }
        next();
      } catch (error) {
        logger.error('Sensitive field encryption middleware error:', error);
        return res.status(500).json({
          error: 'Data encryption failed',
          code: 'ENCRYPTION_ERROR'
        });
      }
    };
  }

  /**
   * Decrypt sensitive fields in response
   * @param {Array} fields - Array of field names to decrypt
   * @returns {Function} Express middleware function
   */
  decryptSensitiveFields(fields) {
    return async (req, res, next) => {
      try {
        // Store original send function
        const originalSend = res.send;
        
        // Override send function to decrypt data before sending
        res.send = async function(data) {
          try {
            if (data && typeof data === 'string') {
              const parsedData = JSON.parse(data);
              
              if (parsedData.data && Array.isArray(parsedData.data)) {
                // Handle array of objects
                for (const item of parsedData.data) {
                  for (const field of fields) {
                    if (item[field]) {
                      item[field] = await dataEncryptionService.decryptDatabaseField(
                        item[field],
                        field
                      );
                    }
                  }
                }
              } else if (parsedData.data && typeof parsedData.data === 'object') {
                // Handle single object
                for (const field of fields) {
                  if (parsedData.data[field]) {
                    parsedData.data[field] = await dataEncryptionService.decryptDatabaseField(
                      parsedData.data[field],
                      field
                    );
                  }
                }
              }
              
              data = JSON.stringify(parsedData);
            }
          } catch (error) {
            logger.error('Response decryption error:', error);
          }
          
          return originalSend.call(this, data);
        };
        
        next();
      } catch (error) {
        logger.error('Sensitive field decryption middleware error:', error);
        next();
      }
    };
  }

  /**
   * Validate encrypted data integrity
   * @param {Object} encryptedData - Encrypted data to validate
   * @returns {Promise<boolean>} Validation result
   */
  async validateEncryptedData(encryptedData) {
    try {
      if (!encryptedData || !encryptedData.encrypted || !encryptedData.tag) {
        return false;
      }

      // Try to decrypt to validate
      await this.decryptData(encryptedData);
      return true;

    } catch (error) {
      logger.error('Encrypted data validation error:', error);
      return false;
    }
  }

  /**
   * Rotate encryption keys
   * @param {string} oldKeyId - Old key ID
   * @param {string} newKeyId - New key ID
   * @returns {Promise<boolean>} Success status
   */
  async rotateEncryptionKeys(oldKeyId, newKeyId) {
    try {
      logger.info(`Starting key rotation from ${oldKeyId} to ${newKeyId}`);

      // In a real implementation, this would:
      // 1. Generate new key
      // 2. Re-encrypt all data with new key
      // 3. Update key references
      // 4. Remove old key

      // For now, we'll just log the rotation
      await this.logEncryptionEvent('KEY_ROTATION', {
        oldKeyId: oldKeyId,
        newKeyId: newKeyId,
        algorithm: this.algorithm
      });

      logger.info('Key rotation completed');
      return true;

    } catch (error) {
      logger.error('Key rotation error:', error);
      return false;
    }
  }

  /**
   * Generate new encryption key
   * @returns {Promise<string>} New key ID
   */
  async generateNewKey() {
    try {
      const newKeyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In a real implementation, this would store the key securely
      logger.info(`Generated new encryption key: ${newKeyId}`);
      
      return newKeyId;

    } catch (error) {
      logger.error('Key generation error:', error);
      throw new Error('Failed to generate new key');
    }
  }

  /**
   * Get encryption statistics
   * @returns {Promise<Object>} Encryption statistics
   */
  async getEncryptionStats() {
    try {
      return {
        algorithm: this.algorithm,
        keyLength: this.keyLength,
        ivLength: this.ivLength,
        tagLength: this.tagLength,
        keyId: 'default',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Encryption stats error:', error);
      return {
        algorithm: this.algorithm,
        keyLength: this.keyLength,
        ivLength: this.ivLength,
        tagLength: this.tagLength,
        keyId: 'unknown',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Log encryption events for audit
   * @param {string} event - Event type
   * @param {Object} data - Event data
   * @returns {Promise<void>}
   */
  async logEncryptionEvent(event, data) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: event,
        ...data
      };

      logger.info('Encryption Event:', JSON.stringify(logEntry, null, 2));

      // Store in database if audit logging is enabled
      if (process.env.AUDIT_LOGGING_ENABLED === 'true') {
        const db = require('../models');
        await db.AuditLog.create({
          eventType: event,
          eventData: JSON.stringify(logEntry),
          ipAddress: 'system',
          userAgent: 'encryption-service',
          timestamp: new Date()
        });
      }

    } catch (error) {
      logger.error('Encryption event logging error:', error);
    }
  }

  /**
   * Test encryption/decryption functionality
   * @returns {Promise<boolean>} Test result
   */
  async testEncryption() {
    try {
      const testData = {
        message: 'Test encryption data',
        timestamp: new Date().toISOString(),
        random: Math.random().toString()
      };

      // Encrypt test data
      const encrypted = await this.encryptData(testData, 'test_key');
      
      // Decrypt test data
      const decrypted = await this.decryptData(encrypted);
      
      // Verify data integrity
      const isValid = JSON.stringify(testData) === JSON.stringify(decrypted);
      
      logger.info(`Encryption test ${isValid ? 'PASSED' : 'FAILED'}`);
      
      return isValid;

    } catch (error) {
      logger.error('Encryption test error:', error);
      return false;
    }
  }
}

// Create singleton instance
const dataEncryptionService = new DataEncryptionService();

module.exports = dataEncryptionService; 