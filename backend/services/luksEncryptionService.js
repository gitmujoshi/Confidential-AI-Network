/**
 * LUKS Encryption Service
 * 
 * This service provides LUKS-based encryption for large datasets and models.
 * LUKS (Linux Unified Key Setup) is ideal for large files due to:
 * - Hardware-accelerated encryption
 * - Block-level processing
 * - Built-in key management
 * - Industry-standard security
 * 
 * Features:
 * - LUKS container creation and management
 * - Key slot management
 * - Progress tracking for large files
 * - Support for various file systems
 * - Automatic cleanup and error handling
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class LUKSEncryptionService {
  constructor() {
    // Validate required environment variables
    this.validateEnvironmentVariables();
    
    this.luksPath = '/usr/bin/cryptsetup';
    this.tempDir = process.env.ENCRYPTION_TEMP_DIR;
    this.maxFileSize = parseInt(process.env.ENCRYPTION_LUKS_MAX_SIZE);
    this.keySize = parseInt(process.env.LUKS_KEY_SIZE) / 8; // Convert bits to bytes
    this.cipher = process.env.LUKS_CIPHER;
    this.hash = process.env.LUKS_HASH;
    this.iterations = parseInt(process.env.LUKS_PBKDF2_ITERATIONS);
    this.containerDir = process.env.LUKS_CONTAINER_DIR;
    
    // Ensure temp directory exists
    this.ensureTempDir();
  }
  
  validateEnvironmentVariables() {
    const requiredVars = [
      'ENCRYPTION_TEMP_DIR',
      'ENCRYPTION_LUKS_MAX_SIZE',
      'LUKS_KEY_SIZE',
      'LUKS_CIPHER',
      'LUKS_HASH',
      'LUKS_PBKDF2_ITERATIONS',
      'LUKS_CONTAINER_DIR'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Ensure temporary directory exists
   */
  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Check if LUKS is available on the system
   * @returns {Promise<boolean>} True if LUKS is available
   */
  async isLUKSAvailable() {
    return new Promise((resolve) => {
      exec(`${this.luksPath} --version`, (error) => {
        resolve(!error);
      });
    });
  }

  /**
   * Create a LUKS container for a large file
   * @param {string} inputPath - Path to input file
   * @param {string} outputPath - Path to LUKS container
   * @param {string} password - Password for LUKS container
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Creation result
   */
  async createLUKSContainer(inputPath, outputPath, password, options = {}) {
    try {
      // Check if LUKS is available
      if (!(await this.isLUKSAvailable())) {
        throw new Error('LUKS (cryptsetup) is not available on this system');
      }

      const stats = fs.statSync(inputPath);
      if (stats.size > this.maxFileSize) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${this.maxFileSize})`);
      }

      // Create output directory
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate a random key file for LUKS
      const keyFile = path.join(this.tempDir, `key-${Date.now()}.key`);
      const randomKey = crypto.randomBytes(this.keySize);
      fs.writeFileSync(keyFile, randomKey);

      // Create LUKS container
      const containerSize = Math.ceil(stats.size * 1.1); // 10% overhead
      const containerSizeMB = Math.ceil(containerSize / (1024 * 1024));

      logger.info(`Creating LUKS container: ${containerSizeMB}MB for file: ${inputPath}`);

      // Step 1: Create LUKS container
      await this.runCryptsetup([
        'luksFormat',
        '--cipher', this.cipher,
        '--hash', this.hash,
        '--key-size', '256',
        '--iter-time', this.iterations.toString(),
        '--key-file', keyFile,
        outputPath
      ]);

      // Step 2: Open LUKS container
      const deviceName = `luks-${Date.now()}`;
      const devicePath = `/dev/mapper/${deviceName}`;
      
      await this.runCryptsetup([
        'luksOpen',
        '--key-file', keyFile,
        outputPath,
        deviceName
      ]);

      try {
        // Step 3: Create filesystem in LUKS container
        await this.runCommand(`mkfs.ext4 -F ${devicePath}`);
        
        // Step 4: Mount LUKS container
        const mountPoint = path.join(this.tempDir, `mount-${Date.now()}`);
        fs.mkdirSync(mountPoint);
        
        await this.runCommand(`mount ${devicePath} ${mountPoint}`);
        
        try {
          // Step 5: Copy file to LUKS container
          const fileName = path.basename(inputPath);
          const targetPath = path.join(mountPoint, fileName);
          
          await this.copyFileWithProgress(inputPath, targetPath, (progress) => {
            logger.info(`Copying file: ${progress.toFixed(2)}%`);
          });
          
          // Step 6: Create metadata file
          const metadata = {
            algorithm: 'LUKS',
            cipher: this.cipher,
            hash: this.hash,
            keySize: 256,
            originalSize: stats.size,
            containerSize: containerSize,
            fileName: fileName,
            timestamp: new Date().toISOString(),
            ...options
          };
          
          fs.writeFileSync(
            path.join(mountPoint, '.luks-metadata.json'),
            JSON.stringify(metadata, null, 2)
          );
          
        } finally {
          // Unmount LUKS container
          await this.runCommand(`umount ${mountPoint}`);
          fs.rmdirSync(mountPoint);
        }
        
        // Step 7: Close LUKS container
        await this.runCryptsetup(['luksClose', deviceName]);
        
        // Clean up key file
        fs.unlinkSync(keyFile);
        
        logger.info(`LUKS container created successfully: ${outputPath}`);
        
        return {
          success: true,
          inputPath,
          outputPath,
          originalSize: stats.size,
          containerSize: containerSize,
          algorithm: 'LUKS',
          cipher: this.cipher,
          hash: this.hash,
          keySize: 256,
          metadata: metadata
        };
        
      } catch (error) {
        // Clean up on error
        try {
          await this.runCryptsetup(['luksClose', deviceName]);
        } catch (cleanupError) {
          logger.warn('Error during cleanup:', cleanupError.message);
        }
        throw error;
      }
      
    } catch (error) {
      logger.error('LUKS container creation failed:', error);
      throw error;
    }
  }

  /**
   * Extract file from LUKS container
   * @param {string} containerPath - Path to LUKS container
   * @param {string} outputPath - Path to extract file
   * @param {string} password - Password for LUKS container
   * @returns {Promise<Object>} Extraction result
   */
  async extractFromLUKS(containerPath, outputPath, password) {
    try {
      if (!(await this.isLUKSAvailable())) {
        throw new Error('LUKS (cryptsetup) is not available on this system');
      }

      // Generate temporary key file
      const keyFile = path.join(this.tempDir, `key-${Date.now()}.key`);
      const randomKey = crypto.randomBytes(this.keySize);
      fs.writeFileSync(keyFile, randomKey);

      // Open LUKS container
      const deviceName = `luks-extract-${Date.now()}`;
      const devicePath = `/dev/mapper/${deviceName}`;
      
      await this.runCryptsetup([
        'luksOpen',
        '--key-file', keyFile,
        containerPath,
        deviceName
      ]);

      try {
        // Mount LUKS container
        const mountPoint = path.join(this.tempDir, `mount-extract-${Date.now()}`);
        fs.mkdirSync(mountPoint);
        
        await this.runCommand(`mount ${devicePath} ${mountPoint}`);
        
        try {
          // Read metadata
          const metadataPath = path.join(mountPoint, '.luks-metadata.json');
          let metadata = {};
          if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          }
          
          // Find the file to extract
          const files = fs.readdirSync(mountPoint);
          const dataFile = files.find(f => f !== '.luks-metadata.json');
          
          if (!dataFile) {
            throw new Error('No data file found in LUKS container');
          }
          
          // Create output directory
          const outputDir = path.dirname(outputPath);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          // Copy file from LUKS container
          const sourcePath = path.join(mountPoint, dataFile);
          await this.copyFileWithProgress(sourcePath, outputPath, (progress) => {
            logger.info(`Extracting file: ${progress.toFixed(2)}%`);
          });
          
          logger.info(`File extracted successfully: ${outputPath}`);
          
          return {
            success: true,
            containerPath,
            outputPath,
            extractedSize: fs.statSync(outputPath).size,
            algorithm: 'LUKS',
            metadata: metadata
          };
          
        } finally {
          // Unmount LUKS container
          await this.runCommand(`umount ${mountPoint}`);
          fs.rmdirSync(mountPoint);
        }
        
      } finally {
        // Close LUKS container
        await this.runCryptsetup(['luksClose', deviceName]);
        
        // Clean up key file
        fs.unlinkSync(keyFile);
      }
      
    } catch (error) {
      logger.error('LUKS extraction failed:', error);
      throw error;
    }
  }

  /**
   * Get LUKS container information
   * @param {string} containerPath - Path to LUKS container
   * @returns {Promise<Object>} Container information
   */
  async getLUKSInfo(containerPath) {
    try {
      if (!(await this.isLUKSAvailable())) {
        throw new Error('LUKS (cryptsetup) is not available on this system');
      }

      const result = await this.runCryptsetup(['luksDump', containerPath]);
      
      // Parse LUKS dump output
      const info = {
        path: containerPath,
        size: fs.statSync(containerPath).size,
        algorithm: 'LUKS',
        timestamp: new Date().toISOString()
      };
      
      // Extract key information from dump
      const lines = result.split('\n');
      for (const line of lines) {
        if (line.includes('Cipher:')) {
          info.cipher = line.split(':')[1].trim();
        } else if (line.includes('Hash spec:')) {
          info.hash = line.split(':')[1].trim();
        } else if (line.includes('Key bits:')) {
          info.keySize = parseInt(line.split(':')[1].trim());
        }
      }
      
      return info;
      
    } catch (error) {
      logger.error('Failed to get LUKS info:', error);
      throw error;
    }
  }

  /**
   * Run cryptsetup command
   * @param {Array} args - Command arguments
   * @returns {Promise<string>} Command output
   */
  async runCryptsetup(args) {
    return new Promise((resolve, reject) => {
      const child = spawn(this.luksPath, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`cryptsetup failed: ${stderr}`));
        }
      });
    });
  }

  /**
   * Run shell command
   * @param {string} command - Command to run
   * @returns {Promise<string>} Command output
   */
  async runCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Copy file with progress callback
   * @param {string} source - Source file path
   * @param {string} target - Target file path
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<void>}
   */
  async copyFileWithProgress(source, target, progressCallback) {
    return new Promise((resolve, reject) => {
      const stats = fs.statSync(source);
      const totalSize = stats.size;
      let copiedSize = 0;
      
      const readStream = fs.createReadStream(source);
      const writeStream = fs.createWriteStream(target);
      
      readStream.on('data', (chunk) => {
        copiedSize += chunk.length;
        const progress = (copiedSize / totalSize) * 100;
        progressCallback(progress);
      });
      
      readStream.on('end', () => {
        writeStream.end();
        resolve();
      });
      
      readStream.on('error', reject);
      writeStream.on('error', reject);
    });
  }

  /**
   * Clean up temporary files
   */
  async cleanup() {
    try {
      if (fs.existsSync(this.tempDir)) {
        const files = fs.readdirSync(this.tempDir);
        for (const file of files) {
          const filePath = path.join(this.tempDir, file);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      logger.warn('Cleanup failed:', error.message);
    }
  }
}

module.exports = new LUKSEncryptionService();
