import { Sequelize } from 'sequelize';
import { config } from '../config';
import { logger } from '../config/logger';

// Initialize Sequelize
export const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  pool: config.database.pool,
  logging: (msg) => logger.debug(msg),
});

// Test connection
export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Unable to connect to database', { error });
    throw error;
  }
}

// Sync models
export async function syncModels(force: boolean = false): Promise<void> {
  try {
    await sequelize.sync({ force });
    logger.info('Database models synchronized');
  } catch (error) {
    logger.error('Failed to sync database models', { error });
    throw error;
  }
}
