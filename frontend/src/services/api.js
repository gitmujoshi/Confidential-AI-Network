import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('🌐 [API] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ [API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ [API] Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('❌ [API] Response error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // Check if this is a refresh request to avoid infinite loops
      if (error.config?.url?.includes('/auth/refresh')) {
        console.log('🔐 [API] Refresh token failed, clearing auth tokens');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Check if this is a password update request - don't auto-logout for password updates
      if (error.config?.url?.includes('/auth/update-password')) {
        console.log('🔐 [API] Password update returned 401, but not auto-logging out');
        return Promise.reject(error);
      }

      // Try to refresh the token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        console.log('🔄 [API] Attempting to refresh token...');
        try {
          const refreshResponse = await api.post('/api/auth/refresh', { refreshToken });
          
          // Update tokens in localStorage
          localStorage.setItem('authToken', refreshResponse.data.accessToken);
          localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
          
          // Update the original request with new token
          error.config.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          
          console.log('✅ [API] Token refreshed, retrying original request');
          return api(error.config);
        } catch (refreshError) {
          console.log('❌ [API] Token refresh failed, clearing auth tokens');
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('currentUser');
          
          // Only redirect if we're not already on the login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token available, clear auth tokens
        console.log('🔐 [API] No refresh token available, clearing auth tokens');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// MOCK MODE: To enable mock API responses for registration, you can use either:
// 1. URL parameter: Add ?mock=true to your URL (e.g., http://localhost:3000?mock=true)
// 2. Browser console: localStorage.setItem('USE_MOCK_API', 'true') (if localStorage is available)
// To disable, remove the URL parameter or run: localStorage.removeItem('USE_MOCK_API')
//
// This will make registration, DID, and verification endpoints return fake data for frontend-only testing.

// Check for mock mode via URL parameter or localStorage
const isMock = typeof window !== 'undefined' && (
  (window.localStorage && window.localStorage.getItem('USE_MOCK_API') === 'true') ||
  new URLSearchParams(window.location.search).get('mock') === 'true'
);

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

// Create the real API service first
const realApiService = {
  // Generic HTTP methods
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),

  // Auth
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  updatePassword: (passwordData) => api.post('/api/auth/update-password', passwordData),
  verifyDID: (didData) => api.post('/api/auth/verify-did', didData),
  getAuthDIDInfo: () => api.get('/api/auth/did-info'),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/api/auth/reset-password', { token, newPassword }),
  verifyResetToken: (token) => api.get(`/api/auth/verify-reset-token/${token}`),
  getDevResetToken: (email) => api.get(`/api/auth/dev/reset-token/${email}`),
  updateProfile: (profileData) => api.put('/api/auth/profile', profileData),

  // DID Management
  verifyDIDOwnership: (didData) => api.post('/api/did/verify', didData),
  getDIDInfo: (did) => api.get(`/api/did/info/${did}`),
  resolveDID: (did) => api.get(`/api/did/resolve/${did}`),
  checkDIDAvailability: (did) => api.get(`/api/did/check/${did}`),
  createSystemDID: (data) => api.post('/api/did/create-system', data),
  getSupportedDIDMethods: () => api.get('/api/did/supported-methods'),

  // Enterprise DID Management
  validateEnterpriseDID: (did) => api.get(`/api/did/enterprise/validate/${did}`),
  getEnterpriseDomains: () => api.get('/api/did/enterprise/domains'),
  updateEnterpriseDomains: (config) => api.post('/api/did/enterprise/domains', config),
  getDIDCacheStats: () => api.get('/api/did/cache/stats'),
  clearDIDCache: () => api.post('/api/did/cache/clear'),

  // Datasets
  getDatasets: async (params) => {
    const response = await api.get('/api/datasets/public', { params });
    return response.data;
  },
  getDataset: async (datasetId) => {
    const response = await api.get(`/api/datasets/${datasetId}`);
    return response.data;
  },
  createDataset: (data) => api.post('/api/datasets', data),
  updateDataset: (datasetId, data) => api.put(`/api/datasets/${datasetId}`, data),
  deleteDataset: (datasetId) => api.delete(`/api/datasets/${datasetId}`),
  searchDatasets: async (params) => {
    const response = await api.get('/api/datasets/search', { params });
    return response.data;
  },
  getDatasetCategories: async () => {
    const response = await api.get('/api/datasets/categories/list');
    return response.data;
  },
  getDatasetStats: async () => {
    const response = await api.get('/api/datasets/stats/overview');
    return response.data;
  },

  // Contracts
  getContracts: async (userId) => {
    const response = await api.get(`/api/contracts/user/${userId}`);
    return response.data;
  },
  getContract: async (contractId) => {
    const response = await api.get(`/api/contracts/${contractId}`);
    return response.data;
  },
  createContract: async (contractData) => {
    // Redirect to Ricardian contract creation since plain contracts are deprecated
    const response = await api.post('/api/contracts/ricardian', contractData);
    return response.data;
  },
  createMultiTDPContract: async (contractData) => {
    const response = await api.post('/api/contracts/multi-tdp', contractData);
    return response.data;
  },
  getContractSigningData: async (contractId) => {
    const response = await api.get(`/api/contracts/${contractId}/signing-data`);
    return response.data;
  },
  signContract: async (contractId, data) => {
    const response = await api.post(`/api/contracts/${contractId}/sign`, data);
    return response.data;
  },
  signContractAsTDP: async (contractId, tdpId, data) => {
    const response = await api.post(`/api/contracts/${contractId}/tdp/${tdpId}/sign`, data);
    return response.data;
  },
  getMultiTDPContractStatus: async (contractId) => {
    const response = await api.get(`/api/contracts/${contractId}/multi-tdp-status`);
    return response.data;
  },
  recordPaymentForTDP: async (contractId, tdpId, paymentData) => {
    const response = await api.post(`/api/contracts/${contractId}/tdp/${tdpId}/payment`, paymentData);
    return response.data;
  },
  getPaymentSummary: async (contractId) => {
    const response = await api.get(`/api/contracts/${contractId}/payment-summary`);
    return response.data;
  },
  selectCCRP: async (contractId, data) => {
    const response = await api.post(`/api/contracts/${contractId}/select-ccrp`, data);
    return response.data;
  },
  completeContract: async (contractId, data) => {
    const response = await api.post(`/api/contracts/${contractId}/complete`, data);
    return response.data;
  },
  cancelContract: async (contractId, data) => {
    const response = await api.post(`/api/contracts/${contractId}/cancel`, data);
    return response.data;
  },

  // AI Models
  getAIModels: async () => {
    const response = await api.get('/api/contracts/ricardian/available-models');
    return response.data;
  },

  // Ricardian Contracts
  createRicardianContract: async (contractData) => {
    const response = await api.post('/api/contracts/ricardian', contractData);
    return response.data;
  },
  previewRicardianContract: async (contractData) => {
    const response = await api.post('/api/contracts/ricardian/preview', contractData);
    return response.data;
  },
  previewMultiTDPRicardianContract: async (contractData) => {
    const response = await api.post('/api/contracts/ricardian/multi-tdp-preview-test', contractData);
    return response.data;
  },
  verifyRicardianContract: async (contractId) => {
    const response = await api.get(`/api/contracts/${contractId}/verify`);
    return response.data;
  },
  updateContractEnvironment: async (contractId, environmentSpecs) => {
    const response = await api.put(`/api/contracts/${contractId}/environment`, { environmentSpecs });
    return response.data;
  },
  updateContractTraining: async (contractId, trainingParams) => {
    const response = await api.put(`/api/contracts/${contractId}/training`, { trainingParams });
    return response.data;
  },
  updateContractKMS: async (contractId, kmsConfigs) => {
    const response = await api.put(`/api/contracts/${contractId}/kms`, { kmsConfigs });
    return response.data;
  },
  updateContractAttestation: async (contractId, attestationReport) => {
    const response = await api.put(`/api/contracts/${contractId}/attestation`, { attestationReport });
    return response.data;
  },

  // Update contract (TDC only)
  updateContract: async (contractId, updateData) => {
    const response = await api.put(`/api/contracts/${contractId}`, updateData);
    return response.data;
  },
  getSupportedContractTypes: async () => {
    const response = await api.get('/api/contracts/types/supported');
    return response.data.supportedTypes;
  },
  getAvailableModels: async () => {
    const response = await api.get('/api/contracts/ricardian/available-models');
    return response.data;
  },
  getContractTemplate: async (contractType) => {
    const response = await api.get(`/api/contracts/types/${contractType}/template`);
    return response.data;
  },

  // Users
  getUsers: async () => {
    const response = await api.get('/api/users');
    return response.data.users || [];
  },
  getCCRPUsers: async (cloudProvider = null) => {
    // Create a clean URL with only the parameters we want
    let url = '/api/ccrp/all';
    if (cloudProvider) {
      url += `?cloudProvider=${encodeURIComponent(cloudProvider)}`;
    }
    const response = await api.get(url);
    return response.data;
  },
  getUser: (userId) => api.get(`/api/users/${userId}`),
  getUserByWallet: async (walletAddress) => {
    console.log('🌐 [API] getUserByWallet called with address:', walletAddress);
    try {
      const response = await api.get(`/api/users/wallet/${walletAddress}`);
      console.log('✅ [API] getUserByWallet response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [API] getUserByWallet error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Enterprise Signing Service
  signMessage: async (data) => {
    const response = await api.post('/api/signing/sign', data);
    return response.data;
  },
  getAvailableDIDs: async () => {
    const response = await api.get('/api/signing/dids');
    return response.data;
  },
  getPublicKey: async (did) => {
    const response = await api.get(`/api/signing/public-key/${encodeURIComponent(did)}`);
    return response.data;
  },
  validateSigningPermission: async (data) => {
    const response = await api.post('/api/signing/validate-permission', data);
    return response.data;
  },
  testSigning: async (data) => {
    const response = await api.post('/api/signing/test', data);
    return response.data;
  },
  registerUser: (userData) => api.post('/api/users/register', userData),
  updateUserRegistration: (userId, userData) => api.put(`/api/users/${userId}/register`, userData),

  // Notifications
  getNotifications: async (userId, params) => {
    const response = await api.get(`/api/notifications/${userId}`, { params });
    return response.data;
  },
  markNotificationAsRead: (notificationId, data) => api.put(`/api/notifications/${notificationId}/read`, data),

  // Blockchain
  getBlockchainStatus: async () => {
    const response = await api.get('/api/blockchain/status');
    return response.data;
  },

  // Health check
  healthCheck: () => api.get('/health'),
};

// Create mock API service that only implements registration endpoints
const mockApiService = {
  // Registration endpoints
  register: async (userData) => {
    await delay(500);
    const mockPassword = 'TempPass123!';
    return { 
      data: { 
        success: true, 
        userId: 'mock-user-123', 
        loginCredentials: {
          email: userData.email,
          password: mockPassword,
          note: 'Mock credentials for testing. Use these to log in.'
        },
        ...userData 
      } 
    };
  },
  registerUser: async (userData) => {
    await delay(500);
    const mockPassword = 'TempPass123!';
    return { 
      data: { 
        success: true, 
        userId: 'mock-user-123',
        loginCredentials: {
          email: userData.email,
          password: mockPassword,
          note: 'Mock credentials for testing. Use these to log in.'
        },
        ...userData 
      } 
    };
  },
  verifyDID: async (didData) => {
    await delay(300);
    return { data: { verified: true, ...didData } };
  },
  checkDIDAvailability: async (did) => {
    await delay(300);
    // Simulate that all DIDs except one are available
    if (decodeURIComponent(did) === 'did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678') {
      return { data: { available: false } };
    }
    return { data: { available: true } };
  },
  getDIDInfo: async (did) => {
    await delay(300);
    return { data: { did: decodeURIComponent(did), owner: '0xMockOwner', created: '2024-01-01' } };
  },
  verifyDIDOwnership: async (didData) => {
    await delay(300);
    return { data: { verified: true, ...didData } };
  },
  // Blockchain status for mock mode
  getBlockchainStatus: async () => {
    await delay(300);
    return { connected: false, enabled: false, timestamp: new Date().toISOString() };
  },
  
  // For other methods, throw error indicating mock mode
  get: () => { throw new Error('Mock API: get() not implemented for registration testing'); },
  post: () => { throw new Error('Mock API: post() not implemented for registration testing'); },
  put: () => { throw new Error('Mock API: put() not implemented for registration testing'); },
  delete: () => { throw new Error('Mock API: delete() not implemented for registration testing'); },
  login: () => { throw new Error('Mock API: login() not implemented for registration testing'); },
  logout: () => { throw new Error('Mock API: logout() not implemented for registration testing'); },
  getAuthDIDInfo: () => { throw new Error('Mock API: getAuthDIDInfo() not implemented for registration testing'); },
  resolveDID: () => { throw new Error('Mock API: resolveDID() not implemented for registration testing'); },
  createSystemDID: () => { throw new Error('Mock API: createSystemDID() not implemented for registration testing'); },
  getSupportedDIDMethods: () => { throw new Error('Mock API: getSupportedDIDMethods() not implemented for registration testing'); },
  validateEnterpriseDID: () => { throw new Error('Mock API: validateEnterpriseDID() not implemented for registration testing'); },
  getEnterpriseDomains: () => { throw new Error('Mock API: getEnterpriseDomains() not implemented for registration testing'); },
  updateEnterpriseDomains: () => { throw new Error('Mock API: updateEnterpriseDomains() not implemented for registration testing'); },
  getDIDCacheStats: () => { throw new Error('Mock API: getDIDCacheStats() not implemented for registration testing'); },
  clearDIDCache: () => { throw new Error('Mock API: clearDIDCache() not implemented for registration testing'); },
  getDatasets: () => { throw new Error('Mock API: getDatasets() not implemented for registration testing'); },
  getDataset: () => { throw new Error('Mock API: getDataset() not implemented for registration testing'); },
  createDataset: () => { throw new Error('Mock API: createDataset() not implemented for registration testing'); },
  updateDataset: () => { throw new Error('Mock API: updateDataset() not implemented for registration testing'); },
  deleteDataset: () => { throw new Error('Mock API: deleteDataset() not implemented for registration testing'); },
  searchDatasets: () => { throw new Error('Mock API: searchDatasets() not implemented for registration testing'); },
  getDatasetCategories: () => { throw new Error('Mock API: getDatasetCategories() not implemented for registration testing'); },
  getDatasetStats: () => { throw new Error('Mock API: getDatasetStats() not implemented for registration testing'); },
  getContracts: () => { throw new Error('Mock API: getContracts() not implemented for registration testing'); },
  getContract: () => { throw new Error('Mock API: getContract() not implemented for registration testing'); },
  createContract: () => { throw new Error('Mock API: createContract() not implemented for registration testing'); },
  getContractSigningData: () => { throw new Error('Mock API: getContractSigningData() not implemented for registration testing'); },
  signContract: () => { throw new Error('Mock API: signContract() not implemented for registration testing'); },
  selectCCRP: () => { throw new Error('Mock API: selectCCRP() not implemented for registration testing'); },
  completeContract: () => { throw new Error('Mock API: completeContract() not implemented for registration testing'); },
  cancelContract: () => { throw new Error('Mock API: cancelContract() not implemented for registration testing'); },
  getUsers: () => { throw new Error('Mock API: getUsers() not implemented for registration testing'); },
  getUser: () => { throw new Error('Mock API: getUser() not implemented for registration testing'); },
  getUserByWallet: () => { throw new Error('Mock API: getUserByWallet() not implemented for registration testing'); },
  updateUserRegistration: () => { throw new Error('Mock API: updateUserRegistration() not implemented for registration testing'); },
  getNotifications: () => { throw new Error('Mock API: getNotifications() not implemented for registration testing'); },
  markNotificationAsRead: () => { throw new Error('Mock API: markNotificationAsRead() not implemented for registration testing'); },
  healthCheck: () => { throw new Error('Mock API: healthCheck() not implemented for registration testing'); },
};

// Export the appropriate service based on mock mode
export const apiService = isMock ? mockApiService : realApiService;

export default apiService; 