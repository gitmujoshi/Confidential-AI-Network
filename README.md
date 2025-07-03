# Contract Management System
## Enterprise-Grade Contract Management with DID and IAM Integration

A comprehensive contract management system that combines blockchain technology, Decentralized Identifiers (DIDs), and enterprise Identity and Access Management (IAM) for secure, transparent, and efficient contract lifecycle management.

## 🌟 Key Features

### 🔐 **Identity Management**
- **Enterprise IAM Integration**: Full Keycloak integration for enterprise-grade authentication and authorization
- **Decentralized Identifiers (DIDs)**: Support for both `did:ethr` and `did:web` methods
- **Multiple DID Options**: 
  - **did:ethr**: Ethereum-based DIDs for individual users (e.g., `did:ethr:goerli:0x1234567890abcdef...`)
  - **did:web**: Web-based DIDs for organizations (e.g., `did:web:company.com:user:alice`)
- **Bring Your Own DID**: Users can integrate their existing DIDs for identity continuity
- **Multi-factor Authentication**: Enhanced security with IAM-based MFA
- **Role-based Access Control**: TDP, TDC, and CCRP roles with specific permissions

### 📋 **Contract Management**
- **Smart Contract Integration**: Ethereum-based smart contracts for immutable contract storage
- **Multi-party Signing**: Support for TDP, TDC, and CCRP parties
- **DID-based Signing**: Cryptographic contract signing using DIDs
- **Contract Lifecycle Management**: Complete workflow from creation to execution
- **Audit Trail**: Immutable blockchain records of all contract activities

### 🗄️ **Data Management**
- **Dataset Management**: Secure dataset creation and management for TDPs
- **Access Control**: Granular permissions for dataset access
- **Data Privacy**: Privacy-preserving data sharing mechanisms
- **Compliance Tracking**: Built-in compliance and audit features

### 🔒 **Security & Compliance**
- **Zero-trust Architecture**: Comprehensive security model
- **Cryptographic Verification**: All operations cryptographically verified
- **Audit Logging**: Complete audit trail for compliance
- **Data Encryption**: End-to-end encryption for sensitive data
- **Privacy by Design**: Privacy-preserving identity management

## 🏗️ Architecture

The system is built with a modern, scalable architecture:

- **Frontend**: React-based user interface with Material-UI
- **Backend**: Node.js/Express API with comprehensive IAM integration
- **Database**: PostgreSQL with advanced indexing and security
- **Blockchain**: Ethereum smart contracts for immutable storage
- **IAM**: Keycloak for enterprise identity management
- **DID**: Decentralized identifier support for self-sovereign identity

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Docker and Docker Compose
- MetaMask or compatible Web3 wallet

### Quick Start
1. **Clone the repository**
2. **Set up environment variables** (see `.env.example`)
3. **Start the IAM services**: `docker-compose -f docker-compose.iam.yml up -d`
4. **Run database setup**: `cd backend && npm run setup`
5. **Start the backend**: `cd backend && npm start`
6. **Start the frontend**: `cd frontend && npm start`

### User Onboarding
1. **Register**: Create an account with your wallet and DID
2. **Verify Identity**: Complete IAM verification process
3. **Set Up Profile**: Configure your organization and role
4. **Start Managing Contracts**: Begin creating and managing contracts

## 📚 Documentation

### User Guides
- **[Setup Guide](SETUP_GUIDE.md)**: Complete installation and configuration
- **[User Guide](USER_GUIDE.md)**: How to use the system
- **[Wallet Guide](WALLET_GUIDE.md)**: MetaMask setup and usage
- **[Existing DID Guide](EXISTING_DID_GUIDE.md)**: Using your existing DIDs

### Technical Documentation
- **[Architecture Guide](ARCHITECTURE_GUIDE.md)**: System architecture and design
- **[API Documentation](API_DOCS.md)**: Complete API reference
- **[Security Guide](SECURITY_GUIDE.md)**: Security features and best practices
- **[DID Management Guide](DID_MANAGEMENT_GUIDE.md)**: DID implementation details

### Deployment Guides
- **[Kubernetes Deployment](KUBERNETES_DEPLOYMENT_GUIDE.md)**: Production deployment
- **[Local Kubernetes](LOCAL_KUBERNETES_GUIDE.md)**: Local development setup

## 🔧 DID Integration

### Supported DID Methods

#### did:ethr (Ethereum-based DIDs)
**Best for**: Individual users with Ethereum wallets
- **Format**: `did:ethr:[network]:[ethereum-address]`
- **Examples**: 
  - `did:ethr:goerli:0x1234567890abcdef...` (testnet)
  - `did:ethr:mainnet:0x1234567890abcdef...` (mainnet)
- **Benefits**:
  - Fully decentralized
  - Works with existing MetaMask wallets
  - No additional setup required
  - Cross-platform compatibility
- **Verification**: Wallet signature verification

#### did:web (Web-based DIDs)
**Best for**: Organizations with web domains
- **Format**: `did:web:[domain]:[path]`
- **Examples**:
  - `did:web:company.com:user:alice`
  - `did:web:university.edu:students:student123`
- **Benefits**:
  - Cost-effective (no gas fees)
  - Fast resolution via HTTP
  - Organization control
  - Easy integration with existing web infrastructure
- **Verification**: DID document resolution and domain validation

### System-Generated DIDs (did:ethr)
When users register without providing an existing DID, the system automatically generates a new `did:ethr` based on their wallet address. This DID is:
- Created using the Ethereum DID method
- Linked to their wallet address
- Stored securely in the database
- Used for all cryptographic operations

### User-Provided DIDs
Users can bring their existing DIDs from other platforms or systems. This feature:
- Maintains identity continuity across platforms
- Supports both `did:ethr` and `did:web` methods
- Requires cryptographic proof of ownership
- Enables self-sovereign identity principles

### DID Verification Process
When users provide an existing DID, the system verifies ownership through:

#### For did:ethr:
1. **Format Validation**: Ensures the DID follows correct standards
2. **Uniqueness Check**: Confirms the DID isn't already registered
3. **Ownership Proof**: Requires wallet signature to prove control
4. **DID Resolution**: Verifies the DID exists on the blockchain
5. **Document Validation**: Checks the DID document structure

#### For did:web:
1. **Format Validation**: Ensures the DID follows correct standards
2. **Uniqueness Check**: Confirms the DID isn't already registered
3. **DID Resolution**: Fetches DID document from web server
4. **Document Validation**: Checks the DID document structure
5. **Domain Verification**: Validates domain ownership and SSL certificate

## 🎯 Use Cases

### Training Data Providers (TDP)
- Create and manage datasets
- Set access permissions and pricing
- Monitor dataset usage and analytics
- Sign contracts for data sharing

### Training Data Consumers (TDC)
- Browse available datasets
- Initiate contract requests
- Manage contract negotiations
- Access purchased datasets

### Confidential Clean Room Providers (CCRP)
- Review contract compliance
- Verify data privacy requirements
- Sign contracts as compliance authority
- Monitor contract execution

## 🔒 Security Features

### Identity Security
- **Multi-factor Authentication**: IAM-based MFA support
- **Session Management**: Secure session handling
- **Access Control**: Role-based permissions
- **Audit Logging**: Complete access logs

### Data Security
- **End-to-End Encryption**: All sensitive data encrypted
- **Blockchain Immutability**: Tamper-proof contract storage
- **Cryptographic Verification**: All operations verified
- **Privacy Protection**: Data minimization principles

### DID Security
- **Ownership Verification**: Cryptographic proof of DID control
- **Key Management**: Secure key storage and rotation
- **Delegation Support**: Controlled DID delegation
- **Recovery Mechanisms**: Secure DID recovery options

## 🌐 Supported Networks

### Development
- **Goerli Testnet**: For development and testing
- **Local Hardhat**: For local development

### Production
- **Ethereum Mainnet**: For production deployments
- **Polygon**: For cost-effective transactions
- **Other EVM Networks**: As needed

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and ensure all code follows our security standards.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation guides
- Review the troubleshooting sections
- Contact the development team
- Join our community forum

---

**Contract Management System** - Secure, verifiable, and compliant contract management with enterprise IAM and DID support. 