# Contract Management System Documentation

Welcome to the streamlined documentation for the Contract Management System. This documentation has been consolidated from 80+ files into a clear, organized structure.

## 🚀 Quick Navigation

### **Getting Started**
- **[Quick Start](QUICK_START.md)** - Get up and running in 5 minutes
- **[Setup Guide](SETUP.md)** - Complete installation and configuration

### **User Documentation**
- **[User Guide](USER_GUIDE.md)** - Complete user documentation for all roles
- **[API Reference](API_REFERENCE.md)** - Complete API documentation

### **Developer Documentation**
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Development setup and workflows
- **[Architecture](ARCHITECTURE.md)** - System design and technical details
- **[Testing](TESTING.md)** - Complete testing guide and test suites
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

## 📋 Documentation Structure

```
docs/
├── README.md                    # This file - Main entry point
├── QUICK_START.md              # Get started in 5 minutes
├── SETUP.md                    # Complete setup guide
├── USER_GUIDE.md               # End-user documentation
├── DEVELOPER_GUIDE.md          # Developer documentation
├── API_REFERENCE.md            # Complete API documentation
├── ARCHITECTURE.md             # System architecture
├── TESTING.md                  # Complete testing guide
├── TROUBLESHOOTING.md          # Common issues and solutions
└── archive/                    # Old documentation (read-only)
```

## 🎯 Quick Commands

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

## 👥 User Roles

- **TDC (Training Data Consumer)**: Browse and purchase datasets
- **TDP (Training Data Provider)**: Create and manage datasets  
- **CCRP (Confidential Clean Room Provider)**: Provide secure computing environments
- **AppAdmin**: System administration

## 🔐 Test Users

All test users use password: `password123`

| Role | Email | Status |
|------|-------|--------|
| TDC | `research@tdc.com` | ✅ Working |
| TDP | `healthcare@tdp.com` | ✅ Working |
| CCRP | `secure@ccrp.com` | ✅ Working |
| AppAdmin | `admin@contractmanagement.com` | ✅ Working |

## 🧪 Test Data Available

The system includes comprehensive test data for testing:
- **7 Datasets** with DEPA IDs (DATASET-001 to DATASET-007)
- **3 AI Models** with DEPA IDs (MODEL-001 to MODEL-003)
- **3 Contract Templates** for different use cases
- **3 Sample Contracts** in various states

## 🧪 Testing

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

For complete testing documentation, see **[Testing Guide](TESTING.md)**.

## 🏗️ System Components

- **Frontend**: React.js with Material-UI (Port 3000)
- **Backend**: Node.js with Express (Port 5001)
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: Keycloak IAM (Port 8080)
- **Blockchain**: Ethereum with Hardhat
- **Secret Management**: HashiCorp Vault
- **Cloud Providers**: AWS, Azure, GCP, OCI

## 📚 What Was Consolidated

This documentation consolidates content from:
- **Authentication**: 8+ files → `SETUP.md`
- **API Documentation**: 4+ files → `API_REFERENCE.md`
- **Secret Management**: 4+ files → `ARCHITECTURE.md`
- **User Guides**: 6+ files → `USER_GUIDE.md`
- **Developer Guides**: 5+ files → `DEVELOPER_GUIDE.md`
- **Troubleshooting**: 10+ files → `TROUBLESHOOTING.md`

## 🔄 Migration Notes

- **Old files** have been moved to `docs/archive/`
- **Cross-references** have been updated throughout the codebase
- **Search functionality** works across all consolidated docs
- **Version history** is preserved in Git

## 🆘 Need Help?

1. **Check [Troubleshooting](TROUBLESHOOTING.md)** for common issues
2. **Use [Quick Start](QUICK_START.md)** for immediate setup
3. **Review [Developer Guide](DEVELOPER_GUIDE.md)** for development workflows
4. **Consult [API Reference](API_REFERENCE.md)** for technical details

---

*Last updated: 2025-08-03*
*Version: 2.0.0 (Streamlined)* 