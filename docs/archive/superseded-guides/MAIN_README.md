# Contract Management System

A comprehensive blockchain-based contract management platform with IAM integration, DID support, and DPDP compliance for secure data sharing between Training Data Providers, Training Data Consumers, and Confidential Clean Room Providers.

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        REACT[React App]
        DID_UI[DID Management]
        CONTRACT_UI[Contract Management]
    end
    
    subgraph "API Layer"
        AUTH_API[Authentication API]
        CONTRACT_API[Contract API]
        DATASET_API[Dataset API]
        DID_API[DID API]
        DPDP_API[DPDP API]
    end
    
    subgraph "Service Layer"
        AUTH_SERVICE[Auth Service]
        CONTRACT_SERVICE[Contract Service]
        DID_SERVICE[DID Service]
        KEYCLOAK_SERVICE[Keycloak Service]
        DPDP_SERVICE[DPDP Service]
    end
    
    subgraph "Data Layer"
        subgraph "Database"
            USERS[(Users)]
            CONTRACTS[(Contracts)]
            DATASETS[(Datasets)]
            CONSENTS[(Consents)]
            AUDIT_LOGS[(Audit Logs)]
        end
        
        subgraph "Blockchain"
            SMART_CONTRACTS[Smart Contracts]
            DID_REGISTRY[DID Registry]
        end
    end
    
    subgraph "External Services"
        KEYCLOAK[Keycloak IAM]
        DID_WEB[DID Web Servers]
        DID_ETHR[Ethereum DID]
        EMAIL[Email Service]
    end
    
    REACT --> AUTH_API
    REACT --> CONTRACT_API
    REACT --> DATASET_API
    REACT --> DID_API
    REACT --> DPDP_API
    
    AUTH_API --> AUTH_SERVICE
    CONTRACT_API --> CONTRACT_SERVICE
    DATASET_API --> CONTRACT_SERVICE
    DID_API --> DID_SERVICE
    DPDP_API --> DPDP_SERVICE
    
    AUTH_SERVICE --> USERS
    CONTRACT_SERVICE --> CONTRACTS
    CONTRACT_SERVICE --> DATASETS
    DID_SERVICE --> DID_REGISTRY
    DPDP_SERVICE --> CONSENTS
    DPDP_SERVICE --> AUDIT_LOGS
    
    AUTH_SERVICE --> KEYCLOAK
    DID_SERVICE --> DID_WEB
    DID_SERVICE --> DID_ETHR
    DPDP_SERVICE --> EMAIL
    
    CONTRACT_SERVICE --> SMART_CONTRACTS
    
    style REACT fill:#61dafb
    style AUTH_SERVICE fill:#ff6b6b
    style CONTRACT_SERVICE fill:#4ecdc4
    style DID_SERVICE fill:#45b7d1
    style DPDP_SERVICE fill:#96ceb4
    style KEYCLOAK fill:#ffa726
    style DID_WEB fill:#fff3e0
    style DID_ETHR fill:#fff8e1
    style USERS fill:#e8f5e8
    style CONTRACTS fill:#e8f5e8
    style DATASETS fill:#e8f5e8
    style CONSENTS fill:#e8f5e8
    style AUDIT_LOGS fill:#e8f5e8
    style SMART_CONTRACTS fill:#fff8e1
    style DID_REGISTRY fill:#fff8e1
    style EMAIL fill:#e0f2f1
```

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

## 🔧 DID Integration

### Enterprise DID Strategy

#### did:web (Primary Enterprise Choice)
**Best for**: Enterprise organizations with web domains
- **Format**: `did:web:[domain]:[path]`
- **Examples**:
  - `did:web:company.com` (organization main DID)
  - `did:web:company.com:legal` (department DID)
  - `did:web:company.com:employees:john.doe` (employee DID)
  - `did:web:company.com:roles:compliance-officer` (role-based DID)
- **Enterprise Benefits**:
  - **Cost-effective**: No blockchain gas fees
  - **Fast resolution**: HTTP-based with caching
  - **Organization control**: Full control over identity infrastructure
  - **Compliance ready**: Meets enterprise security requirements
  - **Scalable**: Easy to manage thousands of organizational DIDs
  - **Integration friendly**: Works with existing web infrastructure
- **Verification**: DID document resolution, domain validation, and SSL certificate verification

#### did:ethr (Blockchain Operations)
**Best for**: Blockchain-specific operations and individual users
- **Format**: `did:ethr:[network]:[ethereum-address]`
- **Examples**: 
  - `did:ethr:goerli:0x1234567890abcdef...` (testnet)
  - `did:ethr:mainnet:0x1234567890abcdef...` (mainnet)
- **Benefits**:
  - Fully decentralized
  - Works with existing MetaMask wallets
  - Built-in cryptographic verification
  - Cross-platform compatibility
- **Verification**: Wallet signature verification

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

Training Data Providers are organizations or individuals who own and manage datasets. They can:
- Create and publish datasets
- Set pricing and terms for data usage
- Automatically sign contracts when TDC initiates them
- Monitor contract execution and data usage

### Training Data Consumers (TDC)

Training Data Consumers are organizations that need data for AI model training or analytics. They can:
- Browse available datasets
- Create contracts with TDPs
- Select CCRPs for compliance review
- Access data after contract activation

### Confidential Clean Room Providers (CCRP)

Confidential Clean Room Providers set up secure runtime environments for data analytics or AI model training based on contracts. They can:
- Review contracts for compliance
- Set up secure computing environments
- Provide data processing infrastructure
- Ensure data privacy and security during model training

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

## 📚 Documentation Structure

This project documentation is organized into 5 comprehensive files:

1. **[MAIN_README.md](MAIN_README.md)** - This file: Complete project overview and getting started
2. **[TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md)** - Architecture, API, and technical details
3. **[SETUP_AND_DEPLOYMENT.md](SETUP_AND_DEPLOYMENT.md)** - All setup, deployment, and configuration guides
4. **[USER_AND_SECURITY_GUIDES.md](USER_AND_SECURITY_GUIDES.md)** - User guides, security, and best practices
5. **[DID_AND_IAM_GUIDES.md](DID_AND_IAM_GUIDES.md)** - All DID and IAM related documentation

## 🛠️ Development

### Project Structure
```
ContractManagement/
├── backend/           # Node.js/Express API
├── frontend/          # React application
├── blockchain/        # Smart contracts
├── scripts/           # Setup and utility scripts
├── docs/              # Documentation
└── docker-compose.iam.yml  # IAM services
```

### Key Scripts
- `npm run dev` - Start development environment
- `npm run setup` - Initial setup and configuration
- `npm run test` - Run test suite
- `npm run deploy` - Deploy smart contracts

### Environment Variables
Copy `.env.example` to `.env` and configure:
- Database connection
- JWT secrets
- Blockchain network settings
- IAM configuration
- Email settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation files
- Review the troubleshooting guides
- Open an issue on GitHub
- Contact the development team

---

**Note**: This system is designed for enterprise use with comprehensive security features. Always follow security best practices and keep all dependencies updated. 