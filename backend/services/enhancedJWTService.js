/**
 * Enhanced JWT Token Service
 * 
 * This service provides advanced JWT token management for the confidential AI training platform
 * with data access control, role-based permissions, and integration with platform encryption.
 * 
 * Features:
 * - Multi-purpose JWT tokens (authentication, data access, TEE attestation)
 * - Role-based access control (TDP, TDC, CCRP, AppAdmin)
 * - Token lifecycle management (creation, validation, refresh, revocation)
 * - Integration with platform encryption workflow
 * - Audit logging for all token operations
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class EnhancedJWTService {
  constructor(platformEncryptionService) {
    this.platformEncryptionService = platformEncryptionService;
    
    // Token configuration
    this.tokenConfig = {
      // Token types and their purposes
      tokenTypes: {
        AUTHENTICATION: 'auth',
        DATA_ACCESS: 'data_access',
        TEE_ATTESTATION: 'tee_attestation',
        TRAINING_EXECUTION: 'training_execution',
        ADMIN_ACCESS: 'admin_access'
      },
      
      // User roles and their permissions
      rolePermissions: {
        TDP: ['upload_data', 'manage_datasets', 'view_own_data'],
        TDC: ['request_data', 'create_contracts', 'execute_training', 'view_own_contracts'],
        CCRP: ['provision_tee', 'manage_environments', 'monitor_training', 'view_own_environments'],
        AppAdmin: ['manage_users', 'view_all_data', 'manage_system', 'audit_logs']
      },
      
      // Token expiry times
      expiryTimes: {
        auth: '1h',
        data_access: '24h',
        tee_attestation: '24h',
        training_execution: '72h',
        admin_access: '8h'
      },
      
      // Token refresh configuration
      refreshConfig: {
        enabled: true,
        expiryTime: '7d',
        maxRefreshCount: 5
      }
    };
    
    // Token blacklist for revocation
    this.tokenBlacklist = new Set();
    
    // Active token tracking
    this.activeTokens = new Map();
    
    logger.info('🎫 Enhanced JWT service initialized');
  }

  /**
   * Create authentication token
   * @param {Object} user - User information
   * @param {string} role - User role
   * @returns {Object} Token response with access and refresh tokens
   */
  async createAuthenticationToken(user, role) {
    try {
      const tokenId = uuidv4();
      const refreshTokenId = uuidv4();
      
      // Create access token payload
      const accessTokenPayload = {
        sub: user.id,
        email: user.email,
        role: role,
        permissions: this.tokenConfig.rolePermissions[role] || [],
        tokenType: this.tokenConfig.tokenTypes.AUTHENTICATION,
        jti: tokenId,
        iat: Math.floor(Date.now() / 1000),
        iss: 'confidential-ai-platform',
        aud: 'api-access'
      };

      // Create refresh token payload
      const refreshTokenPayload = {
        sub: user.id,
        tokenType: 'refresh',
        jti: refreshTokenId,
        parentTokenId: tokenId,
        iat: Math.floor(Date.now() / 1000),
        iss: 'confidential-ai-platform',
        aud: 'token-refresh'
      };

      // Get signing key from platform encryption service
      const signingKey = await this.getSigningKey();
      
      // Generate tokens
      const accessToken = jwt.sign(accessTokenPayload, signingKey.privateKey, {
        algorithm: 'RS256',
        expiresIn: this.tokenConfig.expiryTimes.auth
      });

      const refreshToken = jwt.sign(refreshTokenPayload, signingKey.privateKey, {
        algorithm: 'RS256',
        expiresIn: this.tokenConfig.refreshConfig.expiryTime
      });

      // Track active tokens
      this.activeTokens.set(tokenId, {
        userId: user.id,
        role: role,
        tokenType: 'access',
        createdAt: new Date(),
        lastUsed: new Date()
      });

      this.activeTokens.set(refreshTokenId, {
        userId: user.id,
        role: role,
        tokenType: 'refresh',
        parentTokenId: tokenId,
        createdAt: new Date(),
        refreshCount: 0
      });

      const response = {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: this.tokenConfig.expiryTimes.auth,
        user: {
          id: user.id,
          email: user.email,
          role: role,
          permissions: accessTokenPayload.permissions
        }
      };

      this.auditTokenOperation('CREATE_AUTH_TOKEN', {
        userId: user.id,
        role: role,
        tokenId: tokenId
      });

      logger.info(`🎫 Authentication token created for user ${user.email} (${role})`);
      return response;
      
    } catch (error) {
      logger.error('Failed to create authentication token:', error);
      throw error;
    }
  }

  /**
   * Create data access token for TDC
   * @param {Object} dataAccessRequest - Data access request details
   * @param {string} tdcId - TDC user ID
   * @param {string} datasetId - Dataset ID
   * @returns {string} Data access token
   */
  async createDataAccessToken(dataAccessRequest, tdcId, datasetId) {
    try {
      const tokenId = uuidv4();
      
      const payload = {
        sub: tdcId,
        datasetId: datasetId,
        permissions: ['READ', 'TRAIN'],
        tokenType: this.tokenConfig.tokenTypes.DATA_ACCESS,
        jti: tokenId,
        iat: Math.floor(Date.now() / 1000),
        iss: 'confidential-ai-platform',
        aud: 'data-access',
        dataAccessRequest: {
          purpose: dataAccessRequest.purpose,
          contractId: dataAccessRequest.contractId,
          requestedAt: new Date().toISOString()
        }
      };

      const signingKey = await this.getSigningKey();
      
      const token = jwt.sign(payload, signingKey.privateKey, {
        algorithm: 'RS256',
        expiresIn: this.tokenConfig.expiryTimes.data_access
      });

      // Track active token
      this.activeTokens.set(tokenId, {
        userId: tdcId,
        datasetId: datasetId,
        tokenType: 'data_access',
        createdAt: new Date(),
        lastUsed: new Date()
      });

      this.auditTokenOperation('CREATE_DATA_ACCESS_TOKEN', {
        tdcId: tdcId,
        datasetId: datasetId,
        tokenId: tokenId
      });

      logger.info(`🎫 Data access token created for TDC ${tdcId}, dataset ${datasetId}`);
      return token;
      
    } catch (error) {
      logger.error('Failed to create data access token:', error);
      throw error;
    }
  }

  /**
   * Create TEE attestation token for CCRP
   * @param {Object} teeInfo - TEE information
   * @param {string} ccrpId - CCRP user ID
   * @returns {string} TEE attestation token
   */
  async createTEEAttestationToken(teeInfo, ccrpId) {
    try {
      const tokenId = uuidv4();
      
      const payload = {
        sub: ccrpId,
        teeId: teeInfo.teeId,
        tokenType: this.tokenConfig.tokenTypes.TEE_ATTESTATION,
        jti: tokenId,
        iat: Math.floor(Date.now() / 1000),
        iss: 'confidential-ai-platform',
        aud: 'tee-attestation',
        teeInfo: {
          hardwareType: teeInfo.hardwareType,
          attestationData: teeInfo.attestationData,
          verifiedAt: new Date().toISOString()
        }
      };

      const signingKey = await this.getSigningKey();
      
      const token = jwt.sign(payload, signingKey.privateKey, {
        algorithm: 'RS256',
        expiresIn: this.tokenConfig.expiryTimes.tee_attestation
      });

      // Track active token
      this.activeTokens.set(tokenId, {
        userId: ccrpId,
        teeId: teeInfo.teeId,
        tokenType: 'tee_attestation',
        createdAt: new Date(),
        lastUsed: new Date()
      });

      this.auditTokenOperation('CREATE_TEE_ATTESTATION_TOKEN', {
        ccrpId: ccrpId,
        teeId: teeInfo.teeId,
        tokenId: tokenId
      });

      logger.info(`🎫 TEE attestation token created for CCRP ${ccrpId}, TEE ${teeInfo.teeId}`);
      return token;
      
    } catch (error) {
      logger.error('Failed to create TEE attestation token:', error);
      throw error;
    }
  }

  /**
   * Create training execution token
   * @param {Object} trainingRequest - Training request details
   * @param {string} tdcId - TDC user ID
   * @param {string} ccrpId - CCRP user ID
   * @returns {string} Training execution token
   */
  async createTrainingExecutionToken(trainingRequest, tdcId, ccrpId) {
    try {
      const tokenId = uuidv4();
      
      const payload = {
        sub: tdcId,
        ccrpId: ccrpId,
        trainingJobId: trainingRequest.trainingJobId,
        tokenType: this.tokenConfig.tokenTypes.TRAINING_EXECUTION,
        jti: tokenId,
        iat: Math.floor(Date.now() / 1000),
        iss: 'confidential-ai-platform',
        aud: 'training-execution',
        trainingRequest: {
          datasetId: trainingRequest.datasetId,
          modelId: trainingRequest.modelId,
          contractId: trainingRequest.contractId,
          requestedAt: new Date().toISOString()
        }
      };

      const signingKey = await this.getSigningKey();
      
      const token = jwt.sign(payload, signingKey.privateKey, {
        algorithm: 'RS256',
        expiresIn: this.tokenConfig.expiryTimes.training_execution
      });

      // Track active token
      this.activeTokens.set(tokenId, {
        userId: tdcId,
        ccrpId: ccrpId,
        trainingJobId: trainingRequest.trainingJobId,
        tokenType: 'training_execution',
        createdAt: new Date(),
        lastUsed: new Date()
      });

      this.auditTokenOperation('CREATE_TRAINING_EXECUTION_TOKEN', {
        tdcId: tdcId,
        ccrpId: ccrpId,
        trainingJobId: trainingRequest.trainingJobId,
        tokenId: tokenId
      });

      logger.info(`🎫 Training execution token created for TDC ${tdcId}, job ${trainingRequest.trainingJobId}`);
      return token;
      
    } catch (error) {
      logger.error('Failed to create training execution token:', error);
      throw error;
    }
  }

  /**
   * Validate JWT token
   * @param {string} token - JWT token
   * @param {string} expectedType - Expected token type
   * @returns {Object} Token payload
   */
  async validateToken(token, expectedType = null) {
    try {
      // Check if token is blacklisted
      if (this.tokenBlacklist.has(token)) {
        throw new Error('Token has been revoked');
      }

      // Get verification key
      const signingKey = await this.getSigningKey();
      
      // Verify token
      const payload = jwt.verify(token, signingKey.publicKey, {
        algorithms: ['RS256'],
        issuer: 'confidential-ai-platform'
      });

      // Check token type if specified
      if (expectedType && payload.tokenType !== expectedType) {
        throw new Error(`Invalid token type. Expected: ${expectedType}, Got: ${payload.tokenType}`);
      }

      // Update last used time
      if (this.activeTokens.has(payload.jti)) {
        this.activeTokens.get(payload.jti).lastUsed = new Date();
      }

      return payload;
      
    } catch (error) {
      logger.error('Token validation failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Validate refresh token
      const payload = await this.validateToken(refreshToken, 'refresh');
      
      // Check refresh count
      const tokenInfo = this.activeTokens.get(payload.jti);
      if (!tokenInfo || tokenInfo.refreshCount >= this.tokenConfig.refreshConfig.maxRefreshCount) {
        throw new Error('Refresh token has exceeded maximum refresh count');
      }

      // Increment refresh count
      tokenInfo.refreshCount += 1;
      
      // Get user information (in production, this would come from database)
      const user = {
        id: payload.sub,
        email: 'user@example.com', // This would be fetched from database
        role: tokenInfo.role
      };

      // Create new access token
      const newTokenResponse = await this.createAuthenticationToken(user, tokenInfo.role);
      
      this.auditTokenOperation('REFRESH_ACCESS_TOKEN', {
        userId: payload.sub,
        refreshTokenId: payload.jti,
        newTokenId: newTokenResponse.accessToken
      });

      logger.info(`🎫 Access token refreshed for user ${payload.sub}`);
      return newTokenResponse;
      
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw error;
    }
  }

  /**
   * Revoke token
   * @param {string} token - Token to revoke
   * @param {string} reason - Revocation reason
   */
  async revokeToken(token, reason = 'User requested') {
    try {
      // Add to blacklist
      this.tokenBlacklist.add(token);
      
      // Remove from active tokens
      const payload = jwt.decode(token);
      if (payload && payload.jti) {
        this.activeTokens.delete(payload.jti);
      }

      this.auditTokenOperation('REVOKE_TOKEN', {
        tokenId: payload?.jti,
        reason: reason
      });

      logger.info(`🎫 Token revoked: ${reason}`);
      
    } catch (error) {
      logger.error('Failed to revoke token:', error);
      throw error;
    }
  }

  /**
   * Check user permissions
   * @param {Object} user - User information
   * @param {string} permission - Required permission
   * @returns {boolean} Has permission
   */
  hasPermission(user, permission) {
    const userPermissions = this.tokenConfig.rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Get signing key from platform encryption service
   * @returns {Object} Signing key pair
   */
  async getSigningKey() {
    try {
      if (this.platformEncryptionService && this.platformEncryptionService.jwtSigningKeys) {
        return this.platformEncryptionService.jwtSigningKeys;
      }
      
      // Fallback: generate temporary key
      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      
      return keyPair;
      
    } catch (error) {
      logger.error('Failed to get signing key:', error);
      throw error;
    }
  }

  /**
   * Get active tokens for user
   * @param {string} userId - User ID
   * @returns {Array} Active tokens
   */
  getActiveTokensForUser(userId) {
    const userTokens = [];
    
    for (const [tokenId, tokenInfo] of this.activeTokens.entries()) {
      if (tokenInfo.userId === userId) {
        userTokens.push({
          tokenId,
          ...tokenInfo
        });
      }
    }
    
    return userTokens;
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens() {
    const now = new Date();
    const expiredTokens = [];
    
    for (const [tokenId, tokenInfo] of this.activeTokens.entries()) {
      // Check if token is expired (basic check, JWT expiry is handled by verification)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (now - tokenInfo.createdAt > maxAge) {
        expiredTokens.push(tokenId);
      }
    }
    
    // Remove expired tokens
    expiredTokens.forEach(tokenId => {
      this.activeTokens.delete(tokenId);
    });
    
    if (expiredTokens.length > 0) {
      logger.info(`🧹 Cleaned up ${expiredTokens.length} expired tokens`);
    }
  }

  /**
   * Audit token operation
   * @param {string} operation - Operation type
   * @param {Object} details - Operation details
   */
  auditTokenOperation(operation, details) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      operation,
      details,
      service: 'EnhancedJWTService'
    };
    
    logger.info('📋 Token audit:', auditLog);
    
    // In production, this would be stored in a secure audit log
    return auditLog;
  }

  /**
   * Get token statistics
   * @returns {Object} Token statistics
   */
  getTokenStatistics() {
    const stats = {
      totalActiveTokens: this.activeTokens.size,
      blacklistedTokens: this.tokenBlacklist.size,
      tokensByType: {},
      tokensByUser: {}
    };
    
    // Count tokens by type
    for (const tokenInfo of this.activeTokens.values()) {
      stats.tokensByType[tokenInfo.tokenType] = (stats.tokensByType[tokenInfo.tokenType] || 0) + 1;
      stats.tokensByUser[tokenInfo.userId] = (stats.tokensByUser[tokenInfo.userId] || 0) + 1;
    }
    
    return stats;
  }
}

module.exports = EnhancedJWTService;
