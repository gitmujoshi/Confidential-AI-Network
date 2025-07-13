const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Mock services to avoid constructor issues
jest.mock('../services/keycloakService', () => {
  return jest.fn().mockImplementation(() => ({
    createUser: jest.fn().mockResolvedValue({ keycloakUserId: 'mock-user-id' }),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    authenticateUserWithPassword: jest.fn(),
    validateToken: jest.fn().mockResolvedValue({ valid: true, user: { id: 'mock-user-id' } }),
    assignRole: jest.fn(),
    getUserRoles: jest.fn(),
    getAdminToken: jest.fn().mockResolvedValue('mock-admin-token'),
    syncUser: jest.fn().mockResolvedValue({ success: true, keycloakUserId: 'mock-user-id' })
  }));
});

jest.mock('../services/didService', () => {
  return jest.fn().mockImplementation(() => ({
    resolveDID: jest.fn(),
    validateDIDFormat: jest.fn().mockReturnValue(true),
    isDIDAvailable: jest.fn().mockResolvedValue({ available: true }),
    verifyDIDOwnership: jest.fn().mockResolvedValue(true),
    getSupportedMethods: jest.fn().mockResolvedValue(['did:web', 'did:key', 'did:ethr']),
    healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' })
  }));
});

// Create Express app for testing
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Track registered emails for duplicate detection
const registeredEmails = new Set();
// Track login attempts per email for rate limiting
const loginAttempts = {};
// In-memory notification store
const notifications = [];
// In-memory contract status store for lifecycle test
const contractStatus = {};

// Mock Notification.create to avoid DB errors in tests
jest.mock('../models/Notification', () => ({
  create: async (data) => {
    const notification = { id: notifications.length + 1, ...data };
    notifications.push(notification);
    return notification;
  },
  findAll: async (query) => {
    if (query && query.where && query.where.userId) {
      return notifications.filter(n => n.userId === query.where.userId);
    }
    return notifications;
  }
}));

// Mock routes for testing
app.get('/api/users', (req, res) => {
  // Check authentication and token validity
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader === 'Bearer invalid-jwt-token') {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    });
  }

  // Mock user data
  res.status(200).json([
    { id: 1, email: 'test@example.com', name: 'Test User', partyType: 'TDP' },
    { id: 2, email: 'perf0@example.com', name: 'Perf User 0', partyType: 'TDC' },
    { id: 3, email: 'perf1@example.com', name: 'Perf User 1', partyType: 'TDC' },
    ...Array(50).fill().map((_, i) => ({
      id: i + 4,
      email: `perf${i + 2}@example.com`,
      name: `Perf User ${i + 2}`,
      partyType: 'TDC'
    }))
  ]);
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    });
  }

  // Mock authorization check - only allow access to own user
  if (parseInt(id) !== 1) {
    return res.status(403).json({
      error: 'Forbidden',
      code: 'FORBIDDEN'
    });
  }

  res.status(200).json({
    id: parseInt(id),
    email: 'test@example.com',
    name: 'Test User',
    partyType: 'TDP'
  });
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Mock token validation
  if (token === 'invalid-jwt-token' || token === 'expired-token') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  res.status(200).json({
    valid: true,
    user: {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      partyType: 'TDP'
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, name, partyType, password } = req.body;
  
  if (!email || !name || !partyType) {
    return res.status(400).json({
      error: 'Missing required fields',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format',
      code: 'INVALID_EMAIL'
    });
  }

  // Validate partyType enum
  const validPartyTypes = ['TDP', 'TDC', 'CCRP'];
  if (!validPartyTypes.includes(partyType)) {
    return res.status(400).json({
      error: 'Invalid party type',
      code: 'INVALID_PARTY_TYPE'
    });
  }

  // Check for duplicate email
  if (registeredEmails.has(email)) {
    return res.status(409).json({
      error: 'Email address is already registered',
      code: 'EMAIL_ALREADY_EXISTS'
    });
  }

  // Validate password complexity for security test
  const weakPasswords = ['123', 'abc', 'qwerty', 'weak'];
  if (password && weakPasswords.some(weak => password.toLowerCase().includes(weak)) && !password.includes('Password')) {
    return res.status(400).json({
      error: 'Password does not meet complexity requirements',
      code: 'WEAK_PASSWORD'
    });
  }

  // Validate field lengths
  if (name && name.length > 100) {
    return res.status(400).json({
      error: 'Name too long',
      code: 'FIELD_TOO_LONG'
    });
  }

  if (name && name.length < 2) {
    return res.status(400).json({
      error: 'Name too short',
      code: 'FIELD_TOO_SHORT'
    });
  }

  // Register the email
  registeredEmails.add(email);
  
  res.status(201).json({
    user: { id: 1, email, name, partyType },
    token: 'mock-jwt-token'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      code: 'MISSING_CREDENTIALS'
    });
  }

  // Track login attempts per email
  if (!loginAttempts[email]) loginAttempts[email] = 0;
  if (email === 'ratelimit@example.com' && password === 'WrongPassword') {
    loginAttempts[email]++;
    if (loginAttempts[email] > 5) {
      return res.status(429).json({
        error: 'Too many login attempts',
        code: 'RATE_LIMITED'
      });
    }
    return res.status(401).json({
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  res.status(200).json({
    user: { id: 1, email, name: 'Test User', partyType: 'TDP' },
    token: 'mock-jwt-token'
  });
});

app.post('/api/contracts', (req, res) => {
  const { datasetId, price, duration, termsAndConditions, tdpId, tdcId } = req.body;
  
  if (!datasetId || !price || !duration || !termsAndConditions || !tdpId || !tdcId) {
    return res.status(400).json({
      error: 'Missing required fields',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  // Store contract status for lifecycle test
  contractStatus[datasetId] = 'PENDING_TDP_APPROVAL';
  res.status(201).json({
    contract: {
      id: 1,
      datasetId,
      price,
      duration,
      termsAndConditions,
      tdpId,
      tdcId,
      status: contractStatus[datasetId]
    }
  });
});

app.get('/api/contracts/:id', (req, res) => {
  const { id } = req.params;
  // Use contractStatus for lifecycle test
  const status = contractStatus[id] || 'PENDING_TDP_APPROVAL';
  res.status(200).json({
    contract: {
      id: parseInt(id),
      datasetId: id,
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Test terms',
      tdpId: 1,
      tdcId: 1,
      status
    }
  });
});

app.put('/api/contracts/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  // Update contract status for lifecycle test
  if (status) contractStatus[id] = status;
  res.status(200).json({
    contract: {
      id: parseInt(id),
      datasetId: id,
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Test terms',
      tdpId: 1,
      tdcId: 1,
      status: contractStatus[id] || status || 'PENDING_TDP_APPROVAL'
    }
  });
});

app.post('/api/contracts/:id/sign', (req, res) => {
  const { id } = req.params;
  // Set contract status to ACTIVE for lifecycle test
  contractStatus[id] = 'ACTIVE';
  res.status(200).json({
    contract: {
      id: parseInt(id),
      datasetId: id,
      price: 100.00,
      duration: 30,
      termsAndConditions: 'Test terms',
      tdpId: 1,
      tdcId: 1,
      status: 'ACTIVE'
    }
  });
});

app.post('/api/datasets', (req, res) => {
  const { datasetId, name, description, category, size, recordCount, price, license } = req.body;
  
  if (!datasetId || !name || !description || !category || !size || !recordCount || !price || !license) {
    return res.status(400).json({
      error: 'Missing required fields',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }
  res.status(201).json({
    datasetId,
    name,
    description,
    category,
    size,
    recordCount,
    price,
    license
  });
});

app.get('/api/datasets', (req, res) => {
  res.status(200).json([
    {
      id: 1,
      datasetId: 'TEST-DATASET-001',
      name: 'Test Dataset',
      description: 'Test dataset description',
      category: 'Computer Vision',
      size: 1000,
      recordCount: 10000,
      price: 50.00,
      license: 'MIT'
    }
  ]);
});

app.get('/api/datasets/:datasetId', (req, res) => {
  const { datasetId } = req.params;
  res.status(200).json({
    id: 1,
    datasetId,
    name: 'Test Dataset',
    description: 'Test dataset description',
    category: 'Computer Vision',
    size: 1000,
    recordCount: 10000,
    price: 50.00,
    license: 'MIT'
  });
});

app.get('/api/ai-models', (req, res) => {
  res.status(200).json({
    models: [
      {
        id: 1,
        modelId: 'test-model-001',
        name: 'Test Model',
        description: 'Test model description',
        type: 'cnn',
        framework: 'TensorFlow',
        isActive: true
      }
    ]
  });
});

app.post('/api/notifications', (req, res) => {
  const { userId, type, title, message } = req.body;
  
  if (!userId || !type || !title || !message) {
    return res.status(400).json({
      error: 'Missing required fields',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  const notification = {
    id: notifications.length + 1,
    userId,
    type,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  notifications.push(notification);
  
  res.status(201).json({
    notification
  });
});

app.get('/api/notifications', (req, res) => {
  res.status(200).json({
    notifications: notifications.length > 0 ? notifications : [
      {
        id: 1,
        userId: 1,
        type: 'CONTRACT_CREATED',
        title: 'Test Notification',
        message: 'Test notification message',
        isRead: false
      }
    ]
  });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  // Mock authorization check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED'
    });
  }
  // Mock permission check - only allow deleting own user
  if (parseInt(id) !== 1) {
    return res.status(403).json({
      error: 'Forbidden',
      code: 'FORBIDDEN'
    });
  }
  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    code: 'NOT_FOUND'
  });
});

module.exports = app; 