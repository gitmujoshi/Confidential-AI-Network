const db = require('../models');

async function checkUser() {
  try {
    const user = await db.User.findOne({
      where: { email: 'tdp.medical@example.com' }
    });
    
    if (user) {
      console.log('User found:', user.email);
      console.log('Has password:', !!user.password);
      console.log('Password length:', user.password ? user.password.length : 0);
      console.log('Is active:', user.isActive);
      console.log('Party type:', user.partyType);
    } else {
      console.log('User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser(); 