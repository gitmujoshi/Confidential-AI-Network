const db = require('../../models');

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Sync all models with database
    await db.sequelize.sync({ force: true });
    
    console.log('Database setup completed successfully!');
    console.log('Tables created:');
    console.log('- users');
    console.log('- datasets');
    console.log('- contracts');
    console.log('- notifications');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 