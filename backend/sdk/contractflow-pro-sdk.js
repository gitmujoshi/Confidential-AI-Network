/**
 * ContractFlow Pro - Node.js Client SDK
 * Comprehensive SDK for interacting with the ContractFlow Pro API
 */

const axios = require('axios');

class ContractFlowProSDK {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'http://localhost:5001';
    this.apiBase = `${this.baseURL}/api`;
    this.token = config.token || null;
    this.timeout = config.timeout || 30000;
    
    // Initialize axios instance
    this.client = axios.create({
      baseURL: this.apiBase,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your token.');
        }
        throw error;
      }
    );
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
  }

  /**
   * Health & System
   */
  async getHealth() {
    const response = await this.client.get('/health');
    return response.data;
  }

  async getAPIStatus() {
    const response = await this.client.get('/api/status');
    return response.data;
  }

  /**
   * Authentication
   */
  async login(email, password) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.success && response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async register(userData) {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  async logout() {
    this.clearToken();
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Contract Management
   */
  async createRicardianContract(contractData) {
    const response = await this.client.post('/contracts/ricardian', contractData);
    return response.data;
  }

  async getContract(contractId) {
    const response = await this.client.get(`/contracts/${contractId}`);
    return response.data;
  }

  async listContracts(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await this.client.get(`/contracts?${queryParams}`);
    return response.data;
  }

  async updateContract(contractId, updateData) {
    const response = await this.client.put(`/contracts/${contractId}`, updateData);
    return response.data;
  }

  async previewContract(contractData) {
    const response = await this.client.post('/contracts/ricardian/multi-tdp-preview-test', contractData);
    return response.data;
  }

  /**
   * Dataset Management
   */
  async getPublicDatasets(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await this.client.get(`/datasets/public?${queryParams}`);
    return response.data;
  }

  async searchDatasets(query, filters = {}) {
    const params = { q: query, ...filters };
    const queryParams = new URLSearchParams(params);
    const response = await this.client.get(`/datasets/search?${queryParams}`);
    return response.data;
  }

  async getTDPDatasets(userId) {
    const response = await this.client.get(`/tdp/datasets/${userId}`);
    return response.data;
  }

  async createDataset(datasetData) {
    const response = await this.client.post('/datasets', datasetData);
    return response.data;
  }

  /**
   * Infrastructure & Cloud
   */
  async createTrainingEnvironment(environmentData) {
    const response = await this.client.post('/infrastructure/environments', environmentData);
    return response.data;
  }

  async getEnvironment(environmentId) {
    const response = await this.client.get(`/infrastructure/environments/${environmentId}`);
    return response.data;
  }

  async listEnvironments(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await this.client.get(`/infrastructure/environments?${queryParams}`);
    return response.data;
  }

  async destroyEnvironment(environmentId) {
    const response = await this.client.delete(`/infrastructure/environments/${environmentId}`);
    return response.data;
  }

  async getCloudProviders() {
    const response = await this.client.get('/infrastructure/cloud-providers');
    return response.data;
  }

  async getCloudProviderDetails(provider) {
    const response = await this.client.get(`/infrastructure/cloud-providers/${provider}`);
    return response.data;
  }

  async estimateCosts(estimationData) {
    const response = await this.client.post('/infrastructure/cost-estimation', estimationData);
    return response.data;
  }

  /**
   * Cloud Credentials
   */
  async storeCloudCredentials(credentialData) {
    const response = await this.client.post('/ccrp/cloud-credentials', credentialData);
    return response.data;
  }

  async getCloudCredentials(userId) {
    const response = await this.client.get(`/ccrp/cloud-credentials/${userId}`);
    return response.data;
  }

  async validateCredentials(credentialId) {
    const response = await this.client.post(`/ccrp/cloud-credentials/${credentialId}/validate`);
    return response.data;
  }

  async getSecretManagers() {
    const response = await this.client.get('/secret-managers');
    return response.data;
  }

  /**
   * Dashboards
   */
  async getTDCDashboard(userId) {
    const response = await this.client.get(`/tdc/dashboard/${userId}`);
    return response.data;
  }

  async getTDPDashboard(userId) {
    const response = await this.client.get(`/tdp/dashboard/${userId}`);
    return response.data;
  }

  async getCCRPDashboard(userId) {
    const response = await this.client.get(`/ccrp/dashboard/${userId}`);
    return response.data;
  }

  /**
   * Analytics
   */
  async getContractAnalytics(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await this.client.get(`/analytics/contracts?${queryParams}`);
    return response.data;
  }

  /**
   * User Management
   */
  async listUsers(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await this.client.get(`/users?${queryParams}`);
    return response.data;
  }

  async getUser(userId) {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }

  /**
   * Security & Compliance
   */
  async getEnvironmentSecurity(environmentId) {
    const response = await this.client.get(`/infrastructure/environments/${environmentId}/security`);
    return response.data;
  }

  async getComplianceReport(environmentId) {
    const response = await this.client.get(`/infrastructure/environments/${environmentId}/compliance`);
    return response.data;
  }

  /**
   * Monitoring & Metrics
   */
  async getEnvironmentMetrics(environmentId, params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await this.client.get(`/infrastructure/environments/${environmentId}/metrics?${queryParams}`);
    return response.data;
  }

  /**
   * Utility Methods
   */
  async isAuthenticated() {
    try {
      await this.getProfile();
      return true;
    } catch (error) {
      return false;
    }
  }

  async refreshToken() {
    // Implementation depends on refresh token endpoint
    throw new Error('Refresh token not implemented yet');
  }

  /**
   * Batch Operations
   */
  async batchCreateContracts(contractsData) {
    const promises = contractsData.map(data => this.createRicardianContract(data));
    return Promise.allSettled(promises);
  }

  async batchGetContracts(contractIds) {
    const promises = contractIds.map(id => this.getContract(id));
    return Promise.allSettled(promises);
  }

  /**
   * Error Handling
   */
  handleError(error) {
    if (error.response) {
      return {
        status: error.response.status,
        message: error.response.data?.error || error.message,
        details: error.response.data?.details || null
      };
    }
    return {
      status: 0,
      message: error.message,
      details: null
    };
  }
}

/**
 * Convenience Classes for Specific Use Cases
 */
class ContractManager {
  constructor(sdk) {
    this.sdk = sdk;
  }

  async createAITrainingContract(datasetIds, duration, terms) {
    return this.sdk.createRicardianContract({
      datasetSelections: datasetIds.map(id => ({ datasetId: id, individualPrice: 1000 })),
      duration,
      termsAndConditions: terms,
      contractType: 'AI_TRAINING',
      privacyRequirements: {
        differentialPrivacy: true,
        maxPrivacyLoss: 0.1
      }
    });
  }

  async getActiveContracts() {
    return this.sdk.listContracts({ status: 'ACTIVE' });
  }

  async getContractHistory() {
    return this.sdk.listContracts({ status: 'COMPLETED' });
  }
}

class DatasetManager {
  constructor(sdk) {
    this.sdk = sdk;
  }

  async searchByCategory(category, maxPrice = null) {
    const filters = { category };
    if (maxPrice) filters.priceMax = maxPrice;
    return this.sdk.searchDatasets('', filters);
  }

  async getAffordableDatasets(budget) {
    return this.sdk.getPublicDatasets({ priceMax: budget });
  }
}

class InfrastructureManager {
  constructor(sdk) {
    this.sdk = sdk;
  }

  async provisionAzureEnvironment(contractId, vmSize = 'Standard_D2s_v3') {
    return this.sdk.createTrainingEnvironment({
      contractId,
      cloudProvider: 'AZURE',
      region: 'eastus',
      vmSize,
      enableConfidentialComputing: true,
      enableEncryption: true
    });
  }

  async provisionAWSEnvironment(contractId, instanceType = 't3.medium') {
    return this.sdk.createTrainingEnvironment({
      contractId,
      cloudProvider: 'AWS',
      region: 'us-east-1',
      vmSize: instanceType,
      enableConfidentialComputing: true,
      enableEncryption: true
    });
  }

  async monitorEnvironment(environmentId) {
    return this.sdk.getEnvironmentMetrics(environmentId, { timeRange: '24h' });
  }
}

/**
 * Export the SDK and convenience classes
 */
module.exports = {
  ContractFlowProSDK,
  ContractManager,
  DatasetManager,
  InfrastructureManager
};

// Example usage:
/*
const { ContractFlowProSDK, ContractManager } = require('./contractflow-pro-sdk');

const sdk = new ContractFlowProSDK({
  baseURL: 'https://api.contractflowpro.com',
  timeout: 30000
});

// Login
await sdk.login('user@example.com', 'password');

// Use convenience classes
const contractManager = new ContractManager(sdk);
const contract = await contractManager.createAITrainingContract(
  ['DS-001', 'DS-002'],
  30,
  'Standard AI training terms'
);

console.log('Contract created:', contract);
*/ 