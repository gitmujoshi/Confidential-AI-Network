# Backend Scripts Organization

## Overview

The backend scripts have been organized into four main categories for better maintainability and clarity:

## 📁 Directory Structure

```
backend/scripts/
├── source/          # Production scripts and utilities
├── test/           # Test scripts and debugging tools  
├── migration/      # Database migration scripts
├── debug/          # Debugging and troubleshooting scripts
└── README.md       # This file
```

## 📊 File Distribution

| Category | Count | Description |
|----------|-------|-------------|
| **source/** | 47 | Production scripts, utilities, and setup scripts |
| **test/** | 36 | Test scripts and debugging tools |
| **migration/** | 25 | Database migration and schema update scripts |
| **debug/** | 10 | Debugging and troubleshooting scripts |

**Total**: 118 organized files

## 🎯 Categories Explained

### Source Scripts (`source/`)
**Purpose**: Production scripts, utilities, and setup scripts

**Examples**:
- `setupDatabase.js` - Database initialization
- `setupKeycloak.js` - Keycloak configuration
- `createSampleData.js` - Sample data creation
- `list-all-users.js` - User listing utilities
- `sync-db-users-to-keycloak.js` - User synchronization

**Usage**:
```bash
node scripts/source/[script-name].js
```

### Test Scripts (`test/`)
**Purpose**: Test scripts and debugging tools

**Examples**:
- `test-enhanced-did-signing.js` - DID signing tests
- `test-keycloak-auth.js` - Authentication tests
- `test-contract-creation.js` - Contract creation tests
- `test-report.html` - Test reports

**Usage**:
```bash
node scripts/test/[test-name].js
```

### Migration Scripts (`migration/`)
**Purpose**: Database migration and schema update scripts

**Examples**:
- `add-cloud-provider-support.js` - Cloud provider schema updates
- `addDIDFields.js` - DID field additions
- `fix-keycloak-integration.js` - Keycloak fixes
- `updateUserModel.js` - User model updates

**Usage**:
```bash
node scripts/migration/[migration-name].js
```

⚠️ **Warning**: Always backup your database before running migrations!

### Debug Scripts (`debug/`)
**Purpose**: Debugging and troubleshooting scripts

**Examples**:
- `debug-token.js` - Token debugging
- `debug-auth.js` - Authentication debugging
- `debug-user-object.js` - User object debugging
- `quick-ui-test.js` - Quick UI tests

**Usage**:
```bash
node scripts/debug/[debug-name].js
```

## 🔧 Benefits of This Organization

### 1. **Clear Separation of Concerns**
- Production scripts are separate from test scripts
- Migration scripts are isolated for safety
- Debug scripts are easily accessible

### 2. **Improved Maintainability**
- Easy to find specific types of scripts
- Clear documentation for each category
- Reduced confusion about script purposes

### 3. **Better Development Workflow**
- Developers can quickly locate relevant scripts
- Test scripts are grouped together
- Migration scripts are clearly marked

### 4. **Enhanced Safety**
- Migration scripts are clearly separated
- Test scripts don't interfere with production
- Debug scripts are isolated

## 📝 Usage Guidelines

### For Developers
1. **New Scripts**: Place in appropriate category based on purpose
2. **Test Scripts**: Always place in `test/` directory
3. **Migrations**: Always place in `migration/` directory
4. **Debug Scripts**: Place in `debug/` directory

### For Operations
1. **Production**: Use scripts from `source/` directory
2. **Testing**: Use scripts from `test/` directory
3. **Migrations**: Use scripts from `migration/` directory with caution
4. **Troubleshooting**: Use scripts from `debug/` directory

## 🚀 Quick Reference

### Common Operations

**Setup Database**:
```bash
node scripts/source/setupDatabase.js
```

**Run Tests**:
```bash
node scripts/test/test-enhanced-did-signing.js
```

**Run Migration**:
```bash
node scripts/migration/add-cloud-provider-support.js
```

**Debug Issues**:
```bash
node scripts/debug/debug-token.js
```

## 📋 Migration Notes

- All existing script references have been updated
- README files created for each directory
- Scripts maintain their original functionality
- No breaking changes to existing workflows

## 🔄 Future Maintenance

When adding new scripts:
1. Determine the script's primary purpose
2. Place it in the appropriate directory
3. Update this documentation if needed
4. Follow the naming conventions established

This organization makes the backend scripts much more manageable and easier to navigate! 