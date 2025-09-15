console.log('🚀 Starting backend server with updated CORS configuration...');
console.log('🚀 Starting backend server with CORS fix...');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'test') {
  require('dotenv').config({ path: './config.test.env' });
} else {
  require("dotenv").config({ path: "../config.env" });
  // Load secrets if available
  try {
    require("dotenv").config({ path: "../secrets.env" });
  } catch (error) {
    console.log('⚠️ Secrets file not found, using config.env only');
  }
}

const db = require('./models');
const BlockchainService = require('./services/blockchainService');
const blockchainService = new BlockchainService();
const { authenticateToken } = require('./middleware/auth');

// Ensure database models are synced
async function syncDatabase() {
  try {
    console.log('🔧 Syncing database models...');
    await db.sequelize.sync({ force: false, alter: false });
    console.log('✅ Database models synced successfully');
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
    // Don't fail startup, just log the error
  }
}

// Import routes
const authRouter = require('./routes/auth');
const userRouter = require('./routes/users');
const contractsRouter = require('./routes/contracts');
const datasetsRouter = require('./routes/datasets');
const scittCcfRouter = require('./routes/scitt-ccf');
const provenanceRouter = require('./routes/provenance');
const didRouter = require('./routes/did');
const dpdpRouter = require('./routes/dpdp');
const contractSigningRouter = require('./routes/contractSigning');
const aiModelsRouter = require('./routes/ai-models');
const notificationsRouter = require('./routes/notifications');
const globalDeploymentRouter = require('./routes/globalDeployment');
const blockchainRouter = require('./routes/blockchain');
const platformEncryptionRouter = require('./routes/platform-encryption');
const trainingRouter = require('./routes/training');
const constraintsRouter = require('./routes/constraints');
const depaRouter = require('./routes/depa');

// Import role-specific routes
const adminRouter = require('./routes/admin');
const tdpRouter = require('./routes/tdp');
const tdcRouter = require('./routes/tdc');
const ccrpRouter = require('./routes/ccrp');

// Import infrastructure routes
const infrastructureRouter = require('./routes/infrastructure');

// Import differential privacy routes
const differentialPrivacyRouter = require('./routes/differential-privacy-simple');

// Import contract template routes
const contractTemplatesRouter = require('./routes/contract-templates');

const app = express();
const PORT = process.env.PORT;

// Winston logger setup
const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
const logLevel = process.env.LOG_LEVEL;

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

// Keycloak health check and auto-fix
async function checkKeycloakHealth() {
  try {
    const axios = require('axios');
    const response = await axios.get(`${process.env.KEYCLOAK_URL}/health`, { 
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) 
    });
    logger.info('✅ Keycloak health check passed');
    return true;
  } catch (error) {
    logger.warn('⚠️ Keycloak health check failed, attempting auto-fix...');
    try {
      const { execSync } = require('child_process');
      execSync('node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js', { cwd: __dirname, stdio: 'inherit' });
      logger.info('✅ Keycloak auto-fix completed');
      return true;
    } catch (fixError) {
      logger.error('❌ Keycloak auto-fix failed:', fixError.message);
      return false;
    }
  }
}

// Security middleware
app.use(helmet());

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 1000 // limit each IP to 1000 requests per windowMs (increased for testing)
// });
// app.use(limiter);

// CORS configuration - Permissive for development
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/did', didRouter);
app.use('/api/dpdp', dpdpRouter);
app.use('/api/signing', contractSigningRouter);
app.use('/api/training', trainingRouter);
app.use('/api/ai-models', aiModelsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/global-deployment', globalDeploymentRouter);
app.use('/api/blockchain', blockchainRouter);
app.use('/api/constraints', constraintsRouter);
app.use('/api/depa', depaRouter);

// Contract template routes
app.use('/api/contract-templates', contractTemplatesRouter);

// SCITT CCF routes
app.use('/api/scitt-ccf', scittCcfRouter);
app.use('/api/provenance', provenanceRouter);

// Platform encryption routes
app.use('/api/platform-encryption', platformEncryptionRouter);

// Enhanced encryption routes
const enhancedEncryptionRouter = require('./routes/enhanced-encryption');
app.use('/api/enhanced-encryption', enhancedEncryptionRouter);

// Role-specific routes
app.use('/api/admin', adminRouter);
app.use('/api/tdp', tdpRouter);
app.use('/api/tdc', tdcRouter);
app.use('/api/ccrp', ccrpRouter);

// Infrastructure routes
app.use('/api/infrastructure', infrastructureRouter);

// Differential privacy routes
app.use('/api/dp', differentialPrivacyRouter);

// Debug routes
const debugRouter = require('./routes/debug');
app.use('/api/debug', debugRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Initialize services and start server
async function initializeServices() {
  try {
    // Initialize email service
    const emailService = require('./services/emailService');
    // Email service is auto-initialized in constructor
    console.log('✅ Email service initialized');

    // Test database connection with retry
    console.log('🔍 Testing database connection...');
    let retries = 3;
    while (retries > 0) {
      try {
        await db.sequelize.authenticate();
        logger.info('Database connection established successfully.');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        console.log(`⚠️ Database connection failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Sync database schema from models (create if not exists)
    console.log('🏗️  Syncing database schema from models...');
    await db.sequelize.sync({ force: false });
    console.log('✅ Database schema synced successfully from models');

    // Initialize blockchain service only if enabled
    if (process.env.BLOCKCHAIN_ENABLED !== 'false') {
      console.log('🔗 Initializing blockchain service...');
      await blockchainService.initialize();
      logger.info('Blockchain service initialized successfully.');
    } else {
      console.log('ℹ️  Blockchain service disabled in configuration (BLOCKCHAIN_ENABLED=false)');
    }

    // Check Keycloak health (temporarily disabled)
    // await checkKeycloakHealth();
    console.log('⚠️ Keycloak health check skipped for now');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base URL: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    console.error('Full error details:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Export app for testing
module.exports = app;

// Start the application
initializeServices(); 