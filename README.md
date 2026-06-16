# 🚀 Confidential AI Network

A comprehensive contract management system with multi-party authentication, **SCITT CCF Ledger integration**, confidential computing capabilities, and **differential privacy implementation**.

## 🏗️ Architecture

### Application Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React Frontend<br/>Port: 3000]
        B[SCITT CCF Dashboard<br/>Real-time Monitoring]
        C[Contract Management UI<br/>Role-based Dashboards]
    end
    
    subgraph "Backend Layer"
        D[Node.js Backend<br/>Port: 5001]
        E[Keycloak IAM<br/>Port: 8080]
        F[Contract Router Service<br/>SCITT CCF Only]
    end
    
    subgraph "SCITT CCF Layer"
        G[SCITT CCF Service<br/>Ledger Integration]
        H[TEE Provider<br/>Confidential Computing]
        I[Claims Management<br/>Contract Operations]
    end
    
    subgraph "Data Layer"
        J[PostgreSQL<br/>Port: 5432]
        K[SCITT CCF Ledger<br/>Port: 8000]
        L[System Health<br/>Monitoring & Metrics]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    D --> F
    F --> G
    G --> H
    G --> I
    G --> K
    D --> J
    D --> L
    
    style A fill:#e1f5fe
    style D fill:#f3e5f5
    style G fill:#e8f5e8
    style J fill:#fff3e0
    style K fill:#fce4ec
```

### OCI Deployment Architecture

For production on **Oracle Cloud Infrastructure (OCI)**, the system deploys across compartment-isolated environments (dev, test, staging, prod) with defense-in-depth edge security:

- **Edge**: WAF → API Gateway / Cloud Gate → Flexible Load Balancer
- **Compute**: OKE (Kubernetes) with private worker nodes and ingress
- **Data**: Autonomous Database (private endpoint), OCI Vault, Object Storage
- **Shared services**: OCIR, Cloud Guard, Bastion, centralized logging

```mermaid
flowchart TB
  subgraph Internet
    Users[Users / TDC TDP CCRP]
    Admins[Platform Admins]
  end

  subgraph DNS["OCI DNS / External DNS"]
    App_DNS[app.env.example.com]
    Auth_DNS[auth.env.example.com]
    Api_DNS[api.env.example.com]
  end

  subgraph Edge["cms-security-shared / cms-env-network"]
    WAF[OCI WAF]
    APIGW[OCI API Gateway]
    CG[Oracle Cloud Gate]
    LB[Flexible Load Balancer — private backends]
  end

  subgraph EnvProd["Compartment: cms-prod"]
    VCN_P[Prod VCN]
    OKE_P[OKE Cluster]
    ADB_P[Autonomous DB — private]
    Vault_P[OCI Vault]
  end

  subgraph Shared["Compartment: cms-shared-services"]
    OCIR[Container Registry]
    Logging[Logging / Audit]
    CloudGuard[Cloud Guard]
    Bastion[OCI Bastion]
  end

  Users --> App_DNS --> WAF
  Users --> Auth_DNS --> WAF
  Users --> Api_DNS --> WAF

  WAF -->|api.* host| APIGW --> LB
  WAF -->|app.* auth.* ops.*| CG --> LB
  LB --> OKE_P
  OKE_P --> ADB_P
  OKE_P --> Vault_P

  Admins --> Bastion --> OKE_P

  CloudGuard -. monitors .-> EnvProd
  OCIR --> OKE_P
```

**Traffic path (production):** DNS → WAF → API Gateway (`api.{env}`) or Cloud Gate (`app.{env}`, `auth.{env}`) → Load Balancer → OKE ingress → application pods. Database access uses Autonomous DB private endpoints only.

#### Compartments

Three-level compartment tree under a dedicated tenancy — one subtree per environment, never mixed in a single compartment:

```mermaid
flowchart TB
  Root[Tenancy / Root CMS Compartment]

  Root --> Sec[cms-security-shared<br/>WAF · Cloud Guard · SIEM]
  Root --> Net[cms-network-shared<br/>DRG · hub VCN · DNS]
  Root --> Shared[cms-shared-services<br/>OCIR · Terraform state · CI/CD]
  Root --> IdComp[cms-identity<br/>Identity Domain policies]

  Root --> Dev[cms-dev]
  Root --> Test[cms-test]
  Root --> Staging[cms-staging]
  Root --> Prod[cms-prod]

  Dev --> DevNet[cms-dev-network]
  Dev --> DevComp[cms-dev-compute]
  Dev --> DevData[cms-dev-data]
  Dev --> DevOps[cms-dev-ops]

  Test --> TestNet[cms-test-network]
  Test --> TestComp[cms-test-compute]
  Test --> TestData[cms-test-data]
  Test --> TestOps[cms-test-ops]

  Staging --> StgNet[cms-staging-network]
  Staging --> StgComp[cms-staging-compute]
  Staging --> StgData[cms-staging-data]
  Staging --> StgOps[cms-staging-ops]

  Prod --> ProdNet[cms-prod-network]
  Prod --> ProdComp[cms-prod-compute]
  Prod --> ProdData[cms-prod-data]
  Prod --> ProdOps[cms-prod-ops]
```

| Compartment | Resources |
|-------------|-----------|
| `cms-{env}-network` | VCN, subnets, NSGs, load balancer, service gateway |
| `cms-{env}-compute` | OKE cluster, node pools, Bastion |
| `cms-{env}-data` | Autonomous DB, Object Storage, Vault (Security Zone enforced in staging/prod) |
| `cms-{env}-ops` | Alarms, notifications, on-call integrations |

#### Identity Domains

Separate Identity Domain per environment (`cms-dev-id`, `cms-test-id`, `cms-staging-id`, `cms-prod-id`). Keycloak remains the application authorization source; Identity Domain provides enterprise SSO and MFA.

```mermaid
flowchart LR
  subgraph Workforce
    IdP[Corporate IdP<br/>Okta / Azure AD]
  end

  subgraph OCI["Per-environment Identity Domain"]
    ID[cms-env-id<br/>MFA · user lifecycle]
    Groups[TDC · TDP · CCRP · AppAdmin groups]
  end

  subgraph Edge
    CG[Cloud Gate<br/>app · auth · ops URLs]
  end

  subgraph App
    KC[Keycloak realm<br/>contract-management]
    SPA[React frontend]
    APIGW[API Gateway<br/>JWT validation]
    API[Backend API]
  end

  IdP -->|SAML/OIDC| ID
  ID --> Groups
  Groups --> CG
  CG --> SPA
  CG --> KC
  SPA -->|OIDC / PKCE| KC
  KC -->|Bearer JWT| APIGW
  APIGW --> API
```

| Environment | Identity Domain | Purpose |
|-------------|-----------------|---------|
| dev | `cms-dev-id` | Developer SSO, Keycloak sync testing |
| test | `cms-test-id` | QA automation, Playwright service accounts |
| staging | `cms-staging-id` | Pre-prod UAT, partner demos |
| prod | `cms-prod-id` | Production TDC / TDP / CCRP / AppAdmin users |

#### Network

One isolated VCN per environment with non-overlapping CIDRs. Private worker nodes; no compute in public subnets.

```mermaid
flowchart TB
  Internet[Internet]

  subgraph VCN["cms-env VCN (e.g. prod 10.40.0.0/16)"]
    IGW[Internet Gateway]

    subgraph Public["Public subnets (2+ ADs)"]
      WAF_LB[WAF / LB listeners only]
    end

    subgraph DMZ["DMZ / Edge subnets (optional)"]
      APIGW_N[API Gateway]
      CG_N[Cloud Gate connector]
    end

    subgraph AppTier["Private app subnets"]
      OKE[OKE worker nodes<br/>pod CIDR 10.247.0.0/16]
    end

    subgraph DataTier["Private data subnets"]
      ADB[Autonomous DB<br/>private endpoint only]
    end

    NAT[NAT Gateway]
    SGW[Service Gateway]
  end

  Internet --> IGW --> WAF_LB
  WAF_LB --> DMZ --> AppTier
  AppTier --> DataTier
  AppTier -->|egress 0.0.0.0/0| NAT --> Internet
  AppTier -->|OCI APIs · Object Storage| SGW
```

| Environment | VCN CIDR | OKE pod CIDR | Service CIDR |
|-------------|----------|--------------|--------------|
| dev | `10.10.0.0/16` | `10.244.0.0/16` | `10.96.0.0/16` |
| test | `10.20.0.0/16` | `10.245.0.0/16` | `10.97.0.0/16` |
| staging | `10.30.0.0/16` | `10.246.0.0/16` | `10.98.0.0/16` |
| prod | `10.40.0.0/16` | `10.247.0.0/16` | `10.99.0.0/16` |

NSGs (`nsg-lb-ingress`, `nsg-oke-workers`, `nsg-adb`) use default-deny with explicit allow rules. Admin access via OCI Bastion only — no SSH from the internet.

#### Security Zones

Security Zones apply to `cms-prod-data` and `cms-staging-data` compartments to enforce guardrails at the infrastructure layer:

```mermaid
flowchart TB
  subgraph SZ["Security Zone — cms-prod-data / cms-staging-data"]
    direction TB
    P1[Deny public Object Storage buckets]
    P2[Deny compute instances in public subnets]
    P3[Deny DB systems without encryption]
    P4[Require Vault for secret creation]
  end

  subgraph Monitored["Also monitored by Cloud Guard"]
    CG2[Public bucket ACL changes]
    CG3[Open security lists · crypto mining]
    CG4[Overly permissive IAM policies]
  end

  DataComp[cms-env-data compartment] --> SZ
  DataComp -.-> Monitored
```

| Environment | Security Zone | WAF mode | MFA |
|-------------|---------------|----------|-----|
| dev | Optional | Log only | Off |
| test | Optional | Block | Optional |
| staging | **Required** on data compartment | Block | Admins |
| prod | **Required** on data compartment | Block + bot mgmt | All users |

| Topic | Documentation |
|-------|---------------|
| OCI security architecture & setup runbook | [docs/production/OCI_SECURITY_ARCHITECTURE.md](docs/production/OCI_SECURITY_ARCHITECTURE.md) |
| IAM, Cloud Gate, API Gateway, WAF | [docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md](docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md) |
| Terraform (OKE, ADB, LB, OCIR) | [deployment/oci/terraform/README.md](deployment/oci/terraform/README.md) |
| OCI readiness & rollout phases | [docs/deployment/OCI_READINESS.md](docs/deployment/OCI_READINESS.md) |

## 🚀 Quick Start

### **Local Development**
```bash
# ✅ CURRENT - Start everything properly (SCITT CCF only)
./start-system.sh                    # Main system startup (replaces start-system-scitt-ccf.sh)

# ✅ CURRENT - Manage SCITT CCF services
./manage-scitt-ccf.sh start
./manage-scitt-ccf.sh status
./manage-scitt-ccf.sh test

# ✅ CURRENT - Check system health
npm run status

# ✅ CURRENT - Test authentication
npm run test:login
```

### **🔧 Configuration & Fixes**
```bash
# ✅ CURRENT - Unified authentication fix
./fix-auth.sh                       # or ./scripts/fix-auth-unified.sh

# ✅ CURRENT - SSL configuration fix (NEW)
./scripts/fix-ssl-inconsistencies.sh # Fix SSL configuration issues

# ✅ CURRENT - Centralized configuration (NEW)
./scripts/config-loader.js           # Load configurations from config/system.env
```

### **Production Deployment**
```bash
# Ubuntu VM deployment (interactive)
./deployment/deploy-to-ubuntu-vm.sh

# Ubuntu VM deployment (quick)
./deployment/quick-deploy-ubuntu.sh yourdomain.com

# Local VM development environment
./deployment/deploy-to-local-vm.sh
```

## 📁 Repository layout

| Path | Purpose |
|------|---------|
| `docker/` | Docker Compose stacks and Dockerfiles |
| `scripts/` | Startup, deploy, SCITT, dev, and utility scripts — see [scripts/README.md](scripts/README.md) |
| `fixtures/` | Contract templates and test-data JSON samples |
| `config/examples/` | Example env files (copy to repo root as `config.env`, `.env`, etc.) |
| `docs/` | Documentation index — [docs/README.md](docs/README.md) |

Root wrappers (`start-system.sh`, `manage-scitt-ccf.sh`, `dev-start.sh`, `fix-auth.sh`) call into `scripts/`.

## 🔐 LUKS Encryption for Large Files

The system implements **intelligent encryption** that automatically selects the optimal method based on file size:

- **Small Files (< 100MB)**: In-memory encryption for fast processing
- **Medium Files (100MB-1GB)**: Streaming encryption for memory efficiency  
- **Large Files (> 1GB)**: **LUKS encryption** with hardware acceleration

### **LUKS Benefits for Large Datasets**
- **Hardware Acceleration**: 10x+ performance using CPU AES-NI instructions
- **Memory Efficient**: 64KB blocks regardless of file size
- **Industry Standard**: Widely used, audited, and trusted
- **Training Integration**: Seamless decryption in TEE environments

### **Quick LUKS Setup**
```bash
# Test LUKS encryption capabilities
curl -X GET http://localhost:5001/api/enhanced-encryption/methods

# Encrypt large file (auto-selects LUKS for > 1GB)
curl -X POST http://localhost:5001/api/enhanced-encryption/encrypt-file \
  -H "Authorization: Bearer <token>" \
  -F "file=@large_dataset.zip" \
  -F "dataType=TRAINING_DATA"
```

## 🔗 SCITT CCF Integration

The system is built on **Microsoft's SCITT CCF Ledger** for high-performance, confidential computing contract management.

### **Key Features**
- **High Performance**: 10-100x throughput improvement over traditional blockchain systems
- **Confidential Computing**: Hardware-level TEE (Trusted Execution Environment) support
- **Standards Compliance**: IETF SCITT working group standards
- **Enterprise Ready**: Production-grade infrastructure and security
- **Zero Downtime**: Continuous service with automatic failover

### **Quick SCITT CCF Setup**

```bash
# Setup SCITT CCF integration
./manage-scitt-ccf.sh setup

# Start SCITT CCF services
./manage-scitt-ccf.sh start

# Test SCITT CCF integration
./manage-scitt-ccf.sh test

# Check SCITT CCF status
./manage-scitt-ccf.sh status
```

### **Migration Modes**

The system now operates in **SCITT CCF only** mode for simplified architecture:

- **`SCITT_CCF_ONLY`**: Use only SCITT CCF Ledger (Current)
- **Legacy Support**: Traditional blockchain support has been removed for cleaner SCITT CCF architecture


## 🧪 Testing

### **Frontend E2E (Playwright)**

From `frontend/`:

```bash
npm run test:e2e:install    # browsers (once)
npm run test:e2e:chromium   # fast single-browser run
```

The **backend must be up** (`http://localhost:5001/health` or `BACKEND_URL` in `config.env`). Global setup **fails fast** if the API is unreachable (no more silent runs against a dead server).

**Docs:** [frontend/tests/e2e/README.md](frontend/tests/e2e/README.md)

**Backend unit (TDC helpers):**

```bash
cd backend && npm run test:unit -- --testPathPattern=tdc-training-helpers
```

### **Updated Test Suites for SCITT CCF**

The backend test suites have been completely updated to include SCITT CCF integration:

```bash
# Run SCITT CCF integration tests
npm test -- --testPathPattern="scitt-ccf"

# Run all tests including SCITT CCF
npm test

# Run specific SCITT CCF tests
npm test -- scitt-ccf-integration.test.js
npm test -- scitt-ccf-api.test.js
```

**Test Coverage Includes:**
- **SCITT CCF Service Tests**: Service initialization, connection, contract creation
- **Contract Router Tests**: Simplified routing to SCITT CCF only
- **System Health Tests**: SCITT CCF health monitoring
- **API Endpoint Tests**: All SCITT CCF API endpoints

## 📚 Documentation

All documentation is organized under **[docs/README.md](docs/README.md)** (single index).

| Topic | Link |
|-------|------|
| Quick start | [docs/getting-started/QUICK_START.md](docs/getting-started/QUICK_START.md) |
| Developer guide | [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) |
| User / admin | [docs/USER_GUIDE.md](docs/USER_GUIDE.md) · [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| API | [docs/api/API_REFERENCE.md](docs/api/API_REFERENCE.md) |
| Contract signing | [docs/features/contract-signing/](docs/features/contract-signing/CONTRACT_SIGNING_INDEX.md) |
| SCITT CCF | [docs/features/scitt/](docs/features/scitt/SCITT_CCF_INTEGRATION_README.md) |
| Training | [docs/training/](docs/training/README.md) |
| Deploy (VM / OCI / K8s) | [docs/deployment/README.md](docs/deployment/README.md) |
| Production / OCI security | [docs/production/](docs/production/README.md) |
| Testing & E2E | [docs/testing/](docs/testing/TEST_DATA_FOR_TESTERS.md) · [frontend/tests/e2e/README.md](frontend/tests/e2e/README.md) |

Legacy paths at the repo root and under `docs/` redirect to the locations above.

## 🚀 Features

### **Core Contract Management**
- **Multi-Party Contracts**: TDP, TDC, CCRP workflow support
- **Ricardian Contracts**: Human-readable + machine-executable contracts
- **Contract Lifecycle**: Complete contract management from creation to completion
- **Role-Based Access**: Secure access control for all user types

### **SCITT CCF Integration**
- **High-Performance Ledger**: Microsoft's SCITT CCF implementation
- **Confidential Computing**: TEE support for secure data processing
- **Supply Chain Transparency**: Immutable audit trail for all operations
- **Enterprise Security**: Hardware-level security and attestation

### **Advanced Features**
- **TDC training jobs**: Start training from a **signed** contract (`/tdc/training`), simulated runs by default (`TRAINING_SIMULATION_MODE`), optional **register trained model** for inference (`POST /api/tdc/training/jobs/:jobId/register-model`). See **[docs/training/TDC_TRAINING_RUNTIME.md](docs/training/TDC_TRAINING_RUNTIME.md)**.
- **CCRP training console**: Deploy/monitor jobs via **`/api/ccrp/training/...`** and UI at **`/ccrp/training-environment`**.
- **Digital Contract Signing**: Secure digital signature generation and verification
- **Key Management**: Multi-algorithm key generation and management (ECDSA-P256, RSA-2048, RSA-4096)
- **SCITT CCF Integration**: Immutable signature storage and verification
- **Differential Privacy**: Privacy-preserving data analytics
- **Multi-Cloud Support**: AWS, Azure, GCP, OCI integration
- **Global Deployment**: Multi-jurisdiction deployment support
- **Real-Time Monitoring**: System health and performance monitoring

## 🚀 Deployment Options

### **Local Development Environment**
- **Quick Setup**: `./deployment/deploy-to-local-vm.sh` - Complete local environment
- **VirtualBox Guide**: `deployment/LOCAL_VM_QUICK_START.md` - 10-minute setup
- **Comprehensive Guide**: `deployment/LOCAL_VM_SETUP_GUIDE.md` - Detailed instructions

### **Production Ubuntu VM Deployment**
- **Interactive Setup**: `./deployment/deploy-to-ubuntu-vm.sh` - Step-by-step production deployment
- **Quick Deployment**: `./deployment/quick-deploy-ubuntu.sh` - One-command deployment
- **Manual Guide**: `deployment/UBUNTU_VM_DEPLOYMENT_GUIDE.md` - Complete production setup

### **Deployment Features**
- ✅ **HTTPS/SSL**: Let's Encrypt certificates with Nginx reverse proxy
- ✅ **Keycloak IAM**: Complete identity management with persistent configuration
- ✅ **SCITT CCF Integration**: High-performance ledger infrastructure for secure contracts
- ✅ **Firewall & Security**: UFW firewall with secure port configuration
- ✅ **Backup & Monitoring**: Automated backups and health checks
- ✅ **Local Development**: Full development environment in VM

## 🏗️ Technology Stack

### **Backend**
- **Runtime**: Node.js 18+ with Express.js
- **Database**: PostgreSQL 15+ with Sequelize ORM
- **Authentication**: Keycloak IAM integration
- **Ledger**: SCITT CCF Ledger (Microsoft)

### **Frontend**
- **Framework**: React.js 18+ with Material-UI
- **State Management**: React Context + Hooks
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors

### **Infrastructure**
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes ready
- **Monitoring**: Built-in health monitoring
- **Security**: TEE integration, encryption, attestation

## 🔧 Development

### **Prerequisites**
- Node.js 18+ and npm
- PostgreSQL 15+
- Docker and Docker Compose
- SCITT CCF Ledger

### **Setup**
```bash
# Clone repository
git clone <repository-url>
cd ContractManagement

# Install dependencies
npm install

# ✅ CURRENT - Setup environment (NEW centralized config)
cp config/system.env.example config/system.env
# Edit config/system.env with your settings

# ✅ CURRENT - Start services
./start-system.sh                    # Main system startup

# ✅ CURRENT - Run tests
npm test
```

### **🔧 Configuration Management**
```bash
# ✅ CURRENT - Use centralized configuration
./scripts/config-loader.js           # Load from config/system.env

# ✅ CURRENT - Fix common issues
./scripts/fix-auth-unified.sh       # Authentication issues
./scripts/fix-ssl-inconsistencies.sh # SSL configuration issues

# ✅ CURRENT - Clean up outdated scripts
./scripts/cleanup-outdated-scripts.sh # Remove outdated files
```

## 📊 System Status

```bash
# Check system health
npm run status

# Check SCITT CCF status
./manage-scitt-ccf.sh status

# View logs
docker-compose logs -f
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs folder](docs/README.md) for comprehensive guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions

---

**Built with ❤️ using Microsoft's SCITT CCF Ledger technology** 