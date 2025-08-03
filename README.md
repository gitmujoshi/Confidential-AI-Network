# Contract Management System

A comprehensive contract management system with multi-party authentication, blockchain integration, and confidential computing capabilities.

## 🚀 Quick Start

### **One-Command Setup**
```bash
# Start everything properly
./start-system.sh

# Or fix authentication issues
./fix-auth.sh
```

### **Available Test Users**
- **TDC**: `tdc-test@example.com` / `password123`
- **TDP**: `tdp-test@example.com` / `password123`
- **CCRP**: `ccrp-test@example.com` / `password123`
- **AppAdmin**: `appadmin-test@example.com` / `password123`

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Development Workflow](#-development-workflow)
- [Authentication](#-authentication)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Cursor Best Practices](#-cursor-best-practices)

## 🏗️ Architecture

### **Components**
- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: Keycloak IAM
- **Blockchain**: Ethereum with Hardhat
- **Secret Management**: HashiCorp Vault
- **Cloud Providers**: AWS, Azure, GCP, OCI

### **User Roles**
- **TDP (Training Data Provider)**: Create and manage datasets
- **TDC (Training Data Consumer)**: Browse and purchase datasets
- **CCRP (Confidential Clean Room Provider)**: Provide secure computing environments
- **AppAdmin**: System administration

## 🔄 Development Workflow

### **Before Making Changes**
```bash
# Check current state
npm run status

# Test current functionality
npm run test:login
```

### **During Development**
```bash
# Make small, focused changes
# Test immediately after each change
npm run test:login

# If something breaks, fix it immediately
./fix-auth.sh
```

### **After Making Changes**
```bash
# Test the specific change
npm run test:login

# Test related functionality
npm run status

# Update documentation if needed
```

## 🔐 Authentication

### **Keycloak Integration**
- **Realm**: `contract-management`
- **Frontend Client**: `contract-management-frontend` (public)
- **Backend Client**: `contract-management-backend` (confidential)
- **Roles**: TDP, TDC, CCRP, ADMIN

### **Authentication Flow**
1. User logs in via frontend
2. Frontend authenticates with Keycloak
3. Backend validates tokens
4. Role-based access control applied

### **Common Authentication Issues**
```bash
# Quick fix for authentication problems
./fix-auth.sh

# Manual Keycloak fix
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js

# Reset everything
npm run reset:***REMOVED-KEYCLOAK_DB_PASSWORD***
```

## 📚 API Documentation

### **Authentication Endpoints**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### **Contract Management**
- `GET /api/contracts` - List contracts
- `POST /api/contracts` - Create contract
- `GET /api/contracts/:id` - Get contract details
- `PUT /api/contracts/:id` - Update contract

### **Dataset Management**
- `GET /api/datasets` - List datasets
- `POST /api/datasets` - Create dataset
- `GET /api/datasets/:id` - Get dataset details

### **Cloud Credentials**
- `GET /api/ccrp/cloud-credentials` - List cloud credentials
- `POST /api/ccrp/cloud-credentials` - Add cloud credentials
- `PUT /api/ccrp/cloud-credentials/:id` - Update credentials

## 🧪 Testing

### **Test Commands**
```bash
# Run all tests
npm test

# Test authentication
npm run test:login

# Check system status
npm run status

# Health check
npm run health
```

### **Test Users**
All test users use password: `password123`

| Role | Email | User ID | Status |
|------|-------|---------|--------|
| TDC | `tdc-test@example.com` | 50 | ✅ Working |
| TDP | `tdp-test@example.com` | 51 | ✅ Working |
| CCRP | `ccrp-test@example.com` | 52 | ✅ Working |
| AppAdmin | `appadmin-test@example.com` | 53 | ✅ Working |

## 🚨 Troubleshooting

### **Common Issues**

#### **Authentication Issues**
```bash
# Quick fix
./fix-auth.sh

# Manual Keycloak fix
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js

# Check Keycloak status
curl -s http://localhost:8080/health
```

#### **Backend Won't Start**
```bash
# Check if port is in use
lsof -i :5001

# Kill existing process
pkill -f "node server.js"

# Start fresh
cd backend && node server.js
```

#### **Environment Issues**
```bash
# Check environment files
diff backend/.env backend/config.env

# Sync environment files
cd backend && node auto-fix-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
```

### **Debugging Commands**
```bash
# Check system status
npm run status

# Test authentication
npm run test:login

# Check health
npm run health

# View logs
tail -f logs/backend.log
```

## 🎯 Cursor Best Practices

### **Development Workflow**
1. **Check current state** before making changes
2. **Make small, focused changes**
3. **Test immediately** after each change
4. **Fix issues** before moving on
5. **Document changes** with clear commit messages

### **Automation Scripts**
- `./fix-auth.sh` - Fix authentication issues
- `./start-system.sh` - Start everything properly
- `npm run status` - Check system health
- `npm run test:login` - Test authentication

### **Prevention Strategies**
- Use automated health checks
- Test authentication after every change
- Keep environment files in sync
- Use persistent Keycloak configuration
- Monitor system health regularly

For detailed Cursor best practices, see [CURSOR_BEST_PRACTICES.md](CURSOR_BEST_PRACTICES.md).

## 📁 Project Structure

```
ContractManagement/
├── backend/                 # Backend server
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── models/             # Database models
│   ├── scripts/            # Utility scripts
│   └── tests/              # Test files
├── frontend/               # React frontend
│   ├── src/                # Source code
│   ├── components/         # React components
│   └── pages/              # Page components
├── blockchain/             # Smart contracts
├── docs/                   # Documentation
├── scripts/                # Project scripts
└── config/                 # Configuration files
```

## 🔧 Configuration

### **Environment Variables**
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
KEYCLOAK_ENABLED=true

# Server
PORT=5001
NODE_ENV=development
```

### **Docker Services**
- **Keycloak**: Port 8080
- **PostgreSQL**: Port 5432
- **Backend**: Port 5001
- **Frontend**: Port 3000

## 📈 Monitoring

### **Health Checks**
- Backend: `http://localhost:5001/health`
- Keycloak: `http://localhost:8080/health`
- Frontend: `http://localhost:3000`

### **Logs**
- Backend logs: `logs/backend.log`
- Keycloak logs: Docker container logs
- Frontend logs: Browser console

## 🤝 Contributing

1. **Check current state** before making changes
2. **Make small, focused changes**
3. **Test immediately** after each change
4. **Use automation scripts** when available
5. **Document changes** with clear commit messages
6. **Follow the development workflow** outlined above

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [Cursor Best Practices](CURSOR_BEST_PRACTICES.md)
3. Check the [API Documentation](#-api-documentation)
4. Run `./fix-auth.sh` for authentication issues

---

*Last updated: 2025-08-03*
*Version: 1.0.0* 