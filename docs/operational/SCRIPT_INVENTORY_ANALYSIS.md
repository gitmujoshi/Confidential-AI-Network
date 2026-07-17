# Script Inventory Analysis

## 📊 **Total Script Count**

**Total Scripts**: 588 (excluding node_modules, .git, temp directories)
**Management & Setup Scripts**: ~131 scripts

## 🗂️ **Script Categories**

### 1. **Main System Scripts** (22 scripts)
**Location**: Root directory
**Purpose**: Core system management

```
start-system.sh              # Start all services
stop-system.sh               # Stop all services
dev-start.sh                 # Development startup
dev-setup.sh                 # Development setup
clean-start.sh               # Clean system start
clean-stop.sh                # Clean system stop
setup-fresh-system.sh        # Fresh system setup
setup-linux.sh               # Linux setup
manage-services.sh            # Service management
manage-scitt-ccf.sh          # SCITT CCF management
fix-database-setup.sh        # Database setup fix
deploy-ubuntu.sh             # Ubuntu deployment
```

### 2. **Deployment Scripts** (51 scripts)
**Location**: `deployment/` directory
**Purpose**: Local and remote deployment

#### Local Development (25 scripts)
```
deployment/local/
├── setup-and-run.sh         # Complete local setup
├── start-services.sh        # Start all services
├── stop-services.sh         # Stop all services
├── start-backend-only.sh    # Backend only
├── start-frontend.sh        # Frontend only
├── start-scitt-ccf-integrated.sh
├── dev-backend.sh           # Backend development
├── dev-frontend.sh          # Frontend development
├── dev-blockchain.sh        # Blockchain development
├── restart.sh               # System restart
├── shutdown.sh              # System shutdown
├── emergency-stop.sh        # Emergency stop
├── status.sh                # System status
├── cleanup-memory.sh        # Memory cleanup
├── backup-keycloak.sh       # Keycloak backup
└── restore-keycloak.sh      # Keycloak restore
```

#### Testing Scripts (15 scripts)
```
deployment/
├── test-basic-apis.sh       # Basic API testing
├── test-basic-apis-simple.sh
├── test-contract-creation.sh
├── test-contract-creation-ui.sh
├── test-contract-creation-end-to-end.sh
├── test-contract-creation-simplified.sh
├── test-frontend-api-access.sh
├── test-frontend-contract-creation.sh
├── test-user-login-all-types.sh
├── test-tdc-dashboard.sh
├── test-ai-models-display.sh
├── test-ai-models-display-fix.sh
├── test-ai-models-single-select.sh
├── create-test-data.sh      # Test data creation
└── deployment-status.sh     # Deployment status
```

#### Keycloak Management (8 scripts)
```
deployment/
├── setup-keycloak-https.sh  # HTTPS Keycloak setup
├── start-keycloak-https.sh  # Start HTTPS Keycloak
├── stop-keycloak-https.sh   # Stop HTTPS Keycloak
├── status-keycloak-https.sh # Keycloak status
├── fix-keycloak-client-config.sh
├── fix-keycloak-client.js
├── generate-keycloak-certs.sh
└── set-keycloak-user-passwords.sh
```

#### Monitoring (3 scripts)
```
deployment/monitoring/
├── monitor-resources.sh     # Resource monitoring
├── analyze-memory.sh        # Memory analysis
└── optimize-memory.sh       # Memory optimization
```

### 3. **Backend Scripts** (48 scripts)
**Location**: `backend/` directory
**Purpose**: Backend-specific setup and management

#### Database Setup (8 scripts)
```
backend/scripts/source/
├── setupDatabase.js         # Database setup
├── setup-comprehensive-db.js
├── setup-test-database.js
├── setupDPDPCompliance.js
└── deploy-database.sh
```

#### Keycloak Setup (6 scripts)
```
backend/
├── setup-keycloak.js        # Keycloak setup
├── setup-keycloak-simple.js
├── setup-keycloak-persistent.sh
├── configure-email-dev.js
└── scripts/source/setupKeycloak.js
```

#### Testing Setup (15 scripts)
```
backend/tests/
├── setup.js                 # Test setup
├── env-setup.js             # Environment setup
├── integration/setup.js     # Integration setup
├── unit/setup.js            # Unit test setup
└── integration/test-scenario-manager.js
```

#### Integration Testing (4 scripts)
```
backend/scripts/
├── start-integration-test-env.sh
├── stop-integration-test-env.sh
└── setup-complete-system.js
```

### 4. **Kubernetes Scripts** (6 scripts)
**Location**: `k8s/` directory
**Purpose**: Kubernetes deployment

```
k8s/
├── deploy.sh                # K8s deployment
├── local-setup.sh           # Local K8s setup
├── minikube-setup.sh        # Minikube setup
└── configmap.yaml           # Configuration
```

### 5. **Cloud Deployment Scripts** (4 scripts)
**Location**: `deploy/` directory
**Purpose**: Cloud platform deployment

```
deploy/
├── azure/deploy-azure.sh    # Azure deployment
├── gcp/deploy-gcp.sh        # GCP deployment
├── oci/deploy-oci.sh        # Oracle Cloud deployment
└── production/deploy-multi-vm.sh
```

### 6. **Configuration Management** (3 scripts)
**Location**: `scripts/` directory
**Purpose**: Configuration management

```
scripts/
├── config-manager.sh        # Configuration manager
├── consolidate-configs.sh   # Config consolidation
└── config-loader.js         # Configuration loader
```

## 🎯 **Key Scripts for Different Use Cases**

### **Quick Start (Development)**
```bash
./dev-setup.sh               # Initial setup
./dev-start.sh               # Start development environment
```

### **Production Deployment**
```bash
./deploy-ubuntu.sh           # Ubuntu production
./deploy/azure/deploy-azure.sh  # Azure production
./deploy/gcp/deploy-gcp.sh   # GCP production
```

### **Local Development**
```bash
./deployment/local/setup-and-run.sh  # Complete local setup
./deployment/local/start-services.sh # Start services
./deployment/local/status.sh         # Check status
```

### **Testing**
```bash
./deployment/test-basic-apis-simple.sh  # Basic API tests
./deployment/create-test-data.sh        # Create test data
```

### **Troubleshooting**
```bash
./fix-database-setup.sh      # Fix database issues
./deployment/local/emergency-stop.sh    # Emergency stop
./deployment/monitoring/analyze-memory.sh  # Memory analysis
```

## 📈 **Script Complexity Analysis**

### **High Complexity** (Full system management)
- `setup-fresh-system.sh`
- `deployment/local/setup-and-run.sh`
- `deploy-ubuntu.sh`
- `backend/scripts/setup-complete-system.js`

### **Medium Complexity** (Service-specific)
- `start-system.sh`
- `manage-services.sh`
- `deployment/local/start-services.sh`
- `backend/setup-keycloak.js`

### **Low Complexity** (Single purpose)
- `deployment/test-basic-apis-simple.sh`
- `deployment/local/status.sh`
- `deployment/monitoring/cleanup-memory.sh`

## 🚨 **Redundancy Issues**

### **Duplicate Functionality**
1. **Multiple Keycloak Setup Scripts**:
   - `backend/setup-keycloak.js`
   - `backend/setup-keycloak-simple.js`
   - `backend/setup-keycloak-persistent.sh`
   - `deployment/setup-keycloak-https.sh`

2. **Multiple Service Start Scripts**:
   - `start-system.sh`
   - `deployment/local/start-services.sh`
   - `deployment/local/start-servers.sh`

3. **Multiple Test Scripts**:
   - `deployment/test-basic-apis.sh`
   - `deployment/test-basic-apis-simple.sh`

## 💡 **Recommendations**

### **Consolidation Needed**
1. **Merge duplicate Keycloak scripts** into single comprehensive script
2. **Consolidate service management** scripts
3. **Standardize test scripts** with clear naming conventions
4. **Create master script** that orchestrates all setup

### **Documentation Needed**
1. **Script dependency mapping**
2. **Execution order documentation**
3. **Prerequisites for each script**
4. **Error handling procedures**

### **Automation Opportunities**
1. **Script dependency checking**
2. **Automatic prerequisite installation**
3. **Health checks after script execution**
4. **Rollback procedures**

## 🎯 **Summary**

The project has **131+ setup and management scripts** across multiple categories. While this provides flexibility, it also creates complexity and potential for confusion. The recent configuration consolidation work is a good start, but similar consolidation could benefit the script ecosystem.

**Key Takeaway**: The system is very comprehensive but could benefit from script consolidation and better documentation to reduce complexity for new developers.
