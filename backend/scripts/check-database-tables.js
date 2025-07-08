/**
 * Check Database Tables
 * 
 * This script checks if the database tables exist and are properly set up.
 */

const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../config.env' });

class DatabaseChecker {
  constructor() {
    this.sequelize = new Sequelize(
      process.env.DB_NAME || 'contract_management',
      process.env.DB_USER || 'mukeshjoshi',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: '***REMOVED-DB_PASSWORD***',
        logging: false
      }
    );
  }

  async checkDatabase() {
    try {
      console.log('🔍 Checking database setup');
      console.log('=' * 50);

      // Test database connection
      await this.sequelize.authenticate();
      console.log('✅ Database connection successful');

      // Check database name
      const [dbName] = await this.sequelize.query('SELECT current_database();', {
        type: Sequelize.QueryTypes.SELECT
      });
      console.log(`📊 Connected to database: ${dbName.current_database}`);

      // List all tables
      const [tables] = await this.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `, {
        type: Sequelize.QueryTypes.SELECT
      });

      if (tables && tables.length > 0) {
        console.log(`📋 Found ${tables.length} table(s):`);
        tables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });

        // Check if users table exists
        const usersTable = tables.find(t => t.table_name === 'users');
        if (usersTable) {
          console.log('\n✅ Users table exists');
          
          // Check users table structure
          const [columns] = await this.sequelize.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
          `, {
            type: Sequelize.QueryTypes.SELECT
          });

          console.log('\n📋 Users table structure:');
          columns.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
          });

          // Check if DID column exists
          const didColumn = columns.find(c => c.column_name === 'did');
          if (didColumn) {
            console.log('\n✅ DID column exists in users table');
          } else {
            console.log('\n❌ DID column missing from users table');
          }

        } else {
          console.log('\n❌ Users table does not exist');
          console.log('   This means the database migration has not been run.');
          console.log('   Run: npm run migrate or node scripts/setupDatabase.js');
        }

      } else {
        console.log('\n❌ No tables found in database');
        console.log('   This means the database is completely empty.');
        console.log('   Run: npm run migrate or node scripts/setupDatabase.js');
      }

    } catch (error) {
      console.error('❌ Error checking database:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('   Database connection failed. Please check:');
        console.log('   1. PostgreSQL is running');
        console.log('   2. Database credentials in config.env');
        console.log('   3. Database exists');
      }
    } finally {
      await this.sequelize.close();
    }
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  const checker = new DatabaseChecker();
  
  checker.checkDatabase()
    .then(() => {
      console.log('\n✅ Database check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database check failed:', error.message);
      process.exit(1);
    });
}

module.exports = DatabaseChecker; 