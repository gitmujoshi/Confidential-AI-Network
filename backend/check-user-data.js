const db = require('./models');

async function checkUserData() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected');

    const users = await db.User.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'email', 'iamUsername', 'iamUserId', 'partyType']
    });

    console.log('👥 Users in database:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Email: ${user.email}, IAM Username: ${user.iamUsername}, IAM User ID: ${user.iamUserId}, Party: ${user.partyType}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.sequelize.close();
  }
}

checkUserData();
