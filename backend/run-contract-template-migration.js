const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './config.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: '***REMOVED-DB_PASSWORD***',
    logging: false // Disable logging for cleaner output
  }
);

async function runMigration() {
  console.log('🔧 Running Contract Template Migration...');
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    const queryInterface = sequelize.getQueryInterface();
    const migration = require('./migrations/add-contract-templates-table');

    console.log('📊 Executing migration...');
    await migration.up(queryInterface, Sequelize);
    console.log('✅ Contract template migration completed successfully');

    // Seed default templates
    console.log('🌱 Seeding default contract templates...');
    const ContractTemplateService = require('./services/contractTemplateService');
    const templateService = new ContractTemplateService();
    await templateService.seedDefaultTemplates();
    console.log('✅ Default templates seeded successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 