// Mock API Service for Frontend-Only Development
// This allows testing the frontend without the backend running

// Simulate network delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage
const mockStorage = {
  users: [],
  datasets: [],
  contracts: [],
  notifications: []
};

// Mock user data
const mockUsers = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    partyType: 'TDC',
    walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    organization: 'DataCorp Inc',
    domain: 'datacorp.com',
    address: '123 Business St, Tech City, TC 12345',
    userType: 'enterprise',
    isRegistered: true,
    registrationDate: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    partyType: 'TDP',
    walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    organization: 'ProcessTech Ltd',
    domain: 'processtech.com',
    address: '456 Processing Ave, Data Town, DT 67890',
    userType: 'enterprise',
    isRegistered: true,
    registrationDate: '2024-01-20T14:15:00Z'
  },
  {
    id: 3,
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    partyType: 'CCRP',
    walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    organization: 'Compliance Partners',
    domain: 'compliancepartners.com',
    address: '789 Compliance Blvd, Reg City, RC 11111',
    userType: 'enterprise',
    isRegistered: true,
    registrationDate: '2024-01-25T09:45:00Z'
  }
];

// Mock datasets
const mockDatasets = [
  {
    id: 1,
    name: 'Medical Imaging Dataset',
    description: 'High-quality medical imaging data for AI training',
    category: 'Healthcare',
    size: '2.5GB',
    records: 15000,
    owner: 'DataCorp Inc',
    price: 5000,
    status: 'available',
    createdAt: '2024-01-10T08:00:00Z'
  },
  {
    id: 2,
    name: 'Financial Transaction Data',
    description: 'Anonymized financial transaction records',
    category: 'Finance',
    size: '1.8GB',
    records: 25000,
    owner: 'ProcessTech Ltd',
    price: 3500,
    status: 'available',
    createdAt: '2024-01-12T10:30:00Z'
  },
  {
    id: 3,
    name: 'E-commerce User Behavior',
    description: 'Customer behavior patterns from online shopping',
    category: 'Retail',
    size: '3.2GB',
    records: 30000,
    owner: 'DataCorp Inc',
    price: 4200,
    status: 'available',
    createdAt: '2024-01-15T14:20:00Z'
  }
];

// Mock contracts
const mockContracts = [
  {
    id: 1,
    title: 'Medical Data Processing Agreement',
    datasetId: 1,
    datasetName: 'Medical Imaging Dataset',
    tdc: 'Alice Johnson',
    tdp: 'Bob Smith',
    ccrp: 'Charlie Brown',
    status: 'active',
    value: 5000,
    createdAt: '2024-01-20T11:00:00Z',
    signedAt: '2024-01-21T15:30:00Z'
  },
  {
    id: 2,
    title: 'Financial Data Analysis Contract',
    datasetId: 2,
    datasetName: 'Financial Transaction Data',
    tdc: 'Alice Johnson',
    tdp: 'Bob Smith',
    ccrp: 'Charlie Brown',
    status: 'pending',
    value: 3500,
    createdAt: '2024-01-22T09:15:00Z'
  }
];

// Mock notifications
const mockNotifications = [
  {
    id: 1,
    userId: 1,
    title: 'Contract Signed',
    message: 'Your contract "Medical Data Processing Agreement" has been signed by all parties.',
    type: 'success',
    read: false,
    createdAt: '2024-01-21T15:35:00Z'
  },
  {
    id: 2,
    userId: 1,
    title: 'New Dataset Available',
    message: 'A new dataset "E-commerce User Behavior" is now available for processing.',
    type: 'info',
    read: false,
    createdAt: '2024-01-15T14:25:00Z'
  }
];

// Initialize mock storage
mockStorage.users = [...mockUsers];
mockStorage.datasets = [...mockDatasets];
mockStorage.contracts = [...mockContracts];
mockStorage.notifications = [...mockNotifications];

// Mock API service
export const mockApiService = {
  // Generic HTTP methods (simulated)
  get: async (url, config) => {
    await delay();
    console.log('🔧 [Mock API] GET:', url);
    
    // Simulate different endpoints
    if (url.includes('/api/users')) {
      return { data: mockStorage.users };
    } else if (url.includes('/api/datasets')) {
      return { data: mockStorage.datasets };
    } else if (url.includes('/api/contracts')) {
      return { data: mockStorage.contracts };
    } else if (url.includes('/api/notifications')) {
      return { data: mockStorage.notifications };
    } else if (url.includes('/health')) {
      return { data: { status: 'OK', timestamp: new Date().toISOString() } };
    }
    
    return { data: null };
  },

  post: async (url, data, config) => {
    await delay();
    console.log('🔧 [Mock API] POST:', url, data);
    
    // Simulate different endpoints
    if (url.includes('/api/auth/register')) {
      const newUser = {
        id: mockStorage.users.length + 1,
        ...data,
        isRegistered: true,
        registrationDate: new Date().toISOString()
      };
      mockStorage.users.push(newUser);
      return { data: { success: true, user: newUser, message: 'Registration successful' } };
    } else if (url.includes('/api/datasets')) {
      const newDataset = {
        id: mockStorage.datasets.length + 1,
        ...data,
        status: 'available',
        createdAt: new Date().toISOString()
      };
      mockStorage.datasets.push(newDataset);
      return { data: { success: true, dataset: newDataset } };
    } else if (url.includes('/api/contracts')) {
      const newContract = {
        id: mockStorage.contracts.length + 1,
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      mockStorage.contracts.push(newContract);
      return { data: { success: true, contract: newContract } };
    }
    
    return { data: { success: true } };
  },

  put: async (url, data, config) => {
    await delay();
    console.log('🔧 [Mock API] PUT:', url, data);
    return { data: { success: true } };
  },

  delete: async (url, config) => {
    await delay();
    console.log('🔧 [Mock API] DELETE:', url);
    return { data: { success: true } };
  },

  // Auth
  login: async (credentials) => {
    await delay();
    console.log('🔧 [Mock API] Login:', credentials);
    const user = mockStorage.users.find(u => u.email === credentials.email);
    if (user) {
      return { data: { success: true, user, token: 'mock-jwt-token' } };
    }
    throw new Error('Invalid credentials');
  },

  register: async (userData) => {
    await delay();
    console.log('🔧 [Mock API] Register:', userData);
    const newUser = {
      id: mockStorage.users.length + 1,
      ...userData,
      isRegistered: true,
      registrationDate: new Date().toISOString()
    };
    mockStorage.users.push(newUser);
    return { data: { success: true, user: newUser, message: 'Registration successful' } };
  },

  logout: async () => {
    await delay();
    console.log('🔧 [Mock API] Logout');
    return { data: { success: true } };
  },

  verifyDID: async (didData) => {
    await delay();
    console.log('🔧 [Mock API] Verify DID:', didData);
    return { data: { success: true, verified: true } };
  },

  getAuthDIDInfo: async () => {
    await delay();
    console.log('🔧 [Mock API] Get Auth DID Info');
    return { data: { did: 'did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678' } };
  },

  // DID Management
  verifyDIDOwnership: async (didData) => {
    await delay();
    console.log('🔧 [Mock API] Verify DID Ownership:', didData);
    return { data: { success: true, verified: true } };
  },

  getDIDInfo: async (did) => {
    await delay();
    console.log('🔧 [Mock API] Get DID Info:', did);
    return { data: { method: 'ethr', identifier: did.split(':')[2] } };
  },

  resolveDID: async (did) => {
    await delay();
    console.log('🔧 [Mock API] Resolve DID:', did);
    return { data: { resolved: true, document: { id: did } } };
  },

  checkDIDAvailability: async (did) => {
    await delay();
    console.log('🔧 [Mock API] Check DID Availability:', did);
    // Simulate some DIDs as taken
    const takenDIDs = [
      'did:ethr:goerli:0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      'did:ethr:goerli:0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
    ];
    const isAvailable = !takenDIDs.includes(did);
    return { data: { available: isAvailable } };
  },

  createSystemDID: async (data) => {
    await delay();
    console.log('🔧 [Mock API] Create System DID:', data);
    return { data: { success: true, did: 'did:ethr:goerli:0x' + Math.random().toString(16).substr(2, 40) } };
  },

  getSupportedDIDMethods: async () => {
    await delay();
    console.log('🔧 [Mock API] Get Supported DID Methods');
    return { data: ['ethr', 'web'] };
  },

  // Enterprise DID Management
  validateEnterpriseDID: async (did) => {
    await delay();
    console.log('🔧 [Mock API] Validate Enterprise DID:', did);
    return { data: { valid: true, domain: did.split(':')[2] } };
  },

  getEnterpriseDomains: async () => {
    await delay();
    console.log('🔧 [Mock API] Get Enterprise Domains');
    return { data: ['example.com', 'company.com', 'enterprise.org'] };
  },

  updateEnterpriseDomains: async (config) => {
    await delay();
    console.log('🔧 [Mock API] Update Enterprise Domains:', config);
    return { data: { success: true } };
  },

  getDIDCacheStats: async () => {
    await delay();
    console.log('🔧 [Mock API] Get DID Cache Stats');
    return { data: { hits: 150, misses: 25, size: 50 } };
  },

  clearDIDCache: async () => {
    await delay();
    console.log('🔧 [Mock API] Clear DID Cache');
    return { data: { success: true } };
  },

  // Datasets
  getDatasets: async (params) => {
    await delay();
    console.log('🔧 [Mock API] Get Datasets:', params);
    return mockStorage.datasets;
  },

  getDataset: async (datasetId) => {
    await delay();
    console.log('🔧 [Mock API] Get Dataset:', datasetId);
    const dataset = mockStorage.datasets.find(d => d.id === parseInt(datasetId));
    return dataset || null;
  },

  createDataset: async (data) => {
    await delay();
    console.log('🔧 [Mock API] Create Dataset:', data);
    const newDataset = {
      id: mockStorage.datasets.length + 1,
      ...data,
      status: 'available',
      createdAt: new Date().toISOString()
    };
    mockStorage.datasets.push(newDataset);
    return { data: { success: true, dataset: newDataset } };
  },

  updateDataset: async (datasetId, data) => {
    await delay();
    console.log('🔧 [Mock API] Update Dataset:', datasetId, data);
    return { data: { success: true } };
  },

  deleteDataset: async (datasetId) => {
    await delay();
    console.log('🔧 [Mock API] Delete Dataset:', datasetId);
    return { data: { success: true } };
  },

  searchDatasets: async (params) => {
    await delay();
    console.log('🔧 [Mock API] Search Datasets:', params);
    return mockStorage.datasets;
  },

  getDatasetCategories: async () => {
    await delay();
    console.log('🔧 [Mock API] Get Dataset Categories');
    return ['Healthcare', 'Finance', 'Retail', 'Technology', 'Education'];
  },

  getDatasetStats: async () => {
    await delay();
    console.log('🔧 [Mock API] Get Dataset Stats');
    return {
      total: mockStorage.datasets.length,
      available: mockStorage.datasets.filter(d => d.status === 'available').length,
      categories: ['Healthcare', 'Finance', 'Retail']
    };
  },

  // Contracts
  getContracts: async (userId) => {
    await delay();
    console.log('🔧 [Mock API] Get Contracts for user:', userId);
    return { data: mockStorage.contracts };
  },

  getContract: async (contractId) => {
    await delay();
    console.log('🔧 [Mock API] Get Contract:', contractId);
    const contract = mockStorage.contracts.find(c => c.id === parseInt(contractId));
    return { data: contract };
  },

  createContract: async (contractData) => {
    await delay();
          console.log('🔧 [Mock API] Create Contract (redirected from plain contract):', contractData);
    const newContract = {
      id: mockStorage.contracts.length + 1,
      ...contractData,
      status: 'PENDING_TDP_APPROVAL',
      createdAt: new Date().toISOString(),
      legalDocumentHash: '0x' + Math.random().toString(36).substring(2, 15),
      ricardianSignature: '0x' + Math.random().toString(36).substring(2, 15),
      smartContractAddress: '0x' + Math.random().toString(36).substring(2, 42),
      contractType: 'AI_TRAINING'
    };
    mockStorage.contracts.push(newContract);
          return { data: { success: true, contract: newContract, message: 'Contract created successfully' } };
  },

  getContractSigningData: async (contractId) => {
    await delay();
    console.log('🔧 [Mock API] Get Contract Signing Data:', contractId);
    return { data: { message: 'Sign this contract', nonce: Date.now() } };
  },

  signContract: async (contractId, data) => {
    await delay();
    console.log('🔧 [Mock API] Sign Contract:', contractId, data);
    return { data: { success: true } };
  },

  selectCCRP: async (contractId, data) => {
    await delay();
    console.log('🔧 [Mock API] Select CCRP:', contractId, data);
    return { data: { success: true } };
  },

  completeContract: async (contractId, data) => {
    await delay();
    console.log('🔧 [Mock API] Complete Contract:', contractId, data);
    return { data: { success: true } };
  },

  cancelContract: async (contractId, data) => {
    await delay();
    console.log('🔧 [Mock API] Cancel Contract:', contractId, data);
    return { data: { success: true } };
  },

  // Users
  getUsers: async () => {
    await delay();
    console.log('🔧 [Mock API] Get Users');
    return mockStorage.users;
  },

  getUser: async (userId) => {
    await delay();
    console.log('🔧 [Mock API] Get User:', userId);
    const user = mockStorage.users.find(u => u.id === parseInt(userId));
    return { data: user };
  },

  getUserByWallet: async (walletAddress) => {
    await delay();
    console.log('🔧 [Mock API] Get User by Wallet:', walletAddress);
    const user = mockStorage.users.find(u => u.walletAddress.toLowerCase() === walletAddress.toLowerCase());
    if (user) {
      return user;
    }
    throw new Error('User not found');
  },

  registerUser: async (userData) => {
    await delay();
    console.log('🔧 [Mock API] Register User:', userData);
    const newUser = {
      id: mockStorage.users.length + 1,
      ...userData,
      isRegistered: true,
      registrationDate: new Date().toISOString()
    };
    mockStorage.users.push(newUser);
    return { data: { success: true, user: newUser } };
  },

  updateUserRegistration: async (userId, userData) => {
    await delay();
    console.log('🔧 [Mock API] Update User Registration:', userId, userData);
    return { data: { success: true } };
  },

  // Notifications
  getNotifications: async (userId, params) => {
    await delay();
    console.log('🔧 [Mock API] Get Notifications for user:', userId);
    return { data: mockStorage.notifications.filter(n => n.userId === parseInt(userId)) };
  },

  markNotificationAsRead: async (notificationId, data) => {
    await delay();
    console.log('🔧 [Mock API] Mark Notification as Read:', notificationId);
    return { data: { success: true } };
  },

  // Blockchain
  getBlockchainStatus: async () => {
    await delay();
    console.log('🔧 [Mock API] Get Blockchain Status');
    return { connected: true, network: 'goerli', blockNumber: 12345678 };
  },

  // Health check
  healthCheck: async () => {
    await delay(100);
    console.log('🔧 [Mock API] Health Check');
    return { data: { status: 'OK', timestamp: new Date().toISOString() } };
  }
};

export default mockApiService; 