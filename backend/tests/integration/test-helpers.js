/**
 * Test Helper Utilities for Integration Tests
 * 
 * Provides common test operations, assertions, and utilities:
 * - HTTP request helpers
 * - Common assertions
 * - Test data validation
 * - Error handling utilities
 */

const request = require('supertest');

class TestHelpers {
  constructor(app) {
    this.app = app;
  }

  /**
   * Make an authenticated HTTP request
   */
  async authenticatedRequest(method, endpoint, token, data = null) {
    try {
      const req = request(this.app)[method.toLowerCase()](endpoint)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');
      
      if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        req.send(data);
      }
      
      return await req;
    } catch (error) {
      console.error(`❌ HTTP request failed: ${method} ${endpoint}`, error.message);
      throw error;
    }
  }

  /**
   * Make an unauthenticated HTTP request
   */
  async unauthenticatedRequest(method, endpoint, data = null) {
    try {
      const req = request(this.app)[method.toLowerCase()](endpoint)
        .set('Content-Type', 'application/json');
      
      if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        req.send(data);
      }
      
      return await req;
    } catch (error) {
      console.error(`❌ HTTP request failed: ${method} ${endpoint}`, error.message);
      throw error;
    }
  }

  /**
   * Validate successful response
   */
  validateSuccessResponse(response, expectedStatus = 200) {
    try {
      expect(response.status).toBe(expectedStatus);
      expect(response.body).toBeDefined();
      
      if (expectedStatus === 201) {
        expect(response.body.success).toBe(true);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Response validation failed:', {
        expectedStatus,
        actualStatus: response.status,
        body: response.body
      });
      throw error;
    }
  }

  /**
   * Validate error response
   */
  validateErrorResponse(response, expectedStatus, expectedErrorCode = null) {
    try {
      expect(response.status).toBe(expectedStatus);
      expect(response.body.error).toBeDefined();
      
      if (expectedErrorCode) {
        expect(response.body.code).toBe(expectedErrorCode);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error response validation failed:', {
        expectedStatus,
        actualStatus: response.status,
        expectedErrorCode,
        actualErrorCode: response.body.code,
        body: response.body
      });
      throw error;
    }
  }

  /**
   * Validate user data structure
   */
  validateUserData(user, expectedRole = null) {
    try {
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.partyType).toBeDefined();
      expect(user.isActive).toBe(true);
      
      if (expectedRole) {
        expect(user.partyType).toBe(expectedRole);
      }
      
      return true;
    } catch (error) {
      console.error('❌ User data validation failed:', {
        user,
        expectedRole
      });
      throw error;
    }
  }

  /**
   * Validate dataset data structure
   */
  validateDatasetData(dataset, expectedOwnerId = null) {
    try {
      expect(dataset).toBeDefined();
      expect(dataset.datasetId).toBeDefined();
      expect(dataset.name).toBeDefined();
      expect(dataset.description).toBeDefined();
      expect(dataset.category).toBeDefined();
      expect(dataset.price).toBeDefined();
      expect(dataset.ownerId).toBeDefined();
      
      if (expectedOwnerId) {
        expect(dataset.ownerId).toBe(expectedOwnerId);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Dataset data validation failed:', {
        dataset,
        expectedOwnerId
      });
      throw error;
      }
  }

  /**
   * Validate contract data structure
   */
  validateContractData(contract, expectedStatus = null) {
    try {
      expect(contract).toBeDefined();
      expect(contract.id).toBeDefined();
      expect(contract.status).toBeDefined();
      expect(contract.contractType).toBeDefined();
      expect(contract.createdAt).toBeDefined();
      
      if (expectedStatus) {
        expect(contract.status).toBe(expectedStatus);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Contract data validation failed:', {
        contract,
        expectedStatus
      });
      throw error;
    }
  }

  /**
   * Validate AI model data structure
   */
  validateAIModelData(aiModel) {
    try {
      expect(aiModel).toBeDefined();
      expect(aiModel.modelId).toBeDefined();
      expect(aiModel.name).toBeDefined();
      expect(aiModel.description).toBeDefined();
      expect(aiModel.type).toBeDefined();
      expect(aiModel.framework).toBeDefined();
      expect(aiModel.isActive).toBeDefined();
      
      return true;
    } catch (error) {
      console.error('❌ AI model data validation failed:', {
        aiModel
      });
      throw error;
    }
  }

  /**
   * Wait for a condition to be true
   */
  async waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        if (await condition()) {
          return true;
        }
      } catch (error) {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Retry an operation with exponential backoff
   */
  async retry(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⚠️ Operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Generate unique test data
   */
  generateUniqueData(prefix = 'test') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return {
      email: `${prefix}-${timestamp}-${random}@test.example.com`,
      name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Test User ${timestamp}`,
      datasetId: `TEST-DATASET-${timestamp}-${random}`,
      modelId: `TEST-MODEL-${timestamp}-${random}`,
      organization: `Test ${prefix.charAt(0).toUpperCase() + prefix.slice(1)} Organization`
    };
  }

  /**
   * Validate JWT token structure
   */
  validateJWTToken(token) {
    try {
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(100); // Basic JWT length check
      
      // Decode JWT payload (without verification)
      const parts = token.split('.');
      expect(parts.length).toBe(3);
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      expect(payload.userId).toBeDefined();
      expect(payload.role).toBeDefined();
      expect(payload.exp).toBeDefined();
      
      return true;
    } catch (error) {
      console.error('❌ JWT token validation failed:', {
        token: token ? token.substring(0, 50) + '...' : 'undefined'
      });
      throw error;
    }
  }

  /**
   * Check if service is healthy
   */
  async checkServiceHealth(endpoint = '/health') {
    try {
      const response = await this.unauthenticatedRequest('GET', endpoint);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for service to be healthy
   */
  async waitForServiceHealth(endpoint = '/health', timeout = 30000) {
    return this.waitFor(
      () => this.checkServiceHealth(endpoint),
      timeout,
      1000
    );
  }

  /**
   * Create test user with validation
   */
  async createTestUser(role, options = {}) {
    try {
      const userData = {
        email: options.email || this.generateUniqueData(role.toLowerCase()).email,
        name: options.name || this.generateUniqueData(role.toLowerCase()).name,
        partyType: role,
        password: options.password || 'Password123',
        organization: options.organization || this.generateUniqueData(role.toLowerCase()).organization,
        ...options
      };

      const response = await this.unauthenticatedRequest('POST', '/api/auth/register', userData);
      
      this.validateSuccessResponse(response, 201);
      this.validateUserData(response.body.user, role);
      
      return response.body.user;
    } catch (error) {
      console.error(`❌ Failed to create test user for role ${role}:`, error.message);
      throw error;
    }
  }

  /**
   * Login test user and get token
   */
  async loginTestUser(email, password) {
    try {
      const response = await this.unauthenticatedRequest('POST', '/api/auth/login', {
        email,
        password
      });
      
      this.validateSuccessResponse(response, 200);
      expect(response.body.token).toBeDefined();
      
      this.validateJWTToken(response.body.token);
      
      return response.body.token;
    } catch (error) {
      console.error(`❌ Failed to login test user ${email}:`, error.message);
      throw error;
    }
  }

  /**
   * Create authenticated test user (register + login)
   */
  async createAuthenticatedUser(role, options = {}) {
    try {
      const user = await this.createTestUser(role, options);
      const token = await this.loginTestUser(user.email, options.password || 'Password123');
      
      return {
        ...user,
        token
      };
    } catch (error) {
      console.error(`❌ Failed to create authenticated user for role ${role}:`, error.message);
      throw error;
    }
  }
}

module.exports = TestHelpers;
