# 🗄️ Database Stability Guide

## 🎯 Purpose
This guide ensures database stability and prevents data loss during system updates and configuration changes.

## 🔒 **LOCKED DATABASE CONFIGURATION**

### **Current Stable Configuration:**
```bash
# Container Details
CONTAINER_NAME=postgres-cms
VOLUME_NAME=postgres_data
PORT_MAPPING=5433:5432
NETWORK=cms-network

# Database Details
DB_HOST=localhost
DB_PORT=5433
DB_NAME=contract_management
DB_USER=keycloak
DB_PASSWORD=keycloak
DB_SSL=false
```

### **⚠️ CRITICAL RULES:**

1. **NEVER change container name** without explicit migration
2. **NEVER change volume name** without data migration
3. **NEVER change port mapping** without updating all references
4. **NEVER change database credentials** without updating all services
5. **ALWAYS backup data** before any database changes

## 🚫 **What NOT to Change:**

### **Container Configuration:**
```yaml
# DO NOT CHANGE THESE VALUES:
postgres:
  container_name: postgres-cms  # ❌ DO NOT CHANGE
  ports:
    - "5433:5432"              # ❌ DO NOT CHANGE
  volumes:
    - postgres_data:/var/lib/postgresql/data  # ❌ DO NOT CHANGE
```

### **Database Settings:**
```bash
# DO NOT CHANGE THESE VALUES:
DB_HOST=localhost              # ❌ DO NOT CHANGE
DB_PORT=5433                   # ❌ DO NOT CHANGE
DB_NAME=contract_management    # ❌ DO NOT CHANGE
DB_USER=keycloak              # ❌ DO NOT CHANGE
DB_PASSWORD=keycloak          # ❌ DO NOT CHANGE
```

## ✅ **Safe Changes:**

### **Allowed Changes:**
- Adding new databases to the same PostgreSQL instance
- Adding new tables to existing databases
- Updating application code that uses the database
- Adding new environment variables
- Updating non-database services

### **Requires Migration:**
- Changing container name
- Changing volume name
- Changing port mapping
- Changing database credentials
- Changing database name

## 🔄 **Migration Process:**

### **Step 1: Backup Current Data**
```bash
# Backup current database
docker exec postgres-cms pg_dump -U keycloak contract_management > backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Step 2: Update Configuration**
```bash
# Update config/system.env with new settings
# Update docker-compose files
# Update all scripts that reference the database
```

### **Step 3: Test Migration**
```bash
# Test with new configuration
./deployment/local/start-services.sh
./deployment/local/status.sh
```

### **Step 4: Restore Data**
```bash
# Restore data to new database
docker exec postgres-cms psql -U keycloak -d contract_management < backup_*.sql
```

## 📋 **Prevention Checklist:**

### **Before Any Database Changes:**
- [ ] Document current configuration
- [ ] Create full database backup
- [ ] Test changes in development environment
- [ ] Update all configuration files
- [ ] Update all scripts and services
- [ ] Verify data migration works
- [ ] Update documentation

### **After Database Changes:**
- [ ] Verify all services can connect
- [ ] Verify data integrity
- [ ] Update centralized configuration
- [ ] Test all deployment scripts
- [ ] Update this guide if needed

## 🚨 **Emergency Recovery:**

### **If Data is Lost:**
1. **Stop all services**
2. **Check for backup volumes**
3. **Restore from backup**
4. **Verify data integrity**
5. **Update configuration to prevent recurrence**

### **Backup Commands:**
```bash
# Create backup
docker exec postgres-cms pg_dump -U keycloak contract_management > backup.sql

# Restore backup
docker exec -i postgres-cms psql -U keycloak -d contract_management < backup.sql
```

## 📊 **Current Status:**

| Component | Status | Volume | Data |
|-----------|--------|--------|------|
| **postgres-cms** | ✅ Active | `postgres_data` | ✅ Persistent |
| **Keycloak DB** | ✅ Active | `postgres_data` | ✅ 17 users, 2 realms |
| **App DB** | ✅ Active | `postgres_data` | ⚠️ Empty (needs migration) |

## 🎯 **Next Steps:**

1. **Migrate test data** from old volume to new volume
2. **Verify all services** use centralized configuration
3. **Document any changes** in this guide
4. **Create regular backups** of critical data

---

**Remember: Database stability is critical for data integrity. Always follow this guide when making any database-related changes.**
