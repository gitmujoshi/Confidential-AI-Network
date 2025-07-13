const db = require('./models');

async function checkUser() {
  try {
    const user = await db.User.findOne({ 
      where: { email: 'testregistration@example.com' } 
    });
    
    if (user) {
      console.log('User found in database:');
      console.log('- ID:', user.id);
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Has password:', !!user.password);
      console.log('- Is registered:', user.isRegistered);
      console.log('- IAM User ID:', user.iamUserId);
    } else {
      console.log('User not found in database');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUser(); 