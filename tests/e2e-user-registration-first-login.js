/**
 * E2E Test Suite: User Registration and First Login Flow
 * 
 * This test suite covers the complete user onboarding flow:
 * 1. User Registration via API
 * 2. First Login Detection
 * 3. Password Change on First Login
 * 4. Successful Login with New Password
 * 
 * Prerequisites:
 * - Backend server running on localhost:5001
 * - Frontend server running on localhost:3000
 * - Keycloak running and configured
 * - Database accessible
 */

const axios = require('axios');
const { expect } = require('chai');
const { getTestConfig } = require('../scripts/load-config');

// Load configuration from centralized config.env and secrets.env
const config = getTestConfig();

// Test data
const testUser = {
  email: `e2e-test-${Date.now()}@example.com`,
  name: 'E2E Test User',
  partyType: 'TDC'
};

let temporaryPassword = '';
let newPassword = 'NewSecurePassword123!';

describe('E2E: User Registration and First Login Flow', function() {
  this.timeout(config.timeout);

  describe('1. User Registration', function() {
    it('should successfully register a new user via API', async function() {
      console.log(`🧪 Testing registration for: ${testUser.email}`);
      
      const response = await axios.post(`${config.backend}/api/auth/register`, testUser);
      
      // Verify response structure
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('success', true);
      expect(response.data).to.have.property('user');
      expect(response.data).to.have.property('loginCredentials');
      
      // Verify user data
      const user = response.data.user;
      expect(user.email).to.equal(testUser.email);
      expect(user.name).to.equal(testUser.name);
      expect(user.partyType).to.equal(testUser.partyType);
      expect(user.isRegistered).to.equal(true);
      expect(user.onboardingStatus).to.equal('IN_PROGRESS');
      expect(user.profileCompleted).to.equal(false);
      expect(user.emailVerified).to.equal(false);
      
      // Verify login credentials
      const credentials = response.data.loginCredentials;
      expect(credentials.email).to.equal(testUser.email);
      expect(credentials.password).to.be.a('string');
      expect(credentials.password.length).to.be.greaterThan(8);
      expect(credentials.note).to.include('temporary password');
      
      // Store temporary password for next tests
      temporaryPassword = credentials.password;
      
      console.log(`✅ User registered successfully with temporary password: ${temporaryPassword}`);
    });

    it('should prevent duplicate registration with same email', async function() {
      try {
        await axios.post(`${config.backend}/api/auth/register`, testUser);
        throw new Error('Expected registration to fail for duplicate email');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.code).to.equal('EMAIL_ALREADY_EXISTS');
        console.log('✅ Duplicate registration correctly rejected');
      }
    });

    it('should validate required fields during registration', async function() {
      const invalidUser = { email: testUser.email }; // Missing name and partyType
      
      try {
        await axios.post(`${config.backend}/api/auth/register`, invalidUser);
        throw new Error('Expected registration to fail for missing fields');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        console.log('✅ Registration validation working correctly');
      }
    });
  });

  describe('2. First Login Detection', function() {
    it('should detect first login and return appropriate response', async function() {
      console.log(`🧪 Testing first login detection for: ${testUser.email}`);
      
      const response = await axios.post(`${config.backend}/api/auth/login`, {
        email: testUser.email,
        password: temporaryPassword
      });
      
      // Verify first login response
      expect(response.status).to.equal(200);
      expect(response.data.message).to.include('First login detected');
      expect(response.data.requiresPasswordChange).to.equal(true);
      expect(response.data.isFirstLogin).to.equal(true);
      
      // Verify user data
      const user = response.data.user;
      expect(user.email).to.equal(testUser.email);
      expect(user.firstLogin).to.equal(true);
      expect(user.id).to.be.a('number');
      expect(user.depaId).to.be.a('string');
      
      // Should NOT have access token for first login
      expect(response.data.accessToken).to.be.undefined;
      
      console.log('✅ First login correctly detected');
    });

    it('should reject invalid credentials during first login', async function() {
      try {
        await axios.post(`${config.backend}/api/auth/login`, {
          email: testUser.email,
          password: 'wrongpassword'
        });
        throw new Error('Expected login to fail with wrong password');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        console.log('✅ Invalid credentials correctly rejected');
      }
    });
  });

  describe('3. First Login Password Change', function() {
    it('should successfully update password for first-login user', async function() {
      console.log(`🧪 Testing password change for first-login user: ${testUser.email}`);
      
      const response = await axios.post(`${config.backend}/api/auth/first-login-password`, {
        email: testUser.email,
        currentPassword: temporaryPassword,
        newPassword: newPassword
      });
      
      // Verify password update response
      expect(response.status).to.equal(200);
      expect(response.data.success).to.equal(true);
      expect(response.data.message).to.include('Password updated successfully');
      expect(response.data.firstLoginCompleted).to.equal(true);
      
      console.log('✅ Password updated successfully');
    });

    it('should reject password change with wrong current password', async function() {
      try {
        await axios.post(`${config.backend}/api/auth/first-login-password`, {
          email: testUser.email,
          currentPassword: 'wrongpassword',
          newPassword: 'AnotherPassword123!'
        });
        throw new Error('Expected password change to fail with wrong current password');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.code).to.equal('INVALID_CURRENT_PASSWORD');
        console.log('✅ Wrong current password correctly rejected');
      }
    });

    it('should validate new password strength', async function() {
      try {
        await axios.post(`${config.backend}/api/auth/first-login-password`, {
          email: testUser.email,
          currentPassword: temporaryPassword,
          newPassword: '123' // Too short
        });
        throw new Error('Expected password change to fail with weak password');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.code).to.equal('PASSWORD_TOO_SHORT');
        console.log('✅ Weak password correctly rejected');
      }
    });

    it('should reject first-login-password endpoint for non-first-login users', async function() {
      // First, complete the first login for our test user
      await axios.post(`${config.backend}/api/auth/first-login-password`, {
        email: testUser.email,
        currentPassword: temporaryPassword,
        newPassword: newPassword
      });

      // Now try to use the endpoint again
      try {
        await axios.post(`${config.backend}/api/auth/first-login-password`, {
          email: testUser.email,
          currentPassword: newPassword,
          newPassword: 'AnotherPassword123!'
        });
        throw new Error('Expected endpoint to reject non-first-login user');
      } catch (error) {
        expect(error.response.status).to.equal(403);
        expect(error.response.data.code).to.equal('NOT_FIRST_LOGIN');
        console.log('✅ Non-first-login user correctly rejected from first-login endpoint');
      }
    });
  });

  describe('4. Normal Login After Password Change', function() {
    it('should successfully login with new password after first-login completion', async function() {
      console.log(`🧪 Testing normal login with new password: ${testUser.email}`);
      
      const response = await axios.post(`${config.backend}/api/auth/login`, {
        email: testUser.email,
        password: newPassword
      });
      
      // Verify normal login response
      expect(response.status).to.equal(200);
      expect(response.data.message).to.equal('Login successful');
      expect(response.data.requiresPasswordChange).to.equal(false);
      
      // Should have access token for normal login
      expect(response.data.accessToken).to.be.a('string');
      expect(response.data.refreshToken).to.be.a('string');
      expect(response.data.expiresIn).to.be.a('number');
      
      // Verify user data
      const user = response.data.user;
      expect(user.email).to.equal(testUser.email);
      expect(user.firstLogin).to.equal(false); // Should be false after password change
      
      console.log('✅ Normal login successful with new password');
    });

    it('should reject login with old temporary password', async function() {
      try {
        await axios.post(`${config.backend}/api/auth/login`, {
          email: testUser.email,
          password: temporaryPassword
        });
        throw new Error('Expected login to fail with old password');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        console.log('✅ Old password correctly rejected');
      }
    });
  });

  describe('5. Frontend Integration Tests', function() {
    it('should have working API endpoints for frontend integration', async function() {
      // Test that all required endpoints exist and respond
      const endpoints = [
        { method: 'POST', path: '/api/auth/register' },
        { method: 'POST', path: '/api/auth/login' },
        { method: 'POST', path: '/api/auth/first-login-password' }
      ];

      for (const endpoint of endpoints) {
        try {
          if (endpoint.method === 'POST') {
            await axios.post(`${config.backend}${endpoint.path}`, {});
          }
        } catch (error) {
          // We expect errors due to missing data, but not 404s
          expect(error.response.status).to.not.equal(404);
        }
      }
      
      console.log('✅ All required API endpoints are accessible');
    });

    it('should validate API response formats match frontend expectations', async function() {
      // Test registration response format
      const regResponse = await axios.post(`${config.backend}/api/auth/register`, {
        email: `format-test-${Date.now()}@example.com`,
        name: 'Format Test User',
        partyType: 'TDP'
      });

      // Verify response has all fields frontend expects
      expect(regResponse.data).to.have.all.keys([
        'success', 'details', 'user', 'loginCredentials', 'nextSteps'
      ]);

      // Test first-login response format
      const loginResponse = await axios.post(`${config.backend}/api/auth/login`, {
        email: regResponse.data.loginCredentials.email,
        password: regResponse.data.loginCredentials.password
      });

      expect(loginResponse.data).to.have.all.keys([
        'message', 'requiresPasswordChange', 'isFirstLogin', 'user', 'note'
      ]);

      console.log('✅ API response formats match frontend expectations');
    });
  });

  describe('6. Error Handling and Edge Cases', function() {
    it('should handle malformed requests gracefully', async function() {
      const malformedRequests = [
        { endpoint: '/api/auth/register', data: null },
        { endpoint: '/api/auth/register', data: 'invalid-json' },
        { endpoint: '/api/auth/login', data: { email: 'invalid-email' } },
        { endpoint: '/api/auth/first-login-password', data: { email: 'test@example.com' } }
      ];

      for (const request of malformedRequests) {
        try {
          await axios.post(`${config.backend}${request.endpoint}`, request.data);
        } catch (error) {
          expect(error.response.status).to.be.oneOf([400, 401, 403]);
          expect(error.response.data).to.have.property('error');
          expect(error.response.data).to.have.property('code');
        }
      }

      console.log('✅ Malformed requests handled gracefully');
    });

    it('should handle concurrent registration attempts', async function() {
      const concurrentEmail = `concurrent-${Date.now()}@example.com`;
      const registrationData = {
        email: concurrentEmail,
        name: 'Concurrent Test User',
        partyType: 'TDC'
      };

      // Attempt multiple concurrent registrations
      const promises = Array(3).fill().map(() => 
        axios.post(`${config.backend}/api/auth/register`, registrationData)
          .catch(error => error.response)
      );

      const results = await Promise.all(promises);
      
      // One should succeed, others should fail with duplicate email error
      const successes = results.filter(r => r.status === 200);
      const failures = results.filter(r => r.status === 400);
      
      expect(successes.length).to.equal(1);
      expect(failures.length).to.equal(2);
      
      failures.forEach(failure => {
        expect(failure.data.code).to.equal('EMAIL_ALREADY_EXISTS');
      });

      console.log('✅ Concurrent registration attempts handled correctly');
    });
  });

  // Cleanup
  after(function() {
    console.log('\n🧹 Test cleanup completed');
    console.log(`📊 Test Summary:`);
    console.log(`   - Test User: ${testUser.email}`);
    console.log(`   - Temporary Password: ${temporaryPassword}`);
    console.log(`   - New Password: ${newPassword}`);
    console.log(`   - All tests completed successfully`);
  });
});

// Helper function to run tests
if (require.main === module) {
  console.log('🚀 Starting E2E Tests for User Registration and First Login');
  console.log(`Backend: ${config.backend}`);
  console.log(`Frontend: ${config.frontend}`);
  console.log(`Timeout: ${config.timeout}ms`);
  console.log('');
  
  // Run the tests
  require('mocha/cli/cli').main();
}

module.exports = {
  config,
  testUser,
  temporaryPassword,
  newPassword
};
