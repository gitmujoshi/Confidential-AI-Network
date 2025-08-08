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

// Keycloak health check and auto-fix
async function checkKeycloakHealth() {
  try {
    const axios = require('axios');
    const response = await axios.get('http://localhost:8080/health');
    logger.info('✅ Keycloak health check passed');
    return true;
  } catch (error) {
    logger.warn('⚠️ Keycloak health check failed, attempting auto-fix...');
    try {
      const { execSync } = require('child_process');
      execSync('node auto-fix-keycloak.js', { cwd: __dirname, stdio: 'inherit' });
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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
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
app.use('/api/contracts', contractsRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/auth', authRouter);
app.use('/api/did', didRouter);
app.use('/api/dpdp', dpdpRouter);
app.use('/api/signing', signingRouter);
app.use('/api/ai-models', aiModelsRouter);

// Role-specific routes
app.use('/api/admin', adminRouter);
app.use('/api/tdp', tdpRouter);
app.use('/api/tdc', tdcRouter);
app.use('/api/ccrp', ccrpRouter);

// Infrastructure routes
app.use('/api/infrastructure', infrastructureRouter);

// Training routes
app.use('/api/training', trainingRouter);

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

    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Initialize blockchain service
    console.log('🔗 Initializing blockchain service...');
    await blockchainService.initialize();
    logger.info('Blockchain service initialized successfully.');

    // Check Keycloak health
    await checkKeycloakHealth();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base URL: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    logger.error('Failed to initialize services:', error);
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

// Start the application
initializeServices(); 