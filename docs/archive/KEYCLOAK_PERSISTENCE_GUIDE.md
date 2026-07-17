# Keycloak Persistence Issue & Solution

## 🔍 **Why This Keeps Happening**

The Keycloak configuration gets "messed up" because of several issues:

### **1. Multiple Environment Files**
- Backend loads from `config.env` 
- We often edit `.env`
- Changes don't sync between files

### **2. Keycloak Container State**
- Keycloak container gets reset/recreated
- Realm and client configurations are lost
- No persistent volume for configuration

### **3. Manual Setup Process**
- Each restart requires manual realm creation
- Client configuration must be recreated
- User sync must be run again

### **4. Configuration Drift**
- Different scripts use different client IDs
- Environment variables get out of sync
- No single source of truth

## 🛠️ **Permanent Solution**

### **1. Persistent Keycloak Setup**

Use the new persistent setup script:

```bash
# Run the comprehensive setup
./start-system.sh
```

This script:
- ✅ Starts Keycloak with persistent volumes
- ✅ Creates realm and clients automatically
- ✅ Syncs all environment files
- ✅ Tests authentication
- ✅ Provides status report

### **2. Environment File Management**

Both `config.env` and `.env` are now kept in sync:

```bash
# Keycloak Configuration (both files)
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-frontend
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ADMIN_USER=admin
KEYCLOAK_ADMIN_PASSWORD=admin123
KEYCLOAK_ENABLED=true
```

### **3. Docker Compose with Persistence**

The new `docker-compose.keycloak-persistent.yml`:
- Uses persistent volumes for Keycloak data
- Maintains configuration across restarts
- Includes PostgreSQL for Keycloak database

### **4. Automated Setup Script**

The `setup-keycloak-persistent.sh` script:
- Checks if realm exists before creating
- Checks if clients exist before creating
- Updates both environment files
- Syncs users automatically

## 🔄 **Workflow for Changes**

### **When Making Non-Authentication Changes:**

1. **Start the system properly:**
   ```bash
   ./start-system.sh
   ```

2. **Make your changes** (frontend, backend logic, etc.)

3. **Restart only what you changed:**
   ```bash
   # If you changed backend
   cd backend && pkill -f "node server.js" && node server.js &
   
   # If you changed frontend
   cd frontend && npm start
   ```

### **When Making Authentication Changes:**

1. **Update the setup script** if needed
2. **Run the persistent setup:**
   ```bash
   ./start-system.sh
   ```

## 🚨 **Common Issues & Solutions**

### **Issue: "Invalid client credentials"**
**Solution:** Run the persistent setup script
```bash
./start-system.sh
```

### **Issue: "Realm not found"**
**Solution:** Keycloak container was reset, run setup
```bash
cd backend && ./setup-keycloak-persistent.sh
```

### **Issue: Environment variables not loaded**
**Solution:** Check both environment files are in sync
```bash
diff backend/.env backend/config.env
```

### **Issue: Users not synced**
**Solution:** Run user sync
```bash
cd backend && node scripts/source/sync-users-to-keycloak.js
```

## 📋 **Quick Commands**

### **Start Everything:**
```bash
./start-system.sh
```

### **Just Keycloak Setup:**
```bash
cd backend && ./setup-keycloak-persistent.sh
```

### **Test Authentication:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tdc-test@example.com","password":"password123"}'
```

### **Check Service Status:**
```bash
# Keycloak
curl -s http://localhost:8080/health

# Backend
curl -s http://localhost:5001/health

# Frontend
curl -s http://localhost:3000
```

## 🎯 **Best Practices**

1. **Always use the startup script** for initial setup
2. **Don't manually edit Keycloak** - use the setup script
3. **Keep environment files in sync** - both `.env` and `config.env`
4. **Test authentication** after any changes
5. **Use persistent volumes** for Keycloak data

## 🔧 **Configuration Files**

### **Keycloak Configuration:**
- Realm: `contract-management`
- Frontend Client: `contract-management-frontend` (public)
- Backend Client: `contract-management-backend` (confidential)
- Roles: TDP, TDC, CCRP, ADMIN

### **Environment Variables:**
- `KEYCLOAK_URL`: http://localhost:8080
- `KEYCLOAK_REALM`: contract-management
- `KEYCLOAK_CLIENT_ID`: contract-management-frontend
- `KEYCLOAK_CLIENT_SECRET`: (empty for public client)

## ✅ **Verification Checklist**

After running the setup, verify:

- [ ] Keycloak is running on port 8080
- [ ] Backend is running on port 5001
- [ ] Frontend is running on port 3000
- [ ] Authentication works with test users
- [ ] Environment files are in sync
- [ ] Keycloak realm and clients exist
- [ ] Users are synced to Keycloak

## 🚀 **Quick Recovery**

If something breaks:

1. **Stop all services:**
   ```bash
   pkill -f "node server.js"
   docker-compose -f docker-compose.keycloak-persistent.yml down
   ```

2. **Start fresh:**
   ```bash
   ./start-system.sh
   ```

This ensures everything is properly configured and working. 