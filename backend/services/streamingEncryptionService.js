/**
 * Streaming Encryption Service
 * 
 * This service provides streaming encryption capabilities for large files,
 * datasets, and models without loading everything into memory.
 * 
 * Features:
 * - Chunked encryption for large files
 * - Streaming support for binary data
 * - Progress tracking
 * - Memory-efficient processing
 * - Support for various file types (binary, text, JSON)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');
const logger = require('../utils/logger');

class StreamingEncryptionService {
  constructor() {
    // Validate required environment variables
    this.validateEnvironmentVariables();
    
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.chunkSize = parseInt(process.env.ENCRYPTION_CHUNK_SIZE);
    this.maxFileSize = parseInt(process.env.ENCRYPTION_STREAMING_MAX_SIZE);
  }
  
  validateEnvironmentVariables() {
    const requiredVars = [
      'ENCRYPTION_CHUNK_SIZE',
      'ENCRYPTION_STREAMING_MAX_SIZE'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Encrypt a large file using streaming
   * @param {string} inputPath - Path to input file
   * @param {string} outputPath - Path to output encrypted file
   * @param {Buffer} key - Encryption key
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} Encryption result with metadata
   */
  async encryptFile(inputPath, outputPath, key, metadata = {}) {
    try {
      const stats = fs.statSync(inputPath);
      if (stats.size > this.maxFileSize) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${this.maxFileSize})`);
      }

      // Generate random IV for the entire file
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Create encryption stream
      const encryptionStream = this.createEncryptionStream(key, iv);
      
      // Create file streams
      const inputStream = fs.createReadStream(inputPath, { highWaterMark: this.chunkSize });
      const outputStream = fs.createWriteStream(outputPath);

      // Write IV and metadata to output file first
      const header = {
        algorithm: this.algorithm,
        iv: iv.toString('hex'),
        keyId: metadata.keyId || 'default',
        originalSize: stats.size,
        chunkSize: this.chunkSize,
        timestamp: new Date().toISOString(),
        metadata: metadata
      };

      outputStream.write(JSON.stringify(header) + '\n');

      // Pipe through encryption
      return new Promise((resolve, reject) => {
        let totalEncrypted = 0;
        let chunkCount = 0;

        inputStream
          .pipe(encryptionStream)
          .on('data', (chunk) => {
            totalEncrypted += chunk.length;
            chunkCount++;
            
            // Write chunk size and data
            const chunkHeader = Buffer.alloc(4);
            chunkHeader.writeUInt32BE(chunk.length, 0);
            outputStream.write(chunkHeader);
            outputStream.write(chunk);
            
            // Log progress for large files
            if (chunkCount % 100 === 0) {
              const progress = (totalEncrypted / stats.size) * 100;
              logger.info(`Encryption progress: ${progress.toFixed(2)}% (${chunkCount} chunks)`);
            }
          })
          .on('end', () => {
            // Write final authentication tag
            const tag = encryptionStream.getAuthTag();
            const tagHeader = Buffer.alloc(4);
            tagHeader.writeUInt32BE(tag.length, 0);
            outputStream.write(tagHeader);
            outputStream.write(tag);
            
            outputStream.end();
            
            logger.info(`File encrypted successfully: ${inputPath} -> ${outputPath}`);
            resolve({
              success: true,
              inputPath,
              outputPath,
              originalSize: stats.size,
              encryptedSize: totalEncrypted + tag.length + (chunkCount * 4) + JSON.stringify(header).length + 1,
              chunkCount,
              algorithm: this.algorithm,
              keyId: metadata.keyId || 'default'
            });
          })
          .on('error', (error) => {
            logger.error('Encryption stream error:', error);
            reject(error);
          });

        outputStream.on('error', (error) => {
          logger.error('Output stream error:', error);
          reject(error);
        });
      });

    } catch (error) {
      logger.error('File encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt a large file using streaming
   * @param {string} inputPath - Path to encrypted file
   * @param {string} outputPath - Path to decrypted file
   * @param {Buffer} key - Decryption key
   * @returns {Promise<Object>} Decryption result
   */
  async decryptFile(inputPath, outputPath, key) {
    try {
      // Read header
      const fileContent = fs.readFileSync(inputPath);
      const headerEnd = fileContent.indexOf('\n');
      const header = JSON.parse(fileContent.slice(0, headerEnd).toString());
      
      // Validate header
      if (header.algorithm !== this.algorithm) {
        throw new Error(`Unsupported algorithm: ${header.algorithm}`);
      }

      // Create output directory
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Create decryption stream
      const decryptionStream = this.createDecryptionStream(key, Buffer.from(header.iv, 'hex'));
      
      // Create file streams
      const outputStream = fs.createWriteStream(outputPath);
      
      let offset = headerEnd + 1;
      let chunkCount = 0;
      let totalDecrypted = 0;

      // Process chunks
      while (offset < fileContent.length - 4) {
        // Read chunk size
        const chunkSizeBuffer = fileContent.slice(offset, offset + 4);
        const chunkSize = chunkSizeBuffer.readUInt32BE(0);
        offset += 4;

        // Read chunk data
        const chunkData = fileContent.slice(offset, offset + chunkSize);
        offset += chunkSize;

        // Write to decryption stream
        decryptionStream.write(chunkData);
        
        // Read decrypted data
        const decryptedChunk = decryptionStream.read();
        if (decryptedChunk) {
          outputStream.write(decryptedChunk);
          totalDecrypted += decryptedChunk.length;
        }
        
        chunkCount++;
        
        // Log progress
        if (chunkCount % 100 === 0) {
          const progress = (offset / fileContent.length) * 100;
          logger.info(`Decryption progress: ${progress.toFixed(2)}% (${chunkCount} chunks)`);
        }
      }

      // Read and verify final tag
      const tagSizeBuffer = fileContent.slice(offset, offset + 4);
      const tagSize = tagSizeBuffer.readUInt32BE(0);
      offset += 4;
      
      const tag = fileContent.slice(offset, offset + tagSize);
      decryptionStream.setAuthTag(tag);
      
      // Finalize decryption
      const finalChunk = decryptionStream.read();
      if (finalChunk) {
        outputStream.write(finalChunk);
        totalDecrypted += finalChunk.length;
      }
      
      outputStream.end();

      logger.info(`File decrypted successfully: ${inputPath} -> ${outputPath}`);
      return {
        success: true,
        inputPath,
        outputPath,
        decryptedSize: totalDecrypted,
        chunkCount,
        algorithm: header.algorithm,
        keyId: header.keyId
      };

    } catch (error) {
      logger.error('File decryption failed:', error);
      throw error;
    }
  }

  /**
   * Create encryption stream
   * @param {Buffer} key - Encryption key
   * @param {Buffer} iv - Initialization vector
   * @returns {Transform} Encryption stream
   */
  createEncryptionStream(key, iv) {
    const cipher = crypto.createCipherGCM(this.algorithm, key, iv);
    
    return new Transform({
      transform(chunk, encoding, callback) {
        try {
          const encrypted = cipher.update(chunk);
          callback(null, encrypted);
        } catch (error) {
          callback(error);
        }
      },
      flush(callback) {
        try {
          const final = cipher.final();
          callback(null, final);
        } catch (error) {
          callback(error);
        }
      },
      getAuthTag: () => cipher.getAuthTag()
    });
  }

  /**
   * Create decryption stream
   * @param {Buffer} key - Decryption key
   * @param {Buffer} iv - Initialization vector
   * @returns {Transform} Decryption stream
   */
  createDecryptionStream(key, iv) {
    const decipher = crypto.createDecipherGCM(this.algorithm, key, iv);
    
    return new Transform({
      transform(chunk, encoding, callback) {
        try {
          const decrypted = decipher.update(chunk);
          callback(null, decrypted);
        } catch (error) {
          callback(error);
        }
      },
      flush(callback) {
        try {
          const final = decipher.final();
          callback(null, final);
        } catch (error) {
          callback(error);
        }
      },
      setAuthTag: (tag) => decipher.setAuthTag(tag)
    });
  }

  /**
   * Encrypt data in chunks for API responses
   * @param {Buffer|string} data - Data to encrypt
   * @param {Buffer} key - Encryption key
   * @param {Object} metadata - Metadata
   * @returns {Promise<Object>} Encrypted data with chunks
   */
  async encryptDataChunked(data, key, metadata = {}) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipherGCM(this.algorithm, key, iv);
      
      const chunks = [];
      let totalSize = 0;
      
      // Process data in chunks
      for (let i = 0; i < data.length; i += this.chunkSize) {
        const chunk = data.slice(i, i + this.chunkSize);
        const encrypted = cipher.update(chunk);
        chunks.push(encrypted.toString('base64'));
        totalSize += encrypted.length;
      }
      
      const final = cipher.final();
      if (final.length > 0) {
        chunks.push(final.toString('base64'));
        totalSize += final.length;
      }
      
      const tag = cipher.getAuthTag();
      
      return {
        algorithm: this.algorithm,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        chunks: chunks,
        chunkCount: chunks.length,
        totalSize: totalSize,
        keyId: metadata.keyId || 'default',
        timestamp: new Date().toISOString(),
        metadata: metadata
      };
      
    } catch (error) {
      logger.error('Chunked encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt chunked data
   * @param {Object} encryptedData - Encrypted data with chunks
   * @param {Buffer} key - Decryption key
   * @returns {Promise<Buffer>} Decrypted data
   */
  async decryptDataChunked(encryptedData, key) {
    try {
      const decipher = crypto.createDecipherGCM(
        encryptedData.algorithm, 
        key, 
        Buffer.from(encryptedData.iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
      
      let decrypted = Buffer.alloc(0);
      
      // Process each chunk
      for (const chunkBase64 of encryptedData.chunks) {
        const chunk = Buffer.from(chunkBase64, 'base64');
        const decryptedChunk = decipher.update(chunk);
        decrypted = Buffer.concat([decrypted, decryptedChunk]);
      }
      
      const final = decipher.final();
      if (final.length > 0) {
        decrypted = Buffer.concat([decrypted, final]);
      }
      
      return decrypted;
      
    } catch (error) {
      logger.error('Chunked decryption failed:', error);
      throw error;
    }
  }
}

module.exports = new StreamingEncryptionService();
