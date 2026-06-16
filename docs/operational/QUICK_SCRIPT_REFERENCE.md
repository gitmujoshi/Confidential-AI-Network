# Quick Script Reference

## 🚀 **Essential Scripts (Most Used)**

### **System Management**
```bash
# Start everything
./start-system.sh

# Stop everything  
./stop-system.sh

# Development setup
./dev-setup.sh
./dev-start.sh

# Clean restart
./clean-start.sh
./clean-stop.sh
```

### **Local Development**
```bash
# Complete local setup
./deployment/local/setup-and-run.sh

# Start/stop services
./deployment/local/start-services.sh
./deployment/local/stop-services.sh

# Check status
./deployment/local/status.sh
```

### **Testing**
```bash
# Basic API tests
./deployment/test-basic-apis-simple.sh

# Create test data
./deployment/create-test-data.sh

# Contract creation tests
./deployment/test-contract-creation.sh
```

### **Troubleshooting**
```bash
# Fix database issues
./fix-database-setup.sh

# Emergency stop
./deployment/local/emergency-stop.sh

# Memory cleanup
./deployment/monitoring/cleanup-memory.sh
```

### **Configuration Management**
```bash
# Check config status
./scripts/config-manager.sh status

# Validate configuration
./scripts/config-manager.sh validate

# Fix config issues
./scripts/config-manager.sh fix
```

## 📊 **Script Count Summary**

| Category | Count | Purpose |
|----------|-------|---------|
| **Main System** | 22 | Core system management |
| **Deployment** | 51 | Local/remote deployment |
| **Backend** | 48 | Backend-specific setup |
| **Kubernetes** | 6 | K8s deployment |
| **Cloud** | 4 | Cloud platform deployment |
| **Configuration** | 3 | Config management |
| **TOTAL** | **134** | **All setup/management** |

## 🎯 **Script Categories by Purpose**

### **Setup & Installation** (25 scripts)
- Fresh system setup
- Development environment
- Database setup
- Keycloak configuration
- Dependencies installation

### **Service Management** (20 scripts)
- Start/stop services
- Service monitoring
- Health checks
- Restart procedures

### **Testing** (15 scripts)
- API testing
- End-to-end tests
- User authentication tests
- Contract creation tests
- Test data generation

### **Deployment** (30 scripts)
- Local deployment
- Cloud deployment (Azure, GCP, OCI)
- Kubernetes deployment
- Production deployment

### **Monitoring & Maintenance** (10 scripts)
- Resource monitoring
- Memory analysis
- Performance optimization
- Backup/restore

### **Configuration** (8 scripts)
- Configuration management
- Environment setup
- Keycloak configuration
- Database configuration

### **Troubleshooting** (15 scripts)
- Issue diagnosis
- Emergency procedures
- Fix scripts
- Recovery procedures

## 🔧 **Most Complex Scripts**

1. **`setup-fresh-system.sh`** - Complete system setup
2. **`deployment/local/setup-and-run.sh`** - Local environment setup
3. **`deploy-ubuntu.sh`** - Ubuntu production deployment
4. **`backend/scripts/setup-complete-system.js`** - Backend system setup

## ⚠️ **Redundancy Issues**

### **Multiple Scripts Doing Similar Things:**
- **Keycloak Setup**: 6 different scripts
- **Service Starting**: 8 different scripts  
- **Testing**: 15 different test scripts
- **Database Setup**: 5 different scripts

## 💡 **Quick Start Workflow**

```bash
# 1. Initial setup (first time)
./dev-setup.sh

# 2. Start development environment
./dev-start.sh

# 3. Verify everything is working
./deployment/test-basic-apis-simple.sh

# 4. Check system status
./deployment/local/status.sh
```

## 🆘 **Emergency Procedures**

```bash
# System won't start
./deployment/local/emergency-stop.sh
./clean-start.sh

# Database issues
./fix-database-setup.sh

# Configuration problems
./scripts/config-manager.sh fix

# Memory issues
./deployment/monitoring/cleanup-memory.sh
```

---

**Total Scripts**: 134 setup/management scripts
**Most Important**: 15 essential scripts for daily use
**Complexity**: High - could benefit from consolidation
