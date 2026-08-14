import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './config/logger';
import { testConnection, syncModels } from './models/database';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authenticate, optionalAuth } from './middleware/auth';
import apiRoutes from './api/routes';

/**
 * Initialize Express application
 */
function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors(config.cors));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later',
  });
  app.use('/api/', limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Logging
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );

  // Health check (no auth required)
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    });
  });

  // API routes
  app.use('/api/v1/agents', optionalAuth, apiRoutes);
  app.use('/api/v1/policy', authenticate, apiRoutes);
  app.use('/api/v1/identity', authenticate, apiRoutes);
  // Audit trail/report stay authenticated; ingest uses optionalAuth for CAN forward demos
  app.use('/api/v1/audit', optionalAuth, apiRoutes);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Start server
 */
async function startServer(): Promise<void> {
  try {
    logger.info('Starting CompliancePulse AI Backend...', {
      nodeEnv: config.nodeEnv,
      port: config.port,
    });

    // Test database connection
    await testConnection();

    // Sync database models
    await syncModels(config.nodeEnv === 'development');

    // Create Express app
    const app = createApp();

    // Start listening
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`, {
        environment: config.nodeEnv,
        apiPrefix: config.apiPrefix,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start the server
startServer();
