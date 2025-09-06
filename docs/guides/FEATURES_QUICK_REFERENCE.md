# Contract Management System - Features Quick Reference

Quick access to key features, commands, and configuration options.

---

## 🚀 **Quick Start Commands**

### **System Management**
```bash
# Start all services
./deployment/local/start-services.sh

# Stop all services  
./deployment/local/stop-services.sh

# Check system status
./deployment/local/status.sh

# Start SCITT CCF only
./manage-scitt-ccf.sh start
```

### **Testing**
```bash
# Run all tests
npm run test:all

# Mock tests (fast)
npm run test:mock

# Integration tests
npm run test:integration

# SCITT CCF tests
npm run test:scitt-ccf

# Hybrid mode tests
npm run test:hybrid
```

---

## 🔧 **Key Configuration**

### **Environment Variables**
```bash
# Core Configuration
MIGRATION_MODE=HYBRID              # ETHEREUM_ONLY | SCITT_CCF_ONLY | HYBRID
BLOCKCHAIN_ENABLED=true            # Enable smart contracts
SCITT_CCF_ENABLED=true             # Enable SCITT CCF

# Database
DB_HOST=localhost
DB_USER=mukeshjoshi
DB_NAME=contract_management

# Services
KEYCLOAK_URL=http://localhost:8080
CCF_NODE_URL=http://localhost:8000
BLOCKCHAIN_URL=http://localhost:8545
```

---

## 🔗 **Smart Contracts**

### **Contract Status Flow**
```
DRAFT → PENDING_TDP → PENDING_CCRP → ACTIVE → COMPLETED
  ↓         ↓              ↓           ↓         ↓
  ↓     AUTO_SIGN      CCRP_REVIEW   EXECUTE   FINISH
  ↓         ↓              ↓           ↓         ↓
REJECTED ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

### **Key Smart Contract Features**
- ✅ Contract lifecycle management
- ✅ Auto-signing for TDPs
- ✅ CCRP integration
- ✅ Status enforcement
- ✅ Event emission
- ✅ Security protection

---

## 🔍 **Provenance Tracking**

### **Merkle Tree Structure**
```
Root Hash (Level 0)
├── Node 1 (Level 1) ── Node 2 (Level 1)
│   ├── Node 3 (Level 2) ── Node 4 (Level 2)
│   └── Node 5 (Level 2) ── Node 6 (Level 2)
└── Node 7 (Level 1) ── Node 8 (Level 1)
    ├── Node 9 (Level 2) ── Node 10 (Level 2)
    └── Node 11 (Level 2) ── Node 12 (Level 2)
```

### **Provenance Models**
- **MerkleTree**: Tree structure and metadata
- **ProvenanceNode**: Individual tree nodes
- **ProvenanceCapture**: Data capture during processing
- **ProvenanceVerification**: Verification results

---

## 🔐 **SCITT CCF Integration**

### **Service URLs**
```
SCITT CCF Node:      http://localhost:8000
SCITT CCF Dashboard: http://localhost:8082
SCITT CCF Monitor:   http://localhost:8001
SCITT CCF Redis:     localhost:6379
```

### **API Endpoints**
```javascript
GET    /api/scitt-ccf/health                    // Health check
GET    /api/scitt-ccf/metrics                   // Performance metrics
POST   /api/scitt-ccf/contracts                 // Create contract
GET    /api/scitt-ccf/contracts/:id/status      // Contract status
GET    /api/scitt-ccf/contracts/:id/provenance  // Provenance tree
```

---

## 🔄 **Hybrid Mode**

### **Migration Modes**
```bash
# Mode 1: Ethereum Only
MIGRATION_MODE=ETHEREUM_ONLY
BLOCKCHAIN_ENABLED=true
SCITT_CCF_ENABLED=false

# Mode 2: SCITT CCF Only  
MIGRATION_MODE=SCITT_CCF_ONLY
BLOCKCHAIN_ENABLED=false
SCITT_CCF_ENABLED=true

# Mode 3: Hybrid (Recommended)
MIGRATION_MODE=HYBRID
BLOCKCHAIN_ENABLED=true
SCITT_CCF_ENABLED=true
```

### **Fallback Behavior**
- **Blockchain fails** → SCITT CCF continues
- **SCITT CCF fails** → Blockchain continues
- **Both active** → Maximum feature availability

---

## 🗄️ **Database Features**

### **JSONB Fields (All Models)**
```javascript
// Fast tag queries with GIN indexes
WHERE tags @> '["ai", "machine-learning"]'

// Metadata searches
WHERE metadata @> '{"category": "healthcare"}'

// Array containment
WHERE cloud_providers @> '["AWS", "Azure"]'
```

### **Field Naming Convention**
```javascript
// All models use snake_case with underscored: true
{
    underscored: true,
    indexes: [
        { fields: ['user_id'] },      // snake_case
        { fields: ['contract_id'] }   // snake_case
    ]
}
```

---

## 🔐 **Authentication**

### **User Roles**
- **AppAdmin**: Full system access
- **TDP**: Dataset management, contract approval
- **TDC**: Contract creation, model training
- **CCRP**: Environment provisioning, compliance

### **Keycloak Features**
- Single Sign-On (SSO)
- Role-Based Access Control (RBAC)
- JWT token authentication
- Multi-factor authentication

---

## 🧪 **Testing Features**

### **Test Categories**
```bash
# Unit Tests (Mock Mode)
npm run test:mock          # Fast, no external dependencies

# Integration Tests  
npm run test:integration   # Real service connections

# SCITT CCF Tests
npm run test:scitt-ccf     # SCITT CCF specific functionality

# Hybrid Tests
npm run test:hybrid        # Both systems working together

# All Tests
npm run test:all           # Complete test suite
```

### **Test Data**
- **8 Test Users**: All roles covered
- **7 Test Datasets**: Healthcare, Finance, Retail
- **3 AI Models**: Different frameworks and types
- **3 Sample Contracts**: Various statuses and configurations

---

## 🌐 **API Reference**

### **Core Endpoints**
```javascript
// Authentication
POST   /api/auth/login              // User login
POST   /api/auth/register           // User registration

// Contracts
GET    /api/contracts               // List contracts
POST   /api/contracts               // Create contract
POST   /api/contracts/ricardian     // Create Ricardian contract

// Datasets
GET    /api/datasets                // List datasets
POST   /api/datasets                // Create dataset

// Blockchain
GET    /api/blockchain/health       // Blockchain health
POST   /api/blockchain/contracts    // Create blockchain contract

// SCITT CCF
GET    /api/scitt-ccf/health        // SCITT CCF health
POST   /api/scitt-ccf/contracts     // Create SCITT CCF contract
```

---

## 🐳 **Docker Services**

### **Main Services**
```yaml
***REMOVED-DB_PASSWORD***-app:        # Main database (port 5432)
***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***:   # Keycloak database (port 5433)
***REMOVED-KEYCLOAK_DB_PASSWORD***:            # Authentication service (port 8080)
```

### **SCITT CCF Services**
```yaml
scitt-ccf-node:      # Main ledger (port 8000)
scitt-ccf-dashboard: # Web interface (port 8082)
scitt-ccf-monitor:   # Health monitoring (port 8001)
scitt-ccf-redis:     # Caching (port 6379)
scitt-ccf-***REMOVED-DB_PASSWORD***:  # SCITT CCF storage (port 5434)
```

---

## 📊 **Performance Features**

### **JSONB Benefits**
- **10-100x faster** than JSON field queries
- **GIN indexes** for fast tag searches
- **Efficient storage** with binary format
- **Rich query operators** (@>, @?, etc.)

### **Database Optimizations**
- **Proper indexing** on all foreign keys
- **Consistent field naming** (snake_case)
- **Optimized queries** with proper joins
- **Connection pooling** for scalability

---

## 🔒 **Security Features**

### **Data Protection**
- **Encryption at rest** for sensitive data
- **TLS/SSL** for data in transit
- **JWT tokens** with expiration
- **Role-based access** control

### **Compliance**
- **Audit logging** for all operations
- **Provenance tracking** for data lineage
- **TEE attestation** for confidential computing
- **Merkle tree verification** for data integrity

---

## 🚨 **Troubleshooting**

### **Common Issues**
```bash
# Blockchain not available
BLOCKCHAIN_ENABLED=false  # Fallback to database mode

# SCITT CCF not responding
./manage-scitt-ccf.sh restart  # Restart SCITT CCF services

# Database connection issues
docker restart ***REMOVED-DB_PASSWORD***-app     # Restart database container

# Port conflicts
lsof -ti:8080 | xargs kill -9  # Free occupied ports
```

### **Health Checks**
```bash
# System health
curl http://localhost:5001/health

# Blockchain health
curl http://localhost:5001/api/blockchain/health

# SCITT CCF health
curl http://localhost:5001/api/scitt-ccf/health

# Keycloak health
curl http://localhost:8080/health
```

---

## 📚 **Documentation Files**

- **`COMPREHENSIVE_FEATURES_DOCUMENTATION.md`** - Complete feature overview
- **`TEST_DATA_FOR_TESTERS.md`** - Testing guide and test data
- **`backend/tests/README.md`** - Test suite documentation
- **`CONTRACT_MANAGEMENT_SYSTEM_PRD.md`** - Product requirements

---

*This quick reference provides fast access to key features and commands. For detailed information, refer to the comprehensive documentation.*
