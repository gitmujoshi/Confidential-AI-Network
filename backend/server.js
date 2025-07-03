const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./models');
const blockchainService = require('./services/blockchainService');

// Import routes
const contractsRouter = require('./routes/contracts');
const datasetsRouter = require('./routes/datasets');
const authRouter = require('./routes/auth');
const didRouter = require('./routes/did');

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs (increased for testing)
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('🚫 [CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/did', didRouter);

// Users routes (basic CRUD)
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: ['id', 'name', 'email', 'partyType', 'walletAddress', 'publicKey', 'description', 'isRegistered', 'registrationDate', 'createdAt'],
      where: { isActive: true }
    });
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.User.findOne({
      where: { id: req.params.id, isActive: true },
      attributes: ['id', 'name', 'email', 'partyType', 'walletAddress', 'publicKey', 'description', 'isRegistered']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by wallet address
app.get('/api/users/wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    console.log('🔍 [Backend] getUserByWallet called for address:', walletAddress);
    
    // Convert to lowercase for case-insensitive matching
    const normalizedWalletAddress = walletAddress.toLowerCase();
    console.log('🔍 [Backend] Normalized wallet address:', normalizedWalletAddress);
    
    const user = await db.User.findOne({
      where: { 
        walletAddress: db.Sequelize.where(
          db.Sequelize.fn('LOWER', db.Sequelize.col('walletAddress')), 
          normalizedWalletAddress
        ),
        isActive: true 
      },
      attributes: ['id', 'name', 'email', 'partyType', 'walletAddress', 'publicKey', 'description', 'isRegistered', 'registrationDate']
    });
    
    if (!user) {
      console.log('❌ [Backend] User not found for wallet:', walletAddress);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ [Backend] User found:', {
      id: user.id,
      name: user.name,
      partyType: user.partyType,
      isRegistered: user.isRegistered
    });
    
    res.json(user);
  } catch (error) {
    console.error('❌ [Backend] Error getting user by wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User registration endpoint
app.post('/api/users/register', async (req, res) => {
  try {
    const { walletAddress, publicKey, partyType, name, email, description } = req.body;

    // Validate required fields
    if (!walletAddress || !publicKey || !partyType || !name || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, publicKey, partyType, name, email' 
      });
    }

    // Validate wallet address format
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!walletRegex.test(walletAddress)) {
      return res.status(400).json({ 
        error: 'Invalid wallet address format' 
      });
    }

    // Validate public key format (should be a hex string starting with 0x)
    const publicKeyRegex = /^0x[a-fA-F0-9]{128}$/;
    if (!publicKeyRegex.test(publicKey)) {
      return res.status(400).json({ 
        error: 'Invalid public key format. Must be a 64-byte hex string starting with 0x' 
      });
    }

    // Validate party type
    const validPartyTypes = ['TDP', 'TDC', 'CCRP'];
    if (!validPartyTypes.includes(partyType)) {
      return res.status(400).json({ 
        error: 'Invalid party type. Must be one of: TDP, TDC, CCRP' 
      });
    }

    // Check if user already exists
    const existingUser = await db.User.findOne({
      where: { walletAddress }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this wallet address already exists' 
      });
    }

    // Check if email is already taken
    const existingEmail = await db.User.findOne({
      where: { email }
    });

    if (existingEmail) {
      return res.status(409).json({ 
        error: 'Email address is already registered' 
      });
    }

    // Create new user
    const user = await db.User.create({
      walletAddress,
      publicKey,
      partyType,
      name,
      email,
      description: description || '',
      isRegistered: true,
      registrationDate: new Date(),
      isActive: true
    });

    // Create welcome notification
    await db.Notification.create({
      userId: user.id,
      type: 'CONTRACT_CREATED',
      title: 'Welcome to Contract Management',
      message: `Welcome ${name}! Your account has been successfully registered as a ${partyType}.`,
      isRead: false,
      metadata: {
        partyType,
        registrationDate: new Date().toISOString()
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        partyType: user.partyType,
        walletAddress: user.walletAddress,
        publicKey: user.publicKey,
        isRegistered: user.isRegistered
      }
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update existing user registration
app.put('/api/users/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const { publicKey, partyType, name, email, description } = req.body;

    const user = await db.User.findOne({
      where: { id, isActive: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate public key format if provided
    if (publicKey) {
      const publicKeyRegex = /^0x[a-fA-F0-9]{128}$/;
      if (!publicKeyRegex.test(publicKey)) {
        return res.status(400).json({ 
          error: 'Invalid public key format. Must be a 64-byte hex string starting with 0x' 
        });
      }
    }

    // Validate party type if provided
    if (partyType) {
      const validPartyTypes = ['TDP', 'TDC', 'CCRP'];
      if (!validPartyTypes.includes(partyType)) {
        return res.status(400).json({ 
          error: 'Invalid party type. Must be one of: TDP, TDC, CCRP' 
        });
      }
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingEmail = await db.User.findOne({
        where: { email, id: { [db.Sequelize.Op.ne]: id } }
      });

      if (existingEmail) {
        return res.status(409).json({ 
          error: 'Email address is already registered by another user' 
        });
      }
    }

    // Update user
    await user.update({
      publicKey: publicKey || user.publicKey,
      partyType: partyType || user.partyType,
      name: name || user.name,
      email: email || user.email,
      description: description || user.description,
      isRegistered: true,
      registrationDate: user.registrationDate || new Date()
    });

    res.json({
      message: 'User registration updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        partyType: user.partyType,
        walletAddress: user.walletAddress,
        publicKey: user.publicKey,
        isRegistered: user.isRegistered
      }
    });

  } catch (error) {
    console.error('Error updating user registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notifications routes
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const notifications = await db.Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      notifications: notifications.rows,
      total: notifications.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const notification = await db.Notification.findOne({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blockchain status endpoint
app.get('/api/blockchain/status', async (req, res) => {
  try {
    const status = {
      connected: false,
      contractAddress: null,
      lastBlock: null
    };

    // Test actual connection
    const isConnected = await blockchainService.isConnected();
    status.connected = isConnected;
    status.contractAddress = blockchainService.contractAddress;
    
    if (isConnected) {
      try {
        const blockNumber = await blockchainService.provider.getBlockNumber();
        status.lastBlock = blockNumber;
      } catch (error) {
        console.error('Error getting block number:', error);
      }
    }

    res.json(status);
  } catch (error) {
    console.error('Error getting blockchain status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blockchain party registration endpoint
app.post('/api/blockchain/register-party', async (req, res) => {
  try {
    const { walletAddress, partyType, name, description, privateKey } = req.body;

    // Validate required fields
    if (!walletAddress || !partyType || !name || !privateKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Register party on blockchain
    const result = await blockchainService.registerParty(
      walletAddress,
      partyType,
      name,
      description || '',
      privateKey
    );

    res.json({
      success: true,
      message: 'Party registered on blockchain successfully',
      transactionHash: result.transactionHash
    });
  } catch (error) {
    console.error('Error registering party on blockchain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and blockchain service
async function initializeServices() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Initialize blockchain service (optional for development)
    try {
      await blockchainService.initialize();
      console.log('Blockchain service initialized successfully.');
    } catch (blockchainError) {
      console.warn('⚠️  Blockchain service initialization failed (optional for development):', blockchainError.message);
      console.log('ℹ️  The application will continue without blockchain functionality.');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Error initializing services:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await db.sequelize.close();
  process.exit(0);
});

// Start the application
initializeServices(); 