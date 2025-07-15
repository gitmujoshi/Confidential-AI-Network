# Contract Management System

A comprehensive contract management system for AI training data providers, consumers, and confidential clean room providers with **Ricardian Contract** support.

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

## 🎯 Key Features

### **Ricardian Contract System**
- **Legal Document Generation**: Automated creation of human-readable legal documents
- **Smart Contract Deployment**: Blockchain-based contract execution
- **Cryptographic Binding**: Digital signatures ensuring legal-to-code integrity
- **Multi-Party Signing**: TDP, TDC, and CCRP signature workflows
- **Contract State Management**: Comprehensive state machine for contract lifecycle

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

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ContractManagement
```

2. **Set up environment variables**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start the development environment**
```bash
# Start all services
docker-compose up -d

# Or start individual services
npm run dev:backend
npm run dev:frontend
npm run dev:blockchain
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Keycloak: http://localhost:8080

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

3. **Review Legal Document & Smart Contract**
   - Preview generated legal document
   - Review smart contract details
   - Verify cryptographic binding

4. **Create Ricardian Contract**
   - Deploy smart contract to blockchain
   - Generate cryptographic signatures
   - TDP auto-signs (backend handles)
   - Contract becomes legally binding

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

### **Ricardian Contract Legal Structure**
```json
{
  "legalDocument": {
    "title": "AI Training Data Agreement",
    "parties": {
      "dataProvider": { "name": "TDP", "did": "did:web:..." },
      "dataConsumer": { "name": "TDC", "did": "did:web:..." },
      "cleanRoomProvider": { "name": "CCRP", "did": "did:web:..." }
    },
    "terms": [
      "Data usage for AI training only",
      "Privacy-preserving techniques required",
      "Automated data deletion after training",
      "Compliance with DPDP 2023"
    ]
  },
  "smartContract": {
    "address": "0x...",
    "functions": ["createContract", "executePayment", "transferData"]
  }
}
```

## 🔐 Security Features

### **DID:web Integration**
- **Decentralized Identity**: Self-sovereign identity management
- **Cryptographic Signatures**: ES256 signing for contract verification
- **Public Key Infrastructure**: Secure key management
- **Identity Verification**: Real-time DID resolution and verification

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

### **Security Monitoring**
- DID signature verification logs
- KMS access patterns
- Training environment security events
- Compliance audit trails

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
```

### **Test Ricardian Contracts**
```bash
# Test contract creation
npm run test:ricardian

# Test signature verification
npm run test:signing

# Test multi-tenant scenarios
npm run test:multi-tenant
```

## 📚 Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Ricardian Contract Guide](./docs/contracts/RICARDIAN_CONTRACT_GUIDE.md)
- [Multi-Tenant Architecture](./MULTI_TENANT_KMS_ARCHITECTURE.md)
- [UML 4+1 Architecture](./UML_4PLUS1_ARCHITECTURE_DOCUMENTATION.md)
- [DPDP Implementation](./DPDP_COMPLIANCE_IMPLEMENTATION.md)

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

**Note**: This system now exclusively supports **Ricardian contracts** for all contract creation. Plain contracts have been deprecated and removed from the system. 