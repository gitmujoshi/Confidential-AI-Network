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
- ✅ Start the backend server
- ✅ Start the frontend
- ✅ Run health checks
- ✅ Test authentication

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

## 🛠️ Common Commands

### **Start the System**
```bash
./start-system.sh
```

### **Fix Authentication Issues**
```bash
./fix-auth.sh
```

### **Check System Status**
```bash
npm run status
```

### **Test Authentication**
```bash
npm run test:login
```

### **Stop All Services**
```bash
docker-compose -f docker-compose.keycloak-persistent.yml down
pkill -f "node server.js"
pkill -f "react-scripts"
```

## 🚨 Troubleshooting

### **Authentication Issues**
```bash
# Quick fix for authentication problems
./fix-auth.sh
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
docker-compose -f docker-compose.keycloak-persistent.yml down
docker-compose -f docker-compose.keycloak-persistent.yml up -d
```

## 📊 System Health Check

Run this to verify everything is working:

```bash
# Check all services
curl -s http://localhost:5001/health
curl -s http://localhost:8080/health

# Test authentication
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tdc-test@example.com","password":"password123"}'
```

## 🎯 Next Steps

1. **Explore the UI**: Visit http://localhost:3000
2. **Test different roles**: Login with different test users
3. **Read the full documentation**: See [SETUP.md](SETUP.md) for detailed configuration
4. **Develop**: See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for development workflows

## 📚 Documentation

- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[User Guide](USER_GUIDE.md)** - How to use the system
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Development workflows
- **[API Reference](API_REFERENCE.md)** - Technical API documentation
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

*This quick start consolidates information from multiple setup guides and troubleshooting documents.* 