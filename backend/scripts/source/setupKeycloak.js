/**
 * Keycloak Setup Script
 * 
 * This script automates the setup of Keycloak for the Contract Management System.
 * It configures the realm, clients, roles, and initial admin user.
 * 
 * Prerequisites:
 * - Keycloak running on http://localhost:8080
 * - Admin credentials: admin/admin123
 * 
 * Usage:
 * node scripts/setupKeycloak.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Keycloak configuration
const KEYCLOAK_BASE_URL = 'http://localhost:8080';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const REALM_NAME = 'contract-management';

// Client configurations
const FRONTEND_CLIENT = {
  clientId: 'contract-management-frontend',
  publicClient: true,
  standardFlowEnabled: true,
  redirectUris: ['http://localhost:3000/*', 'http://localhost:3000', 'http://localhost:3000/callback'],
  webOrigins: ['http://localhost:3000']
};

const BACKEND_CLIENT = {
  clientId: 'contract-management-backend',
  publicClient: false,
  serviceAccountsEnabled: true
};

class KeycloakSetup {
  constructor() {
    this.accessToken = null;
    this.baseURL = KEYCLOAK_BASE_URL;
  }

  /**
   * Get admin access token
   */
  async getAdminToken() {
    try {
      console.log('🔐 Getting admin access token...');
      
      const response = await axios.post(`${this.baseURL}/realms/master/protocol/openid-connect/token`, 
        new URLSearchParams({
          username: ADMIN_USERNAME,
          password: ADMIN_PASSWORD,
          grant_type: 'password',
          client_id: 'admin-cli'
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      console.log('✅ Admin token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get admin token:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create realm
   */
  async createRealm() {
    try {
      console.log('🏗️ Creating realm...');
      
      const realmData = {
        realm: REALM_NAME,
        enabled: true,
        displayName: 'Contract Management System',
        displayNameHtml: '<div class="kc-logo-text"><span>Contract Management</span></div>',
        attributes: {
          frontendUrl: 'http://localhost:3000',
          backendUrl: 'http://localhost:5001'
        }
      };

      await axios.post(`${this.baseURL}/admin/realms`, realmData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Realm created successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Realm already exists, skipping creation');
      } else {
        console.error('❌ Failed to create realm:', error.response?.data || error.message);
        throw error;
      }
    }
  }

  /**
   * Create roles
   */
  async createRoles() {
    try {
      console.log('👥 Creating roles...');
      
      const roles = [
        {
          name: 'TDP',
          description: 'Training Data Provider - Can create and manage datasets'
        },
        {
          name: 'TDC',
          description: 'Training Data Consumer - Can create contracts'
        },
        {
          name: 'CCRP',
          description: 'Confidential Clean Room Provider - Can review and sign contracts'
        },
        {
          name: 'ADMIN',
          description: 'System Administrator - Full access to all features'
        }
      ];

      for (const role of roles) {
        try {
          await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/roles`, role, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ Role '${role.name}' created`);
        } catch (error) {
          if (error.response?.status === 409) {
            console.log(`ℹ️ Role '${role.name}' already exists`);
          } else {
            console.error(`❌ Failed to create role '${role.name}':`, error.response?.data || error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to create roles:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create groups
   */
  async createGroups() {
    try {
      console.log('👥 Creating groups...');
      
      const groups = [
        {
          name: 'Data Providers',
          attributes: {
            description: ['Training Data Providers Group']
          }
        },
        {
          name: 'Data Consumers',
          attributes: {
            description: ['Training Data Consumers Group']
          }
        },
        {
          name: 'Compliance Reviewers',
          attributes: {
            description: ['Confidential Clean Room Providers Group']
          }
        }
      ];

      for (const group of groups) {
        try {
          await axios.post(`${this.baseURL}/admin/realms/${REALM_NAME}/groups`, group, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ Group '${group.name}' created`);
        } catch (error) {
          if (error.response?.status === 409) {
            console.log(`ℹ️ Group '${group.name}' already exists`);
          } else {
            console.error(`❌ Failed to create group '${group.name}':`, error.response?.data || error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to create groups:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new KeycloakSetup(); 