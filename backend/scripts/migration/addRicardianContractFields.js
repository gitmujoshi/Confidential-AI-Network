/**
 * Database Migration Script: Add Ricardian Contract Fields
 * 
 * This script adds Ricardian contract fields to the existing contracts table.
 * Ricardian contracts combine human-readable legal documents with machine-executable smart contracts.
 * 
 * New Fields:
 * - legalDocumentHash: SHA-256 hash of legal document
 * - ricardianSignature: Cryptographic signature binding legal to smart contract
 * - smartContractAddress: Smart contract address for automated execution
 * - smartContractNetwork: Blockchain network (goerli, mainnet, etc.)
 * - legalDocument: Complete legal document with terms, parties, and signatures (JSON)
 * - environmentSpecs: CCRP environment specifications (JSON)
 * - trainingParams: AI training parameters (JSON)
 * - attestationVerified: Whether Azure attestation has been verified
 * - attestationReport: Azure Confidential Computing attestation report (JSON)
 * - kmsConfigs: Multi-KMS provider configurations (JSON)
 * 
 * Indexes:
 * - legalDocumentHash: Fast legal document hash lookups
 * - smartContractAddress: Fast smart contract address lookups
 * - attestationVerified: Fast attestation verification queries
 */

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: './config.env' });

// Database connection using environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || 'contract_management',
  process.env.DB_USER || 'mukeshjoshi',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function addRicardianContractFields() {
  try {
    console.log('🔧 Starting Ricardian contract fields migration...');

    // Check if fields already exist
    const tableInfo = await sequelize.query(
      "SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'contracts'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingFields = tableInfo.map(row => row.column_name);
    console.log('📋 Existing fields:', existingFields);

    // Fields to add
    const fieldsToAdd = [
      {
        name: 'legalDocumentHash',
        type: 'VARCHAR(64)',
        comment: 'Hash of human-readable legal document for Ricardian binding'
      },
      {
        name: 'ricardianSignature',
        type: 'VARCHAR(132)',
        comment: 'Cryptographic signature binding legal document to smart contract'
      },
      {
        name: 'smartContractAddress',
        type: 'VARCHAR(42)',
        comment: 'Smart contract address for automated execution'
      },
      {
        name: 'smartContractNetwork',
        type: 'VARCHAR(20)',
        defaultValue: "'goerli'",
        comment: 'Blockchain network (goerli, mainnet, etc.)'
      },
      {
        name: 'legalDocument',
        type: 'JSON',
        comment: 'Complete legal document with terms, parties, and signatures'
      },
      {
        name: 'environmentSpecs',
        type: 'JSON',
        comment: 'CCRP environment specifications including compute, security, and KMS config'
      },
      {
        name: 'trainingParams',
        type: 'JSON',
        comment: 'AI training parameters including model type, privacy techniques, and validation metrics'
      },
      {
        name: 'attestationVerified',
        type: 'BOOLEAN',
        defaultValue: 'FALSE',
        comment: 'Whether Azure attestation has been verified'
      },
      {
        name: 'attestationReport',
        type: 'JSON',
        comment: 'Azure Confidential Computing attestation report'
      },
      {
        name: 'kmsConfigs',
        type: 'JSON',
        comment: 'Multi-KMS provider configurations for data decryption'
      }
    ];

    // Add fields that don't exist
    for (const field of fieldsToAdd) {
      if (!existingFields.includes(field.name)) {
        console.log(`➕ Adding field: ${field.name}`);
        
        let alterQuery = `ALTER TABLE contracts ADD COLUMN ${field.name} ${field.type}`;
        
        if (field.defaultValue) {
          alterQuery += ` DEFAULT ${field.defaultValue}`;
        }

        await sequelize.query(alterQuery);
        console.log(`✅ Added field: ${field.name}`);
      } else {
        console.log(`⏭️ Field already exists: ${field.name}`);
      }
    }

    // Add indexes
    console.log('🔍 Adding indexes...');

    // Check if indexes exist
    const indexInfo = await sequelize.query(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'contracts'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingIndexes = indexInfo.map(row => row.indexname);
    console.log('📋 Existing indexes:', existingIndexes);

    // Indexes to add
    const indexesToAdd = [
      {
        name: 'idx_contracts_legal_document_hash',
        columns: ['legalDocumentHash'],
        type: 'INDEX'
      },
      {
        name: 'idx_contracts_smart_contract_address',
        columns: ['smartContractAddress'],
        type: 'INDEX'
      },
      {
        name: 'idx_contracts_attestation_verified',
        columns: ['attestationVerified'],
        type: 'INDEX'
      }
    ];

    // Add indexes that don't exist
    for (const index of indexesToAdd) {
      if (!existingIndexes.includes(index.name)) {
        console.log(`➕ Adding index: ${index.name}`);
        
        const createIndexQuery = `CREATE INDEX ${index.name} ON contracts (${index.columns.join(', ')})`;
        await sequelize.query(createIndexQuery);
        
        console.log(`✅ Added index: ${index.name}`);
      } else {
        console.log(`⏭️ Index already exists: ${index.name}`);
      }
    }

    // Verify migration
    console.log('🔍 Verifying migration...');
    
    const finalTableInfo = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'contracts'",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const finalFields = finalTableInfo.map(row => row.column_name);
    console.log('📋 Final fields:', finalFields);

    // Check for required Ricardian fields (PostgreSQL converts to lowercase)
    const requiredFields = [
      'legaldocumenthash',
      'ricardiansignature', 
      'smartcontractaddress',
      'smartcontractnetwork',
      'legaldocument',
      'environmentspecs',
      'trainingparams',
      'attestationverified',
      'attestationreport',
      'kmsconfigs'
    ];

    const missingFields = requiredFields.filter(field => !finalFields.includes(field));
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      throw new Error('Migration incomplete - missing required fields');
    }

    console.log('✅ Ricardian contract fields migration completed successfully!');
    console.log('📊 Migration Summary:');
    console.log(`   - Added ${fieldsToAdd.length} new fields`);
    console.log(`   - Added ${indexesToAdd.length} new indexes`);
    console.log(`   - All required fields verified`);

  } catch (error) {
    console.error('❌ Error during Ricardian contract fields migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  addRicardianContractFields()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addRicardianContractFields }; 