/**
 * Fix Database Schema Script
 * Updates the database schema to match the expected Sequelize models
 */

const { Sequelize } = require('sequelize');

// Connect to database from inside the container
const sequelize = new Sequelize(
  'contract_management',
  'postgres',
  'postgres',
  {
    host: 'postgres-app',
    port: 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function fixDatabaseSchema() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    console.log('🔧 Fixing database schema...');
    
    // Drop existing tables and recreate with proper schema
    console.log('🗑️ Dropping existing tables...');
    await sequelize.query('DROP TABLE IF EXISTS contracts CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS datasets CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS ai_models CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS contract_templates CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('✅ Tables dropped');
    
    // Create users table with proper schema
    console.log('👥 Creating users table...');
    await sequelize.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        party_type VARCHAR(50) NOT NULL,
        organization VARCHAR(255),
        wallet_address VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        is_registered BOOLEAN DEFAULT false,
        email_verified BOOLEAN DEFAULT false,
        depa_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');
    
    // Create datasets table with proper schema
    console.log('📊 Creating datasets table...');
    await sequelize.query(`
      CREATE TABLE datasets (
        id SERIAL PRIMARY KEY,
        dataset_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        record_count INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        license VARCHAR(255) NOT NULL,
        tags JSONB,
        metadata JSONB,
        is_public BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        confidential_computing_required BOOLEAN DEFAULT false,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        depa_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Datasets table created');
    
    // Create AI models table with proper schema
    console.log('🤖 Creating AI models table...');
    await sequelize.query(`
      CREATE TABLE ai_models (
        id SERIAL PRIMARY KEY,
        model_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        model_type VARCHAR(100) NOT NULL,
        architecture VARCHAR(100) NOT NULL,
        accuracy DECIMAL(3,2) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        tags JSONB,
        metadata JSONB,
        is_public BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        depa_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ AI Models table created');
    
    // Create contract templates table with proper schema
    console.log('📋 Creating contract templates table...');
    await sequelize.query(`
      CREATE TABLE contract_templates (
        id SERIAL PRIMARY KEY,
        template_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        terms TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        contract_type VARCHAR(100) NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Contract Templates table created');
    
    // Create contracts table with proper schema
    console.log('📜 Creating contracts table...');
    await sequelize.query(`
      CREATE TABLE contracts (
        id SERIAL PRIMARY KEY,
        contract_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        tdp_id INTEGER REFERENCES users(id),
        tdc_id INTEGER REFERENCES users(id),
        ccrp_id INTEGER REFERENCES users(id),
        dataset_id INTEGER REFERENCES datasets(id),
        model_id INTEGER REFERENCES ai_models(id),
        template_id VARCHAR(255) REFERENCES contract_templates(template_id),
        price DECIMAL(10,2),
        duration INTEGER,
        terms_and_conditions TEXT,
        status VARCHAR(50) DEFAULT 'PENDING_TDP_APPROVAL',
        depa_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Contracts table created');
    
    // Create indexes
    console.log('🔍 Creating indexes...');
    await sequelize.query('CREATE INDEX idx_datasets_category ON datasets(category)');
    await sequelize.query('CREATE INDEX idx_datasets_owner_id ON datasets(owner_id)');
    await sequelize.query('CREATE INDEX idx_datasets_is_public ON datasets(is_public)');
    await sequelize.query('CREATE INDEX idx_datasets_confidential_computing ON datasets(confidential_computing_required)');
    await sequelize.query('CREATE INDEX idx_ai_models_owner_id ON ai_models(owner_id)');
    await sequelize.query('CREATE INDEX idx_contracts_tdp_id ON contracts(tdp_id)');
    await sequelize.query('CREATE INDEX idx_contracts_tdc_id ON contracts(tdc_id)');
    await sequelize.query('CREATE INDEX idx_contracts_status ON contracts(status)');
    console.log('✅ Indexes created');
    
    console.log('🎉 Database schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Main execution
if (require.main === module) {
  fixDatabaseSchema()
    .then(() => {
      console.log('🎉 Database schema fix completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database schema fix failed:', error);
      process.exit(1);
    });
}

module.exports = {
  fixDatabaseSchema
};
