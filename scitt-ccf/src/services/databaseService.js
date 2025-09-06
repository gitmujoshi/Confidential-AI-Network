const { Sequelize } = require('sequelize');

let sequelize = null;

async function initializeDatabase() {
  try {
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://scitt_user:scitt_pass@scitt-ccf-postgres:5432/scitt_ccf';
    
    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      retry: {
        max: 3
      }
    });

    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    return sequelize;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function closeDatabase() {
  if (sequelize) {
    await sequelize.close();
    console.log('✅ Database connection closed');
  }
}

function getDatabase() {
  return sequelize;
}

module.exports = {
  initializeDatabase,
  closeDatabase,
  getDatabase
};
