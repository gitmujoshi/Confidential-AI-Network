/**
 * Keycloak Service for authentication and user management
 */
const axios = require('axios');
const https = require('https');

function sanitizeKeycloakNamePart(part) {
  if (!part || typeof part !== 'string') return '';
  const cleaned = part.replace(/[^\p{L}\p{N}\s\-']/gu, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 50) || '';
}

class KeycloakService {
  constructor() {
    // Validate required environment variables
    this.validateEnvironmentVariables();
    
    this.baseUrl = process.env.KEYCLOAK_URL;
    this.realm = process.env.KEYCLOAK_REALM;
    this.adminRealm = 'master';
    this.clientId = process.env.KEYCLOAK_CLIENT_ID;
    this.clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
    this.adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME;
    this.adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD;
    
    // Configure axios based on URL scheme
    this.isHttps = this.baseUrl.startsWith('https://');
    this.httpsAgent = this.isHttps ? new https.Agent({
      rejectUnauthorized: false
    }) : null;
  }
  
  validateEnvironmentVariables() {
    const requiredVars = [
      'KEYCLOAK_URL',
      'KEYCLOAK_REALM',
      'KEYCLOAK_CLIENT_ID',
      'KEYCLOAK_CLIENT_SECRET',
      'KEYCLOAK_ADMIN_USERNAME',
      'KEYCLOAK_ADMIN_PASSWORD'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Get admin token for Keycloak operations
   * @returns {Promise<string>} - Admin access token
   */
  async getAdminToken() {
    try {
      const response = await axios.post(`${this.baseUrl}/realms/${this.adminRealm}/protocol/openid-connect/token`, 
        `grant_type=password&client_id=admin-cli&username=${this.adminUsername}&password=${this.adminPassword}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          httpsAgent: this.httpsAgent
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting admin token:', error.response?.data || error.message);
      throw new Error(`Failed to get admin token: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Authenticate user with password
   * @param {string} username - Username or email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Token response
   */
  async authenticateUserWithPassword(username, password) {
    try {
      // URL encode the password to handle special characters
      const encodedPassword = encodeURIComponent(password);
      const encodedUsername = encodeURIComponent(username);
      
      // Build the request body
      let requestBody = `grant_type=password&client_id=${this.clientId}&username=${encodedUsername}&password=${encodedPassword}`;
      
      // Add client secret only if it's configured (for confidential clients)
      if (this.clientSecret) {
        requestBody += `&client_secret=${this.clientSecret}`;
      }
      
      const response = await axios.post(`${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        requestBody,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          httpsAgent: this.httpsAgent
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error authenticating user:', error.response?.data || error.message);
      throw new Error(`Authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get user info from token
   * @param {string} token - Access token
   * @returns {Promise<Object>} - User info
   */
  async getUserInfo(token) {
    try {
      const response = await axios.get(`${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error.response?.data || error.message);
      throw new Error(`Failed to get user info: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - New token response
   */
  async refreshToken(refreshToken) {
    try {
      const response = await axios.post(`${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        `grant_type=refresh_token&client_id=${this.clientId}&refresh_token=${refreshToken}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error.response?.data || error.message);
      throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Success status
   */
  async updateUserPassword(userId, newPassword) {
    try {
      const adminToken = await this.getAdminToken();
      
      await axios.put(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}/reset-password`,
        {
          type: 'password',
          value: newPassword,
          temporary: false
        },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: this.httpsAgent
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error updating user password:', error.response?.data || error.message);
      throw new Error(`Failed to update password: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  /**
   * Create a new user in Keycloak
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user info with temporary password
   */
  async createUser(userData) {
    try {
      const adminToken = await this.getAdminToken();
      
      // Use provided password or generate temporary password
      const password = userData.password || this.generateTemporaryPassword();
      
      // Prepare user data for Keycloak
      const rawFirst = userData.name?.split(' ')[0] || '';
      const rawLast = userData.name?.split(' ').slice(1).join(' ') || '';
      const ***REMOVED-KEYCLOAK_DB_PASSWORD***UserData = {
        username: userData.email,
        email: userData.email,
        firstName: sanitizeKeycloakNamePart(rawFirst) || sanitizeKeycloakNamePart(userData.name || '') || 'User',
        lastName: sanitizeKeycloakNamePart(rawLast) || 'User',
        enabled: true,
        emailVerified: false,
        credentials: [{
          type: 'password',
          value: password,
          temporary: !userData.password // Only temporary if no password provided
        }],
        attributes: {
          partyType: [userData.partyType],
          walletAddress: userData.walletAddress ? [userData.walletAddress] : [],
          organization: userData.organization ? [userData.organization] : [],
          phoneNumber: userData.phoneNumber ? [userData.phoneNumber] : [],
          website: userData.website ? [userData.website] : [],
          location: userData.location ? [userData.location] : []
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/admin/realms/${this.realm}/users`,
        ***REMOVED-KEYCLOAK_DB_PASSWORD***UserData,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          httpsAgent: this.httpsAgent
        }
      );

      // Get the created user ID from the Location header
      const locationHeader = response.headers.location;
      const userId = locationHeader.split('/').pop();

      console.log(`✅ Keycloak user created: ${userId} (${userData.email})`);

      // Remove the UPDATE_PASSWORD required action so user can login immediately
      try {
        console.log(`🔧 Attempting to remove UPDATE_PASSWORD requirement for user: ${userData.email} (${userId})`);
        const removed = await this.removeRequiredAction(userId, 'UPDATE_PASSWORD');
        if (removed) {
          console.log(`✅ Removed UPDATE_PASSWORD requirement for user: ${userData.email}`);
        } else {
          console.log(`⚠️ UPDATE_PASSWORD requirement not found for user: ${userData.email}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to remove UPDATE_PASSWORD requirement: ${error.message}`);
      }

      return {
        ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId: userId,
        temporaryPassword: password, // Return the actual password used
        username: userData.email,
        email: userData.email
      };
    } catch (error) {
      console.error('Error creating user in Keycloak:', error.response?.data || error.message);
      throw new Error(`Failed to create user in Keycloak: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - User info or null
   */
  async getUser(userId) {
    try {
      const adminToken = await this.getAdminToken();
      
      const response = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting user:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Update user in Keycloak
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} - Updated user info
   */
  async updateUser(userId, userData) {
    try {
      const adminToken = await this.getAdminToken();
      
      const response = await axios.put(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}`,
        userData,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error.response?.data || error.message);
      throw new Error(`Failed to update user: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  /**
   * Delete user from Keycloak
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteUser(userId) {
    try {
      const adminToken = await this.getAdminToken();
      
      await axios.delete(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get all users from Keycloak
   * @returns {Promise<Array>} - Array of users
   */
  async getUsers(options = {}) {
    try {
      const adminToken = await this.getAdminToken();
      const max = options.max || 500;
      
      const response = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/users?max=${max}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting users:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {string} roleName - Role name
   * @returns {Promise<boolean>} - Success status
   */
  async assignRole(userId, roleName) {
    try {
      const adminToken = await this.getAdminToken();
      
      // First get the role ID
      const rolesResponse = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/roles`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const role = rolesResponse.data.find(r => r.name === roleName);
      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }
      
      // Assign the role to the user
      await axios.post(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`,
        [role],
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error assigning role:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Remove role from user
   * @param {string} userId - User ID
   * @param {string} roleName - Role name
   * @returns {Promise<boolean>} - Success status
   */
  async removeRole(userId, roleName) {
    try {
      const adminToken = await this.getAdminToken();
      
      // First get the role ID
      const rolesResponse = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/roles`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const role = rolesResponse.data.find(r => r.name === roleName);
      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }
      
      // Remove the role from the user
      await axios.delete(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          data: [role]
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error removing role:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get user roles
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of roles
   */
  async getUserRoles(userId) {
    try {
      const adminToken = await this.getAdminToken();
      
      const response = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting user roles:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Send email verification to user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async sendEmailVerification(userId) {
    try {
      const adminToken = await this.getAdminToken();
      
      await axios.put(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}/send-verify-email`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error sending email verification:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Verify token
   * @param {string} token - JWT token
   * @returns {Promise<Object|null>} - Token payload or null
   */
  async verifyToken(token) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error verifying token:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Validate token and extract user information
   * @param {string} token - JWT token
   * @returns {Promise<Object>} - Validation result with user info
   */
  async validateToken(token) {
    try {
      // Decode the JWT token to get user information
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }

      // Decode the payload (second part)
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        return { valid: false, error: 'Token expired' };
      }

      // Extract user information from token with explicit username-to-email mapping
      // Keycloak username attribute should be mapped to email in database
      const ***REMOVED-KEYCLOAK_DB_PASSWORD***Username = payload.preferred_username || payload.username;
      const ***REMOVED-KEYCLOAK_DB_PASSWORD***Email = payload.email;
      
      // Use email if available, otherwise use username (which should be email)
      const email = ***REMOVED-KEYCLOAK_DB_PASSWORD***Email || ***REMOVED-KEYCLOAK_DB_PASSWORD***Username;
      
      const userInfo = {
        email: email,
        username: ***REMOVED-KEYCLOAK_DB_PASSWORD***Username, // Keep original username for reference
        name: payload.name,
        walletAddress: payload.walletAddress,
        partyType: payload.partyType,
        dbUserId: payload.sub // Keycloak user ID
      };

      return {
        valid: true,
        user: userInfo
      };
    } catch (error) {
      console.error('Error validating token:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Remove a required action from a user
   * @param {string} userId - User ID
   * @param {string} action - Required action to remove
   * @returns {Promise<boolean>} - Success status
   */
  async removeRequiredAction(userId, action) {
    try {
      const adminToken = await this.getAdminToken();
      
      // Get current user data
      const userResponse = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const userData = userResponse.data;
      
      // Remove the specified required action
      if (userData.requiredActions && userData.requiredActions.includes(action)) {
        userData.requiredActions = userData.requiredActions.filter(a => a !== action);
        
        // Update the user with only the requiredActions field to avoid conflicts
        await axios.put(
          `${this.baseUrl}/admin/realms/${this.realm}/users/${userId}`,
          {
            id: userId,
            requiredActions: userData.requiredActions
          },
          {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        return true;
      }
      
      return true; // Action not present, consider it removed
    } catch (error) {
      console.error('Error removing required action:', error.response?.data || error.message);
      throw new Error(`Failed to remove required action: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  /**
   * Generate a temporary password for new users
   * @returns {string} - Temporary password
   */
  generateTemporaryPassword() {
    // Include special characters for better security in production
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

module.exports = KeycloakService; 