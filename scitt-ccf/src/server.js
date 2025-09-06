const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Import services and routes
const { initializeDatabase } = require('./services/databaseService');
const { initializeRedis } = require('./services/redisService');
const { initializeMerkleTreeService } = require('./services/merkleTreeService');
const claimRoutes = require('./routes/claimRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 9000;

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'scitt-ccf' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString()
    }
  }
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    // Check Redis health
    const redisHealth = await checkRedisHealth();
    
    // Check Merkle tree service health
    const merkleHealth = await checkMerkleTreeHealth();
    
    const responseTime = Date.now() - startTime;
    
    const overallStatus = dbHealth.status === 'healthy' && 
                         redisHealth.status === 'healthy' && 
                         merkleHealth.status === 'healthy' 
      ? 'healthy' 
      : 'degraded';
    
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      response_time: responseTime,
      checks: {
        database: dbHealth,
        redis: redisHealth,
        merkle_tree_generation: merkleHealth
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Health check helper functions
async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    await initializeDatabase();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      response_time: responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time: null,
      error: error.message
    };
  }
}

async function checkRedisHealth() {
  try {
    const startTime = Date.now();
    await initializeRedis();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      response_time: responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time: null,
      error: error.message
    };
  }
}

async function checkMerkleTreeHealth() {
  try {
    const startTime = Date.now();
    await initializeMerkleTreeService();
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      response_time: responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time: null,
      error: error.message
    };
  }
}

// API routes
app.use('/api', claimRoutes);
app.use('/health', healthRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'SCITT CCF Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      claims: '/api/claims',
      health_detailed: '/health/detailed'
    },
    documentation: '/api/docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

// Initialize services and start server
async function startServer() {
  try {
    logger.info('🚀 Starting SCITT CCF Service...');
    
    // Initialize database
    logger.info('🗄️ Initializing database...');
    await initializeDatabase();
    logger.info('✅ Database initialized');
    
    // Initialize Redis
    logger.info('🔴 Initializing Redis...');
    await initializeRedis();
    logger.info('✅ Redis initialized');
    
    // Initialize Merkle tree service
    logger.info('🌳 Initializing Merkle tree service...');
    await initializeMerkleTreeService();
    logger.info('✅ Merkle tree service initialized');
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 SCITT CCF Service running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔐 Claims API: http://localhost:${PORT}/api/claims`);
      logger.info(`📈 Detailed health: http://localhost:${PORT}/health/detailed`);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start SCITT CCF Service:', error);
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
