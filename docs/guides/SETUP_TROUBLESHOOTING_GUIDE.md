# Setup Troubleshooting Guide

## 🚨 **Why This Keeps Happening**

The login/authentication issues keep recurring because of **systematic problems** in our setup process:

### 1. **Inconsistent Environment Configuration**
- **Problem**: Multiple scripts expect different Keycloak client configurations
- **Root Cause**: No single source of truth for environment setup
- **Solution**: Use the comprehensive setup script

### 2. **Keycloak-Database Sync Gaps**
- **Problem**: Users created in database but not in Keycloak (or vice versa)
- **Root Cause**: Separate scripts for database and Keycloak user creation
- **Solution**: Create users in both systems simultaneously

### 3. **Environment Variable Loading Issues**
- **Problem**: `config.env` not loaded correctly by different scripts
- **Root Cause**: Inconsistent path resolution and dotenv configuration
- **Solution**: Explicit path configuration in server.js

### 4. **Client Configuration Mismatches**
- **Problem**: Backend expects confidential client, Keycloak has public client
- **Root Cause**: Different setup scripts create different client configurations
- **Solution**: Standardize on public client configuration

## 🛠️ **The Solution: Current Recommended Scripts**

Use the **current, recommended scripts** instead of outdated ones:

### **✅ CURRENT Scripts (Use These)**
```bash
# ✅ CURRENT - Main system startup
./start-system.sh                    # Comprehensive system startup

# ✅ CURRENT - Unified authentication fix (NEW)
./scripts/fix-auth-unified.sh       # Fix authentication issues

# ✅ CURRENT - SSL configuration fix (NEW)
./scripts/fix-ssl-inconsistencies.sh # Fix SSL configuration issues

# ✅ CURRENT - Centralized configuration (NEW)
./scripts/config-loader.js           # Load from config/system.env
```

### **❌ OUTDATED Scripts (Don't Use These)**
```bash
# ❌ OUTDATED - Use ./start-system.sh instead
./setup-fresh-system.sh             # Replaced by start-system.sh
./setup-linux.sh                    # Replaced by dev-setup.sh
./clean-start.sh                    # Replaced by start-system.sh
./clean-stop.sh                     # Replaced by stop-system.sh

# ❌ OUTDATED - Use unified scripts instead
./fix-auth.sh                       # Replaced by scripts/fix-auth-unified.sh
./fix-keycloak.sh                   # Replaced by scripts/fix-auth-unified.sh
./fix-database-setup.sh             # Replaced by scripts/fix-auth-unified.sh
```

### **🔧 Configuration Management**
```bash
# ✅ CURRENT - Use centralized configuration
./scripts/config-loader.js           # Load from config/system.env

# ✅ CURRENT - Clean up outdated scripts
./scripts/cleanup-outdated-scripts.sh # Remove outdated files
```

## 📋 **Step-by-Step Setup Process**

### Prerequisites
1. **Start Keycloak**: `docker-compose -f docker-compose.keycloak-dev.yml up -d`
2. **Start Backend**: `cd backend && npm start`
3. **Ensure Database**: PostgreSQL running with `contract_management` database

### ✅ CURRENT Setup Process
```bash
# 1. Start the system
./start-system.sh

# 2. Fix authentication issues if needed
./scripts/fix-auth-unified.sh

# 3. Test authentication
npm run test:login
```

### Verify Setup
```bash
# Test login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tdp.medical@example.com","password":"password123"}'
```

## 🔧 **Configuration Reference**

### Keycloak Configuration
- **Realm**: `contract-management`
- **Client ID**: `contract-management-frontend`
- **Client Type**: Public (no secret)
- **Admin Console**: https://localhost:8443
- **Admin Username**: `admin`
- **Admin Password**: `admin123`

### Backend Configuration
- **URL**: http://localhost:5001
- **Environment File**: `config/system.env` (NEW centralized config)
- **Keycloak Client ID**: `contract-management-frontend`
- **Keycloak Client Secret**: (empty - public client)

### Test Users
All users use password: `password123`

| Email | Role | Status |
|-------|------|--------|
| tdp.medical@example.com | TDP | ✅ Working |
| tdp.nlp@example.com | TDP | ✅ Working |
| tdp.autodrive@example.com | TDP | ✅ Working |
| tdc.healthcare@example.com | TDC | ✅ Working |
| tdc.fintech@example.com | TDC | ✅ Working |
| tdc.language@example.com | TDC | ✅ Working |
| ccrp.securecloud@example.com | CCRP | ✅ Working |
| ccrp.trustedai@example.com | CCRP | ✅ Working |
| ccrp.privacyfirst@example.com | CCRP | ✅ Working |

## 🚫 **Common Mistakes to Avoid**

### ❌ Don't Do This:
```bash
# Don't use outdated scripts
./setup-fresh-system.sh
./setup-linux.sh
./clean-start.sh
./clean-stop.sh
./fix-auth.sh
./fix-keycloak.sh
./fix-database-setup.sh
```

### ✅ Do This Instead:
```bash
# Use current recommended scripts
./start-system.sh                    # Main system startup
./scripts/fix-auth-unified.sh       # Unified authentication fix
./scripts/fix-ssl-inconsistencies.sh # SSL configuration fix
./scripts/config-loader.js           # Centralized configuration
```

## 🔍 **Troubleshooting Checklist**

When login fails, check these in order:

1. **Is Keycloak running?**
   ```bash
   curl -k https://localhost:8443/health
   ```

2. **Is Backend running?**
   ```bash
   curl http://localhost:5001/health
   ```

3. **Does the realm exist?**
   ```bash
   curl -k -X POST https://localhost:8443/realms/master/protocol/openid-connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=password&client_id=admin-cli&username=admin&password=admin123"
   ```

4. **Does the client exist?**
   ```bash
   curl -k -X POST https://localhost:8443/realms/contract-management/protocol/openid-connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=password&client_id=contract-management-frontend&username=tdp.medical@example.com&password=password123"
   ```

5. **Do users exist in Keycloak?**
   - Check Keycloak admin console: https://localhost:8443
   - Look for users in the `contract-management` realm

6. **Are environment variables loaded?**
   ```bash
   # Check if backend is using correct client ID
   grep KEYCLOAK_CLIENT_ID config/system.env
   ```

## 🎯 **Prevention Strategy**

### 1. **Use Current Recommended Scripts**
- Always use `./start-system.sh` for system startup
- Use `./scripts/fix-auth-unified.sh` for authentication issues
- Use `./scripts/config-loader.js` for configuration management

### 2. **Document Configuration Changes**
- When changing Keycloak configuration, update `config/system.env`
- When changing environment variables, update the centralized config
- Document any manual changes

### 3. **Test End-to-End**
- Always test authentication after setup
- Verify all test users can log in
- Check role-based access works

### 4. **Version Control**
- Keep current scripts in version control
- Remove outdated scripts to avoid confusion
- Maintain clear setup instructions

## 📞 **When All Else Fails**

If the current recommended scripts don't work:

1. **Reset Everything**:
   ```bash
   # Stop all services
   pkill -f "node server.js"
   docker-compose -f docker-compose.keycloak-dev.yml down
   
   # Clear database (if needed)
   dropdb contract_management
   createdb contract_management
   
   # Restart services
   docker-compose -f docker-compose.keycloak-dev.yml up -d
   cd backend && npm start &
   
   # Run current setup
   ./start-system.sh
   ```

2. **Check Logs**:
   ```bash
   # Backend logs
   tail -f logs/backend.log
   
   # Keycloak logs
   docker-compose -f docker-compose.keycloak-dev.yml logs keycloak
   ```

3. **Manual Verification**:
   - Test each component individually
   - Verify environment variables are loaded from `config/system.env`
   - Check network connectivity between services

---

**Remember**: Use the current recommended scripts to prevent these recurring issues. The centralized configuration system is designed to be your single source of truth for system setup. 