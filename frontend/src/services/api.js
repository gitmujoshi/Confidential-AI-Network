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
  (error) => {
    console.error('❌ [API] Response error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const apiService = {
  // Generic HTTP methods
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),

  // Auth
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  verifyDID: (didData) => api.post('/api/auth/verify-did', didData),
  getAuthDIDInfo: () => api.get('/api/auth/did-info'),

  // DID Management
  verifyDIDOwnership: (didData) => api.post('/api/did/verify', didData),
  getDIDInfo: (did) => api.get(`/api/did/info/${did}`),
  resolveDID: (did) => api.get(`/api/did/resolve/${did}`),
  checkDIDAvailability: (did) => api.get(`/api/did/check/${did}`),
  createSystemDID: (data) => api.post('/api/did/create-system', data),
  getSupportedDIDMethods: () => api.get('/api/did/supported-methods'),

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
  getContracts: (userId) => api.get(`/api/contracts/user/${userId}`),
  getContract: (contractId) => api.get(`/api/contracts/${contractId}`),
  createContract: (contractData) => api.post('/api/contracts', contractData),
  getContractSigningData: (contractId) => api.get(`/api/contracts/${contractId}/signing-data`),
  signContract: (contractId, data) => api.post(`/api/contracts/${contractId}/sign`, data),
  selectCCRP: (contractId, data) => api.post(`/api/contracts/${contractId}/select-ccrp`, data),
  completeContract: (contractId, data) => api.post(`/api/contracts/${contractId}/complete`, data),
  cancelContract: (contractId, data) => api.post(`/api/contracts/${contractId}/cancel`, data),

  // Users
  getUsers: async () => {
    const response = await api.get('/api/users');
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
  registerUser: (userData) => api.post('/api/users/register', userData),
  updateUserRegistration: (userId, userData) => api.put(`/api/users/${userId}/register`, userData),

  // Notifications
  getNotifications: (userId, params) => api.get(`/api/notifications/${userId}`, { params }),
  markNotificationAsRead: (notificationId, data) => api.put(`/api/notifications/${notificationId}/read`, data),

  // Blockchain
  getBlockchainStatus: async () => {
    const response = await api.get('/api/blockchain/status');
    return response.data;
  },

  // Health check
  healthCheck: () => api.get('/health'),
};

export default apiService; 