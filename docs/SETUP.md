# 🔧 Complete Setup Guide

This guide consolidates all setup and configuration information for the Contract Management System.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Architecture](#system-architecture)
3. [Installation](#installation)
4. [Authentication Setup](#authentication-setup)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## 🎯 Prerequisites

### **Required Software**
- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Node.js** (v16+) and **npm** (v8+)
- **Git** (v2.30+)
- **PostgreSQL** (v13+) - Optional (Docker will provide)

### **System Requirements**
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB free space
- **Network**: Internet access for Docker images

### **Ports Required**
- **3000**: Frontend (React)
- **5001**: Backend (Node.js)
- **5432**: PostgreSQL
- **8080**: Keycloak

## 🏗️ System Architecture

### **Components Overview**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Keycloak      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (IAM)         │
│   Port: 3000    │    │   Port: 5001    │    │   Port: 8080    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Port: 5432    │
                       └─────────────────┘
```

### **Authentication Flow**
1. **User Login**: Frontend authenticates with Keycloak
2. **Token Validation**: Backend validates tokens with Keycloak
3. **Role-Based Access**: System applies role-based permissions
4. **Session Management**: Tokens are refreshed automatically

## 🚀 Installation

### **Step 1: Clone Repository**
```bash
git clone <repository-url>
cd ContractManagement
```

### **Step 2: Environment Setup**
```bash
# Copy environment files
cp env.example .env
cp backend/config.env.example backend/config.env

# Update configuration (see Configuration section)
```

### **Step 3: Start System**
```bash
# One-command startup
./start-system.sh
```

This script will:
- Start Keycloak and PostgreSQL containers
- Configure Keycloak realm, clients, and roles
- Sync users to Keycloak
- Start backend server
- Start frontend development server
- Run health checks
- Test authentication

## 🔐 Authentication Setup

### **Keycloak Configuration**

The system uses Keycloak for identity and access management:

#### **Realm Configuration**
- **Realm Name**: `contract-management`
- **Access Token Lifespan**: 5 minutes
- **SSO Session Idle**: 30 minutes
- **SSO Session Max**: 60 minutes

#### **Client Configuration**
- **Frontend Client**: `contract-management-frontend` (public)
- **Backend Client**: `contract-management-backend` (confidential)
- **Direct Access Grants**: Enabled
- **Standard Flow**: Enabled

#### **User Roles**
- **TDP**: Training Data Provider
- **TDC**: Training Data Consumer
- **CCRP**: Confidential Clean Room Provider
- **ADMIN**: System Administrator

### **User Synchronization**

Users are automatically synced from the database to Keycloak:

```bash
# Manual user sync (if needed)
node backend/scripts/source/sync-users-to-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

### **Test Users**

The system includes pre-configured test users:

| Role | Email | Password | User ID | Status |
|------|-------|----------|---------|--------|
| TDC | `tdc-test@example.com` | `password123` | 50 | ✅ Active |
| TDP | `tdp-test@example.com` | `password123` | 51 | ✅ Active |
| CCRP | `ccrp-test@example.com` | `password123` | 52 | ✅ Active |
| AppAdmin | `appadmin-test@example.com` | `password123` | 53 | ✅ Active |

## ⚙️ Configuration

### **Environment Variables**

#### **Backend Configuration** (`backend/config.env`)
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=***REMOVED-DB_PASSWORD***
DB_PASSWORD=***REMOVED-DB_PASSWORD***

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-frontend
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ENABLED=true

# Server
PORT=5001
NODE_ENV=development
JWT_SECRET=your-secret-key

# Blockchain
BLOCKCHAIN_ENABLED=true
CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

#### **Frontend Configuration** (`.env`)
```bash
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_KEYCLOAK_URL=http://localhost:8080
REACT_APP_KEYCLOAK_REALM=contract-management
REACT_APP_KEYCLOAK_CLIENT_ID=contract-management-frontend
```

### **Docker Configuration**

#### **Keycloak Persistent Setup** (`docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml`)
```yaml
version: '3.8'
services:
  ***REMOVED-KEYCLOAK_DB_PASSWORD***:
    image: quay.io/***REMOVED-KEYCLOAK_DB_PASSWORD***/***REMOVED-KEYCLOAK_DB_PASSWORD***:latest
    ports:
      - "8080:8080"
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ***REMOVED-KEYCLOAK_ADMIN_PASSWORD***
      KC_DB: ***REMOVED-DB_PASSWORD***
      KC_DB_URL: jdbc:***REMOVED-DB_PASSWORD***ql://***REMOVED-DB_PASSWORD***:5432/***REMOVED-KEYCLOAK_DB_PASSWORD***
    volumes:
      - ./***REMOVED-KEYCLOAK_DB_PASSWORD***-data:/opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/data
    depends_on:
      - ***REMOVED-DB_PASSWORD***

  ***REMOVED-DB_PASSWORD***:
    image: ***REMOVED-DB_PASSWORD***:13
    environment:
      POSTGRES_DB: ***REMOVED-KEYCLOAK_DB_PASSWORD***
      POSTGRES_USER: ***REMOVED-KEYCLOAK_DB_PASSWORD***
      POSTGRES_PASSWORD: password
    volumes:
      - ***REMOVED-KEYCLOAK_DB_PASSWORD***_db_data:/var/lib/***REMOVED-DB_PASSWORD***ql/data

volumes:
  ***REMOVED-KEYCLOAK_DB_PASSWORD***_db_data:
```

## 🧪 Testing

### **Health Checks**

#### **Backend Health**
```bash
curl -s http://localhost:5001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-03T21:52:36.235Z",
  "services": {
    "database": "connected",
    "***REMOVED-KEYCLOAK_DB_PASSWORD***": "connected",
    "blockchain": "connected"
  }
}
```

#### **Keycloak Health**
```bash
curl -s http://localhost:8080/health
```

#### **Authentication Test**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tdc-test@example.com","password":"password123"}'
```

Expected response:
```json
{
  "success": true,
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": 50,
    "email": "tdc-test@example.com",
    "partyType": "TDC",
    "name": "TDC Test User"
  }
}
```

### **Automated Testing**

#### **Run All Tests**
```bash
npm test
```

#### **Test Authentication**
```bash
npm run test:login
```

#### **Check System Status**
```bash
npm run status
```

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Authentication Issues**
**Symptoms**: "Invalid client credentials" or "401 Unauthorized"

**Solution**:
```bash
# Quick fix
./fix-auth.sh

# Manual Keycloak fix
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

#### **2. Backend Won't Start**
**Symptoms**: "Port already in use" or "Cannot bind to port 5001"

**Solution**:
```bash
# Check if port is in use
lsof -i :5001

# Kill existing process
pkill -f "node server.js"

# Start fresh
cd backend && node server.js
```

#### **3. Keycloak Issues**
**Symptoms**: "Realm not found" or "Client not found"

**Solution**:
```bash
# Restart Keycloak
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml restart

# Reset Keycloak completely
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml down
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml up -d
```

#### **4. Database Issues**
**Symptoms**: "Connection refused" or "Database not found"

**Solution**:
```bash
# Check PostgreSQL
docker ps | grep ***REMOVED-DB_PASSWORD***

# Restart database
docker-compose -f docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.yml restart ***REMOVED-DB_PASSWORD***
```

#### **5. Environment Issues**
**Symptoms**: "Configuration not found" or "Environment variables missing"

**Solution**:
```bash
# Check environment files
diff backend/.env backend/config.env

# Sync environment files
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

### **Debugging Commands**

#### **Check System Status**
```bash
npm run status
```

#### **View Logs**
```bash
# Backend logs
tail -f logs/backend.log

# Keycloak logs
docker logs ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms

# PostgreSQL logs
docker logs ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***
```

#### **Test Individual Components**
```bash
# Test database connection
cd backend && node -e "require('./models').sequelize.authenticate().then(() => console.log('DB OK')).catch(console.error)"

# Test Keycloak connection
curl -s http://localhost:8080/health

# Test backend API
curl -s http://localhost:5001/health
```

## 🔄 Maintenance

### **Regular Tasks**

#### **Backup Keycloak Configuration**
```bash
./deployment/local/backup-***REMOVED-KEYCLOAK_DB_PASSWORD***.sh
```

#### **Restore Keycloak Configuration**
```bash
./deployment/local/restore-***REMOVED-KEYCLOAK_DB_PASSWORD***.sh
```

#### **Update Environment Files**
```bash
# Sync .env and config.env
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

### **Performance Monitoring**

#### **Memory Usage**
```bash
# Check Node.js memory usage
ps aux | grep node

# Check Docker memory usage
docker stats
```

#### **Database Performance**
```bash
# Check PostgreSQL connections
docker exec ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD*** psql -U ***REMOVED-KEYCLOAK_DB_PASSWORD*** -d ***REMOVED-KEYCLOAK_DB_PASSWORD*** -c "SELECT count(*) FROM pg_stat_activity;"
```

## 📚 Related Documentation

- **[Quick Start](QUICK_START.md)** - Get started in 5 minutes
- **[User Guide](USER_GUIDE.md)** - How to use the system
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Development workflows
- **[API Reference](API_REFERENCE.md)** - Technical API documentation
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

*This setup guide consolidates information from multiple authentication and configuration documents.* 