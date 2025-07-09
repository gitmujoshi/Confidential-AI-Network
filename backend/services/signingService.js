/**
 * Enterprise DID Signing Service
 * 
 * This service provides secure signing operations for DID-based contract signing.
 * It manages private keys securely and provides a REST API for signing requests.
 * 
 * Security Features:
 * - Private keys stored securely (not exposed to frontend)
 * - Authentication and authorization required
 * - Audit logging for all signing operations
 * - Support for multiple enterprise DIDs
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class SigningService {
  constructor() {
    // Enterprise private keys (in production, these would be stored in HSM/KMS)
    this.enterpriseKeys = new Map();
    
    // Initialize with your enterprise DID
    this.initializeEnterpriseKeys();
    
    console.log('🔐 Enterprise Signing Service initialized');
  }

  /**
   * Initialize enterprise private keys
   * In production, these would be loaded from secure storage (HSM, KMS, etc.)
   */
  initializeEnterpriseKeys() {
    // Your enterprise DID private key (replace with actual private key)
    const enterprisePrivateJwk = {
      "kty": "EC",
      "crv": "P-256",
      "x": "FFQw_IJcWPr8qZrwq48azt1hVM8JNp3nnJ0367TxUyQ=",
      "y": "AkPYsoJhbJNqIRGwnUHQN2D3cq4MPtzlVPx8BVuzTAo=",
      "d": "YOUR_ENTERPRISE_PRIVATE_KEY_D_VALUE", // Replace with actual private key
      "kid": "120c453f6d39fe0b8dfecceba8b0e7992f9bc650c2bf4001d2e448907b140877",
      "alg": "ES256"
    };

    this.enterpriseKeys.set('did:web:gitmujoshi.github.io', {
      privateJwk: enterprisePrivateJwk,
      publicJwk: {
        "kty": "EC",
        "crv": "P-256",
        "x": "FFQw_IJcWPr8qZrwq48azt1hVM8JNp3nnJ0367TxUyQ=",
        "y": "AkPYsoJhbJNqIRGwnUHQN2D3cq4MPtzlVPx8BVuzTAo=",
        "kid": "120c453f6d39fe0b8dfecceba8b0e7992f9bc650c2bf4001d2e448907b140877",
        "alg": "ES256"
      }
    });

    console.log('✅ Enterprise keys loaded for:', Array.from(this.enterpriseKeys.keys()));
  }

  /**
   * Sign a message with ES256 using the enterprise private key
   * @param {string} message - Message to sign
   * @param {string} did - DID to use for signing
   * @param {string} userId - User requesting the signature
   * @returns {Object} Signature result
   */
  async signMessage(message, did, userId) {
    try {
      console.log('🔐 Enterprise signing request:', { did, userId, messageLength: message.length });

      // Validate inputs
      if (!message || !did || !userId) {
        throw new Error('Missing required parameters: message, did, userId');
      }

      // Check if we have the private key for this DID
      const keyPair = this.enterpriseKeys.get(did);
      if (!keyPair) {
        throw new Error(`No private key available for DID: ${did}`);
      }

      // Convert JWK to PEM for Node.js crypto
      const privateKeyPem = this.jwkToPem(keyPair.privateJwk);
      
      // Sign the message
      const sign = crypto.createSign('SHA256');
      sign.update(message);
      const signature = sign.sign(privateKeyPem, 'base64');
      
      // Convert to base64url format
      const signatureBase64Url = signature
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // Log the signing operation for audit
      await this.logSigningOperation({
        did,
        userId,
        message,
        signature: signatureBase64Url,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Enterprise signing completed successfully');

      return {
        success: true,
        signature: signatureBase64Url,
        did,
        message,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Enterprise signing failed:', error.message);
      throw error;
    }
  }

  /**
   * Convert JWK to PEM format for Node.js crypto
   * @param {Object} jwk - JSON Web Key
   * @returns {string} PEM format private key
   */
  jwkToPem(jwk) {
    if (!jwk.d) {
      throw new Error('Private JWK must include "d" field');
    }

    // Convert base64url to base64
    const x = jwk.x.replace(/-/g, '+').replace(/_/g, '/');
    const y = jwk.y.replace(/-/g, '+').replace(/_/g, '/');
    const d = jwk.d.replace(/-/g, '+').replace(/_/g, '/');

    // Create DER format
    const der = Buffer.concat([
      Buffer.from([0x30, 0x77, 0x02, 0x01, 0x01]), // Version
      Buffer.from([0x04, 0x20]), // Private key
      Buffer.from(d, 'base64'),
      Buffer.from([0xa0, 0x0a, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]), // Algorithm
      Buffer.from([0xa1, 0x44, 0x03, 0x42, 0x00, 0x04]), // Public key
      Buffer.from(x, 'base64'),
      Buffer.from(y, 'base64')
    ]);

    return `-----BEGIN EC PRIVATE KEY-----\n${der.toString('base64')}\n-----END EC PRIVATE KEY-----`;
  }

  /**
   * Log signing operation for audit purposes
   * @param {Object} operation - Signing operation details
   */
  async logSigningOperation(operation) {
    try {
      // In production, this would go to a secure audit log
      console.log('📋 [AUDIT] Signing operation:', {
        timestamp: operation.timestamp,
        did: operation.did,
        userId: operation.userId,
        messageLength: operation.message.length,
        signatureLength: operation.signature.length
      });

      // You could also store this in a database for audit purposes
      // await AuditLog.create({
      //   action: 'DID_SIGNING',
      //   userId: operation.userId,
      //   details: {
      //     did: operation.did,
      //     messageHash: crypto.createHash('sha256').update(operation.message).digest('hex'),
      //     signatureLength: operation.signature.length
      //   },
      //   timestamp: new Date()
      // });

    } catch (error) {
      console.error('❌ Failed to log signing operation:', error.message);
    }
  }

  /**
   * Get available enterprise DIDs
   * @returns {Array} List of available DIDs
   */
  getAvailableDIDs() {
    return Array.from(this.enterpriseKeys.keys());
  }

  /**
   * Get public key for a DID
   * @param {string} did - DID to get public key for
   * @returns {Object} Public JWK
   */
  getPublicKey(did) {
    const keyPair = this.enterpriseKeys.get(did);
    if (!keyPair) {
      throw new Error(`No public key available for DID: ${did}`);
    }
    return keyPair.publicJwk;
  }

  /**
   * Validate that a user can sign with a specific DID
   * @param {string} userId - User ID
   * @param {string} did - DID to validate
   * @returns {boolean} Whether user can sign with this DID
   */
  async validateUserSigningPermission(userId, did) {
    try {
      // In production, this would check user permissions, roles, etc.
      const user = await User.findOne({ where: { id: userId } });
      
      if (!user) {
        return false;
      }

      // For now, allow any authenticated user to sign with enterprise DIDs
      // In production, you'd check specific permissions, roles, etc.
      return this.enterpriseKeys.has(did);

    } catch (error) {
      console.error('❌ Error validating user signing permission:', error.message);
      return false;
    }
  }
}

module.exports = SigningService; 