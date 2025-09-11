const crypto = require('crypto');
const { promisify } = require('util');

class KeyManagementService {
  constructor() {
    // Load configuration from environment variables
    this.loadConfiguration();
  }

  /**
   * Load key management configuration from environment variables
   */
  loadConfiguration() {
    // Parse supported algorithms from environment
    const algorithmsEnv = process.env.KEY_ALGORITHMS || 'ECDSA-P256,RSA-2048,RSA-4096';
    const supportedAlgorithms = algorithmsEnv.split(',').map(alg => alg.trim());
    
    // Build key algorithms configuration
    this.keyAlgorithms = {};
    
    if (supportedAlgorithms.includes('ECDSA-P256')) {
      this.keyAlgorithms['ECDSA-P256'] = { name: 'ec', namedCurve: 'prime256v1' };
    }
    
    if (supportedAlgorithms.includes('RSA-2048')) {
      this.keyAlgorithms['RSA-2048'] = { name: 'rsa', modulusLength: 2048 };
    }
    
    if (supportedAlgorithms.includes('RSA-4096')) {
      this.keyAlgorithms['RSA-4096'] = { name: 'rsa', modulusLength: 4096 };
    }
    
    // Set default algorithm
    this.defaultAlgorithm = process.env.DEFAULT_KEY_ALGORITHM || 'ECDSA-P256';
    
    // Key generation settings
    this.keyIdPrefix = process.env.KEY_ID_PREFIX || 'KEY';
    this.keyExpiryDays = parseInt(process.env.KEY_EXPIRY_DAYS) || 365;
    
    // Encryption settings
    this.encryptionAlgorithm = process.env.KEY_ENCRYPTION_ALGORITHM || 'aes-256-gcm';
    this.encryptionSalt = process.env.KEY_ENCRYPTION_SALT || 'salt';
    
    console.log(`🔐 [KeyManagement] Loaded configuration:`, {
      supportedAlgorithms: Object.keys(this.keyAlgorithms),
      defaultAlgorithm: this.defaultAlgorithm,
      keyIdPrefix: this.keyIdPrefix,
      keyExpiryDays: this.keyExpiryDays
    });
  }

  /**
   * Generate a new key pair for signing
   * @param {Object} options - Key generation options
   * @param {string} options.algorithm - Key algorithm (defaults to DEFAULT_KEY_ALGORITHM)
   * @param {string} options.userId - User ID for key association
   * @returns {Promise<Object>} Generated key pair with metadata
   */
  async generateKeyPair(options) {
    const { algorithm = this.defaultAlgorithm, userId } = options;
    
    if (!this.keyAlgorithms[algorithm]) {
      throw new Error(`Unsupported key algorithm: ${algorithm}. Supported: ${Object.keys(this.keyAlgorithms).join(', ')}`);
    }

    try {
      // Generate key pair
      const keyPair = await this.generateKeyPairAsync(algorithm);
      
      // Create key metadata
      const keyId = this.generateKeyId();
      const keyData = {
        keyId,
        userId,
        keyType: algorithm,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey, // In production, this should be encrypted
        keyStatus: 'active',
        createdAt: new Date(),
        lastUsedAt: null
      };

      return keyData;
    } catch (error) {
      console.error('Error generating key pair:', error);
      throw new Error('Failed to generate key pair');
    }
  }

  /**
   * Generate key pair using Node.js crypto module
   * @param {string} algorithm - Key algorithm
   * @returns {Promise<Object>} Key pair
   */
  async generateKeyPairAsync(algorithm) {
    const algorithmConfig = this.keyAlgorithms[algorithm];
    
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(algorithmConfig.name, {
        ...algorithmConfig,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      }, (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
        } else {
          resolve({ publicKey, privateKey });
        }
      });
    });
  }

  /**
   * Generate a unique key ID
   * @returns {string} Unique key ID
   */
  generateKeyId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `${this.keyIdPrefix}-${timestamp}-${random}`;
  }

  /**
   * Encrypt private key for storage
   * @param {string} privateKey - Private key in PEM format
   * @param {string} password - Encryption password
   * @returns {Object} Encrypted key data
   */
  encryptPrivateKey(privateKey, password) {
    const algorithm = this.encryptionAlgorithm;
    const key = crypto.scryptSync(password, this.encryptionSalt, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm
    };
  }

  /**
   * Decrypt private key from storage
   * @param {Object} encryptedData - Encrypted key data
   * @param {string} password - Decryption password
   * @returns {string} Decrypted private key
   */
  decryptPrivateKey(encryptedData, password) {
    const { encrypted, iv, authTag, algorithm } = encryptedData;
    const key = crypto.scryptSync(password, this.encryptionSalt, 32);
    const decipher = crypto.createDecipher(algorithm, key);
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Generate a digital signature
   * @param {string} data - Data to sign
   * @param {string} privateKey - Private key in PEM format
   * @param {string} algorithm - Signing algorithm (defaults to DEFAULT_KEY_ALGORITHM)
   * @returns {Promise<Object>} Signature data
   */
  async generateSignature(data, privateKey, algorithm = this.defaultAlgorithm) {
    try {
      const algorithmConfig = this.keyAlgorithms[algorithm];
      
      // For ECDSA, we need to specify the hash algorithm
      const hashAlgorithm = algorithm === 'ECDSA-P256' ? 'sha256' : 'sha256';
      const sign = crypto.createSign(hashAlgorithm);
      
      sign.update(data);
      const signature = sign.sign(privateKey, 'hex');
      
      return {
        signature,
        algorithm: algorithmConfig.name,
        hashAlgorithm,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error generating signature:', error);
      throw new Error('Failed to generate signature');
    }
  }

  /**
   * Verify a digital signature
   * @param {string} data - Original data
   * @param {string} signature - Signature to verify
   * @param {string} publicKey - Public key in PEM format
   * @param {string} algorithm - Signature algorithm (defaults to DEFAULT_KEY_ALGORITHM)
   * @returns {Promise<boolean>} Verification result
   */
  async verifySignature(data, signature, publicKey, algorithm = this.defaultAlgorithm) {
    try {
      const algorithmConfig = this.keyAlgorithms[algorithm];
      
      // For ECDSA, we need to specify the hash algorithm
      const hashAlgorithm = algorithm === 'ECDSA-P256' ? 'sha256' : 'sha256';
      const verify = crypto.createVerify(hashAlgorithm);
      
      verify.update(data);
      const isValid = verify.verify(publicKey, signature, 'hex');
      
      return isValid;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Validate key format and structure
   * @param {Object} keyData - Key data to validate
   * @returns {boolean} Validation result
   */
  validateKeyData(keyData) {
    const requiredFields = ['keyId', 'keyType', 'publicKey', 'privateKey'];
    
    for (const field of requiredFields) {
      if (!keyData[field]) {
        return false;
      }
    }
    
    // Validate key type
    if (!this.keyAlgorithms[keyData.keyType]) {
      return false;
    }
    
    // Validate PEM format
    const pemRegex = /^-----BEGIN (PUBLIC|PRIVATE) KEY-----\n[\s\S]*\n-----END (PUBLIC|PRIVATE) KEY-----$/;
    if (!pemRegex.test(keyData.publicKey) || !pemRegex.test(keyData.privateKey)) {
      return false;
    }
    
    return true;
  }

  /**
   * Get supported key algorithms
   * @returns {Array} List of supported algorithms
   */
  getSupportedAlgorithms() {
    return Object.keys(this.keyAlgorithms);
  }

  /**
   * Get algorithm information
   * @param {string} algorithm - Algorithm name
   * @returns {Object} Algorithm information
   */
  getAlgorithmInfo(algorithm) {
    const info = this.keyAlgorithms[algorithm];
    if (!info) {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
    
    return {
      name: algorithm,
      ...info,
      description: this.getAlgorithmDescription(algorithm)
    };
  }

  /**
   * Get human-readable algorithm description
   * @param {string} algorithm - Algorithm name
   * @returns {string} Algorithm description
   */
  getAlgorithmDescription(algorithm) {
    const descriptions = {
      'ECDSA-P256': 'Elliptic Curve Digital Signature Algorithm with P-256 curve. Recommended for most use cases.',
      'RSA-2048': 'RSA algorithm with 2048-bit key length. Good balance of security and performance.',
      'RSA-4096': 'RSA algorithm with 4096-bit key length. Maximum security but slower performance.'
    };
    
    return descriptions[algorithm] || 'Unknown algorithm';
  }

  /**
   * Get current key management configuration
   * @returns {Object} Current configuration
   */
  getConfiguration() {
    return {
      supportedAlgorithms: Object.keys(this.keyAlgorithms),
      defaultAlgorithm: this.defaultAlgorithm,
      keyIdPrefix: this.keyIdPrefix,
      keyExpiryDays: this.keyExpiryDays,
      encryptionAlgorithm: this.encryptionAlgorithm,
      keyAlgorithms: this.keyAlgorithms
    };
  }

  /**
   * Reload configuration from environment variables
   * Useful for hot-reloading configuration without restart
   */
  reloadConfiguration() {
    console.log('🔄 [KeyManagement] Reloading configuration from environment...');
    this.loadConfiguration();
  }
}

module.exports = new KeyManagementService();
