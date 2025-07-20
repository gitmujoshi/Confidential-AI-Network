const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

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

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
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
app.use('/api/contracts', contractsRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/auth', authRouter);
app.use('/api/did', didRouter);
app.use('/api/dpdp', dpdpRouter);
app.use('/api/signing', signingRouter);
app.use('/api/ai-models', aiModelsRouter);

// Role-specific routes
app.use('/api/admin', authenticateToken, adminRouter);
app.use('/api/tdp', authenticateToken, tdpRouter);
app.use('/api/tdc', authenticateToken, tdcRouter);
app.use('/api/ccrp', authenticateToken, ccrpRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Add address method for supertest
app.address = () => ({ port: PORT });

// Start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
  });
}

module.exports = app; 