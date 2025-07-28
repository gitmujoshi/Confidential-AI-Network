const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './config.env' });

const db = require('./models');
const BlockchainService = require('./services/blockchainService');
const blockchainService = new BlockchainService();
const { authenticateToken } = require('./middleware/auth');

// Import routes
const contractsRouter = require('./routes/contracts');
const datasetsRouter = require('./routes/datasets');
const authRouter = require('./routes/auth');
const didRouter = require('./routes/did');
const dpdpRouter = require('./routes/dpdp');
const signingRouter = require('./routes/signing');
const aiModelsRouter = require('./routes/ai-models');

// Import role-specific routes
const adminRouter = require('./routes/admin');
const tdpRouter = require('./routes/tdp');
const tdcRouter = require('./routes/tdc');
const ccrpRouter = require('./routes/ccrp');

// Import infrastructure routes
const infrastructureRouter = require('./routes/infrastructure');

// Import training routes
const trainingRouter = require('./routes/training');

const app = express();
const PORT = process.env.PORT || 8000;

// Winston logger setup
const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
const logLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'backend.log') }),
    new winston.transports.Console()
  ]
});

// Make logger available globally in backend
module.exports.logger = logger;

// Memory monitoring
setInterval(() => {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  logger.info(`🧠 [Memory] Heap used: ${heapUsedMB}MB, Total: ${heapTotalMB}MB`);
  
  // Warning if memory usage is high
  if (heapUsedMB > 400) {
    logger.warn(`⚠️ [Memory] High memory usage: ${heapUsedMB}MB`);
  }
}, 30000); // Check every 30 seconds

// Garbage collection hints (if available)
setInterval(() => {
  if (global.gc) {
    global.gc();
    logger.info('🗑️ [Memory] Garbage collection triggered');
  }
}, 60000); // Every minute

// Security middleware
app.use(helmet());

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 1000 // limit each IP to 1000 requests per windowMs (increased for testing)
// });
// app.use(limiter);

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
      logger.warn('🚫 [CORS] Blocked origin:', origin);
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

// Blockchain status endpoint
app.get('/api/blockchain/status', async (req, res) => {
  try {
    const isConnected = await blockchainService.isConnected();
    
    res.json({
      connected: isConnected,
      enabled: process.env.BLOCKCHAIN_ENABLED !== 'false',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error checking blockchain status:', error);
    res.json({
      connected: false,
      enabled: process.env.BLOCKCHAIN_ENABLED !== 'false',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/ai-models', aiModelsRouter);
app.use('/api/did', didRouter);
app.use('/api/dpdp', dpdpRouter);
app.use('/api/signing', signingRouter);

// Role-specific API routes
app.use('/api/admin', adminRouter);
app.use('/api/tdp', tdpRouter);
app.use('/api/tdc', tdcRouter);
app.use('/api/ccrp', ccrpRouter);

// Infrastructure API routes
app.use('/api/infrastructure', infrastructureRouter);

// Training API routes
app.use('/api/training', trainingRouter);

// Import users router
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

/**
 * Blockchain Health Check Endpoint
 * 
 * Provides comprehensive status information about the blockchain service including:
 * - Current operating mode (BLOCKCHAIN_ENABLED/DATABASE_ONLY)
 * - Blockchain availability and connectivity
 * - Contract address and deployment status
 * - Last block number and network status
 * - Service health and error information
 * 
 * This endpoint is useful for:
 * - Monitoring blockchain service status
 * - Debugging connectivity issues
 * - Verifying configuration settings
 * - Health checks and system monitoring
 * 
 * @returns {Object} Blockchain service health status
 * @throws {Error} If health check fails
 */
app.get('/api/blockchain/health', async (req, res) => {
  try {
    const health = await blockchainService.healthCheck();
    res.json(health);
  } catch (error) {
    logger.error('Error checking blockchain health:', error);
    res.status(500).json({ 
      error: 'Failed to check blockchain health',
      details: error.message 
    });
  }
});

// Get user by wallet address
app.get('/api/users/wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    logger.info('🔍 [Backend] getUserByWallet called for address:', walletAddress);
    
    // Convert to lowercase for case-insensitive matching
    const normalizedWalletAddress = walletAddress.toLowerCase();
    logger.info('🔍 [Backend] Normalized wallet address:', normalizedWalletAddress);
    
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
      logger.info('❌ [Backend] User not found for wallet:', walletAddress);
      return res.status(404).json({ error: 'User not found' });
    }
    
    logger.info('✅ [Backend] User found:', {
      id: user.id,
      name: user.name,
      partyType: user.partyType,
      isRegistered: user.isRegistered
    });
    
    res.json(user);
  } catch (error) {
    logger.error('❌ [Backend] Error getting user by wallet:', error);
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
    logger.error('Error registering user:', error);
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
    logger.error('Error updating user registration:', error);
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
    logger.error('Error getting notifications:', error);
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
    logger.error('Error marking notification as read:', error);
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
        logger.error('Error getting block number:', error);
      }
    }

    res.json(status);
  } catch (error) {
    logger.error('Error getting blockchain status:', error);
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
    logger.error('Error registering party on blockchain:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile (supports AppAdmin editing other users)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      organization, 
      phoneNumber, 
      website, 
      location, 
      description,
      did,
      didSource,
      didVerified,
      didVerificationMethod,
      publicKey,
      isActive,
      profileCompleted,
      emailVerified,
      onboardingStatus
    } = req.body;

    // Find the user to update
    const user = await db.User.findOne({
      where: { id, isActive: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check authorization: Only AppAdmin can update other users, or users can update their own profile
    const currentUser = req.user.localUser;
    const isAppAdmin = currentUser.partyType === 'AppAdmin';
    const isOwnProfile = currentUser.id === parseInt(id);

    if (!isAppAdmin && !isOwnProfile) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        details: 'Only AppAdmin users can update other users\' profiles'
      });
    }

    // Prepare update data based on user permissions
    const updateData = {
      name: name || user.name,
      organization: organization || user.organization,
      phoneNumber: phoneNumber || user.phoneNumber,
      website: website || user.website,
      location: location || user.location,
      description: description || user.description,
      profileCompleted: profileCompleted !== undefined ? profileCompleted : user.profileCompleted
    };

    // Only AppAdmin can update DID information and account status
    if (isAppAdmin) {
      if (did !== undefined) updateData.did = did;
      if (didSource !== undefined) updateData.didSource = didSource;
      if (didVerified !== undefined) updateData.didVerified = didVerified;
      if (didVerificationMethod !== undefined) updateData.didVerificationMethod = didVerificationMethod;
      if (publicKey !== undefined) updateData.publicKey = publicKey;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (emailVerified !== undefined) updateData.emailVerified = emailVerified;
      if (onboardingStatus !== undefined) updateData.onboardingStatus = onboardingStatus;
    }

    // Update user profile
    await user.update(updateData);

    // Create notification for profile update
    await db.Notification.create({
      userId: user.id,
      type: 'PROFILE_UPDATED',
      title: 'Profile Updated',
      message: `Your profile has been updated successfully.`,
      isRead: false,
      metadata: {
        updateTime: new Date().toISOString(),
        updatedFields: Object.keys(req.body).filter(key => req.body[key] !== undefined)
      }
    });

    res.json({
      message: 'User profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        partyType: user.partyType,
        organization: user.organization,
        phoneNumber: user.phoneNumber,
        website: user.website,
        location: user.location,
        description: user.description,
        did: user.did,
        didSource: user.didSource,
        didVerified: user.didVerified,
        didVerificationMethod: user.didVerificationMethod,
        publicKey: user.publicKey,
        isActive: user.isActive,
        profileCompleted: user.profileCompleted,
        emailVerified: user.emailVerified,
        onboardingStatus: user.onboardingStatus
      }
    });

  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
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
    logger.info('Database connection established successfully.');

    // Initialize blockchain service (optional for development)
    try {
      await blockchainService.initialize();
      logger.info('Blockchain service initialized successfully.');
    } catch (blockchainError) {
      logger.warn('⚠️  Blockchain service initialization failed (optional for development):', blockchainError.message);
      logger.info('ℹ️  The application will continue without blockchain functionality.');
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Error initializing services:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await db.sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await db.sequelize.close();
  process.exit(0);
});

// Start the application
initializeServices(); 