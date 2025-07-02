# Contract Management System

A comprehensive blockchain-based contract management system with role-based access control, secure wallet integration, and automated contract workflows.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **Docker** and **Docker Compose** (for IAM)
- **MetaMask** browser extension
- **Git**

### Setup in 5 Minutes
```bash
# Clone and install
git clone <repository-url>
cd ContractManagement
npm install && cd backend && npm install && cd ../frontend && npm install && cd ../blockchain && npm install && cd ..

# Setup database
createdb contract_management
cd backend && npm run setup-db

# Setup IAM (Keycloak)
docker-compose -f docker-compose.iam.yml up -d
cd backend && npm run setup-***REMOVED-KEYCLOAK_DB_PASSWORD***
npm run migrate-iam

# Start services (3 terminals)
# Terminal 1: cd blockchain && npx hardhat node
# Terminal 2: cd backend && npm run dev  
# Terminal 3: cd frontend && npm start

# Access: http://localhost:3000
# Keycloak Admin: http://localhost:8080/admin (admin/***REMOVED-KEYCLOAK_ADMIN_PASSWORD***)
```

📖 **For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**
📖 **For IAM setup, see [IAM_SETUP_GUIDE.md](./IAM_SETUP_GUIDE.md)**

## 🏗️ System Overview

### Multi-Role Architecture
- **TDP (Training Data Provider)**: Dataset owners who provide training data
- **TDC (Training Data Consumer)**: Organizations that purchase and use training data  
- **CCRP (Confidential Clean Room Provider)**: Independent reviewers who validate contracts

### Key Features
- **Enterprise IAM Integration**: Keycloak-based identity and access management
- **DID Support**: Decentralized Identifiers for self-sovereign identity
- **Secure Wallet Integration**: Client-side signing with MetaMask
- **Blockchain Immutability**: Smart contracts for secure, transparent agreements
- **Role-Based UI**: Dynamic interfaces based on user permissions
- **User Onboarding**: Multi-step registration with email verification
- **Automated Workflows**: Streamlined contract creation and signing
- **Real-time Notifications**: Live updates and email notifications
- **Profile Management**: Enhanced user profiles with organization details

### Technology Stack
- **Frontend**: React 18, Material-UI, Ethers.js, React Query
- **Backend**: Node.js, Express.js, Sequelize ORM, PostgreSQL
- **Blockchain**: Hardhat, Solidity, OpenZeppelin
- **IAM**: Keycloak, OAuth2, OpenID Connect, JWT
- **Identity**: DID (Decentralized Identifiers), Self-sovereign identity
- **Security**: HTTPS, Client-side signing, Rate limiting

## 📚 Documentation

### Core Guides
- **[Setup Guide](./SETUP_GUIDE.md)** - Complete installation and configuration
- **[IAM Setup Guide](./IAM_SETUP_GUIDE.md)** - Keycloak IAM integration setup
- **[User Guide](./USER_GUIDE.md)** - How to use the application
- **[Wallet Guide](./WALLET_GUIDE.md)** - MetaMask setup and wallet management
- **[Architecture Guide](./ARCHITECTURE_GUIDE.md)** - System design and technical details

### Reference Materials
- **[Test Wallets](./TEST_WALLETS.md)** - Development wallet information
- **[API Documentation](./API_DOCS.md)** - Backend API reference
- **[IAM Integration Strategy](./IAM_INTEGRATION_STRATEGY.md)** - IAM architecture and strategy

## 🔐 Security Features

### Enterprise IAM Security
- **Keycloak Integration**: Industry-standard identity management
- **OAuth2/OpenID Connect**: Secure authentication protocols
- **JWT Token Validation**: Server-side token verification
- **Role-Based Access Control**: Fine-grained permissions
- **Email Verification**: Multi-factor authentication support
- **DID Support**: Self-sovereign identity for blockchain operations

### Client-Side Security
- Private keys never transmitted over network
- All cryptographic operations in browser memory
- Memory cleared after signing operations
- Input validation and sanitization

### Network Security
- HTTPS/TLS encryption for all communications
- Rate limiting on API endpoints
- CORS configuration
- Request validation and sanitization

### Blockchain Security
- Smart contract auditing and testing
- Access control modifiers
- Reentrancy protection
- Event logging for audit trails

## 🎯 User Workflows

### User Onboarding
1. **Registration**: Connect wallet and provide basic information
2. **Email Verification**: Verify email address for security
3. **Profile Completion**: Add organization and contact details
4. **Role Assignment**: Automatic role assignment based on criteria
5. **Access Activation**: Full system access after onboarding

### TDP (Training Data Provider)
1. Complete onboarding and profile setup
2. Create and manage datasets
3. Auto-sign contracts when created by TDC
4. Monitor contract status and history
5. Receive payments for data access

### TDC (Training Data Consumer)
1. Complete onboarding and profile setup
2. Browse available datasets
3. Select CCRP for contract review
4. Create contracts with dataset and CCRP
5. Sign contracts to finalize agreements

### CCRP (Confidential Clean Room Provider)
1. Complete onboarding and profile setup
2. Receive notifications for contract review
3. Review contract terms and conditions
4. Sign contracts after compliance validation
5. Maintain audit trail of approvals

## 🛠️ Development

### Project Structure
```
ContractManagement/
├── frontend/          # React application
├── backend/           # Node.js/Express API
├── blockchain/        # Hardhat smart contracts
├── scripts/           # Setup and utility scripts
└── docs/             # Documentation
```

### Available Scripts
```bash
# Development
npm run dev           # Start all services
npm run blockchain    # Start Hardhat node
npm run backend       # Start backend server
npm run frontend      # Start frontend

# Database
npm run setup-db      # Setup database and seed data
npm run reset-db      # Reset database

# IAM Integration
npm run setup-***REMOVED-KEYCLOAK_DB_PASSWORD*** # Setup Keycloak IAM
npm run migrate-iam   # Add IAM fields to database

# Testing
npm run test          # Run all tests
npm run test:backend  # Backend tests only
npm run test:blockchain # Blockchain tests only
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

- **Documentation**: Check the guides above
- **Issues**: Create an issue on GitHub
- **Questions**: Open a discussion on GitHub

---

**⚠️ Important**: This is a development system. Never use test wallets on mainnet networks! 