/**
 * Keycloak Service for authentication and user management
 */
const axios = require('axios');

class KeycloakService {
  constructor() {
    this.baseUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    this.realm = process.env.KEYCLOAK_REALM || 'contract-management';
    this.adminRealm = 'master';
    this.clientId = process.env.KEYCLOAK_CLIENT_ID || 'contract-management-backend';
    this.clientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'sncRBEV5Et3E3XxpGoWA0DflTW4dIezX';
    this.adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME || 'admin';
    this.adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || '***REMOVED-KEYCLOAK_ADMIN_PASSWORD***';
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
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
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
      const response = await axios.post(`${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        `grant_type=password&client_id=${this.clientId}&client_secret=${this.clientSecret}&username=${username}&password=${password}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
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
        `grant_type=refresh_token&client_id=${this.clientId}&client_secret=${this.clientSecret}&refresh_token=${refreshToken}`,
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
          }
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
      
      // Generate temporary password
      const temporaryPassword = this.generateTemporaryPassword();
      
      // Prepare user data for Keycloak
      const ***REMOVED-KEYCLOAK_DB_PASSWORD***UserData = {
        username: userData.email,
        email: userData.email,
        firstName: userData.name?.split(' ')[0] || '',
        lastName: userData.name?.split(' ').slice(1).join(' ') || '',
        enabled: true,
        emailVerified: false,
        credentials: [{
          type: 'password',
          value: temporaryPassword,
          temporary: true
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
          }
        }
      );

      // Get the created user ID from the Location header
      const locationHeader = response.headers.location;
      const userId = locationHeader.split('/').pop();

      console.log(`✅ Keycloak user created: ${userId} (${userData.email})`);

      return {
        ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId: userId,
        temporaryPassword: temporaryPassword,
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
  async getUsers() {
    try {
      const adminToken = await this.getAdminToken();
      
      const response = await axios.get(
        `${this.baseUrl}/admin/realms/${this.realm}/users`,
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
   * Generate a temporary password for new users
   * @returns {string} - Temporary password
   */
  generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

module.exports = KeycloakService; 