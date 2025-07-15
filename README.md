# Contract Management System

A comprehensive contract management system supporting multi-tenant, multi-cloud AI training contracts with Ricardian contract functionality, blockchain integration, Merkle tree provenance tracking, and enterprise-grade security.

## 🚀 Key Features

### Multi-Tenant Architecture
- **Multi-Cloud Support**: AWS, Azure, GCP, and on-premises infrastructure
- **Tenant Isolation**: Complete security isolation between TDPs and TDCs
- **KMS Integration**: Support for AWS KMS, Azure Key Vault, GCP KMS, HashiCorp Vault
- **Storage Gateway**: Unified access to different storage systems (S3, Blob, GCS)
- **Cross-Cloud Training**: Secure training execution across multiple cloud environments

### Multi-TDP Contract Management
- **Up to 3 Datasets**: Create contracts with multiple datasets from different TDPs
- **Individual Pricing**: Each dataset has its own price within the contract
- **Independent Signing**: Each TDP signs independently for their dataset
- **Payment Tracking**: Individual payment status tracking per TDP
- **Status Monitoring**: Real-time multi-TDP status tracking

### Merkle Tree Provenance Tracking
- **Complete Data Lineage**: Track all data transformations from source to trained model
- **Cryptographic Verification**: Use Merkle trees for tamper-proof provenance
- **Cross-Cloud Consistency**: Verify provenance across multiple cloud environments
- **Model Governance**: Enable comprehensive model auditing and explainability
- **Compliance Support**: Meet regulatory requirements for model transparency

### Ricardian Contract Support
- **Legal Documents**: Human-readable legal agreements
- **Smart Contracts**: Machine-executable blockchain contracts
- **Cryptographic Binding**: Legal documents bound to smart contracts
- **Technical Parameters**: AI training parameters and environment specifications
- **Multi-Tenant Specifications**: Cloud provider, KMS, and storage configurations
- **Provenance Integration**: Merkle tree provenance tracking in contracts

### KMS and Training Environment
- **Key Management**: Centralized KMS for DID:web, data encryption, and model encryption
- **Data Encryption**: Encrypted storage and transmission of datasets and models
- **Automatic Provisioning**: Training environments provisioned based on contract specifications
- **Automated Training**: Training execution triggered when all parties sign contracts
- **Confidential Computing**: Secure processing in encrypted VMs/containers

### Download Functionality
- **Complete Contract Download**: All contract data including legal, technical, workflow, and signature information
- **Legal Document Download**: Human-readable legal documents in JSON format
- **Enhanced Data Coverage**: Includes payment summaries, multi-TDP status, and all Ricardian fields
- **Clear User Interface**: Descriptive button labels and comprehensive data display

### Security & Compliance
- **JWT Authentication**: Secure user authentication
- **Role-Based Access**: TDC, TDP, and CCRP user roles
- **Data Encryption**: KMS integration for data protection
- **Audit Trail**: Comprehensive logging and tracking
- **Cross-Cloud Security**: Security isolation and verification across clouds

## 🏗️ Architecture

### Multi-Tenant Architecture
- **Tenant Configurations**: Each TDP/TDC has their own cloud infrastructure
- **KMS Adapter Pattern**: Abstract different KMS providers
- **Storage Gateway**: Unified storage access layer
- **Federated Identity**: Cross-cloud identity management
- **Encrypted Bridges**: Secure data transfer between clouds

### Backend (Node.js + Express)
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with Keycloak integration
- **Blockchain**: Ethereum smart contract integration
- **Notifications**: Email and in-app notifications
- **Testing**: Comprehensive test suite
- **Multi-Cloud Support**: Cross-cloud environment provisioning
- **Provenance Tracking**: Merkle tree provenance capture and verification

### Frontend (React + Material-UI)
- **Multi-Dataset Selection**: Interactive dataset selection with pricing
- **Contract Management**: Comprehensive contract display and management
- **Download Capabilities**: Complete contract and legal document downloads
- **Real-time Updates**: Live status tracking and notifications
- **Multi-Cloud Dashboard**: Cloud provider and KMS management
- **Provenance Viewer**: Merkle tree provenance visualization

## 📋 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Docker (for Keycloak)
- Cloud provider accounts (AWS, Azure, GCP)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ContractManagement.git
   cd ContractManagement
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp config.env.example config.env
   # Configure database, cloud providers, and KMS settings
   npm run setup-db
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Keycloak Setup**
   ```bash
   cd deployment/utilities
   docker-compose -f docker-compose.iam.yml up -d
   ```

5. **Multi-Cloud Configuration**
   ```bash
   # Configure cloud provider credentials
   # Set up KMS providers
   # Configure storage gateways
   # Set up cross-cloud networking
   ```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/contracts

# JWT Secret
JWT_SECRET=your-secret-key

# Blockchain
BLOCKCHAIN_NETWORK=goerli
CONTRACT_ADDRESS=0x...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Multi-Cloud Configuration
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AZURE_TENANT_ID=your-azure-tenant
AZURE_CLIENT_ID=your-azure-client
AZURE_CLIENT_SECRET=your-azure-secret
GCP_PROJECT_ID=your-gcp-project
GCP_CREDENTIALS_FILE=path/to/credentials.json
```

### Multi-Tenant Configuration
```json
{
  "tenantConfigurations": {
    "tdp": {
      "cloudProvider": "AWS",
      "kmsProvider": "AWS_KMS",
      "storageProvider": "AWS_S3",
      "region": "us-east-1"
    },
    "tdc": {
      "cloudProvider": "AZURE",
      "kmsProvider": "AZURE_KEY_VAULT",
      "storageProvider": "AZURE_BLOB",
      "region": "eastus"
    },
    "ccrp": {
      "cloudProvider": "MULTI_CLOUD",
      "supportedClouds": ["AWS", "AZURE", "GCP", "ON_PREMISES"]
    }
  }
}
```

## 📖 Usage

### Creating Multi-Tenant Contracts
1. **Configure Tenants**: Set up TDP and TDC cloud infrastructure
2. **Select Datasets**: Choose 1-3 datasets from different TDPs
3. **Set Pricing**: Configure individual prices for each dataset
4. **Configure Contract**: Set duration, terms, and technical parameters
5. **Specify Infrastructure**: Define cloud providers, KMS, and storage
6. **Create Contract**: Contract is created with all selected datasets

### Managing Contracts
1. **View Details**: Comprehensive display of all TDPs and datasets
2. **Track Status**: Real-time updates on signatures and payments
3. **Download Documents**: Complete contract and legal document downloads
4. **Record Payments**: Individual payment tracking per TDP
5. **Monitor Provenance**: Track Merkle tree provenance for model auditing

### Cross-Cloud Training
1. **Environment Provisioning**: Automatic provisioning across multiple clouds
2. **Key Coordination**: Secure key management across different KMS providers
3. **Data Transfer**: Encrypted data transfer between cloud environments
4. **Training Execution**: Secure training execution with provenance tracking
5. **Model Validation**: Cross-cloud model validation with privacy preservation

### Download Functionality
- **Complete Contract**: Downloads all contract data (legal, technical, workflow, signatures)
- **Legal Document**: Downloads only the legal document JSON (when available)
- **Enhanced Coverage**: Includes payment summaries, multi-TDP status, and Ricardian fields
- **Provenance Data**: Includes Merkle tree provenance for model auditing

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Multi-Cloud Tests
```bash
npm run test:multi-cloud
```

### Provenance Tests
```bash
npm run test:provenance
```

## 📚 Documentation

### Core Documentation
- [Multi-Tenant KMS Architecture](MULTI_TENANT_KMS_ARCHITECTURE.md)
- [Merkle Tree Provenance Implementation](MERKLE_TREE_PROVENANCE_IMPLEMENTATION.md)
- [Multi-Tenant Contract Update Summary](MULTI_TENANT_CONTRACT_UPDATE_SUMMARY.md)
- [KMS and Training Environment Architecture](KMS_TRAINING_ENVIRONMENT_ARCHITECTURE.md)

### Implementation Guides
- [Multi-TDP Implementation Guide](MULTI_TDP_IMPLEMENTATION_SUMMARY.md)
- [Frontend Multi-TDP Update Summary](FRONTEND_MULTI_TDP_UPDATE_SUMMARY.md)
- [Role-Based Dashboard Implementation](ROLE_BASED_DASHBOARD_IMPLEMENTATION.md)
- [Cloud Provider Implementation](CLOUD_PROVIDER_IMPLEMENTATION.md)

### Technical Documentation
- [UML 4+1 Architecture Documentation](UML_4PLUS1_ARCHITECTURE_DOCUMENTATION.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Enterprise Registration Strategy](ENTERPRISE_REGISTRATION_STRATEGY.md)
- [Contract Template Guide](CONTRACT_TEMPLATE_GUIDE.md)

### Testing and Deployment
- [Integration Testing Guide](INTEGRATION_TESTING_GUIDE.md)
- [Test Suite Update Summary](TEST_SUITE_UPDATE_SUMMARY.md)
- [Test Data for Testers](TEST_DATA_FOR_TESTERS.md)
- [Project Status Summary](PROJECT_STATUS_SUMMARY.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the test examples

## 🔄 Recent Updates

### Latest Features (December 2024)
- **Multi-Tenant Architecture**: Support for different cloud providers per TDP/TDC
- **Merkle Tree Provenance**: Complete data lineage tracking for model auditing
- **KMS Integration**: Support for AWS KMS, Azure Key Vault, GCP KMS, HashiCorp Vault
- **Cross-Cloud Training**: Secure training execution across multiple cloud environments
- **Enhanced Security**: Cross-cloud security isolation and verification
- **Model Governance**: Comprehensive model auditing and explainability

### Technical Improvements
- **Multi-Cloud Support**: AWS, Azure, GCP, and on-premises infrastructure
- **Provenance Tracking**: Merkle tree provenance capture and verification
- **KMS Adapter Pattern**: Abstract different KMS providers
- **Storage Gateway**: Unified access to different storage systems
- **Cross-Cloud Consistency**: Verify consistency across multiple cloud environments
- **Enhanced Compliance**: Support for DPDP 2023, GDPR, HIPAA across clouds

### Previous Features
- **Multi-TDP Contract Support**: Up to 3 datasets from different TDPs
- **Download Functionality**: Complete contract and legal document downloads
- **Enhanced UI**: Clear button labels and comprehensive data display
- **Ricardian Contract Details**: Full display of legal and technical parameters
- **Payment Tracking**: Individual payment status per TDP
- **Real-time Status**: Live updates on contract progress 