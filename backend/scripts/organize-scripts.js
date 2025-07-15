const fs = require('fs');
const path = require('path');

/**
 * Script to organize backend scripts into appropriate directories
 * 
 * Categories:
 * - source/: Production scripts, utilities, and setup scripts
 * - test/: Test scripts and debugging tools
 * - migration/: Database migration and schema update scripts
 * - debug/: Debugging and troubleshooting scripts
 */

const scriptCategories = {
  source: [
    // Production and utility scripts
    'setupDatabase.js',
    'setupKeycloak.js',
    'setup-keycloak-realm.js',
    'setup-comprehensive-db.js',
    'setup-test-database.js',
    'setup-users-with-github-dids.js',
    'setupDPDPCompliance.js',
    'seedData.js',
    'registerHardhatUsers.js',
    'createAdminUsers.js',
    'createSampleCCRPs.js',
    'createSampleData.js',
    'createSampleDatasetsForTDP.js',
    'create-sample-datasets.js',
    'create-sample-models.js',
    'create-sample-users.js',
    'create-tdp-with-datasets.js',
    'create-tdp-with-did.js',
    'create-tdp-datasets.js',
    'create-tdp-datasets-admin.js',
    'create-tdp-datasets-fixed.js',
    'create-tdp-models.js',
    'create-datasets-and-models.js',
    'create-datasets-and-models-admin.js',
    'create-datasets-and-models-simple.js',
    'create-comprehensive-test-data.js',
    'create-comprehensive-test-data-with-delays.js',
    'createContractWithMultipleDatasets.js',
    'createTestDatasets.js',
    'createTestWallets.js',
    'create-test-dataset.js',
    'create-test-user.js',
    'create-test-users-via-internal-registration.js',
    'create-test-users-with-identical-email-name.js',
    'insert-sample-ai-models.js',
    'refresh-test-data.js',
    'generate-valid-addresses.js',
    'list-all-users.js',
    'list-ccrps.js',
    'check-database-tables.js',
    'check-user-did.js',
    'check-user-password.js',
    'check-users.js',
    'check-user.js',
    'check-appadmin-status.js',
    'check-ricardian-contracts.js',
    'check-healthcare-datasets.js',
    'verify-contract.js',
    'working-test-users.md',
    'set-admin-password.js',
    'set-test-user-passwords.js',
    'set-tdp-passwords.js',
    'register-appadmin.js',
    'add-appadmin-role.js',
    'sync-db-users-to-keycloak.js',
    'sync-user-passwords-to-keycloak.js',
    'sync-appadmin-from-keycloak.js',
    'get-keycloak-client-secret.js',
    'configure-keycloak-token-mapper.js',
    'configure-email-dev.js',
    'create-tdc-user.js',
    'create-tdp-user-and-datasets.js',
    'generate-tdp-token.js',
    'generate-admin-token.js',
    'get-reset-token.js',
    'fix-jwt-secret.js',
    'update-realm.js',
    'update-contract-status-enum.js',
    'updateTestUserPublicKeys.js',
    'remove-modelid-from-contracts.js',
    'cleanup-orphaned-keycloak-users.js',
    'disable-rate-limits.js',
    'toggle-blockchain-mode.js',
    'start-integration-test-env.sh',
    'stop-integration-test-env.sh'
  ],
  
  test: [
    // Test scripts
    'test-enhanced-did-signing.js',
    'test-keycloak-auth.js',
    'test-blockchain-fallback.js',
    'test-ccrp-selection.js',
    'test-contracts-fix.js',
    'test-contracts-ui.js',
    'test-did-signing.js',
    'test-contract-creation.js',
    'test-multi-tdp-runner.js',
    'test-multi-tdp-complete-flow.js',
    'test-multi-tdp-endpoints.js',
    'test-privacy-integration.js',
    'test-enhanced-contract-creation.js',
    'test-enhanced-ricardian.js',
    'test-user-logins.js',
    'test-frontend-auth-flow.js',
    'test-frontend-auth.js',
    'test-improved-forgot-password.js',
    'test-login-fix.js',
    'test-public-key.js',
    'test-registration.js',
    'test-complete-functionality.js',
    'test-contract-signing.js',
    'test-email-verification.js',
    'test-final-verification.js',
    'test-forgot-password-flow.js',
    'test-appadmin-login-final.js',
    'test-appadmin-login.js',
    'test-ccrp-endpoint.js',
    'test-ccrp-with-login.js',
    'test-tdc-token.js',
    'test-all-dashboards.js',
    'test-ccrp-cloud-providers.js',
    'test-report.html',
    'test-report.xml'
  ],
  
  migration: [
    // Database migration scripts
    'add-training-environment-fields.js',
    'addCcrpCloudProviderField.js',
    'update-cloud-provider-support.js',
    'add-cloud-provider-support.js',
    'addMultipleTDPsSupport.js',
    'updatePartyTypeEnum.js',
    'updateUserModel.js',
    'updateNotificationEnum.js',
    'updateNotificationTypes.js',
    'migrateIAMFields.js',
    'addDIDFields.js',
    'addEmailVerificationFields.js',
    'addPasswordResetFields.js',
    'addRicardianContractFields.js',
    'add-password-column.js',
    'addPublicKeyColumn.js',
    'create-ai-models-table.js',
    'assign-did-to-tdp.js',
    'fix-keycloak-client-permissions.js',
    'fix-keycloak-client.js',
    'fix-keycloak-integration.js',
    'fix-keycloak-users.js',
    'quick-keycloak-fix.js',
    'reset-keycloak-admin.js'
  ],
  
  debug: [
    // Debugging scripts
    'debug-complete-flow.js',
    'debug-auth.js',
    'debug-user-object.js',
    'debug-token-detailed.js',
    'debug-token.js',
    'debug-user-role.js',
    'debug-did-update.js',
    'debug-contract-creation.js',
    'quick-ui-test.js'
  ]
};

async function organizeScripts() {
  const scriptsDir = path.join(__dirname);
  const sourceDir = path.join(scriptsDir, 'source');
  const testDir = path.join(scriptsDir, 'test');
  const migrationDir = path.join(scriptsDir, 'migration');
  const debugDir = path.join(scriptsDir, 'debug');
  
  console.log('📁 Organizing backend scripts...\n');
  
  // Create directories if they don't exist
  [sourceDir, testDir, migrationDir, debugDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  let movedCount = 0;
  let skippedCount = 0;
  
  // Move files to appropriate directories
  for (const [category, files] of Object.entries(scriptCategories)) {
    const targetDir = path.join(scriptsDir, category);
    
    for (const file of files) {
      const sourcePath = path.join(scriptsDir, file);
      const targetPath = path.join(targetDir, file);
      
      if (fs.existsSync(sourcePath)) {
        try {
          fs.renameSync(sourcePath, targetPath);
          console.log(`✅ Moved ${file} → ${category}/`);
          movedCount++;
        } catch (error) {
          console.log(`❌ Failed to move ${file}: ${error.message}`);
        }
      } else {
        console.log(`⚠️  File not found: ${file}`);
        skippedCount++;
      }
    }
  }
  
  // Check for remaining files in scripts directory
  const remainingFiles = fs.readdirSync(scriptsDir)
    .filter(file => {
      const stat = fs.statSync(path.join(scriptsDir, file));
      return stat.isFile() && file !== 'organize-scripts.js';
    });
  
  if (remainingFiles.length > 0) {
    console.log('\n📋 Remaining files in scripts/ (not categorized):');
    remainingFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Moved: ${movedCount} files`);
  console.log(`   ⚠️  Skipped: ${skippedCount} files`);
  console.log(`   📁 Remaining: ${remainingFiles.length} files`);
  
  // Create README files for each directory
  createReadmeFiles();
}

function createReadmeFiles() {
  const readmeContent = {
    source: `# Source Scripts

This directory contains production scripts, utilities, and setup scripts for the Contract Management System.

## Categories
- **Setup Scripts**: Database and system initialization
- **Data Creation**: Sample data and user creation
- **Utility Scripts**: Helper functions and tools
- **Configuration**: System configuration and setup

## Usage
Run scripts from the backend directory:
\`\`\`bash
node scripts/source/[script-name].js
\`\`\`
`,

    test: `# Test Scripts

This directory contains test scripts and debugging tools for the Contract Management System.

## Categories
- **Integration Tests**: End-to-end testing
- **Unit Tests**: Individual component testing
- **Debugging Tools**: Troubleshooting utilities
- **Test Reports**: Generated test results

## Usage
Run tests from the backend directory:
\`\`\`bash
node scripts/test/[test-name].js
\`\`\`
`,

    migration: `# Migration Scripts

This directory contains database migration and schema update scripts.

## Categories
- **Schema Updates**: Database structure changes
- **Data Migrations**: Data transformation scripts
- **IAM Updates**: Identity and access management changes
- **Keycloak Fixes**: Authentication system updates

## Usage
Run migrations from the backend directory:
\`\`\`bash
node scripts/migration/[migration-name].js
\`\`\`

⚠️ **Warning**: Always backup your database before running migrations!
`,

    debug: `# Debug Scripts

This directory contains debugging and troubleshooting scripts.

## Categories
- **Token Debugging**: Authentication token analysis
- **Flow Debugging**: Process flow investigation
- **User Debugging**: User-related troubleshooting
- **Contract Debugging**: Contract-related issues

## Usage
Run debug scripts from the backend directory:
\`\`\`bash
node scripts/debug/[debug-name].js
\`\`\`
`
  };
  
  Object.entries(readmeContent).forEach(([category, content]) => {
    const readmePath = path.join(__dirname, category, 'README.md');
    fs.writeFileSync(readmePath, content);
    console.log(`📝 Created README.md in ${category}/`);
  });
}

// Run the organization
organizeScripts().catch(console.error); 