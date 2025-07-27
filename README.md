# Contract Management System

A comprehensive contract management system for AI training data providers, consumers, and confidential clean room providers with **Ricardian Contract** support and **multi-deployment global uniqueness**.

## 🏗️ Architecture Overview

This system implements a **Ricardian Contract** pattern that combines human-readable legal documents with machine-executable smart contracts, providing:

- **Legal Enforceability**: Human-readable terms that courts can interpret
- **Automated Execution**: Smart contracts for automated enforcement
- **Cryptographic Binding**: Digital signatures linking legal documents to smart contracts
- **Multi-Tenant Support**: Each TDP and TDC can have their own private/public cloud infrastructure
- **Multi-Cloud Support**: Support for multiple cloud providers per CCRP
- **KMS Integration**: Decentralized Key Management System for data encryption
- **Training Environment Provisioning**: Automated secure environment setup
- **Merkle Tree Provenance**: Audit trail for training data integrity
- **🌍 Multi-Deployment Global Uniqueness**: Global DEPA ID system for cross-border operations

## 🎯 Key Features

### **Ricardian Contract System**
- **Legal Document Generation**: Automated creation of human-readable legal documents
- **Smart Contract Deployment**: Blockchain-based contract execution
- **Cryptographic Binding**: Digital signatures ensuring legal-to-code integrity
- **Multi-Party Signing**: TDP, TDC, and CCRP signature workflows
- **Contract State Management**: Comprehensive state machine for contract lifecycle

### **🌍 Multi-Deployment Global Uniqueness**
- **Global DEPA ID System**: Deployment-specific prefixes for global uniqueness
- **Cross-Border Operations**: Support for multiple countries and jurisdictions
- **Jurisdiction Compliance**: Built-in support for major regulatory frameworks
- **Data Residency**: Proper data residency requirements for each region
- **Deployment Registry**: Global registry for deployment management
- **Regulatory Compliance**: US-Federal, EU-GDPR, AP-Singapore, CA-Federal, AU-Federal

### **Multi-Tenant Infrastructure**
- **Private Cloud Support**: Each TDP/TDC can have dedicated private cloud infrastructure
- **Public Cloud Integration**: Hybrid cloud support for scalability
- **Storage Gateway**: Unified access to different storage solutions
- **KMS Adapters**: Support for multiple Key Management Systems
- **Cross-Cloud Training**: Orchestration across multiple cloud providers

### **Security & Compliance**
- **DPDP 2023 Compliance**: Full compliance with Indian data protection regulations
- **DID:web Support**: Decentralized identity management
- **Attestation Verification**: Hardware security module verification
- **Privacy-Preserving Training**: Differential privacy, federated learning, secure MPC
- **Audit Trails**: Comprehensive logging and monitoring

### **Training Environment Management**
- **Real Infrastructure Provisioning**: Actual Azure/GCP/AWS infrastructure deployment
- **CCRP-Specific Credentials**: Multi-tenant Azure credential management
- **Automated Provisioning**: CCRP-driven secure environment setup
- **Multi-Cloud Orchestration**: Training across different cloud providers
- **Resource Management**: Dynamic allocation and scaling
- **Security Isolation**: Tenant and data isolation
- **Monitoring & Logging**: Real-time training progress tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Docker & Docker Compose
- Keycloak (for authentication)
- Azure CLI (for Azure integration)
- Azure subscription (for real infrastructure provisioning)

### ⚠️ CRITICAL: Authentication Rules
**ALWAYS use Keycloak authentication. NEVER bypass authentication layers or use direct database calls.**
- See [AUTHENTICATION_RULES.md](./AUTHENTICATION_RULES.md) for complete guidelines
- All user operations must go through service APIs
- Test users must be synced to Keycloak before testing

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ContractManagement
```

2. **Set up environment variables**
```bash
# Copy example configuration
cp deployment-examples.env .env

# Choose your deployment scenario:
# - LOCAL: For local development
# - US-EAST: US East Coast with US Federal compliance
# - EU-WEST: European deployment with GDPR compliance
# - AP-SOUTH: Singapore deployment with PDPA compliance
# - CA-CENTRAL: Canada deployment with PIPEDA compliance
# - AU-SOUTH: Australia deployment with APP compliance

# Edit .env with your deployment configuration
```

3. **Configure multi-deployment settings**
```bash
# Backend configuration (backend/config.env)
DEPLOYMENT_ID=LOCAL                    # Your deployment ID
DEPLOYMENT_PREFIX=LOCAL                # Deployment prefix for DEPA IDs
DEPLOYMENT_REGION=local                # Geographic region
DEPLOYMENT_COUNTRY=Unknown             # Country
DEPLOYMENT_JURISDICTION=LOCAL          # Jurisdiction code
DEPLOYMENT_DATA_RESIDENCY=LOCAL        # Data residency requirements
DEPLOYMENT_REGULATORY_FRAMEWORK=       # Comma-separated regulatory frameworks
DEPLOYMENT_TIMEZONE=UTC                # Timezone
DEPLOYMENT_CURRENCY=USD                # Currency
DEPLOYMENT_LANGUAGE=en-US              # Language

# Frontend configuration (.env)
REACT_APP_DEPLOYMENT_ID=LOCAL          # Same as backend
REACT_APP_DEPLOYMENT_PREFIX=LOCAL      # Same as backend
REACT_APP_DEPLOYMENT_REGION=local      # Same as backend
REACT_APP_DEPLOYMENT_COUNTRY=Unknown   # Same as backend
REACT_APP_DEPLOYMENT_JURISDICTION=LOCAL # Same as backend
REACT_APP_DEPLOYMENT_DATA_RESIDENCY=LOCAL # Same as backend
REACT_APP_DEPLOYMENT_REGULATORY_FRAMEWORK= # Same as backend
REACT_APP_DEPLOYMENT_TIMEZONE=UTC      # Same as backend
REACT_APP_DEPLOYMENT_CURRENCY=USD      # Same as backend
REACT_APP_DEPLOYMENT_LANGUAGE=en-US    # Same as backend
```

4. **Start the development environment**
```bash
# Start all services
docker-compose up -d

# Or start individual services
npm run dev:backend
npm run dev:frontend
npm run dev:blockchain
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Keycloak: http://localhost:8080
- Global Deployment Management: http://localhost:3000/admin/global-deployment

6. **Set up Azure integration (optional)**
```bash
# Set Azure credentials
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export ENCRYPTION_KEY="your-encryption-key"

# Run database migration for CCRP Azure fields
node backend/scripts/migration/addCcrpAzureFields.js

# Test Azure integration
node backend/test-azure-integration.js
node backend/test-ccrp-azure-integration.js
```

## 🌍 Multi-Deployment Configuration

### **Supported Deployments**

| Deployment | Region | Country | Jurisdiction | Compliance |
|------------|--------|---------|--------------|------------|
| **LOCAL** | `local` | `Unknown` | `LOCAL` | None |
| **US-EAST** | `us-east-1` | `United States` | `US-Federal` | GDPR, CCPA, HIPAA, SOX, FedRAMP |
| **US-WEST** | `us-west-2` | `United States` | `US-Federal` | GDPR, CCPA, HIPAA, SOX, FedRAMP |
| **EU-WEST** | `eu-west-1` | `Germany` | `EU-GDPR` | GDPR, ISO-27001 |
| **EU-NORTH** | `eu-north-1` | `Sweden` | `EU-GDPR` | GDPR, ISO-27001 |
| **AP-SOUTH** | `ap-southeast-1` | `Singapore` | `AP-Singapore` | PDPA, ISO-27001 |
| **CA-CENTRAL** | `ca-central-1` | `Canada` | `CA-Federal` | PIPEDA, ISO-27001 |
| **AU-SOUTH** | `ap-southeast-2` | `Australia` | `AU-Federal` | APP, ISO-27001 |

### **Global DEPA ID Format**

```
[DEPLOYMENT_PREFIX]-[ENTITY_TYPE]-[GUID]
Examples:
- US-EAST-TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
- EU-WEST-TDP-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
- AP-SOUTH-CCRP-1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e
```

### **Jurisdiction Compliance**

Each jurisdiction has specific configurations:
- **Data Residency**: Where data must be stored
- **Encryption Standards**: Required encryption methods
- **Audit Requirements**: Compliance frameworks
- **DEPA ID Format**: Jurisdiction-specific format

### **Deployment Management**

Use the Global Deployment Management UI to:
- View current deployment status
- Register new deployments
- Generate global DEPA IDs
- Verify global uniqueness
- Test jurisdiction compliance

## 📋 Contract Creation Workflow

### **Ricardian Contract Creation (TDC Only)**

1. **Select Contract Type & Datasets**
   - Choose from AI Training, Basic, or Custom contract types
   - Select 1-3 datasets from different TDPs
   - Configure individual pricing per dataset

2. **Configure Contract & Environment**
   - Set contract duration and terms
   - Configure privacy requirements (differential privacy, federated learning)
   - Select CCRP and cloud providers
   - Define training environment specifications
   - **🌍 Enable Global DEPA ID** (optional for multi-deployment)

3. **Review Legal Document & Smart Contract**
   - Preview generated legal document
   - Review smart contract details
   - Verify cryptographic binding
   - **🌍 Verify Global DEPA ID** (if enabled)

4. **Create Ricardian Contract**
   - Deploy smart contract to blockchain
   - Generate cryptographic signatures
   - TDP auto-signs (backend handles)
   - Contract becomes legally binding
   - **🌍 Global DEPA ID assigned** (if enabled)

### **Contract States**
- `PENDING_TDP_APPROVAL`: Waiting for TDP signature
- `PENDING_CCRP_APPROVAL`: Waiting for CCRP signature (if selected)
- `ACTIVE`: All parties signed, contract is legally binding
- `COMPLETED`: Contract execution finished
- `CANCELLED`: Contract cancelled by any party

## 🔧 API Endpoints

### **Ricardian Contract Endpoints**
- `POST /api/contracts/ricardian` - Create Ricardian contract
- `POST /api/contracts/ricardian/preview` - Preview contract before creation
- `GET /api/contracts/:id/verify` - Verify Ricardian contract integrity
- `POST /api/contracts/:id/sign` - Sign contract as party

### **🌍 Global Deployment Endpoints**
- `GET /api/global-deployment/status` - Get current deployment status
- `POST /api/global-deployment/register` - Register new deployment (admin)
- `POST /api/global-deployment/generate` - Generate global DEPA ID
- `POST /api/global-deployment/verify` - Verify global uniqueness
- `GET /api/global-deployment/jurisdictions` - Get available jurisdictions
- `POST /api/global-deployment/convert` - Convert standard to global DEPA ID
- `GET /api/global-deployment/test` - Test generation (admin)
- `GET /api/global-deployment/deployments` - Get all deployments (admin)

### **Multi-Tenant Infrastructure**
- `GET /api/ccrp/all` - Get all CCRP providers with cloud support
- `POST /api/contracts/:id/environment` - Update training environment
- `GET /api/kms/providers` - Get available KMS providers
- `POST /api/training/provision` - Provision training environment

## 🏛️ Legal Framework

### **DPDP 2023 Compliance**
- **Data Principal Rights**: Full support for data subject rights
- **Consent Management**: Granular consent tracking and management
- **Data Processing Records**: Comprehensive audit trails
- **Breach Notification**: Automated breach detection and reporting
- **Cross-Border Transfers**: Secure international data transfers

### **🌍 Multi-Jurisdiction Compliance**
- **US Federal**: SOX, FedRAMP, HIPAA, CCPA compliance
- **EU GDPR**: GDPR Article 32, ISO-27001 compliance
- **AP Singapore**: PDPA, MAS-TRM compliance
- **CA Federal**: PIPEDA, ISO-27001 compliance
- **AU Federal**: Australian Privacy Principles compliance

### **Ricardian Contract Legal Structure**
```json
{
  "legalDocument": {
    "title": "AI Training Data Agreement",
    "parties": {
      "dataProvider": { "name": "TDP", "did": "did:web:...", "depaId": "US-EAST-TDP-..." },
      "dataConsumer": { "name": "TDC", "did": "did:web:...", "depaId": "US-EAST-TDC-..." },
      "cleanRoomProvider": { "name": "CCRP", "did": "did:web:...", "depaId": "US-EAST-CCRP-..." }
    },
    "terms": [
      "Data usage for AI training only",
      "Privacy-preserving techniques required",
      "Automated data deletion after training",
      "Compliance with DPDP 2023",
      "🌍 Global DEPA ID for cross-border operations"
    ]
  },
  "smartContract": {
    "address": "0x...",
    "functions": ["createContract", "executePayment", "transferData"],
    "globalDEPAId": "US-EAST-CONTRACT-..."
  }
}
```

## 🔐 Security Features

### **DID:web Integration**
- **Decentralized Identity**: Self-sovereign identity management
- **Cryptographic Signatures**: ES256 signing for contract verification
- **Public Key Infrastructure**: Secure key management
- **Identity Verification**: Real-time DID resolution and verification

### **🌍 Global Security**
- **Deployment-Specific Security**: Each deployment has jurisdiction-specific security requirements
- **Cross-Border Security**: Secure communication between deployments
- **Regulatory Compliance**: Built-in compliance with major regulatory frameworks
- **Audit Trail**: Complete audit trail across all deployments

### **Multi-KMS Support**
- **Azure Key Vault**: Enterprise-grade key management
- **AWS KMS**: Cloud-native key management
- **Google Cloud KMS**: GCP key management
- **Hashicorp Vault**: Self-hosted key management

### **Training Environment Security**
- **Confidential Computing**: Hardware-based security
- **Network Isolation**: Private network segmentation
- **Data Encryption**: At-rest and in-transit encryption
- **Access Control**: Role-based access management

## 📊 Monitoring & Analytics

### **Contract Analytics**
- Contract creation and completion rates
- Party signature timelines
- Payment processing metrics
- Training environment utilization
- **🌍 Global DEPA ID analytics**

### **Security Monitoring**
- DID signature verification logs
- KMS access patterns
- Training environment security events
- Compliance audit trails
- **🌍 Cross-deployment security monitoring**

## 🧪 Testing

### **Run Test Suite**
```bash
# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend

# Integration tests
npm run test:integration

# Contract state machine tests
npm run test:contracts

# 🌍 Global deployment tests
npm run test:global-deployment
```

### **Test Ricardian Contracts**
```bash
# Test contract creation
npm run test:ricardian

# Test signature verification
npm run test:signing

# Test multi-tenant scenarios
npm run test:multi-tenant

# 🌍 Test global DEPA ID generation
npm run test:global-depa-id
```

## 📚 Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Ricardian Contract Guide](./docs/contracts/RICARDIAN_CONTRACT_GUIDE.md)
- [Multi-Tenant Architecture](./MULTI_TENANT_KMS_ARCHITECTURE.md)
- [UML 4+1 Architecture](./UML_4PLUS1_ARCHITECTURE_DOCUMENTATION.md)
- [DPDP Implementation](./DPDP_COMPLIANCE_IMPLEMENTATION.md)
- **🌍 [Multi-Deployment Integration Guide](./MULTI_DEPLOYMENT_INTEGRATION_GUIDE.md)**
- **🌍 [Identity and Access Management Documentation](./IDENTITY_AND_ACCESS_MANAGEMENT_DOCUMENTATION.md)**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the [documentation](./docs/)
- Review the [FAQ](./FAQ.md)

---

**Note**: This system now exclusively supports **Ricardian contracts** for all contract creation with **multi-deployment global uniqueness** for cross-border operations. Plain contracts have been deprecated and removed from the system. 