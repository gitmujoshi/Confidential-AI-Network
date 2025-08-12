# 🚨 Troubleshooting Guide

Complete troubleshooting guide for the Contract Management System. This guide consolidates all troubleshooting and issue resolution information.

## 📋 Table of Contents

1. [Quick Fixes](#quick-fixes)
2. [Authentication Issues](#authentication-issues)
3. [SCITT CCF Integration Issues](#scitt-ccf-integration-issues)
4. [Backend Issues](#backend-issues)
5. [Frontend Issues](#frontend-issues)
6. [Database Issues](#database-issues)
7. [Keycloak Issues](#***REMOVED-KEYCLOAK_DB_PASSWORD***-issues)
8. [Differential Privacy Issues](#differential-privacy-issues)
9. [Network Issues](#network-issues)
10. [Performance Issues](#performance-issues)
11. [Development Issues](#development-issues)

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
- Test SCITT CCF integration (if enabled)
- Report results

#### **Start Everything Properly**
```bash
./start-system.sh
```
This script will:
- Start Keycloak and PostgreSQL
- Start SCITT CCF services (if configured)
- Configure authentication
- Start backend and frontend
- Run health checks
- Test authentication
- Test SCITT CCF integration (if enabled)

#### **Check System Status**
```bash
npm run status
```
This will check:
- Backend health
- Keycloak status
- Database connection
- Authentication status
- SCITT CCF integration status (if enabled)

#### **Check SCITT CCF Status**
```bash
./manage-scitt-ccf.sh status
```
This will check:
- SCITT CCF service status
- Docker container status
- Service health
- Backend integration status

### **Common Quick Fixes**

| Issue | Quick Fix | Command |
|-------|-----------|---------|
| Authentication fails | Run auto-fix | `./fix-auth.sh` |
| Backend won't start | Kill and restart | `pkill -f "node server.js" && cd backend && node server.js` |
| Keycloak issues | Reset Keycloak | `npm run reset:***REMOVED-KEYCLOAK_DB_PASSWORD***` |
| SCITT CCF issues | Check status | `./manage-scitt-ccf.sh status` |
| SCITT CCF won't start | Restart services | `./manage-scitt-ccf.sh restart` |
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

# Check Keycloak logs
docker logs ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms

# Test Keycloak authentication directly
curl -X POST http://localhost:8080/realms/contract-management/protocol/openid-connect/token \
  -d "grant_type=password&client_id=contract-management-frontend&username=tdc-test@example.com&password=password123"
```

## 🔗 SCITT CCF Integration Issues

### **SCITT CCF Services Won't Start**

#### **Symptoms**
```
❌ SCITT CCF services failed to start, continuing with blockchain mode
```

#### **Causes**
- Docker Compose file not found
- Port conflicts
- Insufficient system resources
- Configuration errors

#### **Solutions**

**Quick Fix:**
```bash
# Check SCITT CCF status
./manage-scitt-ccf.sh status

# Restart SCITT CCF services
./manage-scitt-ccf.sh restart
```

**Manual Fix:**
```bash
# Check if Docker Compose file exists
ls -la docker-compose.scitt-ccf-dev.yml

# Check for port conflicts
lsof -i :8000
lsof -i :8001

# Start services manually
docker-compose -f docker-compose.scitt-ccf-dev.yml up -d

# Check container status
docker-compose -f docker-compose.scitt-ccf-dev.yml ps
```

**Configuration Fix:**
```bash
# Check configuration
cat .env.scitt-ccf

# Recreate configuration if needed
./manage-scitt-ccf.sh setup

# Verify Docker services
docker-compose -f docker-compose.scitt-ccf-dev.yml config
```

### **SCITT CCF Health Check Fails**

#### **Symptoms**
```
⚠️  SCITT CCF integration health check failed
```

#### **Causes**
- SCITT CCF node not responding
- Network connectivity issues
- Authentication problems
- Service configuration errors

#### **Solutions**

**Quick Fix:**
```bash
# Check SCITT CCF health
./manage-scitt-ccf.sh status

# Test SCITT CCF integration
./manage-scitt-ccf.sh test
```

**Manual Fix:**
```bash
# Check SCITT CCF node health
curl -s http://localhost:8000/app/health

# Check SCITT CCF governance
curl -s http://localhost:8001

# Check Docker container logs
docker-compose -f docker-compose.scitt-ccf-dev.yml logs scitt-ccf-node

# Check backend integration
curl -s http://localhost:5001/api/system/health | jq '.scittCcf'
```

**Network Fix:**
```bash
# Check network connectivity
ping localhost

# Check firewall settings
sudo ufw status

# Check Docker network
docker network ls
docker network inspect cms-network
```

### **Migration Mode Issues**

#### **Symptoms**
```
❌ Failed to switch migration mode
❌ Migration mode not supported
```

#### **Causes**
- Invalid migration mode
- Backend service not running
- Configuration errors
- Service initialization issues

#### **Solutions**

**Quick Fix:**
```bash
# Check current migration mode
./manage-scitt-ccf.sh status

# Switch to supported mode
./manage-scitt-ccf.sh switch HYBRID
./manage-scitt-ccf.sh switch ETHEREUM_ONLY
./manage-scitt-ccf.sh switch SCITT_CCF_ONLY
```

**Manual Fix:**
```bash
# Check backend status
curl -s http://localhost:5001/health

# Check migration mode via API
curl -s http://localhost:5001/api/system/health | jq '.migrationMode'

# Test migration mode switching
cd backend
node -e "
  const ContractRouterService = require('./services/contractRouterService');
  const router = new ContractRouterService();
  
  router.initialize()
    .then(() => router.switchMigrationMode('HYBRID'))
    .then(result => console.log('Success:', result))
    .catch(error => console.error('Error:', error));
"
cd ..
```

**Configuration Fix:**
```bash
# Check environment configuration
cat .env.scitt-ccf | grep MIGRATION_MODE

# Update configuration
sed -i 's/MIGRATION_MODE=.*/MIGRATION_MODE=HYBRID/' .env.scitt-ccf

# Restart backend
pkill -f "node server.js"
cd backend && node server.js &
cd ..
```

### **Performance Issues with SCITT CCF**

#### **Symptoms**
```
⚠️  SCITT CCF performance degraded
❌ SCITT CCF response time too high
```

#### **Causes**
- High system load
- Insufficient resources
- Network latency
- Configuration suboptimal

#### **Solutions**

**Quick Fix:**
```bash
# Check system resources
./manage-scitt-ccf.sh status

# Restart SCITT CCF services
./manage-scitt-ccf.sh restart
```

**Performance Optimization:**
```bash
# Check system resources
htop
free -h
df -h

# Check Docker resource usage
docker stats

# Optimize SCITT CCF configuration
cat .env.scitt-ccf | grep -E "(HEALTH_CHECK|CACHE|TIMEOUT)"
```

**Configuration Optimization:**
```bash
# Edit SCITT CCF configuration
nano .env.scitt-ccf

# Optimize these settings:
HEALTH_CHECK_INTERVAL=60000      # 1 minute
HEALTH_CHECK_TIMEOUT=10000      # 10 seconds
CACHE_ENABLED=true
CACHE_TTL=600000                # 10 minutes
CACHE_MAX_SIZE=2000

# Restart services
./manage-scitt-ccf.sh restart
```

### **Database Migration Issues**

#### **Symptoms**
```
❌ SCITT CCF tables migration failed
❌ Database schema not updated
```

#### **Causes**
- Migration script errors
- Database connection issues
- Permission problems
- Schema conflicts

#### **Solutions**

**Quick Fix:**
```bash
# Check migration status
cd backend
npm run migrate:status
cd ..

# Run migration manually
cd backend
npm run migrate:scitt-ccf
cd ..
```

**Manual Fix:**
```bash
# Check database connection
cd backend
node -e "
  require('./models').sequelize.authenticate()
    .then(() => console.log('Database connection OK'))
    .catch(console.error);
"
cd ..

# Check existing tables
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "\dt"

# Run migration manually
cd backend
node migrations/20250108-add-scitt-ccf-tables.js
cd ..
```

**Schema Fix:**
```bash
# Check table structure
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
  SELECT table_name, column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name IN ('scitt_claims', 'system_health_log')
  ORDER BY table_name, ordinal_position;
"

# Check contract table enhancements
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d contract_management -c "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns 
  WHERE table_name = 'contracts' 
  AND column_name LIKE 'scitt_%'
  ORDER BY ordinal_position;
"
```

### **Integration Testing Issues**

#### **Symptoms**
```
❌ SCITT CCF integration test failed
❌ Test script not found
```

#### **Causes**
- Test script missing
- Dependencies not installed
- Service not running
- Configuration errors

#### **Solutions**

**Quick Fix:**
```bash
# Run integration test
./manage-scitt-ccf.sh test

# Check test script
ls -la backend/scripts/test-scitt-ccf-integration.js
```

**Manual Fix:**
```bash
# Check if test script exists
cd backend
ls -la scripts/test-scitt-ccf-integration.js

# Run test manually
node scripts/test-scitt-ccf-integration.js

# Check dependencies
npm list
cd ..
```

**Test Environment Fix:**
```bash
# Ensure services are running
./manage-scitt-ccf.sh status

# Check backend health
curl -s http://localhost:5001/health

# Run test with verbose output
cd backend
DEBUG=* node scripts/test-scitt-ccf-integration.js
cd ..
```

### **Common SCITT CCF Error Messages**

#### **"SCITT CCF service not found"**
```bash
# Check service configuration
cat .env.scitt-ccf

# Verify Docker services
docker-compose -f docker-compose.scitt-ccf-dev.yml ps

# Recreate services
./manage-scitt-ccf.sh setup
./manage-scitt-ccf.sh start
```

#### **"SCITT CCF health check failed"**
```bash
# Check service health
./manage-scitt-ccf.sh status

# Check logs
./manage-scitt-ccf.sh logs

# Restart services
./manage-scitt-ccf.sh restart
```

#### **"Migration mode not supported"**
```bash
# Check supported modes
./manage-scitt-ccf.sh switch HYBRID
./manage-scitt-ccf.sh switch ETHEREUM_ONLY
./manage-scitt-ccf.sh switch SCITT_CCF_ONLY

# Check configuration
cat .env.scitt-ccf | grep MIGRATION_MODE
```

#### **"SCITT CCF integration unhealthy"**
```bash
# Check integration status
curl -s http://localhost:5001/api/system/health | jq '.scittCcf'

# Test integration
./manage-scitt-ccf.sh test

# Check backend logs
tail -f logs/backend.log
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

## 🔐 Differential Privacy Issues

### **Quick DP Fixes**

#### **Test DP System Status**
```bash
# Check if DP endpoints are responding
curl -s http://localhost:5001/api/dp/mechanisms

# Test DP functionality
curl -s -X POST http://localhost:5001/api/dp/test \
  -H "Content-Type: application/json" \
  -d '{"data":[1,2,3],"query":{"type":"COUNT"},"privacyParams":{"epsilon":1.0,"mechanism":"geometric"}}'
```

#### **Fix DP Database Issues**
```bash
# Check if DP tables exist
psql -h localhost -U mukeshjoshi -d contract_management -c "\dt" | grep -i privacy

# Run DP migration if tables are missing
cd backend && node run-privacy-migration.js
```

### **Common DP Problems and Solutions**

#### **1. "Differential Privacy Service Not Found" Error**

**Symptoms:**
```
Error: Cannot find module '../services/differentialPrivacyService'
```

**Causes:**
- DP service files not created
- Import paths incorrect
- File permissions issues

**Solutions:**

**Quick Fix:**
```bash
# Check if DP service exists
ls -la backend/services/ | grep -i privacy

# If missing, recreate the service
cd backend && node scripts/create-dp-service.js
```

**Manual Fix:**
```bash
# Verify file structure
find backend/ -name "*privacy*" -type f

# Check import statements in routes
grep -n "differentialPrivacyService" backend/routes/differential-privacy.js
```

#### **2. "Privacy Budget Tables Do Not Exist" Error**

**Symptoms:**
```
Error: relation "PrivacyBudgets" does not exist
```

**Causes:**
- Database migration not run
- Tables created with wrong names
- Database connection issues

**Solutions:**

**Quick Fix:**
```bash
# Run privacy budget migration
cd backend && node run-privacy-migration.js
```

**Manual Fix:**
```bash
# Check database tables
psql -h localhost -U mukeshjoshi -d contract_management -c "\dt" | grep -i privacy

# Check migration files
ls -la backend/migrations/ | grep -i privacy

# Run migration manually
psql -h localhost -U mukeshjoshi -d contract_management -f backend/migrations/add-privacy-budget-tables.js
```

#### **3. "Insufficient Privacy Budget" Error**

**Symptoms:**
```json
{
  "success": false,
  "error": "Insufficient privacy budget",
  "details": {
    "requiredEpsilon": 0.2,
    "availableEpsilon": 0.1
  }
}
```

**Causes:**
- Budget fully consumed
- Budget not initialized for contract
- Budget reset needed

**Solutions:**

**Quick Fix:**
```bash
# Check budget status
curl -s http://localhost:5001/api/dp/budget/contract-123

# Reset budget (if you have permission)
curl -s -X POST http://localhost:5001/api/dp/budget/contract-123/reset
```

**Manual Fix:**
```bash
# Check budget in database
psql -h localhost -U mukeshjoshi -d contract_management -c "SELECT * FROM \"PrivacyBudgets\" WHERE \"contractId\" = 'contract-123';"

# Reset budget manually
psql -h localhost -U mukeshjoshi -d contract_management -c "UPDATE \"PrivacyBudgets\" SET \"remainingEpsilon\" = \"initialEpsilon\", \"remainingDelta\" = \"initialDelta\", \"budgetStatus\" = 'ACTIVE' WHERE \"contractId\" = 'contract-123';"
```

#### **4. "Invalid Privacy Parameters" Error**

**Symptoms:**
```json
{
  "success": false,
  "error": "Invalid privacy parameters",
  "details": {
    "epsilon": "Must be between 0.1 and 10.0"
  }
}
```

**Causes:**
- Epsilon/delta values out of range
- Missing required parameters
- Invalid mechanism selection

**Solutions:**

**Quick Fix:**
```bash
# Use valid parameters
curl -s -X POST http://localhost:5001/api/dp/test \
  -H "Content-Type: application/json" \
  -d '{"data":[1,2,3],"query":{"type":"COUNT"},"privacyParams":{"epsilon":1.0,"delta":1e-5,"mechanism":"laplace"}}'
```

**Parameter Ranges:**
- **Epsilon (ε)**: 0.1 to 10.0
- **Delta (δ)**: 1e-6 to 1e-3
- **Valid Mechanisms**: laplace, gaussian, exponential, geometric

#### **5. "Mechanism Not Supported for Query Type" Error**

**Symptoms:**
```json
{
  "success": false,
  "error": "Mechanism 'laplace' not supported for query type 'COUNT'"
}
```

**Causes:**
- Mechanism-query type mismatch
- Query type not implemented
- Configuration errors

**Solutions:**

**Quick Fix:**
```bash
# Check supported mechanisms for query type
curl -s http://localhost:5001/api/dp/query-types

# Use appropriate mechanism
curl -s -X POST http://localhost:5001/api/dp/test \
  -H "Content-Type: application/json" \
  -d '{"data":[1,2,3],"query":{"type":"COUNT"},"privacyParams":{"epsilon":1.0,"mechanism":"geometric"}}'
```

**Mechanism-Query Type Mapping:**
- **COUNT**: geometric
- **SUM**: laplace
- **AVERAGE**: gaussian
- **GRADIENT**: laplace
- **HISTOGRAM**: laplace
- **PERCENTILE**: laplace

#### **6. "Sensitivity Calculation Failed" Error**

**Symptoms:**
```json
{
  "success": false,
  "error": "Failed to calculate sensitivity for query type 'CUSTOM'"
}
```

**Causes:**
- Unsupported query type
- Data format issues
- Sensitivity analyzer errors

**Solutions:**

**Quick Fix:**
```bash
# Use supported query types
curl -s http://localhost:5001/api/dp/query-types

# Test with simple data
curl -s -X POST http://localhost:5001/api/dp/test \
  -H "Content-Type: application/json" \
  -d '{"data":[1,2,3],"query":{"type":"COUNT"},"privacyParams":{"epsilon":1.0,"mechanism":"geometric"}}'
```

**Supported Query Types:**
- COUNT, SUM, AVERAGE, GRADIENT, HISTOGRAM, PERCENTILE

#### **7. "DP Service Initialization Failed" Error**

**Symptoms:**
```
Error initializing differential privacy service: Cannot find module './mechanisms/laplaceMechanism'
```

**Causes:**
- Missing mechanism files
- Import path issues
- File corruption

**Solutions:**

**Quick Fix:**
```bash
# Check mechanism files
ls -la backend/services/mechanisms/

# Recreate missing mechanisms
cd backend && node scripts/create-dp-mechanisms.js
```

**Manual Fix:**
```bash
# Verify file structure
find backend/services/ -name "*mechanism*" -type f

# Check import statements
grep -n "require.*mechanism" backend/services/differentialPrivacyService.js
```

### **DP Performance Issues**

#### **1. Slow DP Operations**

**Symptoms:**
- Operations taking > 5 seconds
- Timeout errors
- High CPU usage

**Causes:**
- Large datasets
- Complex sensitivity calculations
- Database bottlenecks
- Memory issues

**Solutions:**

**Quick Fix:**
```bash
# Test with smaller data
curl -s -X POST http://localhost:5001/api/dp/test \
  -H "Content-Type: application/json" \
  -d '{"data":[1,2,3],"query":{"type":"COUNT"},"privacyParams":{"epsilon":1.0,"mechanism":"geometric"}}'
```

**Optimization:**
```bash
# Check system resources
top -p $(pgrep -f "node server.js")

# Monitor database performance
psql -h localhost -U mukeshjoshi -d contract_management -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

#### **2. High Memory Usage**

**Symptoms:**
- Out of memory errors
- Slow response times
- System instability

**Causes:**
- Large data arrays in memory
- Memory leaks in DP operations
- Insufficient system memory

**Solutions:**

**Quick Fix:**
```bash
# Restart backend to clear memory
pkill -f "node server.js" && cd backend && node server.js &
```

**Optimization:**
```bash
# Check memory usage
ps aux | grep "node server.js"

# Monitor memory in real-time
watch -n 1 'ps aux | grep "node server.js" | grep -v grep'
```

### **DP Integration Issues**

#### **1. "DP Not Available in Training Service" Error**

**Symptoms:**
```
Error: Differential privacy not available for training
```

**Causes:**
- DP service not integrated
- Training service configuration issues
- Missing DP parameters

**Solutions:**

**Quick Fix:**
```bash
# Check if DP is enabled in training
curl -s http://localhost:5001/api/training/config

# Test DP training endpoint
curl -s -X POST http://localhost:5001/api/training/dp \
  -H "Content-Type: application/json" \
  -d '{"data":[1,2,3],"privacyParams":{"epsilon":1.0,"delta":1e-5}}'
```

#### **2. "Contract Service DP Integration Failed" Error**

**Symptoms:**
```
Error: Failed to apply DP to contract data
```

**Causes:**
- Contract service not updated
- DP service dependency issues
- Configuration mismatches

**Solutions:**

**Quick Fix:**
```bash
# Check contract service health
curl -s http://localhost:5001/api/contracts/health

# Test contract DP endpoint
curl -s -X POST http://localhost:5001/api/contracts/apply-dp \
  -H "Content-Type: application/json" \
  -d '{"contractId":"contract-123","data":[1,2,3],"privacyParams":{"epsilon":1.0}}'
```

### **DP Debugging Commands**

#### **System Health Checks**
```bash
# Check DP service status
curl -s http://localhost:5001/api/dp/mechanisms

# Check DP database tables
psql -h localhost -U mukeshjoshi -d contract_management -c "\dt" | grep -i privacy

# Check DP service logs
tail -f logs/backend.log | grep -i "differential\|privacy\|dp"
```

#### **Database Diagnostics**
```bash
# Check privacy budget status
psql -h localhost -U mukeshjoshi -d contract_management -c "SELECT * FROM \"PrivacyBudgets\" LIMIT 5;"

# Check privacy operation logs
psql -h localhost -U mukeshjoshi -d contract_management -c "SELECT * FROM \"PrivacyOperationsLogs\" ORDER BY timestamp DESC LIMIT 5;"

# Check privacy budget logs
psql -h localhost -U mukeshjoshi -d contract_management -c "SELECT * FROM \"PrivacyBudgetLogs\" ORDER BY timestamp DESC LIMIT 5;"
```

#### **Performance Monitoring**
```bash
# Monitor DP endpoint response times
time curl -s http://localhost:5001/api/dp/mechanisms

# Test DP operation performance
time curl -s -X POST http://localhost:5001/api/dp/test \
  -H "Content-Type: application/json" \
  -d '{"data":[1,2,3],"query":{"type":"COUNT"},"privacyParams":{"epsilon":1.0,"mechanism":"geometric"}}'
```

### **DP Recovery Procedures**

#### **Complete DP System Reset**
```bash
# Stop all services
pkill -f "node server.js"
docker-compose down

# Clear DP database tables
psql -h localhost -U mukeshjoshi -d contract_management -c "DROP TABLE IF EXISTS \"PrivacyOperationsLogs\";"
psql -h localhost -U mukeshjoshi -d contract_management -c "DROP TABLE IF EXISTS \"PrivacyBudgetLogs\";"
psql -h localhost -U mukeshjoshi -d contract_management -c "DROP TABLE IF EXISTS \"PrivacyBudgets\";"

# Recreate DP tables
cd backend && node run-privacy-migration.js

# Restart services
cd .. && ./start-system.sh
```

#### **DP Service Recovery**
```bash
# Check DP service files
find backend/ -name "*privacy*" -type f

# Recreate missing services
cd backend && node scripts/create-dp-services.js

# Test DP functionality
curl -s http://localhost:5001/api/dp/mechanisms
```

### **DP Best Practices for Troubleshooting**

#### **1. Start Simple**
- Test with basic queries first
- Use default parameters initially
- Verify each component individually

#### **2. Check Dependencies**
- Verify database connectivity
- Check service file existence
- Validate configuration files

#### **3. Monitor Resources**
- Watch memory usage
- Monitor CPU utilization
- Check disk space

#### **4. Use Logging**
- Enable debug logging
- Monitor error logs
- Track operation history

#### **5. Test Incrementally**
- Test endpoints individually
- Verify data flow step by step
- Check intermediate results 