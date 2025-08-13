# Contract Management System

A comprehensive contract management system with multi-party authentication, **SCITT CCF Ledger integration**, blockchain integration, confidential computing capabilities, and **differential privacy implementation**.

## 🚀 Quick Start

### **One-Command Setup**
```bash
# Start everything properly (supports both Blockchain and SCITT CCF)
./start-system.sh

# Or fix authentication issues
./fix-auth.sh

# Manage SCITT CCF services
./manage-scitt-ccf.sh start
./manage-scitt-ccf.sh status
./manage-scitt-ccf.sh test
```

### **Available Test Users**
- **TDC**: `research@tdc.com` / `password123`
- **TDP**: `healthcare@tdp.com` / `password123`
- **CCRP**: `secure@ccrp.com` / `password123`
- **AppAdmin**: `admin@contractmanagement.com` / `password123`

### **Test Data Available**
- **7 Datasets** with DEPA IDs (DATASET-001 to DATASET-007)
- **3 AI Models** with DEPA IDs (MODEL-001 to MODEL-003)
- **3 Contract Templates** for different use cases
- **3 Sample Contracts** in various states

## 🔗 SCITT CCF Integration

### **New High-Performance Ledger**
- **10-100x Performance**: Massive throughput improvement over traditional blockchain
- **Confidential Computing**: Hardware-level TEE (Trusted Execution Environment) support
- **Standards Compliance**: IETF SCITT working group standards
- **Hybrid Migration**: Seamless operation between Ethereum and SCITT CCF
- **Zero Downtime**: Continuous service during migration

### **Quick SCITT CCF Setup**
```bash
# Setup SCITT CCF integration
./manage-scitt-ccf.sh setup

# Start SCITT CCF services
./manage-scitt-ccf.sh start

# Test integration
./manage-scitt-ccf.sh test

# Switch migration modes
./manage-scitt-ccf.sh switch HYBRID
./manage-scitt-ccf.sh switch SCITT_CCF_ONLY
./manage-scitt-ccf.sh switch ETHEREUM_ONLY
```

### **Migration Modes**
- **`HYBRID`**: Use both systems simultaneously (recommended for transition)
- **`SCITT_CCF_ONLY`**: Use only SCITT CCF Ledger
- **`ETHEREUM_ONLY`**: Use only traditional blockchain

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [SCITT CCF Integration](#-scitt-ccf-integration)
- [Documentation](#documentation)
- [Architecture](#architecture)
- [Differential Privacy](#differential-privacy)
- [Development Workflow](#development-workflow)
- [Authentication](#authentication)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🧪 Testing

### **Updated Test Suites for SCITT CCF**

The backend test suites have been completely updated to include SCITT CCF integration:

```bash
# Run SCITT CCF integration tests
cd backend
npm test -- --testPathPattern="scitt-ccf"

# Run all tests including SCITT CCF
npm test

# Run specific test suites
npm test -- scitt-ccf-integration.test.js
npm test -- scitt-ccf-api.test.js
```

### **Test Coverage**
- **SCITT CCF Service Tests**: Service initialization, connection, contract creation
- **Contract Router Tests**: Migration modes, fallback scenarios, dual operations
- **System Health Tests**: SCITT CCF vs Ethereum health monitoring
- **API Endpoint Tests**: All SCITT CCF API endpoints
- **Migration Tests**: Contract migration workflows
- **Performance Tests**: Load testing and concurrent operations

## 📚 Documentation

We've consolidated 80+ documentation files into a clear, organized structure:

```
docs/
├── README.md                    # Main entry point
├── QUICK_START.md              # Get started in 5 minutes
├── SETUP.md                    # Complete setup guide
├── USER_GUIDE.md               # End-user documentation
├── DEVELOPER_GUIDE.md          # Developer documentation
├── API_REFERENCE.md            # Complete API documentation
├── ARCHITECTURE.md             # System architecture
├── TROUBLESHOOTING.md          # Common issues and solutions
└── archive/                    # Old documentation (read-only)
```

### **SCITT CCF Documentation**
- **[SCITT CCF Integration Guide](SCITT_CCF_INTEGRATION_README.md)** - Complete integration guide
- **[SCITT CCF Migration Design](SCITT_CCF_MIGRATION_DESIGN.md)** - Technical design document
- **[SCITT CCF Management Script](manage-scitt-ccf.sh)** - Service management script

### **What Was Consolidated**

- **Authentication**: 8+ files → `SETUP.md`
- **API Documentation**: 4+ files → `API_REFERENCE.md`
- **Secret Management**: 4+ files → `ARCHITECTURE.md`
- **User Guides**: 6+ files → `USER_GUIDE.md`
- **Developer Guides**: 5+ files → `DEVELOPER_GUIDE.md`
- **Troubleshooting**: 10+ files → `TROUBLESHOOTING.md`

### **Quick Navigation**

- **[Quick Start](docs/QUICK_START.md)** - Get up and running in 5 minutes
- **[Setup Guide](docs/SETUP.md)** - Complete installation and configuration
- **[User Guide](docs/USER_GUIDE.md)** - How to use the system
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Development workflows
- **[API Reference](docs/API_REFERENCE.md)** - Technical API documentation
- **[Architecture](docs/ARCHITECTURE.md)** - System design and technical details
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[SCITT CCF Integration](SCITT_CCF_INTEGRATION_README.md)** - SCITT CCF setup and usage

## 🏗️ Architecture

### **Components**
- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: Keycloak IAM
- **Blockchain**: Ethereum with Hardhat
- **SCITT CCF**: High-performance confidential computing ledger
- **Secret Management**: HashiCorp Vault
- **Cloud Providers**: AWS, Azure, GCP, OCI
- **Differential Privacy**: Complete implementation with budget tracking

### **System Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                Contract Management System                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Frontend      │  │   Backend       │  │   Keycloak      │  │
│  │   (React)       │◄─►│   (Node.js)     │◄─►│   (IAM)         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Contract Router Service                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Ethereum        │  │ SCITT CCF       │  │ Migration       │  │
│  │ Service         │  │ Service         │  │ Orchestrator    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ PostgreSQL      │  │ SCITT CCF       │  │ Ethereum        │  │
│  │ (Primary)       │  │ Ledger          │  │ Blockchain      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **User Roles**
- **TDP (Training Data Provider)**: Create and manage datasets
- **TDC (Training Data Consumer)**: Browse and purchase datasets
- **CCRP (Confidential Clean Room Provider)**: Provide secure computing environments
- **AppAdmin**: System administration

## 🔐 Differential Privacy

### **✅ Fully Implemented Features**

#### **Core DP Service**
- **Multiple Mechanisms**: Laplace, Gaussian, Exponential, Geometric
- **Privacy Budget Management**: Epsilon and Delta tracking
- **Sensitivity Analysis**: Automatic calculation for different query types
- **Audit Trail**: Complete logging of all DP operations

#### **Database Infrastructure**
- **PrivacyBudgets Table**: Tracks budget consumption per contract
- **PrivacyBudgetLogs Table**: Detailed budget consumption history
- **PrivacyOperationsLogs Table**: Complete audit trail

#### **API Endpoints**
- **`GET /api/dp/mechanisms`** - Available DP mechanisms
- **`GET /api/dp/query-types`** - Supported query types
- **`POST /api/dp/test`** - Test DP functionality
- **`POST /api/dp/apply`** - Apply DP to real data
- **`GET /api/dp/budget/:contractId`** - Check privacy budget
- **`GET /api/dp/history/:contractId`** - Operation history

#### **Enhanced Services**
- **Training Service**: DP-SGD (Differentially Private Stochastic Gradient Descent)
- **Contract Service**: DP application to contract data
- **Privacy Analytics**: Comprehensive monitoring and reporting

### **Privacy Mechanisms Available**
- **Laplace**: For continuous data and gradients
- **Gaussian**: For averages with better utility
- **Exponential**: For discrete data
- **Geometric**: For count queries

### **Query Types Supported**
- **COUNT**: Number of records
- **SUM**: Total values
- **AVERAGE**: Mean values
- **GRADIENT**: Machine learning gradients
- **HISTOGRAM**: Data distributions
- **PERCENTILE**: Statistical measures

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

### **Differential Privacy**
- `GET /api/dp/mechanisms` - Available DP mechanisms
- `GET /api/dp/query-types` - Supported query types
- `POST /api/dp/test` - Test DP functionality
- `POST /api/dp/apply` - Apply DP to data
- `GET /api/dp/budget/:contractId` - Privacy budget status
- `GET /api/dp/history/:contractId` - DP operation history

**For complete API documentation, see [API Reference](docs/API_REFERENCE.md)**

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

# Test differential privacy
curl -s http://localhost:5001/api/dp/mechanisms
```

### **Test Users**
All test users use password: `password123`

| Role | Email | User ID | Status |
|------|-------|---------|--------|
| TDC | `tdc-test@example.com` | 50 | ✅ Working |
| TDP | `tdp-test@example.com` | 51 | ✅ Working |
| CCRP | `ccrp-test@example.com` | 52 | ✅ Working |
| AppAdmin | `appadmin-test@example.com` | 53 | ✅ Working |

### **Differential Privacy Testing**
```bash
# Test DP mechanisms endpoint
curl -s http://localhost:5001/api/dp/mechanisms

# Test DP query types
curl -s http://localhost:5001/api/dp/query-types

# Test DP with sample data
curl -s -X POST http://localhost:5001/api/dp/test \
  -H "Content-Type: application/json" \
  -d '{"data":[1,2,3,4,5],"query":{"type":"AVERAGE"},"privacyParams":{"epsilon":0.1,"delta":1e-5,"mechanism":"laplace"}}'
```

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

#### **Differential Privacy Issues**
```bash
# Check if DP tables exist
psql -h localhost -U mukeshjoshi -d contract_management -c "\dt" | grep -i privacy

# Run DP migration if needed
cd backend && node run-privacy-migration.js

# Test DP endpoints
curl -s http://localhost:5001/api/dp/mechanisms
```

### **Debugging Commands**
```bash
# Check system status
npm run status

# Test authentication
npm run test:login

# Check health
npm run health

# Test differential privacy
curl -s http://localhost:5001/api/dp/mechanisms

# View logs
tail -f logs/backend.log
```

**For comprehensive troubleshooting, see [Troubleshooting Guide](docs/TROUBLESHOOTING.md)**

## 📁 Project Structure

```
ContractManagement/
├── docs/                      # Streamlined documentation
│   ├── README.md             # Main entry point
│   ├── QUICK_START.md        # Quick start guide
│   ├── SETUP.md              # Complete setup
│   ├── USER_GUIDE.md         # User documentation
│   ├── DEVELOPER_GUIDE.md    # Developer workflows
│   ├── API_REFERENCE.md      # API documentation
│   ├── ARCHITECTURE.md       # System architecture
│   ├── TROUBLESHOOTING.md    # Issue resolution
│   └── archive/              # Old documentation
├── backend/                   # Backend server
│   ├── services/             # Business logic services
│   │   ├── differentialPrivacyService.js    # DP core service
│   │   ├── mechanisms/       # DP mechanisms (Laplace, Gaussian)
│   │   ├── privacyBudgetTracker.js          # Budget management
│   │   └── sensitivityAnalyzer.js           # Sensitivity calculation
│   ├── models/               # Database models
│   │   ├── PrivacyBudget.js  # Privacy budget model
│   │   ├── PrivacyBudgetLog.js # Budget log model
│   │   └── PrivacyOperationsLog.js # Operations log
│   ├── routes/               # API routes
│   │   └── differential-privacy.js # DP API endpoints
│   └── migrations/           # Database migrations
│       └── add-privacy-budget-tables.js # DP tables
├── frontend/                  # React frontend
│   └── src/
│       └── components/
│           └── DifferentialPrivacyManager.js # DP UI component
├── blockchain/                # Smart contracts
├── scripts/                   # Project scripts
└── config/                    # Configuration files
```

## 🔧 Configuration

### **Environment Variables**
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contract_management
DB_USER=mukeshjoshi
DB_PASSWORD=

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-frontend
KEYCLOAK_ENABLED=true

# Server
PORT=5001
NODE_ENV=development

# Differential Privacy
DP_DEFAULT_EPSILON=1.0
DP_DEFAULT_DELTA=1e-5
DP_MAX_BUDGET=10.0
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
- Differential Privacy: `http://localhost:5001/api/dp/mechanisms`

### **Logs**
- Backend logs: `logs/backend.log`
- Keycloak logs: Docker container logs
- Frontend logs: Browser console
- DP operations: `PrivacyOperationsLogs` table

## 🤝 Contributing

1. **Check current state** before making changes
2. **Make small, focused changes**
3. **Test immediately** after each change
4. **Use automation scripts** when available
5. **Document changes** with clear commit messages
6. **Follow the development workflow** outlined above
7. **Test differential privacy** endpoints after changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
1. Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. Review the [Developer Guide](docs/DEVELOPER_GUIDE.md)
3. Check the [API Reference](docs/API_REFERENCE.md)
4. Run `./fix-auth.sh` for authentication issues
5. Test DP endpoints: `curl -s http://localhost:5001/api/dp/mechanisms`

---

*Last updated: 2025-08-12*
*Version: 2.1.0 (Differential Privacy Implementation)* 