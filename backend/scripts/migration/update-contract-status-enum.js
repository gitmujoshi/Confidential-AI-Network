const { Sequelize } = require('sequelize');

async function updateContractStatusEnum() {
  const sequelize = new Sequelize({
    dialect: '***REMOVED-DB_PASSWORD***',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || '***REMOVED-DB_PASSWORD***',
    password: process.env.DB_PASSWORD || '***REMOVED-DB_PASSWORD***',
    database: process.env.DB_NAME || 'contract_management',
    logging: false
  });

  try {
    console.log('🔄 Updating contract status enum...');

    // Add the missing enum values
    await sequelize.query(`
      ALTER TYPE enum_contracts_status ADD VALUE IF NOT EXISTS 'PENDING_TDP_APPROVAL';
    `);

    await sequelize.query(`
      ALTER TYPE enum_contracts_status ADD VALUE IF NOT EXISTS 'PENDING_CCRP_APPROVAL';
    `);

    console.log('✅ Successfully updated contract status enum');

  } catch (error) {
    console.error('❌ Error updating contract status enum:', error.message);
    
    // If the enum values already exist, that's fine
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Enum values already exist, continuing...');
    } else {
      throw error;
    }
  } finally {
    await sequelize.close();
  }
}

// Run the migration
updateContractStatusEnum()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 