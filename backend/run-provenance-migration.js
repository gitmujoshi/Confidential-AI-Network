const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../config.env' });

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_management',
  process.env.DB_USER || '***REMOVED-DB_PASSWORD***',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: '***REMOVED-DB_PASSWORD***',
    logging: false
  }
);

async function runProvenanceMigration() {
  try {
    console.log('🚀 Starting provenance migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Create merkle_trees table
    console.log('📋 Creating merkle_trees table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS merkle_trees (
        id SERIAL PRIMARY KEY,
        tree_id VARCHAR(255) UNIQUE NOT NULL,
        contract_id VARCHAR(255) NOT NULL,
        tree_type VARCHAR(50) DEFAULT 'BINARY_MERKLE_TREE',
        hash_algorithm VARCHAR(20) DEFAULT 'SHA256',
        max_depth INTEGER DEFAULT 32,
        root_hash VARCHAR(255) NOT NULL,
        node_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ merkle_trees table created');
    
    // Create provenance_nodes table
    console.log('📋 Creating provenance_nodes table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS provenance_nodes (
        id SERIAL PRIMARY KEY,
        node_id VARCHAR(255) UNIQUE NOT NULL,
        tree_id VARCHAR(255) NOT NULL,
        node_type VARCHAR(100) NOT NULL,
        data_hash VARCHAR(255) NOT NULL,
        parent_hash VARCHAR(255),
        left_child_hash VARCHAR(255),
        right_child_hash VARCHAR(255),
        level INTEGER NOT NULL,
        position INTEGER NOT NULL,
        metadata JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('✅ provenance_nodes table created');
    
    // Create provenance_captures table
    console.log('📋 Creating provenance_captures table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS provenance_captures (
        id SERIAL PRIMARY KEY,
        capture_id VARCHAR(255) UNIQUE NOT NULL,
        contract_id VARCHAR(255) NOT NULL,
        capture_type VARCHAR(100) NOT NULL,
        data_source VARCHAR(255) NOT NULL,
        data_hash VARCHAR(255) NOT NULL,
        merkle_proof JSONB,
        verification_status VARCHAR(50) DEFAULT 'PENDING',
        captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP
      );
    `);
    console.log('✅ provenance_captures table created');
    
    // Create provenance_verifications table
    console.log('📋 Creating provenance_verifications table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS provenance_verifications (
        id SERIAL PRIMARY KEY,
        verification_id VARCHAR(255) UNIQUE NOT NULL,
        capture_id VARCHAR(255) NOT NULL,
        verification_method VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        details JSONB,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ provenance_verifications table created');
    
    // Add indexes for performance
    console.log('📋 Adding performance indexes...');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_merkle_trees_contract_id ON merkle_trees(contract_id);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_provenance_nodes_tree_id ON provenance_nodes(tree_id);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_provenance_nodes_data_hash ON provenance_nodes(data_hash);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_provenance_captures_contract_id ON provenance_captures(contract_id);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_provenance_captures_capture_type ON provenance_captures(capture_type);');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_provenance_verifications_capture_id ON provenance_verifications(capture_id);');
    console.log('✅ Performance indexes added');
    
    // Add foreign key constraints
    console.log('📋 Adding foreign key constraints...');
    try {
      await sequelize.query(`
        ALTER TABLE merkle_trees 
        ADD CONSTRAINT fk_merkle_trees_contract_id 
        FOREIGN KEY (contract_id) REFERENCES contracts(contract_id);
      `);
      console.log('✅ Foreign key constraint added for merkle_trees.contract_id');
    } catch (error) {
      console.log('⚠️ Could not add foreign key constraint (contracts table might not exist yet)');
    }
    
    try {
      await sequelize.query(`
        ALTER TABLE provenance_nodes 
        ADD CONSTRAINT fk_provenance_nodes_tree_id 
        FOREIGN KEY (tree_id) REFERENCES merkle_trees(tree_id);
      `);
      console.log('✅ Foreign key constraint added for provenance_nodes.tree_id');
    } catch (error) {
      console.log('⚠️ Could not add foreign key constraint (merkle_trees table might not exist yet)');
    }
    
    try {
      await sequelize.query(`
        ALTER TABLE provenance_captures 
        ADD CONSTRAINT fk_provenance_captures_contract_id 
        FOREIGN KEY (contract_id) REFERENCES contracts(contract_id);
      `);
      console.log('✅ Foreign key constraint added for provenance_captures.contract_id');
    } catch (error) {
      console.log('⚠️ Could not add foreign key constraint (contracts table might not exist yet)');
    }
    
    try {
      await sequelize.query(`
        ALTER TABLE provenance_verifications 
        ADD CONSTRAINT fk_provenance_verifications_capture_id 
        FOREIGN KEY (capture_id) REFERENCES provenance_captures(capture_id);
      `);
      console.log('✅ Foreign key constraint added for provenance_verifications.capture_id');
    } catch (error) {
      console.log('⚠️ Could not add foreign key constraint (provenance_captures table might not exist yet)');
    }
    
    console.log('🎉 Provenance migration completed successfully!');
    
    // Show table summary
    const tables = await sequelize.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'provenance%' OR table_name = 'merkle_trees'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Created tables:');
    tables[0].forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  runProvenanceMigration()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runProvenanceMigration };
