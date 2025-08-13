const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: '***REMOVED-DB_PASSWORD***',
    logging: false
  }
);

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Create basic tables if they don't exist
    console.log('🔧 Creating basic tables...');
    
    // Users table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        party_type VARCHAR(50) NOT NULL,
        organization VARCHAR(255),
        wallet_address VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');
    
    // Datasets table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS datasets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        data_type VARCHAR(100),
        size VARCHAR(50),
        record_count INTEGER,
        confidentiality VARCHAR(50),
        price DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        user_id INTEGER REFERENCES users(id),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Datasets table created');
    
    // AI Models table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_models (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        model_type VARCHAR(100),
        architecture VARCHAR(100),
        accuracy DECIMAL(3,2),
        price DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        user_id INTEGER REFERENCES users(id),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ AI Models table created');
    
    // Contract Templates table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS contract_templates (
        id SERIAL PRIMARY KEY,
        template_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        terms TEXT,
        is_active BOOLEAN DEFAULT true,
        contract_type VARCHAR(100),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Contract Templates table created');
    
    // Contracts table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        contract_id VARCHAR(255) UNIQUE NOT NULL,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Contracts table created');
    
    console.log('🎉 Database migrations completed!');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

runMigrations();
