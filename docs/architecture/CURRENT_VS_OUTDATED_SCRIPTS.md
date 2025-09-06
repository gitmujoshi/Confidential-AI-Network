# 📋 Current vs Outdated Scripts Analysis

## 🎯 Overview

This document identifies which setup/deployment scripts are **current and recommended** vs **outdated and should be ignored** in the Contract Management System.

## ✅ **CURRENT & RECOMMENDED SCRIPTS**

### **🚀 Main System Scripts (CURRENT)**

#### **1. System Startup & Management**
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

#### **2. Configuration & Fix Scripts (CURRENT)**
```bash
# ✅ CURRENT - Centralized configuration
./scripts/config-loader.js           # Centralized configuration loader
./scripts/fix-auth-unified.sh       # Unified authentication fix (NEW)
./scripts/fix-ssl-inconsistencies.sh # SSL configuration fix (NEW)

# ✅ CURRENT - Individual fix scripts (but being replaced)
./fix-auth.sh                       # Authentication fix (legacy)
./fix-database-setup.sh             # Database setup fix
./fix-keycloak.sh                   # Keycloak fix
```

#### **3. Development Scripts (CURRENT)**
```bash
# ✅ CURRENT - Development setup
./dev-setup.sh                      # Development environment setup
./dev-start.sh                      # Development startup

# ✅ CURRENT - Build system
./build-system.sh                   # Comprehensive build system
```

#### **4. Docker Compose Files (CURRENT)**
```bash
# ✅ CURRENT - Main development
docker-compose.keycloak-dev.yml     # Keycloak with persistent storage
docker-compose.scitt-ccf-dev.yml    # SCITT CCF development

# ✅ CURRENT - Production
docker-compose.main.yml             # Main production setup
```

#### **5. NPM Scripts (CURRENT)**
```bash
# ✅ CURRENT - Main package.json
npm run dev                         # Development mode
npm run server                      # Backend only
npm run client                      # Frontend only
npm run install-all                 # Install all dependencies
npm run test                        # Run all tests

# ✅ CURRENT - Backend package.json
npm run start                       # Start backend
npm run dev                         # Development mode
npm run setup                       # Setup Keycloak and sync users
npm run keycloak:setup              # Keycloak setup only
npm run keycloak:sync               # User sync only
npm run test:login                  # Test authentication
npm run status                      # Check service status
```

### **🧪 Testing Scripts (CURRENT)**
```bash
# ✅ CURRENT - Testing
./test-scitt-ccf-suite.sh           # SCITT CCF test suite
./test-scitt-ccf-frontend-integration.sh # Frontend integration tests
./quick-test.sh                     # Quick system tests
```

## ❌ **OUTDATED & SHOULD BE IGNORED**

### **🚫 Legacy Setup Scripts (OUTDATED)**

#### **1. Old Setup Scripts**
```bash
# ❌ OUTDATED - Use ./start-system.sh instead
./setup-fresh-system.sh             # Replaced by start-system.sh
./setup-linux.sh                    # Replaced by dev-setup.sh
./clean-start.sh                    # Replaced by start-system.sh
./clean-stop.sh                     # Replaced by stop-system.sh
```

#### **2. Old Docker Compose Files**
```bash
# ❌ OUTDATED - Use docker-compose.keycloak-dev.yml instead
docker-compose.dev.yml              # Old development setup
docker-compose.fresh-setup.yml      # Old fresh setup
docker-compose.https.yml            # Old HTTPS setup
docker-compose.keycloak-https.yml   # Old Keycloak HTTPS
docker-compose.keycloak-persistent.yml # Replaced by keycloak-dev.yml
docker-compose.backend.yml          # Old backend only
docker-compose.test.yml             # Old test setup
docker-compose.scitt-ccf-isolated.yml # Old isolated SCITT CCF
```

#### **3. Old Deployment Scripts**
```bash
# ❌ OUTDATED - Use deployment/ folder instead
./deploy-ubuntu.sh                  # Old Ubuntu deployment
```

#### **4. Old Utility Scripts**
```bash
# ❌ OUTDATED - Use centralized config instead
./cleanup-old-scripts.sh            # This script itself is outdated
./cleanup-users.js.backup           # Backup file
./check-user-sync.js                # Replaced by unified scripts
./create-test-users.js              # Replaced by npm scripts
./generate-keycloak-certs.sh        # Replaced by Docker setup
./generate-private-key.js           # Replaced by npm scripts
```

### **🚫 Legacy Backend Scripts (OUTDATED)**

#### **1. Old Backend Scripts**
```bash
# ❌ OUTDATED - Use npm scripts instead
backend/setup-keycloak-simple.js    # Replaced by setup-keycloak-persistent.js
backend/fix-keycloak-client.js      # Replaced by unified fix scripts
backend/list-keycloak-users.js      # Replaced by npm scripts
backend/get-client-secret.js        # Replaced by npm scripts
backend/sync-appadmin-from-keycloak.js # Replaced by sync-users-to-keycloak.js
```

#### **2. Old Test Scripts**
```bash
# ❌ OUTDATED - Use npm test instead
./test-es256-signing.js             # Replaced by npm test
./test-ui-scitt-ccf.sh              # Replaced by test-scitt-ccf-suite.sh
```

## 📊 **Script Status Summary**

### **✅ CURRENT (Use These)**
| Script | Purpose | Status |
|--------|---------|--------|
| `start-system.sh` | Main system startup | ✅ **CURRENT** |
| `manage-services.sh` | Service management | ✅ **CURRENT** |
| `manage-scitt-ccf.sh` | SCITT CCF management | ✅ **CURRENT** |
| `stop-system.sh` | System shutdown | ✅ **CURRENT** |
| `dev-setup.sh` | Development setup | ✅ **CURRENT** |
| `build-system.sh` | Build system | ✅ **CURRENT** |
| `scripts/config-loader.js` | Centralized config | ✅ **CURRENT** |
| `scripts/fix-auth-unified.sh` | Unified auth fix | ✅ **CURRENT** |
| `docker-compose.keycloak-dev.yml` | Keycloak setup | ✅ **CURRENT** |
| `docker-compose.scitt-ccf-dev.yml` | SCITT CCF setup | ✅ **CURRENT** |
| `npm run start` | Backend startup | ✅ **CURRENT** |
| `npm run setup` | Backend setup | ✅ **CURRENT** |
| `npm run test` | Testing | ✅ **CURRENT** |

### **❌ OUTDATED (Ignore These)**
| Script | Purpose | Replacement |
|--------|---------|-------------|
| `setup-fresh-system.sh` | Old system setup | `start-system.sh` |
| `setup-linux.sh` | Old Linux setup | `dev-setup.sh` |
| `clean-start.sh` | Old startup | `start-system.sh` |
| `clean-stop.sh` | Old shutdown | `stop-system.sh` |
| `deploy-ubuntu.sh` | Old deployment | `deployment/` folder |
| `docker-compose.dev.yml` | Old Docker setup | `docker-compose.keycloak-dev.yml` |
| `docker-compose.fresh-setup.yml` | Old fresh setup | `docker-compose.keycloak-dev.yml` |
| `cleanup-old-scripts.sh` | Old cleanup | Manual cleanup |
| `check-user-sync.js` | Old user sync | `npm run keycloak:sync` |
| `create-test-users.js` | Old test users | `npm run setup` |

## 🚀 **Recommended Workflow**

### **For New Developers**
```bash
# 1. Setup development environment
./dev-setup.sh

# 2. Start the system
./start-system.sh

# 3. Test the system
npm run test:login
```

### **For System Administration**
```bash
# 1. Check system status
npm run status

# 2. Fix authentication issues
./scripts/fix-auth-unified.sh

# 3. Manage SCITT CCF
./manage-scitt-ccf.sh status
```

### **For Production Deployment**
```bash
# 1. Use deployment scripts in deployment/ folder
cd deployment/
./deploy-to-ubuntu-vm.sh

# 2. Or use production Docker Compose
docker-compose -f docker-compose.main.yml up -d
```

## 🧹 **Cleanup Recommendations**

### **Files to Remove**
```bash
# Remove outdated scripts
rm setup-fresh-system.sh
rm setup-linux.sh
rm clean-start.sh
rm clean-stop.sh
rm deploy-ubuntu.sh
rm cleanup-old-scripts.sh
rm check-user-sync.js
rm create-test-users.js
rm generate-keycloak-certs.sh
rm generate-private-key.js
rm test-es256-signing.js
rm test-ui-scitt-ccf.sh

# Remove outdated Docker Compose files
rm docker-compose.dev.yml
rm docker-compose.fresh-setup.yml
rm docker-compose.https.yml
rm docker-compose.keycloak-https.yml
rm docker-compose.keycloak-persistent.yml
rm docker-compose.backend.yml
rm docker-compose.test.yml
rm docker-compose.scitt-ccf-isolated.yml

# Remove outdated backend scripts
rm backend/setup-keycloak-simple.js
rm backend/fix-keycloak-client.js
rm backend/list-keycloak-users.js
rm backend/get-client-secret.js
rm backend/sync-appadmin-from-keycloak.js
```

### **Files to Keep**
```bash
# Keep current scripts
start-system.sh
manage-services.sh
manage-scitt-ccf.sh
stop-system.sh
dev-setup.sh
build-system.sh
scripts/config-loader.js
scripts/fix-auth-unified.sh
scripts/fix-ssl-inconsistencies.sh

# Keep current Docker Compose files
docker-compose.keycloak-dev.yml
docker-compose.scitt-ccf-dev.yml
docker-compose.main.yml

# Keep current fix scripts (until fully replaced)
fix-auth.sh
fix-database-setup.sh
fix-keycloak.sh
```

## 📋 **Migration Checklist**

### **Phase 1: Identify Current Scripts**
- [x] Document current vs outdated scripts
- [x] Create centralized configuration system
- [x] Create unified fix scripts

### **Phase 2: Update Documentation**
- [ ] Update README.md with current scripts
- [ ] Update setup guides with current workflow
- [ ] Update troubleshooting guides

### **Phase 3: Cleanup Outdated Scripts**
- [ ] Remove outdated scripts
- [ ] Remove outdated Docker Compose files
- [ ] Update package.json scripts if needed

### **Phase 4: Test Current Workflow**
- [ ] Test new developer onboarding
- [ ] Test system administration tasks
- [ ] Test production deployment

## 🎯 **Key Takeaways**

1. **Use `start-system.sh`** for system startup
2. **Use `scripts/fix-auth-unified.sh`** for authentication issues
3. **Use `scripts/config-loader.js`** for configuration
4. **Use `npm run` commands** for backend operations
5. **Use `deployment/` folder** for production deployments
6. **Ignore all scripts** marked as OUTDATED
7. **Remove outdated files** to reduce confusion

---

**Last Updated**: September 2, 2025  
**Version**: 1.0.0  
**Status**: Current Analysis
