const { Sequelize } = require('sequelize');
require('dotenv').config({ path: './config.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false // Disable logging for cleaner output
  }
);

async function setupTestDatabase() {
  try {
    console.log('🗄️  Setting up test database...');
    
    // Create all required tables
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        "partyType" VARCHAR(50) NOT NULL CHECK ("partyType" IN ('TDP', 'TDC', 'CCRP', 'ADMIN')),
        "publicKey" TEXT,
        did VARCHAR(255),
        "didVerified" BOOLEAN DEFAULT false,
        "isActive" BOOLEAN DEFAULT true,
        "iamUserId" VARCHAR(255),
        "iamUsername" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )`,
      
      // Datasets table
      `CREATE TABLE IF NOT EXISTS datasets (
        id SERIAL PRIMARY KEY,
        "datasetId" VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL CHECK (category IN ('medical', 'financial', 'retail', 'research', 'other')),
        size INTEGER NOT NULL,
        "recordCount" INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        license VARCHAR(255) NOT NULL,
        tags JSON,
        metadata JSON,
        "isPublic" BOOLEAN DEFAULT true,
        "isActive" BOOLEAN DEFAULT true,
        "ownerId" INTEGER REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )`,
      
      // Contracts table
      `CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        "contractId" VARCHAR(255) UNIQUE NOT NULL,
        "blockchainContractId" INTEGER,
        "legaldocumenthash" VARCHAR(66),
        "ricardiansignature" VARCHAR(132),
        "smartcontractaddress" VARCHAR(42),
        "smartcontractnetwork" VARCHAR(255) DEFAULT 'goerli',
        status VARCHAR(50) DEFAULT 'PENDING_TDP_APPROVAL' CHECK (status IN ('PENDING_TDP_APPROVAL', 'PENDING_CCRP_APPROVAL', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
        price DECIMAL(10,2) NOT NULL,
        duration INTEGER NOT NULL,
        "termsAndConditions" TEXT NOT NULL,
        "modelId" VARCHAR(255) NOT NULL,
        "legaldocument" JSON,
        "environmentspecs" JSON,
        "trainingparams" JSON,
        "attestationverified" BOOLEAN DEFAULT false,
        "attestationreport" JSON,
        "kmsconfigs" JSON,
        "tdpSigned" BOOLEAN DEFAULT false,
        "ccrpSigned" BOOLEAN DEFAULT false,
        "tdpSignedAt" TIMESTAMP WITH TIME ZONE,
        "ccrpSignedAt" TIMESTAMP WITH TIME ZONE,
        "tdpId" INTEGER NOT NULL REFERENCES users(id),
        "tdcId" INTEGER NOT NULL REFERENCES users(id),
        "ccrpId" INTEGER REFERENCES users(id),
        "datasetId" INTEGER NOT NULL REFERENCES datasets(id),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )`,
      
      // Notifications table
      `CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL CHECK (type IN ('CONTRACT_CREATED', 'CONTRACT_SIGNED', 'CONTRACT_COMPLETED', 'CONTRACT_CANCELLED', 'DATASET_ADDED', 'USER_REGISTERED', 'SYSTEM_ALERT')),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        "isRead" BOOLEAN DEFAULT false,
        metadata JSONB,
        "userId" INTEGER REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )`,
      
      // AI Models table
      `CREATE TABLE IF NOT EXISTS ai_models (
        id SERIAL PRIMARY KEY,
        "modelId" VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('transformer', 'cnn', 'rnn', 'gan', 'other')),
        architecture VARCHAR(255) NOT NULL,
        parameters VARCHAR(50) NOT NULL,
        framework VARCHAR(50) NOT NULL CHECK (framework IN ('PyTorch', 'TensorFlow', 'JAX', 'Other')),
        "privacyTechnique" VARCHAR(100) NOT NULL CHECK ("privacyTechnique" IN ('federated-learning', 'differential-privacy', 'homomorphic-encryption', 'secure-multi-party-computation', 'zero-knowledge-proofs', 'none')),
        "validationMetrics" JSONB NOT NULL,
        "maxEpochs" INTEGER NOT NULL,
        "batchSize" INTEGER NOT NULL,
        "learningRate" DECIMAL(10,6) NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        metadata JSONB,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )`
    ];
    
    // Create all tables
    for (const table of tables) {
      await sequelize.query(table);
    }
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_party_type ON users("partyType")',
      'CREATE INDEX IF NOT EXISTS idx_datasets_owner_id ON datasets("ownerId")',
      'CREATE INDEX IF NOT EXISTS idx_datasets_category ON datasets(category)',
      'CREATE INDEX IF NOT EXISTS idx_contracts_tdp_id ON contracts("tdpId")',
      'CREATE INDEX IF NOT EXISTS idx_contracts_tdc_id ON contracts("tdcId")',
      'CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId")',
      'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)',
      'CREATE INDEX IF NOT EXISTS idx_ai_models_type ON ai_models(type)',
      'CREATE INDEX IF NOT EXISTS idx_ai_models_framework ON ai_models(framework)',
      'CREATE INDEX IF NOT EXISTS idx_ai_models_is_active ON ai_models("isActive")'
    ];
    
    for (const index of indexes) {
      await sequelize.query(index);
    }
    
    console.log('✅ Test database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the setup
setupTestDatabase()
  .then(() => {
    console.log('🎉 Test database is ready for testing!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }); 