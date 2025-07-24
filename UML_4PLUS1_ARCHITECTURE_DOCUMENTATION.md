# UML 4+1 View Architecture Documentation
## Contract Management System

**Document Version:** 2.0  
**Date:** December 2024  
**Author:** Contract Management System Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Use Case View (+1)](#use-case-view-1)
3. [Logical View](#logical-view)
4. [Development View](#development-view)
5. [Process View](#process-view)
6. [Physical View](#physical-view)
7. [Stakeholder Mapping](#stakeholder-mapping)
8. [Implementation Guidelines](#implementation-guidelines)

---

## 1. Executive Summary

### 1.1 Overview
This document provides a comprehensive UML 4+1 View Architecture for the Contract Management System, covering all aspects from user interactions to deployment infrastructure. The system supports enterprise registration, DID-based identity management, cryptographic contract signing, multi-party contract execution, and **real cloud infrastructure provisioning with CCRP-specific credentials**.

### 1.2 Key Components
- **Frontend**: React-based user interface with role-based dashboards
- **Backend**: Node.js/Express API with microservices architecture
- **Identity Management**: Keycloak IAM integration
- **Blockchain**: Ethereum-based contract recording
- **Database**: PostgreSQL with Redis caching
- **Security**: HSM/KMS integration for cryptographic operations
- **Cloud Infrastructure**: **Real Azure SDK integration with multi-tenant CCRP credential management**
- **Training Environment**: **Real container deployment with Azure Container Instances**

### 1.3 Target Users
- **TDP (Training Data Provider)**: Dataset and model management
- **TDC (Training Data Consumer)**: Contract creation and management
- **CCRP (Confidential Clean Room Provider)**: **Compliance, resource monitoring, and real infrastructure provisioning**
- **AppAdmin**: System administration and oversight

### 1.4 **New Features (v2.0)**
- **Real Azure Infrastructure**: Actual Azure SDK integration replacing mock services
- **CCRP-Specific Credentials**: Multi-tenant Azure credential management per CCRP
- **Encrypted Credential Storage**: AES-256-CBC encrypted client secrets
- **Contract-Specific Configuration**: Contract overrides for CCRP Azure defaults
- **Real Training Execution**: Actual container deployment with Azure Container Instances
- **Cost Management**: Per-CCRP and per-contract budget tracking
- **Multi-Tenant Security**: CCRP isolation with independent Azure subscriptions

---

## 2. Use Case View (+1)

### 2.1 Actors
- **TDP (Training Data Provider)**
- **TDC (Training Data Consumer)**
- **CCRP (Confidential Clean Room Provider)**
- **AppAdmin**
- **Keycloak IAM**
- **Blockchain**
- **External Auditors**
- **Azure Cloud Services** (New)
- **Azure Container Instances** (New)

### 2.2 Major Use Cases
- Register/Onboard as Enterprise
- Login/Authenticate
- Manage Profile & DIDs
- Create/Manage Datasets
- Create/Manage AI Models
- Create Contract
- Sign Contract (multi-party)
- Verify Contract
- **Manage CCRP Azure Credentials** (New)
- **Provision Real Infrastructure** (New)
- **Deploy Training Containers** (New)
- **Monitor Real Resource Usage** (New)
- **Track Real Costs** (New)
- Notification & Audit Trail
- Administer System

### 2.3 Use Case Diagram

```mermaid
graph TD
    %% Actors (stick figures in UML)
    TDP((TDP))
    TDC((TDC))
    CCRP((CCRP))
    AppAdmin((AppAdmin))
    Azure((Azure Cloud))
    
    %% Use Cases (ovals in UML)
    UC1[Register/Onboard]
    UC2[Manage Datasets]
    UC3[Manage Models]
    UC4[Create Contract]
    UC5[Sign Contract]
    UC6[Verify Contract]
    UC7[Authenticate]
    UC8[Administer System]
    UC9[Monitor Usage]
    UC10[Generate Notifications]
    UC11[Create Audit Trail]
    UC12[Record on Blockchain]
    UC13[Manage CCRP Credentials]
    UC14[Provision Infrastructure]
    UC15[Deploy Training Containers]
    UC16[Track Real Costs]
    
    %% System Boundary
    subgraph System["Contract Management System"]
        UC1
        UC2
        UC3
        UC4
        UC5
        UC6
        UC7
        UC8
        UC9
        UC10
        UC11
        UC12
        UC13
        UC14
        UC15
        UC16
    end
    
    %% Actor connections to use cases
    TDP --> UC2
    TDP --> UC5
    TDP --> UC7
    
    TDC --> UC4
    TDC --> UC5
    TDC --> UC7
    
    CCRP --> UC9
    CCRP --> UC13
    CCRP --> UC14
    CCRP --> UC15
    CCRP --> UC16
    CCRP --> UC7
    
    AppAdmin --> UC8
    AppAdmin --> UC7
    
    Azure --> UC14
    Azure --> UC15
    Azure --> UC16
```

---

## 3. Logical View

### 3.1 System Components

```mermaid
graph TB
    %% Frontend Layer
    subgraph Frontend
        ReactApp[React Application]
        UserDashboard[User Dashboard]
        ContractForm[Contract Form]
        SigningModal[Signing Modal]
        APIService[API Service]
        TokenManager[Token Manager]
        ES256Signer[ES256 Signer]
    end
    
    %% Backend Services
    subgraph Backend
        AuthService[Auth Service]
        UserService[User Service]
        DIDService[DID Service]
        DatasetService[Dataset Service]
        ModelService[Model Service]
        ContractService[Contract Service]
        SigningService[Signing Service]
        NotificationService[Notification Service]
        AuditService[Audit Service]
        AdminService[Admin Service]
        InfrastructureService[Infrastructure Service]
        TrainingService[Training Service]
        CCRPAzureCredentialsService[CCRP Azure Credentials Service]
    end
    
    %% External Services
    class KeycloakIAM
    class BlockchainService
    class Database
    class MonitoringService
    class AzureCloud[Azure Cloud Services]
    
    %% Frontend connections to services
    Frontend --> AuthService
    Frontend --> UserService
    Frontend --> DIDService
    Frontend --> DatasetService
    Frontend --> ModelService
    Frontend --> ContractService
    Frontend --> NotificationService
    Frontend --> AuditService
    Frontend --> AdminService
    Frontend --> InfrastructureService
    Frontend --> TrainingService
    Frontend --> CCRPAzureCredentialsService

    %% Service dependencies arranged vertically
    AuthService --> KeycloakIAM
    UserService --> Database
    DIDService --> Database
    DatasetService --> Database
    ModelService --> Database
    ContractService --> Database
    ContractService --> BlockchainService
    SigningService --> DIDService
    SigningService --> BlockchainService
    NotificationService --> Database
    AuditService --> Database
    AdminService --> Database
    MonitoringService --> Database
    InfrastructureService --> AzureCloud
    TrainingService --> AzureCloud
    CCRPAzureCredentialsService --> Database
    CCRPAzureCredentialsService --> AzureCloud
```

### 3.2 **New Azure Integration Components**

```mermaid
graph TB
    subgraph "Azure Infrastructure Layer"
        AzureProvider[Azure Provider]
        CCRPCredentials[CCRP Credentials]
        ContractConfig[Contract Configuration]
    end
    
    subgraph "Azure Services"
        ResourceManager[Azure Resource Manager]
        ContainerInstances[Azure Container Instances]
        StorageBlob[Azure Storage Blob]
        KeyVault[Azure Key Vault]
        MLWorkspace[Azure ML Workspace]
        Monitor[Azure Monitor]
    end
    
    subgraph "Infrastructure Components"
        VNet[Virtual Network]
        VM[Virtual Machines]
        Storage[Storage Accounts]
        Database[SQL Database]
        Security[Network Security Groups]
    end
    
    InfrastructureService --> AzureProvider
    TrainingService --> AzureProvider
    CCRPAzureCredentialsService --> CCRPCredentials
    
    AzureProvider --> ResourceManager
    AzureProvider --> ContainerInstances
    AzureProvider --> StorageBlob
    AzureProvider --> KeyVault
    AzureProvider --> MLWorkspace
    AzureProvider --> Monitor
    
    ResourceManager --> VNet
    ResourceManager --> VM
    ResourceManager --> Storage
    ResourceManager --> Database
    ResourceManager --> Security
    
    CCRPCredentials --> ContractConfig
    ContractConfig --> AzureProvider
```

---

## 4. Development View

### 4.1 Code/Module Structure

#### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── dashboards/
│   │   ├── forms/
│   │   ├── modals/
│   │   └── common/
│   ├── pages/
│   │   ├── dashboards/
│   │   ├── contracts/
│   │   ├── datasets/
│   │   └── admin/
│   ├── services/
│   │   ├── api.js
│   │   └── tokenManager.js
│   └── utils/
│       └── es256sign.js
├── public/
└── package.json
```

#### Backend Structure
```
backend/
├── routes/
│   ├── auth.js
│   ├── contracts.js
│   ├── datasets.js
│   ├── ai-models.js
│   ├── ccrp.js
│   ├── tdp.js
│   ├── tdc.js
│   ├── admin.js
│   └── training.js
├── models/
│   ├── User.js
│   ├── Contract.js
│   ├── Dataset.js
│   ├── AIModel.js
│   ├── Notification.js
│   ├── AuditLog.js
│   ├── CCRPAzureCredentials.js
│   └── TrainingJob.js
├── services/
│   ├── authService.js
│   ├── didService.js
│   ├── blockchainService.js
│   ├── auditService.js
│   ├── notificationService.js
│   ├── signingService.js
│   ├── infrastructureService.js
│   ├── trainingService.js
│   └── ccrpAzureCredentialsService.js
├── providers/
│   ├── azureProvider.js
│   ├── awsProvider.js
│   └── gcpProvider.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
└── scripts/
    ├── migrations/
    └── test-data/
```

### 4.2 Module Structure Diagram

```mermaid
graph TD
    subgraph Frontend
      F1[components]
      F2[pages]
      F3[services]
      F4[utils]
    end
    subgraph Backend
      B1[routes]
      B2[models]
      B3[services]
      B4[providers]
      B5[middleware]
      B6[scripts]
    end
    subgraph Azure
      A1[Azure SDK]
      A2[Azure Provider]
      A3[CCRP Credentials]
    end
    F1 --> F2
    F2 --> F3
    F3 --> F4
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5
    B5 --> B6
    F3 -- API --> B1
    B3 --> A1
    A1 --> A2
    A2 --> A3
```

---

## 5. Process View

### 5.1 Key Processes & Interactions

#### User Registration/Onboarding
- `frontend/src/pages/UserRegistration.js`
- `backend/routes/auth.js`

#### Authentication (JWT, Keycloak)
- `backend/middleware/auth.js`
- `backend/services/***REMOVED-KEYCLOAK_DB_PASSWORD***Service.js`

#### Contract Creation & Multi-Party Signing
- `frontend/src/pages/Contracts.js`
- `backend/routes/contracts.js`
- `backend/services/signingService.js`

#### DID Resolution & Verification
- `backend/services/didService.js`

#### Blockchain Transaction
- `backend/services/blockchainService.js`

#### Notification Dispatch
- `backend/services/notificationService.js`

#### Audit Logging
- `backend/services/auditService.js`

#### Resource Monitoring (CCRP)
- `frontend/src/pages/dashboards/CCRPDashboard.js`
- `backend/routes/ccrp.js`

#### **Real Infrastructure Provisioning** (New)
- `backend/services/infrastructureService.js`
- `backend/routes/training.js`

### 5.2 **New Azure Infrastructure Provisioning Process**

```mermaid
sequenceDiagram
    participant CCRP as CCRP User
    participant FE as Frontend
    participant BE as Backend
    participant KC as Keycloak
    participant DB as Database
    participant Azure as Azure Cloud
    participant Monitor as Azure Monitor

    CCRP->>FE: Login & Navigate to Infrastructure
    FE->>BE: GET /api/auth/profile
    BE->>KC: Verify JWT Token
    KC-->>BE: User Info
    BE-->>FE: User Profile
    FE-->>CCRP: Show Infrastructure Dashboard
    
    CCRP->>FE: Configure Azure Credentials
    FE->>BE: POST /api/ccrp/azure-credentials
    BE->>DB: Store Encrypted Credentials
    DB-->>BE: Credentials Stored
    BE->>Azure: Validate Credentials
    Azure-->>BE: Validation Result
    BE-->>FE: Credentials Validated
    FE-->>CCRP: Show Validation Status
    
    CCRP->>FE: Create Training Environment
    FE->>BE: POST /api/infrastructure/provision
    BE->>DB: Get CCRP Credentials
    DB-->>BE: Encrypted Credentials
    BE->>Azure: Create Resource Group
    Azure-->>BE: Resource Group Created
    BE->>Azure: Create Virtual Network
    Azure-->>BE: VNet Created
    BE->>Azure: Create Virtual Machines
    Azure-->>BE: VMs Created
    BE->>Azure: Create Storage Account
    Azure-->>BE: Storage Created
    BE->>Azure: Create Key Vault
    Azure-->>BE: Key Vault Created
    BE->>Azure: Create ML Workspace
    Azure-->>BE: ML Workspace Created
    BE->>Monitor: Setup Monitoring
    Monitor-->>BE: Monitoring Configured
    BE-->>FE: Infrastructure Provisioned
    FE-->>CCRP: Show Infrastructure Status
```

### 5.3 **Real Training Container Deployment Process**

```mermaid
sequenceDiagram
    participant TDC as TDC User
    participant FE as Frontend
    participant BE as Backend
    participant Azure as Azure Container Instances
    participant Storage as Azure Storage
    participant Monitor as Azure Monitor

    TDC->>FE: Start Training Job
    FE->>BE: POST /api/training/start
    BE->>Azure: Create Container Group
    Azure-->>BE: Container Group Created
    BE->>Storage: Mount Training Data
    Storage-->>BE: Data Mounted
    BE->>Azure: Start Container
    Azure-->>BE: Container Started
    BE->>Monitor: Setup Logging
    Monitor-->>BE: Logging Configured
    BE-->>FE: Training Started
    FE-->>TDC: Show Training Status
    
    Azure->>Monitor: Send Container Logs
    Monitor->>BE: Forward Logs
    BE->>FE: Update Training Progress
    FE-->>TDC: Show Real-time Progress
    
    Azure->>BE: Training Complete
    BE->>Storage: Save Results
    Storage-->>BE: Results Saved
    BE->>Azure: Stop Container
    Azure-->>BE: Container Stopped
    BE-->>FE: Training Complete
    FE-->>TDC: Show Results
```

---

## 6. Physical View

### 6.1 **Updated Infrastructure Architecture**

#### 6.1.1 **Multi-Cloud Deployment Architecture**

```mermaid
graph TB
    subgraph "Load Balancer Layer"
        LB1[Load Balancer 1]
        LB2[Load Balancer 2]
    end
    
    subgraph "Application Layer"
        BE1[Backend 1]
        BE2[Backend 2]
        BE3[Backend 3]
        BE4[Backend 4]
        FE1[Frontend 1]
        FE2[Frontend 2]
    end
    
    subgraph "Azure Cloud Infrastructure"
        AzureRG1[Resource Group 1 - CCRP1]
        AzureRG2[Resource Group 2 - CCRP2]
        AzureRG3[Resource Group 3 - CCRP3]
    end
    
    subgraph "Azure Services"
        ACI1[Container Instances 1]
        ACI2[Container Instances 2]
        Storage1[Storage Account 1]
        Storage2[Storage Account 2]
        KV1[Key Vault 1]
        KV2[Key Vault 2]
        ML1[ML Workspace 1]
        ML2[ML Workspace 2]
    end
    
    LB1 --> BE1
    LB1 --> BE2
    LB2 --> BE3
    LB2 --> BE4
    
    BE1 --> AzureRG1
    BE2 --> AzureRG2
    BE3 --> AzureRG3
    BE4 --> AzureRG1
    
    AzureRG1 --> ACI1
    AzureRG1 --> Storage1
    AzureRG1 --> KV1
    AzureRG1 --> ML1
    
    AzureRG2 --> ACI2
    AzureRG2 --> Storage2
    AzureRG2 --> KV2
    AzureRG2 --> ML2
```

#### 6.1.2 **CCRP Credential Management Architecture**

```mermaid
graph TB
    subgraph "CCRP Users"
        CCRP1[CCRP User 1]
        CCRP2[CCRP User 2]
        CCRP3[CCRP User 3]
    end
    
    subgraph "Application Layer"
        BE[Backend Service]
        Auth[Authentication Service]
    end
    
    subgraph "Database Layer"
        DB[(PostgreSQL Database)]
        Credentials[(CCRP Credentials Table)]
        Contracts[(Contracts Table)]
    end
    
    subgraph "Azure Subscriptions"
        Sub1[Azure Subscription 1]
        Sub2[Azure Subscription 2]
        Sub3[Azure Subscription 3]
    end
    
    CCRP1 --> BE
    CCRP2 --> BE
    CCRP3 --> BE
    
    BE --> Auth
    Auth --> DB
    BE --> Credentials
    BE --> Contracts
    
    BE --> Sub1
    BE --> Sub2
    BE --> Sub3
```

#### 6.1.3 **Real Training Environment Architecture**

```mermaid
graph TB
    subgraph "Training Jobs"
        Job1[Training Job 1]
        Job2[Training Job 2]
        Job3[Training Job 3]
    end
    
    subgraph "Azure Container Instances"
        Container1[Training Container 1]
        Container2[Training Container 2]
        Container3[Training Container 3]
    end
    
    subgraph "Azure Storage"
        Blob1[Training Data Blob 1]
        Blob2[Training Data Blob 2]
        Blob3[Training Data Blob 3]
        Results1[Results Blob 1]
        Results2[Results Blob 2]
        Results3[Results Blob 3]
    end
    
    subgraph "Azure Monitoring"
        Monitor1[Azure Monitor 1]
        Monitor2[Azure Monitor 2]
        Monitor3[Azure Monitor 3]
        Logs1[Log Analytics 1]
        Logs2[Log Analytics 2]
        Logs3[Log Analytics 3]
    end
    
    Job1 --> Container1
    Job2 --> Container2
    Job3 --> Container3
    
    Container1 --> Blob1
    Container2 --> Blob2
    Container3 --> Blob3
    
    Container1 --> Results1
    Container2 --> Results2
    Container3 --> Results3
    
    Container1 --> Monitor1
    Container2 --> Monitor2
    Container3 --> Monitor3
    
    Monitor1 --> Logs1
    Monitor2 --> Logs2
    Monitor3 --> Logs3
```

#### 6.1.4 **Security & Identity Layer**

```mermaid
graph TB
    subgraph "Backend Containers"
        BE1[Backend 1]
        BE2[Backend 2]
        BE3[Backend 3]
        BE4[Backend 4]
    end
    
    subgraph "Identity Management"
        KC1[Keycloak Container 1]
        KC2[Keycloak Container 2]
        KC_DB[(Keycloak Database)]
    end
    
    subgraph "Security Services"
        WAF[Web Application Firewall]
        VPN[VPN Gateway]
        HSM[Hardware Security Module]
        KMS[Key Management Service]
        AzureKV[Azure Key Vault]
    end
    
    subgraph "Azure Security"
        AzureAD[Azure Active Directory]
        AzureRBAC[Azure RBAC]
        AzureEncryption[Azure Encryption]
    end
    
    BE1 --> KC1
    BE2 --> KC2
    BE3 --> KC1
    BE4 --> KC2
    
    KC1 --> KC_DB
    KC2 --> KC_DB
    
    BE1 --> HSM
    BE2 --> HSM
    BE3 --> HSM
    BE4 --> HSM
    
    BE1 --> KMS
    BE2 --> KMS
    BE3 --> KMS
    BE4 --> KMS
    
    BE1 --> AzureKV
    BE2 --> AzureKV
    BE3 --> AzureKV
    BE4 --> AzureKV
    
    WAF --> BE1
    WAF --> BE2
    WAF --> BE3
    WAF --> BE4
    
    VPN --> HSM
    VPN --> KMS
    VPN --> AzureKV
    
    AzureAD --> AzureRBAC
    AzureRBAC --> AzureEncryption
```

#### 6.1.5 **Monitoring & External Services**

```mermaid
graph TB
    subgraph "Backend Containers"
        BE1[Backend 1]
        BE2[Backend 2]
        BE3[Backend 3]
        BE4[Backend 4]
    end
    
    subgraph "Monitoring Stack"
        Prometheus[Prometheus]
        Grafana[Grafana]
        AlertManager[Alert Manager]
        ELK[ELK Stack]
    end
    
    subgraph "Azure Monitoring"
        AzureMonitor[Azure Monitor]
        AzureLogs[Azure Log Analytics]
        AzureMetrics[Azure Metrics]
        AzureAlerts[Azure Alerts]
    end
    
    subgraph "Blockchain Services"
        ETH_NODE[Ethereum Node]
        BC_MONITOR[Blockchain Monitor]
    end
    
    subgraph "External Services"
        Email[Email Service]
        SMS[SMS Service]
        Audit[External Audit]
    end
    
    BE1 --> Prometheus
    BE2 --> Prometheus
    BE3 --> Prometheus
    BE4 --> Prometheus
    
    Prometheus --> Grafana
    Prometheus --> AlertManager
    
    BE1 --> ELK
    BE2 --> ELK
    BE3 --> ELK
    BE4 --> ELK
    
    BE1 --> AzureMonitor
    BE2 --> AzureMonitor
    BE3 --> AzureMonitor
    BE4 --> AzureMonitor
    
    AzureMonitor --> AzureLogs
    AzureMonitor --> AzureMetrics
    AzureMonitor --> AzureAlerts
    
    BE1 --> ETH_NODE
    BE2 --> ETH_NODE
    BE3 --> ETH_NODE
    BE4 --> ETH_NODE
    
    ETH_NODE --> BC_MONITOR
    
    BE1 --> Email
    BE2 --> Email
    BE3 --> Email
    BE4 --> Email
    
    BE1 --> SMS
    BE2 --> SMS
    BE3 --> SMS
    BE4 --> SMS
    
    BE1 --> Audit
    BE2 --> Audit
    BE3 --> Audit
    BE4 --> Audit
```

### 6.2 **Updated Deployment Configuration**

#### Container Orchestration (Kubernetes)
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: contract-management-backend
spec:
  replicas: 4
  selector:
    matchLabels:
      app: contract-management-backend
  template:
    metadata:
      labels:
        app: contract-management-backend
    spec:
      containers:
      - name: backend
        image: contract-management:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: KEYCLOAK_URL
          valueFrom:
            secretKeyRef:
              name: ***REMOVED-KEYCLOAK_DB_PASSWORD***-secret
              key: url
        - name: HSM_URL
          valueFrom:
            secretKeyRef:
              name: hsm-secret
              key: url
        - name: AZURE_SUBSCRIPTION_ID
          valueFrom:
            secretKeyRef:
              name: azure-secret
              key: subscription-id
        - name: AZURE_TENANT_ID
          valueFrom:
            secretKeyRef:
              name: azure-secret
              key: tenant-id
        - name: AZURE_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: azure-secret
              key: client-id
        - name: AZURE_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: azure-secret
              key: client-secret
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: encryption-secret
              key: key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

---

## 7. **Updated Logical Class Diagram**

```mermaid
classDiagram
    %% Frontend Components
    class ReactApp {
        +render()
        +handleState()
        +routeToPage()
    }
    
    class UserDashboard {
        +displayUserInfo()
        +showContracts()
        +showDatasets()
        +showNotifications()
    }
    
    class ContractForm {
        +createContract()
        +validateForm()
        +submitContract()
    }
    
    class SigningModal {
        +signContract()
        +verifySignature()
        +submitSignature()
    }
    
    class APIService {
        +get(url)
        +post(url, data)
        +put(url, data)
        +delete(url)
    }
    
    class TokenManager {
        +getToken()
        +refreshToken()
        +clearToken()
    }
    
    class ES256Signer {
        +signMessage(message, privateKey)
        +verifySignature(message, signature, publicKey)
    }
    
    %% Backend Models
    class User {
        +id: UUID
        +email: String
        +partyType: String
        +did: String
        +walletAddress: String
        +isActive: Boolean
        +createdAt: Date
        +create()
        +update()
        +delete()
        +findByEmail()
        +findByDID()
    }
    
    class Contract {
        +id: UUID
        +contractId: String
        +tdpId: UUID
        +tdcId: UUID
        +ccrpId: UUID
        +status: String
        +terms: JSON
        +signatures: JSON
        +createdAt: Date
        +ccrpAzureSubscriptionId: String
        +ccrpAzureTenantId: String
        +ccrpAzureLocation: String
        +ccrpAzureVMSize: String
        +ccrpAzureStorageSku: String
        +ccrpAzureDatabaseSku: String
        +ccrpAzureEnableEncryption: Boolean
        +ccrpAzureEnableMonitoring: Boolean
        +ccrpAzureBudgetLimit: Decimal
        +create()
        +update()
        +delete()
        +findByUser()
        +findByStatus()
    }
    
    class Dataset {
        +id: UUID
        +name: String
        +description: String
        +ownerId: UUID
        +depaId: String
        +metadata: JSON
        +accessControl: JSON
        +createdAt: Date
        +create()
        +update()
        +delete()
        +findByOwner()
        +findByDEPA()
    }
    
    class AIModel {
        +id: UUID
        +name: String
        +description: String
        +ownerId: UUID
        +depaId: String
        +modelType: String
        +metadata: JSON
        +createdAt: Date
        +create()
        +update()
        +delete()
        +findByOwner()
        +findByType()
    }
    
    class CCRPAzureCredentials {
        +id: UUID
        +ccrpUserId: UUID
        +subscriptionId: String
        +tenantId: String
        +clientId: String
        +clientSecret: String
        +authMethod: String
        +defaultLocation: String
        +defaultVMSize: String
        +enableEncryption: Boolean
        +budgetLimit: Decimal
        +validationStatus: String
        +isActive: Boolean
        +createdAt: Date
        +create()
        +update()
        +delete()
        +validateCredentials()
        +getAzureConfig()
    }
    
    class TrainingJob {
        +id: UUID
        +contractId: UUID
        +jobId: String
        +status: String
        +containerId: String
        +startTime: Date
        +endTime: Date
        +logs: JSON
        +results: JSON
        +createdAt: Date
        +create()
        +update()
        +delete()
        +findByContract()
        +findByStatus()
    }
    
    class Notification {
        +id: UUID
        +userId: UUID
        +type: String
        +title: String
        +message: String
        +isRead: Boolean
        +metadata: JSON
        +createdAt: Date
        +create()
        +markAsRead()
        +findByUser()
        +findUnread()
    }
    
    class AuditLog {
        +id: UUID
        +userId: UUID
        +action: String
        +resource: String
        +details: JSON
        +ipAddress: String
        +userAgent: String
        +timestamp: Date
        +create()
        +findByUser()
        +findByAction()
        +findByDateRange()
    }
    
    %% Backend Services
    class AuthService {
        +registerUser(userData)
        +loginUser(credentials)
        +verifyToken(token)
        +refreshToken(refreshToken)
        +logoutUser(userId)
        +resetPassword(email)
        +changePassword(userId, oldPassword, newPassword)
    }
    
    class DIDService {
        +createSystemDID(walletAddress, network)
        +resolveDID(did)
        +verifySignature(did, message, signature)
        +extractPublicKey(didDocument)
        +validateEnterpriseDID(did)
        +checkDIDAvailability(did)
    }
    
    class ContractService {
        +createContract(contractData)
        +getContract(contractId)
        +updateContract(contractId, updates)
        +deleteContract(contractId)
        +getUserContracts(userId)
        +getAllContracts(filters)
        +signContract(contractId, signatureData)
        +verifyContractSignatures(contractId)
    }
    
    class SigningService {
        +signMessage(message, did, userId)
        +verifyDIDSignature(did, message, signature)
        +recordSignature(contractId, userId, did, signature)
        +updateContractStatus(contract, userPartyType)
        +logSigningOperation(operationData)
    }
    
    class BlockchainService {
        +isConnected()
        +getContract(contractId)
        +deployContract(contractData)
        +signContract(contractId, privateKey)
        +verifyTransaction(transactionHash)
        +broadcastSignedTransaction(signedTransaction)
    }
    
    class NotificationService {
        +createNotification(notificationData)
        +sendEmailNotification(userId, emailData)
        +sendPushNotification(userId, pushData)
        +markNotificationAsRead(notificationId)
        +getUserNotifications(userId)
        +deleteNotification(notificationId)
    }
    
    class AuditService {
        +logEvent(eventData)
        +logUserAction(userId, action, resource, details)
        +logSystemEvent(event, details)
        +getAuditLogs(filters)
        +exportAuditLogs(dateRange)
        +generateAuditReport(reportParams)
    }
    
    class KeycloakService {
        +createUser(userData)
        +updateUser(userId, userData)
        +deleteUser(userId)
        +getUser(userId)
        +sendEmailVerification(userId)
        +resetPassword(userId)
        +assignRole(userId, role)
    }
    
    class InfrastructureService {
        +createTrainingEnvironment(contractId, config)
        +getEnvironment(environmentId)
        +updateEnvironment(environmentId, updates)
        +deleteEnvironment(environmentId)
        +listEnvironments(filters)
        +getEnvironmentStatus(environmentId)
    }
    
    class TrainingService {
        +startTraining(contractId, config)
        +getTrainingJob(jobId)
        +updateTrainingJob(jobId, updates)
        +stopTraining(jobId)
        +listTrainingJobs(filters)
        +getTrainingLogs(jobId)
        +getTrainingResults(jobId)
    }
    
    class CCRPAzureCredentialsService {
        +createOrUpdateCredentials(ccrpUserId, credentials, config)
        +getCredentials(ccrpUserId)
        +validateCredentials(ccrpUserId)
        +getContractAzureConfig(contractId)
        +updateContractAzureConfig(contractId, config)
        +listCCRPsWithCredentials()
        +deleteCredentials(ccrpUserId)
        +testAzureConnectivity(ccrpUserId)
    }
    
    %% Relationships
    ReactApp --> UserDashboard
    ReactApp --> ContractForm
    ReactApp --> SigningModal
    ReactApp --> APIService
    ReactApp --> TokenManager
    ReactApp --> ES256Signer
    
    UserDashboard --> APIService
    ContractForm --> APIService
    SigningModal --> ES256Signer
    SigningModal --> APIService
    
    %% Backend Relationships
    User ||--o{ Contract : creates
    User ||--o{ Dataset : owns
    User ||--o{ AIModel : owns
    User ||--o{ Notification : receives
    User ||--o{ AuditLog : generates
    User ||--o{ CCRPAzureCredentials : has
    User ||--o{ TrainingJob : initiates
    
    Contract ||--o{ Dataset : references
    Contract ||--o{ AIModel : references
    Contract ||--o{ Notification : triggers
    Contract ||--o{ TrainingJob : generates
    
    %% Service Relationships
    AuthService --> User
    AuthService --> KeycloakService
    ContractService --> Contract
    ContractService --> User
    ContractService --> Dataset
    ContractService --> AIModel
    ContractService --> SigningService
    ContractService --> BlockchainService
    ContractService --> NotificationService
    
    SigningService --> DIDService
    SigningService --> BlockchainService
    SigningService --> AuditService
    
    NotificationService --> Notification
    NotificationService --> User
    
    AuditService --> AuditLog
    AuditService --> User
    
    DIDService --> User
    BlockchainService --> Contract
    
    InfrastructureService --> CCRPAzureCredentials
    InfrastructureService --> Contract
    TrainingService --> TrainingJob
    TrainingService --> Contract
    CCRPAzureCredentialsService --> CCRPAzureCredentials
    CCRPAzureCredentialsService --> User
```

---

## 8. Stakeholder Mapping

| View           | Stakeholders                | Main Concerns/Artifacts                | Mapped Files/Dirs                        |
|----------------|----------------------------|----------------------------------------|------------------------------------------|
| Use Case (+1)  | All                        | Scenarios, sequence diagrams           | `frontend/src/pages/`, `backend/routes/` |
| Logical        | Designers, Users           | Class, component diagrams              | `frontend/src/`, `backend/services/`     |
| Development    | Developers, DevOps         | Code structure, modules, packages      | `frontend/`, `backend/`                  |
| Process        | Integrators, Testers       | Sequence/activity diagrams, flows      | `backend/services/`, `backend/routes/`   |
| Physical       | Sysadmins, DevOps, Security| Deployment, network, infra diagrams    | Docker, k8s, cloud infra                 |

---

## 9. Implementation Guidelines

### 9.1 Development Workflow
1. **Design Phase**: Use Logical and Development views to plan features
2. **Implementation Phase**: Follow Process view for integration points
3. **Testing Phase**: Use Use Case view to validate scenarios
4. **Deployment Phase**: Follow Physical view for infrastructure setup

### 9.2 Code Organization
- **Frontend**: Component-based architecture with service layer
- **Backend**: Route → Service → Model pattern
- **Database**: Sequelize ORM with migrations
- **Security**: JWT + Keycloak integration
- **Blockchain**: Ethereum integration with fallback
- **Azure Integration**: Real Azure SDK with CCRP-specific credentials

### 9.3 Security Considerations
- **Authentication**: Multi-factor authentication via Keycloak
- **Authorization**: Role-based access control
- **Cryptography**: ES256 signing with HSM/KMS
- **Audit**: Comprehensive logging and monitoring
- **Compliance**: DPDP, GDPR, enterprise security standards
- **Azure Security**: Encrypted credential storage, CCRP isolation

### 9.4 Scalability Strategy
- **Horizontal Scaling**: Multiple backend containers
- **Database**: Master-slave replication
- **Caching**: Redis for session and data caching
- **CDN**: Static asset delivery
- **Load Balancing**: Kubernetes ingress controller
- **Multi-Tenant**: CCRP isolation with independent Azure subscriptions
- **Real Infrastructure**: Actual Azure resource provisioning

### 9.5 **New Azure Integration Guidelines**

#### **CCRP Credential Management**
- **Encrypted Storage**: AES-256-CBC encryption for client secrets
- **Multi-Tenant**: Each CCRP has independent Azure subscription
- **Validation**: Automatic credential validation before use
- **Audit Trail**: Complete tracking of credential changes

#### **Infrastructure Provisioning**
- **Real Resources**: Actual Azure VMs, storage, networking
- **Container Deployment**: Real Azure Container Instances
- **Cost Management**: Per-CCRP and per-contract budget tracking
- **Monitoring**: Real Azure Monitor integration

#### **Training Environment**
- **Real Execution**: Actual container deployment for training
- **Data Access**: Real Azure Storage blob access
- **Model Registration**: Real Azure ML model registration
- **Security**: Real Azure Key Vault integration

---

## 10. Conclusion

This UML 4+1 View Architecture provides a comprehensive framework for understanding, developing, and maintaining the Contract Management System. Each view serves specific stakeholders and concerns:

- **Use Case View**: Validates requirements and user scenarios
- **Logical View**: Guides system design and component relationships
- **Development View**: Organizes code structure and modules
- **Process View**: Ensures proper integration and workflows
- **Physical View**: Plans deployment and infrastructure

The architecture supports enterprise-grade security, scalability, and compliance while maintaining clear separation of concerns and modular design principles. **The latest v2.0 update adds real Azure infrastructure provisioning with multi-tenant CCRP credential management, making the system truly production-ready for enterprise deployments.**

---

**Document Version:** 2.0  
**Last Updated:** December 2024  
**Next Review:** March 2025 