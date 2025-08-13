# Database Team Deployment Guide

## Overview
This directory contains all the necessary files to deploy the Contract Management System database schema from scratch.

## 🚨 **Current Status: OUT OF SYNC**
The database and application models are currently out of synchronization, causing user registration and other features to fail.

---

## 📁 **Files Provided**

### **1. Complete Database Schema**
- **File**: `create-database-from-scratch.sql`
- **Purpose**: Creates all 21 tables with proper columns, indexes, and constraints
- **Size**: ~500+ lines of SQL
- **Tables**: Users, Datasets, Contracts, Notifications, AI Models, Contract Templates, SCITT Claims, System Health Logs, Privacy Budget, CCRP Credentials, Training Environment, Data Breach, Grievance, Audit Log, Consent, and more

### **2. Automated Deployment Script**
- **File**: `deploy-database.sh`
- **Purpose**: Automated deployment with validation and error handling
- **Features**: Connection testing, database creation, schema deployment, verification
- **Usage**: `./deploy-database.sh [db_name] [user] [host] [port]`

### **3. Analysis Documentation**
- **File**: `MODEL_DATABASE_SYNC_ANALYSIS.md`
- **Purpose**: Detailed analysis of current sync status
- **Content**: Table-by-table comparison, missing tables, required fixes

---

## 🚀 **Quick Start (Recommended)**

### **Option 1: Automated Deployment (Easiest)**
```bash
# Navigate to the scripts directory
cd backend/scripts

# Run the deployment script (uses defaults)
./deploy-database.sh

# Or with custom parameters
./deploy-database.sh contract_management ***REMOVED-DB_PASSWORD*** localhost 5432
```

### **Option 2: Manual SQL Execution**
```bash
# Connect to PostgreSQL
psql -h localhost -U ***REMOVED-DB_PASSWORD*** -d ***REMOVED-DB_PASSWORD***

# Create database
CREATE DATABASE contract_management;

# Connect to new database
\c contract_management

# Execute schema file
\i /path/to/create-database-from-scratch.sql
```

---

## 📋 **Prerequisites**

- **PostgreSQL**: Version 12 or higher
- **psql**: PostgreSQL command-line client
- **Permissions**: User must have CREATE DATABASE and CREATE TABLE privileges
- **Disk Space**: Minimum 100MB free space

---

## 🔧 **Configuration Options**

### **Environment Variables**
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=contract_management
export DB_USER=***REMOVED-DB_PASSWORD***
export DB_PASSWORD=your_password
```

### **Connection Parameters**
- **Host**: Database server hostname/IP
- **Port**: PostgreSQL port (default: 5432)
- **Database**: Target database name
- **User**: Database username with sufficient privileges

---

## 📊 **Expected Output**

After successful deployment, you should see:

```
=====================================================
Database deployment completed successfully!
=====================================================
Deployment verification completed:
  Tables created: 21
  Indexes created: 85+
  Expected number of tables reached
=====================================================
```

---

## 🧪 **Verification Steps**

### **1. Check Tables Exist**
```sql
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

### **2. Check Indexes**
```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### **3. Test User Registration**
```bash
# Test the API endpoint
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","partyType":"TDP","organization":"Test Corp"}'
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Permission Denied**
```bash
# Error: permission denied to create database
# Solution: Ensure user has CREATE privileges
GRANT CREATE ON DATABASE ***REMOVED-DB_PASSWORD*** TO your_user;
```

#### **2. Connection Failed**
```bash
# Error: could not connect to server
# Solution: Check PostgreSQL service is running
sudo systemctl status ***REMOVED-DB_PASSWORD***ql
# or
brew services list | grep ***REMOVED-DB_PASSWORD***ql
```

#### **3. Schema Execution Failed**
```bash
# Error: syntax error at or near...
# Solution: Check PostgreSQL version compatibility
psql --version
# Ensure version 12+ for JSONB support
```

#### **4. Table Already Exists**
```bash
# Error: relation "users" already exists
# Solution: Drop existing database and recreate
DROP DATABASE contract_management;
CREATE DATABASE contract_management;
```

---

## 📈 **Performance Considerations**

### **Indexes Created**
- **Primary Keys**: All tables have auto-incrementing primary keys
- **Foreign Keys**: Properly indexed for join performance
- **Search Fields**: Email, username, status fields indexed
- **JSON Fields**: GIN indexes on JSONB columns for fast queries

### **Constraints**
- **Data Integrity**: CHECK constraints on enum fields
- **Referential Integrity**: Foreign key constraints with CASCADE/SET NULL
- **Uniqueness**: Unique constraints on business identifiers

---

## 🔄 **Maintenance**

### **Regular Tasks**
1. **Monitor Table Sizes**: Check for growth patterns
2. **Index Maintenance**: REINDEX periodically for performance
3. **Vacuum**: Run VACUUM ANALYZE for statistics
4. **Backup**: Regular database backups

### **Monitoring Queries**
```sql
-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## 📞 **Support**

### **Before Contacting Development Team**
1. ✅ Check this README for solutions
2. ✅ Verify PostgreSQL version and permissions
3. ✅ Check database connection and credentials
4. ✅ Review error logs and messages

### **Information to Provide**
- PostgreSQL version: `psql --version`
- Error message: Exact error text
- Environment: OS, PostgreSQL installation method
- Steps taken: What you've already tried

---

## 📚 **Additional Resources**

- **PostgreSQL Documentation**: https://www.***REMOVED-DB_PASSWORD***ql.org/docs/
- **Sequelize Documentation**: https://sequelize.org/
- **Model Definitions**: `../models/` directory
- **Application Configuration**: `../config/` directory

---

## 🎯 **Success Criteria**

Deployment is successful when:
- ✅ All 21 tables are created
- ✅ All indexes are properly created
- ✅ User registration API works without errors
- ✅ All model associations can be established
- ✅ No database connection errors in application logs

---

*Last Updated: 2025-01-08*
*Version: 1.0.0*
*Contact: Contract Management System Development Team*
