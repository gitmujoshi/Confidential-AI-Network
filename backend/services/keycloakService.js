/**
 * Keycloak Service
 * 
 * This service handles all Keycloak IAM integration including:
 * - User authentication and token validation
 * - User management (create, update, delete)
 * - Role management
 * - User synchronization between Keycloak and local database
 * 
 * Features:
 * - JWT token validation
 * - User profile management
 * - Role-based access control
 * - Email verification
 * - User onboarding workflow
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

class KeycloakService {
  constructor() {
    this.config = this.loadConfig();
    this.baseURL = this.config.***REMOVED-KEYCLOAK_DB_PASSWORD***Url;
    this.realm = this.config.realm;
    this.adminToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Load Keycloak configuration
   */
  loadConfig() {
    return {
      ***REMOVED-KEYCLOAK_DB_PASSWORD***Url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
      realm: process.env.KEYCLOAK_REALM || 'contract-management',
      frontendClient: process.env.KEYCLOAK_CLIENT_ID || 'frontend-app',
      backendClient: process.env.KEYCLOAK_CLIENT_ID || 'backend-service',
      backendClientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
      adminUser: {
        username: process.env.KEYCLOAK_ADMIN_USER || 'admin',
        password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin'
      }
    };
  }

  /**
   * Get admin access token
   */
  async getAdminToken() {
    try {
      // Check if we have a valid token
      if (this.adminToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.adminToken;
      }

      console.log('🔐 Getting Keycloak admin token...');
      // Debug logging removed - Keycloak integration working
      
      const response = await axios.post(`${this.baseURL}/realms/master/protocol/openid-connect/token`, 
        new URLSearchParams({
          username: this.config.adminUser.username,
          password: this.config.adminUser.password,
          grant_type: 'password',
          client_id: 'admin-cli'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 5000 // 5 second timeout
        }
      );

      this.adminToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
      
      console.log('✅ Admin token obtained successfully');
      return this.adminToken;
    } catch (error) {
      console.error('❌ Failed to get admin token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Keycloak');
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token) {
    try {
      // Get public key from Keycloak
      const publicKeyResponse = await axios.get(
        `${this.baseURL}/realms/${this.realm}/protocol/openid-connect/certs`
      );
      
      const keys = publicKeyResponse.data.keys;
      if (!keys || keys.length === 0) {
        throw new Error('No public keys available');
      }

      // Try to verify with each key
      for (const key of keys) {
        try {
          const publicKey = `-----BEGIN PUBLIC KEY-----\n${key.n}\n-----END PUBLIC KEY-----`;
          const decoded = jwt.verify(token, publicKey, {
            algorithms: ['RS256'],
            audience: this.config.backendClient,
            issuer: `${this.baseURL}/realms/${this.realm}`
          });
          
          return {
            valid: true,
            payload: decoded,
            user: {
              id: decoded.sub,
              username: decoded.preferred_username,
              email: decoded.email,
              walletAddress: decoded.walletAddress,
              partyType: decoded.partyType,
              publicKey: decoded.publicKey,
              roles: decoded.realm_access?.roles || []
            }
          };
        } catch (verifyError) {
          // Continue to next key
          continue;
        }
      }
      
      throw new Error('Token verification failed');
    } catch (error) {
      console.error('❌ Token validation failed:', error.message);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Create user in Keycloak
   */
  async createUser(userData) {
    try {
      // Test code removed - transaction rollback working correctly
      
      const adminToken = await this.getAdminToken();
      
      // Generate temporary password if not provided
      const temporaryPassword = userData.password || this.generateTemporaryPassword();
      
      const ***REMOVED-KEYCLOAK_DB_PASSWORD***User = {
        username: userData.email,
        email: userData.email,
        enabled: true,
        emailVerified: false,
        firstName: userData.name.split(' ')[0] || userData.name,
        lastName: userData.name.split(' ').slice(1).join(' ') || '',
        attributes: {
          walletAddress: [userData.walletAddress],
          partyType: [userData.partyType],
          publicKey: [userData.publicKey],
          organization: [userData.organization || ''],
          phoneNumber: [userData.phoneNumber || ''],
          website: [userData.website || ''],
          location: [userData.location || '']
        },
        credentials: [
          {
            type: 'password',
            value: temporaryPassword,
            temporary: true
          }
        ],
        realmRoles: [userData.partyType]
      };

      const response = await axios.post(
        `${this.baseURL}/admin/realms/${this.realm}/users`,
        ***REMOVED-KEYCLOAK_DB_PASSWORD***User,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const userId = response.headers.location.split('/').pop();
      console.log(`✅ User created in Keycloak: ${userId}`);
      
      // Log temporary password for development/testing
      console.log('📧 [EMAIL DISABLED] Temporary password for user login:');
      console.log(`   Email: ${userData.email}`);
      console.log(`   Password: ${temporaryPassword}`);
      console.log(`   ⚠️  This password is temporary and should be changed on first login`);
      console.log(`   🔗 Login URL: ${this.baseURL}/realms/${this.realm}/protocol/openid-connect/auth?client_id=contract-management-frontend&response_type=code&scope=openid&redirect_uri=http://localhost:3000/callback`);
      
      return {
        success: true,
        ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId: userId,
        user: ***REMOVED-KEYCLOAK_DB_PASSWORD***User,
        temporaryPassword: temporaryPassword // Return password for frontend display
      };
    } catch (error) {
      console.error('❌ Failed to create user in Keycloak:', error.response?.data || error.message);
      throw new Error('Failed to create user in IAM system');
    }
  }

  /**
   * Update user in Keycloak
   */
  async updateUser(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId, userData) {
    try {
      const adminToken = await this.getAdminToken();
      
      const updateData = {};
      
      if (userData.name) {
        const nameParts = userData.name.split(' ');
        updateData.firstName = nameParts[0] || userData.name;
        updateData.lastName = nameParts.slice(1).join(' ') || '';
      }
      
      if (userData.email) {
        updateData.email = userData.email;
      }
      
      if (userData.attributes) {
        updateData.attributes = userData.attributes;
      }

      await axios.put(
        `${this.baseURL}/admin/realms/${this.realm}/users/${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ User updated in Keycloak: ${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update user in Keycloak:', error.response?.data || error.message);
      throw new Error('Failed to update user in IAM system');
    }
  }

  /**
   * Get user from Keycloak
   */
  async getUser(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId) {
    try {
      const adminToken = await this.getAdminToken();
      
      const response = await axios.get(
        `${this.baseURL}/admin/realms/${this.realm}/users/${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      return {
        success: true,
        user: response.data
      };
    } catch (error) {
      console.error('❌ Failed to get user from Keycloak:', error.response?.data || error.message);
      throw new Error('Failed to get user from IAM system');
    }
  }

  /**
   * Get user roles from Keycloak
   */
  async getUserRoles(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId) {
    try {
      const adminToken = await this.getAdminToken();
      
      const response = await axios.get(
        `${this.baseURL}/admin/realms/${this.realm}/users/${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}/role-mappings/realm`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      return {
        success: true,
        roles: response.data
      };
    } catch (error) {
      console.error('❌ Failed to get user roles from Keycloak:', error.response?.data || error.message);
      throw new Error('Failed to get user roles from IAM system');
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId, roleName) {
    try {
      const adminToken = await this.getAdminToken();
      
      // Get role ID
      const roleResponse = await axios.get(
        `${this.baseURL}/admin/realms/${this.realm}/roles/${roleName}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      const role = roleResponse.data;
      
      // Assign role to user
      await axios.post(
        `${this.baseURL}/admin/realms/${this.realm}/users/${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}/role-mappings/realm`,
        [role],
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Role '${roleName}' assigned to user: ${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to assign role:', error.response?.data || error.message);
      throw new Error('Failed to assign role to user');
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId) {
    try {
      // First, check if Keycloak is available
      try {
        await axios.get(`${this.baseURL}/`, { timeout: 3000 });
      } catch (connectionError) {
        console.warn('⚠️ Keycloak is not available, using fallback email verification');
        return this.sendFallbackEmailVerification(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId);
      }

      const adminToken = await this.getAdminToken();
      
      await axios.put(
        `${this.baseURL}/admin/realms/${this.realm}/users/${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}/send-verify-email`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Email verification sent to user: ${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send email verification via Keycloak:', error.response?.data || error.message);
      console.warn('⚠️ Falling back to local email verification');
      return this.sendFallbackEmailVerification(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId);
    }
  }

  /**
   * Fallback email verification when Keycloak is not available
   */
  async sendFallbackEmailVerification(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId) {
    try {
      // Get user from local database
      const db = require('../models');
      const user = await db.User.findOne({ where: { iamUserId: ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId } });
      
      if (!user) {
        throw new Error('User not found in local database');
      }

      // Use the email service to send verification
      const EmailService = require('./emailService');
      const emailService = new EmailService();
      
      const verificationToken = this.generateVerificationToken();
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
      
      const emailContent = `
        <h2>Email Verification</h2>
        <p>Hello ${user.name},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `;

      await emailService.sendEmail(
        user.email,
        'Verify Your Email Address - Contract Management System',
        emailContent
      );

      // Store verification token in user attributes (for now, we'll use a simple approach)
      await user.update({
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      console.log(`✅ Fallback email verification sent to: ${user.email}`);
      return { 
        success: true, 
        method: 'fallback',
        message: 'Email verification sent via local email service'
      };
    } catch (error) {
      console.error('❌ Fallback email verification failed:', error.message);
      throw new Error('Failed to send email verification (both Keycloak and fallback failed)');
    }
  }

  /**
   * Generate a verification token
   */
  generateVerificationToken() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Reset user password
   */
  async resetPassword(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId, newPassword, temporary = true) {
    try {
      const adminToken = await this.getAdminToken();
      
      await axios.put(
        `${this.baseURL}/admin/realms/${this.realm}/users/${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}/reset-password`,
        {
          type: 'password',
          value: newPassword,
          temporary: temporary
        },
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Password reset for user: ${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to reset password:', error.response?.data || error.message);
      throw new Error('Failed to reset user password');
    }
  }

  /**
   * Update user password (for password reset flow)
   */
  async updateUserPassword(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId, newPassword) {
    try {
      const adminToken = await this.getAdminToken();
      
      await axios.put(
        `${this.baseURL}/admin/realms/${this.realm}/users/${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}/reset-password`,
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

      console.log(`✅ Password updated for user: ${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update password:', error.response?.data || error.message);
      throw new Error('Failed to update user password');
    }
  }

  /**
   * Send password reset email via Keycloak
   */
  async sendPasswordResetEmail(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId) {
    try {
      const adminToken = await this.getAdminToken();
      
      await axios.put(
        `${this.baseURL}/admin/realms/${this.realm}/users/${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}/execute-actions-email`,
        ['UPDATE_PASSWORD'],
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Password reset email sent for user: ${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.response?.data || error.message);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Delete user from Keycloak
   */
  async deleteUser(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId) {
    try {
      const adminToken = await this.getAdminToken();
      
      await axios.delete(
        `${this.baseURL}/admin/realms/${this.realm}/users/${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        }
      );

      console.log(`✅ User deleted from Keycloak: ${***REMOVED-KEYCLOAK_DB_PASSWORD***UserId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete user from Keycloak:', error.response?.data || error.message);
      throw new Error('Failed to delete user from IAM system');
    }
  }

  /**
   * Generate temporary password
   */
  generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Sync user between Keycloak and local database
   */
  async syncUser(localUser, db) {
    try {
      if (!localUser.iamUserId) {
        // Create user in Keycloak
        const ***REMOVED-KEYCLOAK_DB_PASSWORD***Result = await this.createUser({
          email: localUser.email,
          name: localUser.name,
          walletAddress: localUser.walletAddress,
          partyType: localUser.partyType,
          publicKey: localUser.publicKey,
          organization: localUser.organization,
          phoneNumber: localUser.phoneNumber,
          website: localUser.website,
          location: localUser.location
        });

        // Update local user with Keycloak ID
        await localUser.update({
          iamUserId: ***REMOVED-KEYCLOAK_DB_PASSWORD***Result.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId,
          iamUsername: localUser.email,
          onboardingStatus: 'IN_PROGRESS'
        });

        console.log(`✅ User synced to Keycloak: ${localUser.id}`);
        return { success: true, ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId: ***REMOVED-KEYCLOAK_DB_PASSWORD***Result.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId };
      } else {
        // Update existing user in Keycloak
        await this.updateUser(localUser.iamUserId, {
          name: localUser.name,
          email: localUser.email,
          attributes: {
            walletAddress: [localUser.walletAddress],
            partyType: [localUser.partyType],
            publicKey: [localUser.publicKey],
            organization: [localUser.organization || ''],
            phoneNumber: [localUser.phoneNumber || ''],
            website: [localUser.website || ''],
            location: [localUser.location || '']
          }
        });

        console.log(`✅ User synced with Keycloak: ${localUser.id}`);
        return { success: true, ***REMOVED-KEYCLOAK_DB_PASSWORD***UserId: localUser.iamUserId };
      }
    } catch (error) {
      console.error('❌ Failed to sync user:', error.message);
      throw error;
    }
  }

  /**
   * Get user onboarding status
   */
  async getOnboardingStatus(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId) {
    try {
      const userResult = await this.getUser(***REMOVED-KEYCLOAK_DB_PASSWORD***UserId);
      const user = userResult.user;
      
      let status = 'PENDING';
      
      if (user.emailVerified) {
        status = 'VERIFIED';
      } else if (user.attributes?.profileCompleted?.[0] === 'true') {
        status = 'COMPLETED';
      } else if (user.attributes?.onboardingStarted?.[0] === 'true') {
        status = 'IN_PROGRESS';
      }
      
      return {
        success: true,
        status: status,
        emailVerified: user.emailVerified,
        profileCompleted: user.attributes?.profileCompleted?.[0] === 'true'
      };
    } catch (error) {
      console.error('❌ Failed to get onboarding status:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate user with email and password (Resource Owner Password Credentials grant)
   */
  async authenticateUserWithPassword(email, password) {
    try {
      const response = await axios.post(
        `${this.baseURL}/realms/${this.realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          username: email,
          password: password,
          grant_type: 'password',
          client_id: this.config.backendClient,
          client_secret: this.config.backendClientSecret,
          scope: 'openid profile email'
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 5000
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Keycloak user authentication failed:', error.response?.data || error.message);
      throw new Error('Keycloak authentication failed');
    }
  }

  /**
   * Get user info from Keycloak using access token
   */
  async getUserInfo(accessToken) {
    try {
      const response = await axios.get(
        `${this.baseURL}/realms/${this.realm}/protocol/openid-connect/userinfo`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          timeout: 5000
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get user info from Keycloak:', error.response?.data || error.message);
      throw new Error('Failed to get user info from Keycloak');
    }
  }
}

module.exports = KeycloakService; 