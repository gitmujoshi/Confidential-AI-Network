# 🚨 Troubleshooting Guide

Complete troubleshooting guide for the Contract Management System. This guide consolidates all troubleshooting and issue resolution information.

## 📋 Table of Contents

1. [Quick Fixes](#quick-fixes)
2. [Authentication Issues](#authentication-issues)
3. [Backend Issues](#backend-issues)
4. [Frontend Issues](#frontend-issues)
5. [Database Issues](#database-issues)
6. [Keycloak Issues](#***REMOVED-KEYCLOAK_DB_PASSWORD***-issues)
7. [Network Issues](#network-issues)
8. [Performance Issues](#performance-issues)
9. [Development Issues](#development-issues)

## ⚡ Quick Fixes

### **One-Command Solutions**

#### **Fix All Authentication Issues**
```bash
./fix-auth.sh
```
This script will:
- Stop existing backend processes
- Run Keycloak auto-fix
- Start backend server
- Test authentication
- Report results

#### **Start Everything Properly**
```bash
./start-system.sh
```
This script will:
- Start Keycloak and PostgreSQL
- Configure authentication
- Start backend and frontend
- Run health checks
- Test authentication

#### **Check System Status**
```bash
npm run status
```
This will check:
- Backend health
- Keycloak status
- Database connection
- Authentication status

### **Common Quick Fixes**

| Issue | Quick Fix | Command |
|-------|-----------|---------|
| Authentication fails | Run auto-fix | `./fix-auth.sh` |
| Backend won't start | Kill and restart | `pkill -f "node server.js" && cd backend && node server.js` |
| Keycloak issues | Reset Keycloak | `npm run reset:***REMOVED-KEYCLOAK_DB_PASSWORD***` |
| Database issues | Restart PostgreSQL | `docker-compose restart ***REMOVED-DB_PASSWORD***` |
| Frontend blank | Clear cache | `Ctrl+F5` or `Cmd+Shift+R` |

## 🔐 Authentication Issues

### **"Invalid client credentials" Error**

#### **Symptoms**
```
Error authenticating user: {
  error: 'invalid_client',
  error_description: 'Invalid client or Invalid client credentials'
}
```

#### **Causes**
- Keycloak client not configured properly
- Client secret mismatch
- Realm not found
- Client not enabled

#### **Solutions**

**Quick Fix:**
```bash
./fix-auth.sh
```

**Manual Fix:**
```bash
# Run Keycloak auto-fix
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js

# Or reset Keycloak completely
npm run reset:***REMOVED-KEYCLOAK_DB_PASSWORD***
```

**Detailed Fix:**
```bash
# Check Keycloak status
curl -s http://localhost:8080/health

# Get admin token
curl -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -d "grant_type=password&client_id=admin-cli&username=admin&password=***REMOVED-KEYCLOAK_ADMIN_PASSWORD***"

# Check client configuration
curl -X GET http://localhost:8080/admin/realms/contract-management/clients \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### **"Realm not found" Error**

#### **Symptoms**
```
Failed to create user ... in Keycloak: { error: 'Realm not found.' }
```

#### **Solutions**
```bash
# Create realm
cd backend && node setup-***REMOVED-KEYCLOAK_DB_PASSWORD***.js

# Or use the persistent setup
./backend/setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.sh
```

### **"User not found" Error**

#### **Symptoms**
```
User not found in Keycloak
```

#### **Solutions**
```bash
# Sync users to Keycloak
node backend/scripts/source/sync-users-to-***REMOVED-KEYCLOAK_DB_PASSWORD***.js

# Or create user manually
curl -X POST http://localhost:8080/admin/realms/contract-management/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "email": "test@example.com",
    "enabled": true,
    "credentials": [{
      "type": "password",
      "value": "password123",
      "temporary": false
    }]
  }'
```

### **"401 Unauthorized" Error**

#### **Symptoms**
```
HTTP 401 Unauthorized
```

#### **Solutions**
```bash
# Check if backend is running
curl -s http://localhost:5001/health

# Check if Keycloak is running
curl -s http://localhost:8080/health

# Test authentication directly
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tdc-test@example.com","password":"password123"}'
```

## 🔧 Backend Issues

### **Backend Won't Start**

#### **Symptoms**
```
Error: Cannot find module 'server.js'
Port 5001 already in use
```

#### **Solutions**

**Check if port is in use:**
```bash
lsof -i :5001
```

**Kill existing process:**
```bash
pkill -f "node server.js"
```

**Start backend properly:**
```bash
cd backend && node server.js
```

**Check for missing dependencies:**
```bash
cd backend && npm install
```

### **Database Connection Issues**

#### **Symptoms**
```
Database connection failed
SequelizeConnectionError
```

#### **Solutions**

**Check PostgreSQL:**
```bash
# Check if PostgreSQL is running
docker ps | grep ***REMOVED-DB_PASSWORD***

# Restart PostgreSQL
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml restart ***REMOVED-DB_PASSWORD***

# Check database connection
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "SELECT 1;"
```

**Reset database:**
```bash
cd backend && npm run db:reset
```

### **Environment Issues**

#### **Symptoms**
```
Configuration not found
Environment variables missing
```

#### **Solutions**

**Check environment files:**
```bash
# Compare .env and config.env
diff backend/.env backend/config.env

# Sync environment files
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

**Update environment:**
```bash
# Copy example files
cp env.example .env
cp backend/config.env.example backend/config.env

# Update with correct values
sed -i '' "s/KEYCLOAK_CLIENT_ID=.*/KEYCLOAK_CLIENT_ID=contract-management-frontend/" backend/.env
sed -i '' "s/KEYCLOAK_CLIENT_ID=.*/KEYCLOAK_CLIENT_ID=contract-management-frontend/" backend/config.env
```

## 🎨 Frontend Issues

### **Blank Page or Missing UI**

#### **Symptoms**
- Blank white page
- Missing navigation menu
- Missing components

#### **Solutions**

**Clear browser cache:**
- Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache and cookies
- Try incognito/private mode

**Check frontend logs:**
```bash
# Check browser console for errors
# Look for JavaScript errors in browser dev tools
```

**Restart frontend:**
```bash
cd frontend && npm start
```

### **"AlertTitle is not defined" Error**

#### **Symptoms**
```
AlertTitle is not defined
```

#### **Solutions**

**Update Material-UI imports:**
```javascript
// Change from
import { AlertTitle } from '@mui/material';

// To
import { Alert, AlertTitle } from '@mui/material';
```

### **Authentication State Issues**

#### **Symptoms**
- "Please log in to view your dashboard"
- Authentication state not persisting
- Login loop

#### **Solutions**

**Clear authentication state:**
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
```

**Check authentication context:**
```javascript
// Verify UserContext is working
console.log('Auth State:', authState);
```

## 🗄️ Database Issues

### **Database Connection Failed**

#### **Symptoms**
```
Database connection failed
Cannot connect to PostgreSQL
```

#### **Solutions**

**Check PostgreSQL container:**
```bash
# Check if container is running
docker ps | grep ***REMOVED-DB_PASSWORD***

# Check container logs
docker logs ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***

# Restart container
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml restart ***REMOVED-DB_PASSWORD***
```

**Check database credentials:**
```bash
# Test connection
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management

# Check environment variables
echo $DB_HOST $DB_PORT $DB_NAME $DB_USER
```

### **Migration Issues**

#### **Symptoms**
```
Migration failed
Table already exists
```

#### **Solutions**

**Reset database:**
```bash
cd backend && npm run db:reset
```

**Run migrations manually:**
```bash
cd backend && npx sequelize-cli db:migrate
```

**Check migration status:**
```bash
cd backend && npx sequelize-cli db:migrate:status
```

### **Data Issues**

#### **Symptoms**
- Missing test data
- User sync issues
- Data corruption

#### **Solutions**

**Recreate test data:**
```bash
cd backend && node scripts/source/create-e2e-users-direct.js
cd backend && node scripts/source/create-tdp-datasets.js
cd backend && node scripts/source/sync-users-to-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

**Check database tables:**
```bash
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "\dt"
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "SELECT * FROM users LIMIT 5;"
```

## 🔑 Keycloak Issues

### **Keycloak Won't Start**

#### **Symptoms**
```
Keycloak container failed to start
Port 8080 already in use
```

#### **Solutions**

**Check port usage:**
```bash
lsof -i :8080
```

**Restart Keycloak:**
```bash
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml restart ***REMOVED-KEYCLOAK_DB_PASSWORD***
```

**Reset Keycloak completely:**
```bash
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml down
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml up -d
```

### **Keycloak Configuration Issues**

#### **Symptoms**
```
Client not found
Realm not found
Invalid configuration
```

#### **Solutions**

**Run setup script:**
```bash
./backend/setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.sh
```

**Check Keycloak health:**
```bash
curl -s http://localhost:8080/health
```

**Access Keycloak admin:**
- Open: http://localhost:8080/admin/
- Login: admin / ***REMOVED-KEYCLOAK_ADMIN_PASSWORD***
- Check realm and client configuration

### **User Sync Issues**

#### **Symptoms**
```
User not synced to Keycloak
Missing users in Keycloak
```

#### **Solutions**

**Sync users manually:**
```bash
cd backend && node scripts/source/sync-users-to-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

**Check user sync status:**
```bash
# Check database users
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "SELECT email, iamUserId FROM users;"

# Check Keycloak users
curl -X GET http://localhost:8080/admin/realms/contract-management/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 🌐 Network Issues

### **CORS Issues**

#### **Symptoms**
```
CORS error
Cross-origin request blocked
```

#### **Solutions**

**Check CORS configuration:**
```javascript
// In backend/server.js
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
```

**Update CORS settings:**
```bash
# Restart backend after CORS changes
pkill -f "node server.js" && cd backend && node server.js
```

### **Port Conflicts**

#### **Symptoms**
```
Port already in use
Cannot bind to port
```

#### **Solutions**

**Check port usage:**
```bash
lsof -i :3000  # Frontend
lsof -i :5001  # Backend
lsof -i :8080  # Keycloak
lsof -i :5432  # PostgreSQL
```

**Kill processes:**
```bash
pkill -f "react-scripts"  # Frontend
pkill -f "node server.js" # Backend
```

**Use different ports:**
```bash
# Frontend
cd frontend && PORT=3001 npm start

# Backend
cd backend && PORT=5002 node server.js
```

## ⚡ Performance Issues

### **Slow Response Times**

#### **Symptoms**
- API requests taking too long
- Frontend loading slowly
- Database queries slow

#### **Solutions**

**Check system resources:**
```bash
# Check memory usage
free -h

# Check CPU usage
top

# Check disk usage
df -h
```

**Optimize database:**
```bash
# Check slow queries
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Add indexes
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);"
```

**Restart services:**
```bash
# Restart all services
./start-system.sh
```

### **Memory Issues**

#### **Symptoms**
- Out of memory errors
- Slow performance
- Service crashes

#### **Solutions**

**Check memory usage:**
```bash
# Check Node.js memory
ps aux | grep node

# Check Docker memory
docker stats
```

**Increase memory limits:**
```bash
# In docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
```

## 🛠️ Development Issues

### **Hot Reload Not Working**

#### **Symptoms**
- Changes not reflected immediately
- Manual restart required

#### **Solutions**

**Check file watchers:**
```bash
# Increase file watchers (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**Restart development servers:**
```bash
# Restart frontend
cd frontend && npm start

# Restart backend
cd backend && npm run dev
```

### **Test Failures**

#### **Symptoms**
- Tests failing randomly
- Inconsistent test results

#### **Solutions**

**Reset test environment:**
```bash
# Reset database
cd backend && npm run db:reset

# Reset Keycloak
npm run reset:***REMOVED-KEYCLOAK_DB_PASSWORD***

# Recreate test data
node scripts/source/create-e2e-users-direct.js
```

**Run tests in isolation:**
```bash
# Run specific test
npm test -- auth.test.js

# Run with verbose output
npm test -- --verbose
```

### **Git Issues**

#### **Symptoms**
- Merge conflicts
- Branch issues
- Push failures

#### **Solutions**

**Reset to clean state:**
```bash
# Stash changes
git stash

# Reset to last commit
git reset --hard HEAD

# Pull latest changes
git pull origin main
```

**Resolve conflicts:**
```bash
# Check status
git status

# Resolve conflicts manually
# Then commit
git add .
git commit -m "Resolve merge conflicts"
```

## 📞 Getting Help

### **Self-Service Resources**
- **This Guide**: Comprehensive troubleshooting
- **API Documentation**: Technical API reference
- **Developer Guide**: Development workflows
- **Setup Guide**: Installation and configuration

### **Debugging Commands**
```bash
# System status
npm run status

# Health checks
curl -s http://localhost:5001/health
curl -s http://localhost:8080/health

# Test authentication
npm run test:login

# View logs
tail -f logs/backend.log
docker logs -f ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms
```

### **Support Channels**
- **Documentation**: Check this guide first
- **GitHub Issues**: Report bugs and issues
- **Developer Community**: Ask questions and share solutions

## 📚 Related Documentation

- **[Quick Start](QUICK_START.md)** - Get started in 5 minutes
- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[User Guide](USER_GUIDE.md)** - How to use the system
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Development workflows
- **[API Reference](API_REFERENCE.md)** - Technical API documentation

---

*This troubleshooting guide consolidates information from multiple troubleshooting documents and common issue solutions.* 