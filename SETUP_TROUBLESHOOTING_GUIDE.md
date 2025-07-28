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

## 🛠️ **The Solution: Comprehensive Setup Script**

Instead of running multiple scripts, use **ONE script** that handles everything:

```bash
# Run the comprehensive setup
node scripts/setup-complete-system.js
```

This script:
- ✅ Checks all prerequisites
- ✅ Sets up Keycloak realm and client correctly
- ✅ Creates users in both database AND Keycloak
- ✅ Tests authentication end-to-end
- ✅ Provides clear summary and next steps

## 📋 **Step-by-Step Setup Process**

### Prerequisites
1. **Start Keycloak**: `docker-compose up ***REMOVED-KEYCLOAK_DB_PASSWORD***`
2. **Start Backend**: `cd backend && npm start`
3. **Ensure Database**: PostgreSQL running with `contract_management` database

### Run Setup
```bash
cd backend
node scripts/setup-complete-system.js
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
- **Client ID**: `contract-management-client`
- **Client Type**: Public (no secret)
- **Admin Console**: http://localhost:8080
- **Admin Username**: `admin`
- **Admin Password**: `***REMOVED-KEYCLOAK_ADMIN_PASSWORD***`

### Backend Configuration
- **URL**: http://localhost:5001
- **Environment File**: `backend/config.env`
- **Keycloak Client ID**: `contract-management-client`
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
# Don't run multiple setup scripts separately
node scripts/source/setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-realm.js
node scripts/source/create-***REMOVED-KEYCLOAK_DB_PASSWORD***-users.js
node scripts/source/sync-users-to-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

### ✅ Do This Instead:
```bash
# Run the comprehensive setup script
node scripts/setup-complete-system.js
```

## 🔍 **Troubleshooting Checklist**

When login fails, check these in order:

1. **Is Keycloak running?**
   ```bash
   curl http://localhost:8080/health
   ```

2. **Is Backend running?**
   ```bash
   curl http://localhost:5001/health
   ```

3. **Does the realm exist?**
   ```bash
   curl -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=password&client_id=admin-cli&username=admin&password=***REMOVED-KEYCLOAK_ADMIN_PASSWORD***"
   ```

4. **Does the client exist?**
   ```bash
   curl -X POST http://localhost:8080/realms/contract-management/protocol/openid-connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=password&client_id=contract-management-client&username=tdp.medical@example.com&password=password123"
   ```

5. **Do users exist in Keycloak?**
   - Check Keycloak admin console: http://localhost:8080
   - Look for users in the `contract-management` realm

6. **Are environment variables loaded?**
   ```bash
   # Check if backend is using correct client ID
   grep KEYCLOAK_CLIENT_ID backend/config.env
   ```

## 🎯 **Prevention Strategy**

### 1. **Use the Comprehensive Setup Script**
- Always use `setup-complete-system.js` for initial setup
- This ensures consistency across all components

### 2. **Document Configuration Changes**
- When changing Keycloak configuration, update the setup script
- When changing environment variables, update config.env
- Document any manual changes

### 3. **Test End-to-End**
- Always test authentication after setup
- Verify all test users can log in
- Check role-based access works

### 4. **Version Control**
- Keep setup scripts in version control
- Document any environment-specific configurations
- Maintain clear setup instructions

## 📞 **When All Else Fails**

If the comprehensive setup script doesn't work:

1. **Reset Everything**:
   ```bash
   # Stop all services
   pkill -f "node server.js"
   docker-compose down
   
   # Clear database (if needed)
   dropdb contract_management
   createdb contract_management
   
   # Restart services
   docker-compose up ***REMOVED-KEYCLOAK_DB_PASSWORD*** -d
   cd backend && npm start &
   
   # Run comprehensive setup
   node scripts/setup-complete-system.js
   ```

2. **Check Logs**:
   ```bash
   # Backend logs
   tail -f logs/backend.log
   
   # Keycloak logs
   docker-compose logs ***REMOVED-KEYCLOAK_DB_PASSWORD***
   ```

3. **Manual Verification**:
   - Test each component individually
   - Verify environment variables are loaded
   - Check network connectivity between services

---

**Remember**: The comprehensive setup script is designed to prevent these recurring issues. Use it as your single source of truth for system setup. 