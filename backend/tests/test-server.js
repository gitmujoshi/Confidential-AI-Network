const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Test environment is configured by Jest setup files.

const db = require('../models');
const BlockchainService = require('../services/blockchainService');
const blockchainService = new BlockchainService();
const { authenticateToken } = require('../middleware/auth');

// Import routes
const contractsRouter = require('../routes/contracts');
const datasetsRouter = require('../routes/datasets');
const authRouter = require('../routes/auth');
const didRouter = require('../routes/did');
const dpdpRouter = require('../routes/dpdp');
const signingRouter = require('../routes/signing');
const aiModelsRouter = require('../routes/ai-models');
const scittCcfRouter = require('../routes/scitt-ccf');

// CAN (Confidential AI Network) routers (parallel path)
const canJcsRouter = require('../routes/can-jcs');
const canCcrRouter = require('../routes/can-ccr');
const canProvenanceRouter = require('../routes/can-provenance');
const huggingfaceRouter = require('../routes/huggingface');
const debugRouter = require('../routes/debug');

// Import role-specific routes
const adminRouter = require('../routes/admin');
const tdpRouter = require('../routes/tdp');
const tdcRouter = require('../routes/tdc');
const ccrpRouter = require('../routes/ccrp');

// Import infrastructure routes
const infrastructureRouter = require('../routes/infrastructure');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
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
app.use('/api/ai-models', aiModelsRouter);
app.use('/api/did', didRouter);
app.use('/api/dpdp', dpdpRouter);
app.use('/api/signing', signingRouter);
app.use('/api/scitt-ccf', scittCcfRouter);

// CAN API routes (do not require Keycloak)
app.use('/api/can/jcs', canJcsRouter);
app.use('/api/can/ccr', canCcrRouter);
app.use('/api/can/provenance', canProvenanceRouter);
app.use('/api/dev/huggingface', huggingfaceRouter);
app.use('/api/debug', debugRouter);

// Role-specific API routes
app.use('/api/admin', adminRouter);
app.use('/api/tdp', tdpRouter);
app.use('/api/tdc', tdcRouter);
app.use('/api/ccrp', ccrpRouter);

// Infrastructure API routes
app.use('/api/infrastructure', infrastructureRouter);

// Import users router
const usersRouter = require('../routes/users');
app.use('/api/users', usersRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app; 