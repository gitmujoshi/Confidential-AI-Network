const fs = require('fs');
const path = require('path');

// Files that need rate limiting disabled
const filesToUpdate = [
  {
    file: 'routes/auth.js',
    patterns: [
      {
        search: "router.post('/login', authRateLimit, logAuthEvent('LOGIN'), async (req, res) => {",
        replace: "router.post('/login', logAuthEvent('LOGIN'), async (req, res) => {"
      },
      {
        search: "router.post('/register', authRateLimit, logAuthEvent('REGISTER'), async (req, res) => {",
        replace: "router.post('/register', logAuthEvent('REGISTER'), async (req, res) => {"
      },
      {
        search: "router.post('/forgot-password', authRateLimit, logAuthEvent('FORGOT_PASSWORD'), async (req, res) => {",
        replace: "router.post('/forgot-password', logAuthEvent('FORGOT_PASSWORD'), async (req, res) => {"
      },
      {
        search: "router.post('/reset-password', authRateLimit, logAuthEvent('RESET_PASSWORD'), async (req, res) => {",
        replace: "router.post('/reset-password', logAuthEvent('RESET_PASSWORD'), async (req, res) => {"
      }
    ]
  },
  {
    file: 'routes/dpdp.js',
    patterns: [
      {
        search: "// Apply rate limiting to all DPDP routes",
        replace: "// Rate limiting disabled for development"
      },
      {
        search: "router.use(dpdpRateLimit);",
        replace: "// router.use(dpdpRateLimit); // Disabled for development"
      }
    ]
  }
];

function updateFile(filePath, patterns) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    patterns.forEach(pattern => {
      if (content.includes(pattern.search)) {
        content = content.replace(pattern.search, pattern.replace);
        updated = true;
        console.log(`✅ Updated: ${pattern.search.split(',')[0]}...`);
      } else {
        console.log(`⚠️  Pattern not found: ${pattern.search.split(',')[0]}...`);
      }
    });
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated file: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed for: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

function disableRateLimits() {
  console.log('🚀 Disabling rate limits for development...\n');
  
  filesToUpdate.forEach(fileConfig => {
    const filePath = path.join(__dirname, fileConfig.file);
    console.log(`📝 Processing: ${fileConfig.file}`);
    updateFile(filePath, fileConfig.patterns);
    console.log('');
  });
  
  console.log('🎉 Rate limiting disabled for development!');
  console.log('\n📋 Changes made:');
  console.log('  - Removed authRateLimit from login endpoint');
  console.log('  - Removed authRateLimit from register endpoint');
  console.log('  - Removed authRateLimit from forgot-password endpoint');
  console.log('  - Removed authRateLimit from reset-password endpoint');
  console.log('  - Disabled DPDP rate limiting');
  console.log('\n⚠️  Remember to re-enable rate limiting for production!');
}

// Run the script
if (require.main === module) {
  disableRateLimits();
}

module.exports = { disableRateLimits }; 