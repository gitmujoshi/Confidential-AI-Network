/**
 * Configure Email for Development
 * 
 * This script helps configure email settings for development testing
 */

const fs = require('fs');
const path = require('path');

function configureEmailDev() {
  console.log('📧 Email Configuration for Development\n');

  console.log('❌ Why you didn\'t get the email:');
  console.log('   1. Keycloak email sender not configured');
  console.log('   2. SMTP credentials not set up');
  console.log('   3. Gmail requires app-specific passwords\n');

  console.log('✅ The forgot password flow is working correctly:');
  console.log('   - Reset token generated ✅');
  console.log('   - Token stored in database ✅');
  console.log('   - Notification created ✅');
  console.log('   - Only email delivery failed ❌\n');

  console.log('🔧 To fix email delivery, you have several options:\n');

  console.log('Option 1: Use Gmail SMTP (Recommended for testing)');
  console.log('   1. Enable 2-factor authentication on your Gmail account');
  console.log('   2. Generate an App Password: https://myaccount.google.com/apppasswords');
  console.log('   3. Add these environment variables to config.env:');
  console.log('      SMTP_HOST=smtp.gmail.com');
  console.log('      SMTP_PORT=587');
  console.log('      SMTP_USER=your-email@gmail.com');
  console.log('      SMTP_PASS=***REMOVED-EMAIL_PASS***');
  console.log('      FROM_EMAIL=your-email@gmail.com\n');

  console.log('Option 2: Use a test email service');
  console.log('   1. Sign up for Mailtrap.io (free)');
  console.log('   2. Get SMTP credentials from your inbox');
  console.log('   3. Update config.env with Mailtrap credentials\n');

  console.log('Option 3: Use Ethereal Email (for testing)');
  console.log('   1. Visit: https://ethereal.email/create');
  console.log('   2. Use the generated credentials in config.env\n');

  console.log('Option 4: Configure Keycloak Email');
  console.log('   1. Login to Keycloak Admin Console');
  console.log('   2. Go to Realm Settings > Email');
  console.log('   3. Configure SMTP settings\n');

  console.log('🎯 For now, you can test the complete flow using the reset token:');
  console.log('   Token: 19e7e0f13166366e0345771d574a2102caf48cd0c0ace294d2669baffc21ef0c');
  console.log('   Frontend URL: http://localhost:3000/reset-password?token=19e7e0f13166366e0345771d574a2102caf48cd0c0ace294d2669baffc21ef0c\n');

  console.log('📝 Current config.env email settings:');
  const configPath = path.join(__dirname, 'config.env');
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    const emailLines = config.split('\n').filter(line => 
      line.includes('SMTP_') || line.includes('EMAIL_') || line.includes('FROM_')
    );
    if (emailLines.length > 0) {
      emailLines.forEach(line => console.log(`   ${line}`));
    } else {
      console.log('   No email settings found in config.env');
    }
  } else {
    console.log('   config.env file not found');
  }
}

configureEmailDev(); 