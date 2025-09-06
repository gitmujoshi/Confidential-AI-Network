# 🛠️ Developer Guide

## 🚀 Quick Start for Developers

### **Prerequisites**
- Node.js 18+ and npm
- PostgreSQL 15+
- Docker and Docker Compose
- Git

### **Initial Setup**
```bash
# Clone repository
git clone <repository-url>
cd ContractManagement

# Install dependencies
npm run install-all

# Setup environment
cp config/system.env.example config/system.env
# Edit config/system.env with your settings

# Start the system
./start-system.sh
```

## 📋 **Current vs Outdated Scripts**

### **✅ CURRENT Scripts (Use These)**

#### **🚀 System Management**
```bash
# ✅ CURRENT - Main system startup
./start-system.sh                    # Comprehensive system startup with SCITT CCF support

# ✅ CURRENT - System management
./manage-services.sh                 # Service management utilities
./manage-scitt-ccf.sh               # SCITT CCF specific management

# ✅ CURRENT - System control
./stop-system.sh                    # Clean system shutdown
./stop-scitt-ccf.sh                 # SCITT CCF shutdown
```

#### **🔧 Configuration & Fix Scripts**
```bash
# ✅ CURRENT - Centralized configuration (NEW)
./scripts/config-loader.js           # Centralized configuration loader
./scripts/fix-auth-unified.sh       # Unified authentication fix (NEW)
./scripts/fix-ssl-inconsistencies.sh # SSL configuration fix (NEW)

# ✅ CURRENT - Individual fix scripts (legacy but still working)
./fix-auth.sh                       # Authentication fix
./fix-database-setup.sh             # Database setup fix
./fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.sh                   # Keycloak fix
```

#### **🛠️ Development Scripts**
```bash
# ✅ CURRENT - Development setup
./dev-setup.sh                      # Development environment setup
./dev-start.sh                      # Development startup

# ✅ CURRENT - Build system
./build-system.sh                   # Comprehensive build system
```

#### **🐳 Docker Compose Files**
```bash
# ✅ CURRENT - Main development
docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-dev.yml     # Keycloak with persistent storage
docker-compose.scitt-ccf-dev.yml    # SCITT CCF development

# ✅ CURRENT - Production
docker-compose.main.yml             # Main production setup
```

#### **📦 NPM Scripts**
```bash
# ✅ CURRENT - Main package.json
npm run dev                         # Development mode
npm run server                      # Backend only
npm run client                      # Frontend only
npm run install-all                 # Install all dependencies
npm run test                        # Run all tests

# ✅ CURRENT - Backend package.json
npm run start                       # Start backend
npm run setup                       # Setup Keycloak and sync users
npm run ***REMOVED-KEYCLOAK_DB_PASSWORD***:setup              # Keycloak setup only
npm run ***REMOVED-KEYCLOAK_DB_PASSWORD***:sync               # User sync only
npm run test:login                  # Test authentication
npm run status                      # Check service status
```

### **❌ OUTDATED Scripts (Don't Use These)**

#### **🚫 Legacy Setup Scripts**
```bash
# ❌ OUTDATED - Use ./start-system.sh instead
./setup-fresh-system.sh             # Replaced by start-system.sh
./setup-linux.sh                    # Replaced by dev-setup.sh
./clean-start.sh                    # Replaced by start-system.sh
./clean-stop.sh                     # Replaced by stop-system.sh
```

#### **🚫 Old Docker Compose Files**
```bash
# ❌ OUTDATED - Use docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-dev.yml instead
docker-compose.dev.yml              # Old development setup
docker-compose.fresh-setup.yml      # Old fresh setup
docker-compose.https.yml            # Old HTTPS setup
docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-https.yml   # Old Keycloak HTTPS
docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml # Replaced by ***REMOVED-KEYCLOAK_DB_PASSWORD***-dev.yml
docker-compose.backend.yml          # Old backend only
docker-compose.test.yml             # Old test setup
docker-compose.scitt-ccf-isolated.yml # Old isolated SCITT CCF
```

#### **🚫 Old Utility Scripts**
```bash
# ❌ OUTDATED - Use centralized config instead
./cleanup-old-scripts.sh            # This script itself is outdated
./cleanup-users.js.backup           # Backup file
./check-user-sync.js                # Replaced by unified scripts
./create-test-users.js              # Replaced by npm scripts
./generate-***REMOVED-KEYCLOAK_DB_PASSWORD***-certs.sh        # Replaced by Docker setup
./generate-private-key.js           # Replaced by npm scripts
```

## 🔧 **Configuration Management**

### **Centralized Configuration**
The system now uses a centralized configuration approach:

```bash
# ✅ CURRENT - Centralized configuration file
config/system.env                   # Single source of truth for all configurations

# ✅ CURRENT - Configuration loader
./scripts/config-loader.js           # Load configurations from config/system.env
```

### **Configuration Categories**
- **Keycloak**: URL, realm, admin credentials, client settings
- **Database**: Host, port, credentials, connection settings
- **Backend**: Port, environment, logging settings
- **Frontend**: API endpoints, authentication settings
- **SCITT CCF**: Ledger configuration, TEE settings

## 🧪 **Testing**

### **Test Suites**
```bash
# ✅ CURRENT - Run all tests
npm test

# ✅ CURRENT - Run specific test suites
npm run test:mock                   # Mock tests
npm run test:integration            # Integration tests

# ✅ CURRENT - Test authentication
npm run test:login
```

### **Test Data**
- **Test Users**: Available in `docs/testing/TEST_DATA_FOR_TESTERS.md`
- **Test Contracts**: Available in `contract_template.json`
- **Test Scenarios**: Available in `tests/` directory

## 🚀 **Development Workflow**

### **Daily Development**
```bash
# 1. Start the system
./start-system.sh

# 2. Check system health
npm run status

# 3. Run tests
npm test

# 4. Make changes
# ... your development work ...

# 5. Test changes
npm run test:login

# 6. Stop the system
./stop-system.sh
```

### **Authentication Issues**
```bash
# ✅ CURRENT - Fix authentication issues
./scripts/fix-auth-unified.sh

# ✅ CURRENT - Fix SSL configuration issues
./scripts/fix-ssl-inconsistencies.sh
```

### **Configuration Changes**
```bash
# 1. Edit centralized configuration
vim config/system.env

# 2. Test configuration
./scripts/config-loader.js

# 3. Restart services if needed
./stop-system.sh
./start-system.sh
```

## 🏗️ **Architecture Overview**

### **System Components**
- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: Keycloak IAM
- **Ledger**: SCITT CCF (Microsoft)
- **Containerization**: Docker + Docker Compose

### **Key Services**
- **Contract Service**: Contract creation and management
- **Authentication Service**: User authentication and authorization
- **SCITT CCF Service**: Ledger integration and claims management
- **User Service**: User management and role-based access
- **Health Service**: System monitoring and health checks

## 📚 **Documentation**

### **Core Documentation**
- **[Current vs Outdated Scripts](docs/architecture/CURRENT_VS_OUTDATED_SCRIPTS.md)** - Script analysis and recommendations
- **[Centralized Configuration Architecture](docs/architecture/CENTRALIZED_CONFIGURATION_ARCHITECTURE.md)** - Configuration management design
- **[Backend Services Documentation](docs/implementation/BACKEND_SERVICES_DOCUMENTATION.md)** - Complete backend services documentation
- **[Frontend Components Documentation](docs/implementation/FRONTEND_COMPONENTS_DOCUMENTATION.md)** - Frontend components and architecture

### **Setup & Troubleshooting**
- **[Setup Troubleshooting Guide](docs/guides/SETUP_TROUBLESHOOTING_GUIDE.md)** - Common setup issues and solutions
- **[Test Data for Testers](docs/testing/TEST_DATA_FOR_TESTERS.md)** - Test data and user accounts

## 🧹 **Cleanup & Maintenance**

### **Remove Outdated Scripts**
```bash
# ✅ CURRENT - Clean up outdated scripts
./scripts/cleanup-outdated-scripts.sh

# This will:
# - Remove outdated scripts
# - Create backups
# - Generate cleanup summary
# - Show current recommended workflow
```

### **Regular Maintenance**
```bash
# 1. Check system health
npm run status

# 2. Run tests
npm test

# 3. Check for outdated scripts
./scripts/cleanup-outdated-scripts.sh

# 4. Update documentation if needed
```

## 🎯 **Best Practices**

### **Script Usage**
1. **Always use current scripts** - Check the current vs outdated scripts list
2. **Use centralized configuration** - Edit `config/system.env` for all settings
3. **Test after changes** - Run `npm run test:login` after configuration changes
4. **Document changes** - Update documentation when making changes

### **Development**
1. **Start with system startup** - Use `./start-system.sh` for development
2. **Check system health** - Use `npm run status` regularly
3. **Fix issues systematically** - Use the appropriate fix scripts
4. **Clean up regularly** - Remove outdated scripts and files

### **Configuration**
1. **Use centralized config** - All settings in `config/system.env`
2. **Test configuration** - Use `./scripts/config-loader.js` to verify
3. **Document changes** - Update configuration documentation
4. **Version control** - Keep configuration files in version control

## 🆘 **Getting Help**

### **Common Issues**
- **Authentication problems**: Use `./scripts/fix-auth-unified.sh`
- **SSL configuration issues**: Use `./scripts/fix-ssl-inconsistencies.sh`
- **System startup issues**: Check `./start-system.sh` logs
- **Configuration problems**: Use `./scripts/config-loader.js`

### **Resources**
- **Documentation**: Check the `docs/` directory
- **Troubleshooting**: See `docs/guides/SETUP_TROUBLESHOOTING_GUIDE.md`
- **Script Analysis**: See `docs/architecture/CURRENT_VS_OUTDATED_SCRIPTS.md`
- **Configuration**: See `docs/architecture/CENTRALIZED_CONFIGURATION_ARCHITECTURE.md`

---

**Last Updated**: September 2, 2025  
**Version**: 1.0.0  
**Status**: Current Developer Guide
