/**
 * Key Management Service Unit Tests
 * 
 * Comprehensive unit tests for the key management service including
 * key generation, encryption, signature generation, and verification.
 * 
 * @author Contract Management System Team
 * @version 1.0.0
 * @since 2024-01-XX
 */

const keyManagementService = require('../../services/keyManagementService');
const crypto = require('crypto');

describe('Key Management Service', () => {
  let testKeyPair;
  const testData = 'test data for signing';
  const testPassword = 'test-password-123';

  beforeEach(() => {
    // Reset any state before each test
    testKeyPair = null;
  });

  describe('Key Generation', () => {
    test('should generate ECDSA-P256 key pair', async () => {
      const keyData = await keyManagementService.generateKeyPair({
        algorithm: 'ECDSA-P256',
        userId: 1
      });

      expect(keyData).toBeDefined();
      expect(keyData.keyId).toBeDefined();
      expect(keyData.userId).toBe(1);
      expect(keyData.keyType).toBe('ECDSA-P256');
      expect(keyData.publicKey).toBeDefined();
      expect(keyData.privateKey).toBeDefined();
      expect(keyData.keyStatus).toBe('active');
      expect(keyData.createdAt).toBeDefined();

      // Validate PEM format
      expect(keyData.publicKey).toMatch(/-----BEGIN PUBLIC KEY-----/);
      expect(keyData.privateKey).toMatch(/-----BEGIN PRIVATE KEY-----/);

      testKeyPair = keyData;
    });

    test('should generate RSA-2048 key pair', async () => {
      const keyData = await keyManagementService.generateKeyPair({
        algorithm: 'RSA-2048',
        userId: 2
      });

      expect(keyData).toBeDefined();
      expect(keyData.keyType).toBe('RSA-2048');
      expect(keyData.publicKey).toBeDefined();
      expect(keyData.privateKey).toBeDefined();

      // Validate PEM format
      expect(keyData.publicKey).toMatch(/-----BEGIN PUBLIC KEY-----/);
      expect(keyData.privateKey).toMatch(/-----BEGIN PRIVATE KEY-----/);
    });

    test('should generate RSA-4096 key pair', async () => {
      const keyData = await keyManagementService.generateKeyPair({
        algorithm: 'RSA-4096',
        userId: 3
      });

      expect(keyData).toBeDefined();
      expect(keyData.keyType).toBe('RSA-4096');
      expect(keyData.publicKey).toBeDefined();
      expect(keyData.privateKey).toBeDefined();
    });

    test('should throw error for unsupported algorithm', async () => {
      await expect(
        keyManagementService.generateKeyPair({
          algorithm: 'UNSUPPORTED-ALGORITHM',
          userId: 1
        })
      ).rejects.toThrow('Unsupported key algorithm: UNSUPPORTED-ALGORITHM');
    });

    test('should generate unique key IDs', async () => {
      const key1 = await keyManagementService.generateKeyPair({
        algorithm: 'ECDSA-P256',
        userId: 1
      });
      
      const key2 = await keyManagementService.generateKeyPair({
        algorithm: 'ECDSA-P256',
        userId: 1
      });

      expect(key1.keyId).not.toBe(key2.keyId);
    });
  });

  describe('Key Encryption/Decryption', () => {
    test('should encrypt and decrypt private key', () => {
      const privateKey = testKeyPair?.privateKey || '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----';
      
      const encrypted = keyManagementService.encryptPrivateKey(privateKey, testPassword);
      
      expect(encrypted).toBeDefined();
      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');

      const decrypted = keyManagementService.decryptPrivateKey(encrypted, testPassword);
      expect(decrypted).toBe(privateKey);
    });

    test('should fail to decrypt with wrong password', () => {
      const privateKey = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----';
      const encrypted = keyManagementService.encryptPrivateKey(privateKey, testPassword);
      
      expect(() => {
        keyManagementService.decryptPrivateKey(encrypted, 'wrong-password');
      }).toThrow();
    });

    test('should handle empty private key', () => {
      const privateKey = '';
      const encrypted = keyManagementService.encryptPrivateKey(privateKey, testPassword);
      const decrypted = keyManagementService.decryptPrivateKey(encrypted, testPassword);
      
      expect(decrypted).toBe(privateKey);
    });
  });

  describe('Signature Generation', () => {
    beforeEach(async () => {
      if (!testKeyPair) {
        testKeyPair = await keyManagementService.generateKeyPair({
          algorithm: 'ECDSA-P256',
          userId: 1
        });
      }
    });

    test('should generate signature for ECDSA-P256', async () => {
      const signature = await keyManagementService.generateSignature(
        testData,
        testKeyPair.privateKey,
        'ECDSA-P256'
      );

      expect(signature).toBeDefined();
      expect(signature.signature).toBeDefined();
      expect(signature.algorithm).toBe('ECDSA');
      expect(signature.timestamp).toBeDefined();
      expect(typeof signature.signature).toBe('string');
    });

    test('should generate different signatures for different data', async () => {
      const data1 = 'test data 1';
      const data2 = 'test data 2';

      const sig1 = await keyManagementService.generateSignature(
        data1,
        testKeyPair.privateKey,
        'ECDSA-P256'
      );

      const sig2 = await keyManagementService.generateSignature(
        data2,
        testKeyPair.privateKey,
        'ECDSA-P256'
      );

      expect(sig1.signature).not.toBe(sig2.signature);
    });

    test('should generate different signatures for same data with different keys', async () => {
      const keyPair2 = await keyManagementService.generateKeyPair({
        algorithm: 'ECDSA-P256',
        userId: 2
      });

      const sig1 = await keyManagementService.generateSignature(
        testData,
        testKeyPair.privateKey,
        'ECDSA-P256'
      );

      const sig2 = await keyManagementService.generateSignature(
        testData,
        keyPair2.privateKey,
        'ECDSA-P256'
      );

      expect(sig1.signature).not.toBe(sig2.signature);
    });

    test('should handle empty data', async () => {
      const signature = await keyManagementService.generateSignature(
        '',
        testKeyPair.privateKey,
        'ECDSA-P256'
      );

      expect(signature).toBeDefined();
      expect(signature.signature).toBeDefined();
    });

    test('should handle large data', async () => {
      const largeData = 'x'.repeat(10000);
      const signature = await keyManagementService.generateSignature(
        largeData,
        testKeyPair.privateKey,
        'ECDSA-P256'
      );

      expect(signature).toBeDefined();
      expect(signature.signature).toBeDefined();
    });
  });

  describe('Signature Verification', () => {
    beforeEach(async () => {
      if (!testKeyPair) {
        testKeyPair = await keyManagementService.generateKeyPair({
          algorithm: 'ECDSA-P256',
          userId: 1
        });
      }
    });

    test('should verify valid signature', async () => {
      const signature = await keyManagementService.generateSignature(
        testData,
        testKeyPair.privateKey,
        'ECDSA-P256'
      );

      const isValid = await keyManagementService.verifySignature(
        testData,
        signature.signature,
        testKeyPair.publicKey,
        'ECDSA-P256'
      );

      expect(isValid).toBe(true);
    });

    test('should reject invalid signature', async () => {
      const signature = await keyManagementService.generateSignature(
        testData,
        testKeyPair.privateKey,
        'ECDSA-P256'
      );

      const isValid = await keyManagementService.verifySignature(
        'different data',
        signature.signature,
        testKeyPair.publicKey,
        'ECDSA-P256'
      );

      expect(isValid).toBe(false);
    });

    test('should reject signature with wrong public key', async () => {
      const keyPair2 = await keyManagementService.generateKeyPair({
        algorithm: 'ECDSA-P256',
        userId: 2
      });

      const signature = await keyManagementService.generateSignature(
        testData,
        testKeyPair.privateKey,
        'ECDSA-P256'
      );

      const isValid = await keyManagementService.verifySignature(
        testData,
        signature.signature,
        keyPair2.publicKey,
        'ECDSA-P256'
      );

      expect(isValid).toBe(false);
    });

    test('should handle corrupted signature', async () => {
      const corruptedSignature = 'corrupted-signature-data';

      const isValid = await keyManagementService.verifySignature(
        testData,
        corruptedSignature,
        testKeyPair.publicKey,
        'ECDSA-P256'
      );

      expect(isValid).toBe(false);
    });

    test('should handle empty signature', async () => {
      const isValid = await keyManagementService.verifySignature(
        testData,
        '',
        testKeyPair.publicKey,
        'ECDSA-P256'
      );

      expect(isValid).toBe(false);
    });
  });

  describe('Key Validation', () => {
    test('should validate correct key data', () => {
      const validKeyData = {
        keyId: 'KEY-123',
        keyType: 'ECDSA-P256',
        publicKey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
        privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----'
      };

      const isValid = keyManagementService.validateKeyData(validKeyData);
      expect(isValid).toBe(true);
    });

    test('should reject key data with missing fields', () => {
      const invalidKeyData = {
        keyId: 'KEY-123',
        keyType: 'ECDSA-P256'
        // Missing publicKey and privateKey
      };

      const isValid = keyManagementService.validateKeyData(invalidKeyData);
      expect(isValid).toBe(false);
    });

    test('should reject key data with unsupported key type', () => {
      const invalidKeyData = {
        keyId: 'KEY-123',
        keyType: 'UNSUPPORTED-TYPE',
        publicKey: '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----',
        privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----'
      };

      const isValid = keyManagementService.validateKeyData(invalidKeyData);
      expect(isValid).toBe(false);
    });

    test('should reject key data with invalid PEM format', () => {
      const invalidKeyData = {
        keyId: 'KEY-123',
        keyType: 'ECDSA-P256',
        publicKey: 'invalid-pem-format',
        privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----'
      };

      const isValid = keyManagementService.validateKeyData(invalidKeyData);
      expect(isValid).toBe(false);
    });
  });

  describe('Algorithm Information', () => {
    test('should get supported algorithms', () => {
      const algorithms = keyManagementService.getSupportedAlgorithms();
      
      expect(Array.isArray(algorithms)).toBe(true);
      expect(algorithms).toContain('ECDSA-P256');
      expect(algorithms).toContain('RSA-2048');
      expect(algorithms).toContain('RSA-4096');
    });

    test('should get algorithm info for ECDSA-P256', () => {
      const info = keyManagementService.getAlgorithmInfo('ECDSA-P256');
      
      expect(info).toBeDefined();
      expect(info.name).toBe('ECDSA-P256');
      expect(info.description).toBeDefined();
      expect(info.name).toBe('ECDSA');
      expect(info.namedCurve).toBe('P-256');
    });

    test('should get algorithm info for RSA-2048', () => {
      const info = keyManagementService.getAlgorithmInfo('RSA-2048');
      
      expect(info).toBeDefined();
      expect(info.name).toBe('RSA-2048');
      expect(info.description).toBeDefined();
      expect(info.name).toBe('RSA');
      expect(info.modulusLength).toBe(2048);
    });

    test('should throw error for unsupported algorithm info', () => {
      expect(() => {
        keyManagementService.getAlgorithmInfo('UNSUPPORTED-ALGORITHM');
      }).toThrow('Unsupported algorithm: UNSUPPORTED-ALGORITHM');
    });

    test('should get algorithm description', () => {
      const description = keyManagementService.getAlgorithmDescription('ECDSA-P256');
      
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle key generation errors gracefully', async () => {
      // Mock crypto.generateKeyPair to throw an error
      const originalGenerateKeyPair = crypto.generateKeyPair;
      crypto.generateKeyPair = jest.fn((algorithm, options, callback) => {
        callback(new Error('Mock key generation error'));
      });

      await expect(
        keyManagementService.generateKeyPair({
          algorithm: 'ECDSA-P256',
          userId: 1
        })
      ).rejects.toThrow('Failed to generate key pair');

      // Restore original function
      crypto.generateKeyPair = originalGenerateKeyPair;
    });

    test('should handle signature generation errors gracefully', async () => {
      const invalidPrivateKey = 'invalid-private-key';

      await expect(
        keyManagementService.generateSignature(
          testData,
          invalidPrivateKey,
          'ECDSA-P256'
        )
      ).rejects.toThrow('Failed to generate signature');
    });

    test('should handle signature verification errors gracefully', async () => {
      const invalidPublicKey = 'invalid-public-key';
      const signature = 'test-signature';

      const result = await keyManagementService.verifySignature(
        testData,
        signature,
        invalidPublicKey,
        'ECDSA-P256'
      );

      expect(result).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('should generate key pair within reasonable time', async () => {
      const startTime = Date.now();
      
      await keyManagementService.generateKeyPair({
        algorithm: 'ECDSA-P256',
        userId: 1
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    test('should generate signature within reasonable time', async () => {
      if (!testKeyPair) {
        testKeyPair = await keyManagementService.generateKeyPair({
          algorithm: 'ECDSA-P256',
          userId: 1
        });
      }

      const startTime = Date.now();
      
      await keyManagementService.generateSignature(
        testData,
        testKeyPair.privateKey,
        'ECDSA-P256'
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });

    test('should verify signature within reasonable time', async () => {
      if (!testKeyPair) {
        testKeyPair = await keyManagementService.generateKeyPair({
          algorithm: 'ECDSA-P256',
          userId: 1
        });
      }

      const signature = await keyManagementService.generateSignature(
        testData,
        testKeyPair.privateKey,
        'ECDSA-P256'
      );

      const startTime = Date.now();
      
      await keyManagementService.verifySignature(
        testData,
        signature.signature,
        testKeyPair.publicKey,
        'ECDSA-P256'
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
