# 🚀 Quick Start Guide

Get the Contract Management System up and running in 5 minutes.

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** (v16+) and **npm** installed
- **Git** for cloning the repository

## ⚡ One-Command Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd ContractManagement

# Start everything with one command
./start-system.sh
```

This command will:
- ✅ Start Keycloak and PostgreSQL
- ✅ Configure authentication
- ✅ Start SCITT CCF services (if configured)
- ✅ Start the backend server
- ✅ Start the frontend
- ✅ Run health checks
- ✅ Test authentication
- ✅ Test SCITT CCF integration (if enabled)

## 🔗 SCITT CCF Integration (Optional)

### **Enable High-Performance Ledger**
```bash
# Setup SCITT CCF integration
./manage-scitt-ccf.sh setup

# Start SCITT CCF services
./manage-scitt-ccf.sh start

# Test integration
./manage-scitt-ccf.sh test

# Check status
./manage-scitt-ccf.sh status
```

### **Migration Modes**
- **`HYBRID`**: Use both blockchain and SCITT CCF (recommended)
- **`SCITT_CCF_ONLY`**: Use only SCITT CCF Ledger
- **`ETHEREUM_ONLY`**: Use only traditional blockchain

```bash
# Switch migration modes
./manage-scitt-ccf.sh switch HYBRID
./manage-scitt-ccf.sh switch SCITT_CCF_ONLY
./manage-scitt-ccf.sh switch ETHEREUM_ONLY
```

## 🔐 Quick Login Test

Once the system is running, test with these credentials:

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| TDC | `tdc-test@example.com` | `password123` | Browse datasets |
| TDP | `tdp-test@example.com` | `password123` | Create datasets |
| CCRP | `ccrp-test@example.com` | `password123` | Manage cloud credentials |
| AppAdmin | `appadmin-test@example.com` | `password123` | System administration |

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Keycloak Admin**: http://localhost:8080/admin/
- **Health Check**: http://localhost:5001/health

## 🤝 CAN Quickstart (Optional, parallel workflow)

The repo also includes a **parallel CAN (Confidential AI Network) path** under `/api/can/*` (JCS escrow + provenance + local CCRP execution for dev/testing).

- **Docs**: `CAN_QUICKSTART.md`
- **UI helper (dev/test)**: after login as TDC, open `/can/jobs` to run: create job → release keys → release job → wait for training.

### **SCITT CCF URLs (if enabled)**
- **SCITT CCF Node**: http://localhost:8000
- **SCITT CCF Governance**: http://localhost:8001
- **SCITT CCF Dashboard**: http://localhost:8080

## 🛠️ Common Commands

### **Start the System**
```bash
./start-system.sh
```

### **Fix Authentication Issues**
```bash
./fix-auth.sh
```

### **Manage SCITT CCF Services**
```bash
# Start SCITT CCF
./manage-scitt-ccf.sh start

# Stop SCITT CCF
./manage-scitt-ccf.sh stop

# Restart SCITT CCF
./manage-scitt-ccf.sh restart

# Check SCITT CCF status
./manage-scitt-ccf.sh status

# View SCITT CCF logs
./manage-scitt-ccf.sh logs
```

### **Check System Status**
```bash
npm run status
```

### **Test Authentication**
```bash
npm run test:login
```

### **Test SCITT CCF Integration**
```bash
./manage-scitt-ccf.sh test
```

### **Stop All Services**
```bash
# Stop SCITT CCF services
./manage-scitt-ccf.sh stop

# Stop other services
docker-compose -f docker-compose.keycloak-persistent.yml down
pkill -f "node server.js"
pkill -f "react-scripts"
```

## 🧪 Testing the System

### **Quick Health Check**
```bash
# Check system status
npm run status

# Test authentication
npm run test:login

# Test SCITT CCF integration
./manage-scitt-ccf.sh test
```

### **Run SCITT CCF Test Suites**
```bash
# Run all tests including SCITT CCF
cd backend
npm test

# Run SCITT CCF specific tests
npm test -- --testPathPattern="scitt-ccf"

# Run specific test suites
npm test -- scitt-ccf-integration.test.js
npm test -- scitt-ccf-api.test.js
```

### **Test Data Verification**
```bash
# Check if test data exists
docker exec postgres-app psql -U postgres -d contract_management -c "SELECT COUNT(*) FROM users;"

# Expected results:
# - 8 users (TDP, TDC, CCRP, Admin)
# - 7 datasets with DEPA IDs
# - 3 AI models with DEPA IDs
# - 3 contract templates
# - 3 sample contracts
```

## 🚨 Troubleshooting

### **Authentication Issues**
```bash
# Quick fix for authentication problems
./fix-auth.sh
```

### **SCITT CCF Issues**
```bash
# Check SCITT CCF status
./manage-scitt-ccf.sh status

# Restart SCITT CCF services
./manage-scitt-ccf.sh restart

# View SCITT CCF logs
./manage-scitt-ccf.sh logs

# Test SCITT CCF integration
./manage-scitt-ccf.sh test
```

### **Backend Won't Start**
```bash
# Check if port is in use
lsof -i :5001

# Kill existing process and restart
pkill -f "node server.js"
cd backend && node server.js
```

### **Keycloak Issues**
```bash
# Restart Keycloak
docker-compose -f docker-compose.keycloak-persistent.yml restart

# Reset Keycloak completely
docker-compose -f docker-compose.keycloak-persistent.yml down -v
docker-compose -f docker-compose.keycloak-persistent.yml up -d
```

## 🎯 Next Steps

### **For Users**
1. **Explore the Frontend**: http://localhost:3000
2. **Read the User Guide**: [docs/USER_GUIDE.md](USER_GUIDE.md)
3. **Learn about SCITT CCF**: [SCITT_CCF_INTEGRATION_README.md](../SCITT_CCF_INTEGRATION_README.md)

### **For Developers**
1. **Read the Developer Guide**: [docs/DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
2. **Check the API Reference**: [docs/API_REFERENCE.md](API_REFERENCE.md)
3. **Review the Architecture**: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
4. **Study SCITT CCF Design**: [SCITT_CCF_MIGRATION_DESIGN.md](../SCITT_CCF_MIGRATION_DESIGN.md)

### **For System Administrators**
1. **Read the Setup Guide**: [docs/SETUP.md](SETUP.md)
2. **Check Troubleshooting**: [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. **Monitor SCITT CCF**: `./manage-scitt-ccf.sh status`

## 📚 Additional Resources

- **[SCITT CCF Integration Guide](../SCITT_CCF_INTEGRATION_README.md)** - Complete SCITT CCF setup and usage
- **[SCITT CCF Migration Design](../SCITT_CCF_MIGRATION_DESIGN.md)** - Technical architecture and design
- **[SCITT CCF Management Script](../manage-scitt-ccf.sh)** - Service management commands
- **[Environment Configuration](../env.scitt-ccf.example)** - SCITT CCF configuration template 