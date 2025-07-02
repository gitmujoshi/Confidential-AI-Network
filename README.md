# Contract Management System

A comprehensive blockchain-based contract management system with role-based access control, secure wallet integration, and automated contract workflows.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
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

# Start services (3 terminals)
# Terminal 1: cd blockchain && npx hardhat node
# Terminal 2: cd backend && npm run dev  
# Terminal 3: cd frontend && npm start

# Access: http://localhost:3000
```

📖 **For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## 🏗️ System Overview

### Multi-Role Architecture
- **TDP (Training Data Provider)**: Dataset owners who provide training data
- **TDC (Training Data Consumer)**: Organizations that purchase and use training data  
- **CCRP (Confidential Clean Room Provider)**: Independent reviewers who validate contracts

### Key Features
- **Secure Wallet Integration**: Client-side signing with MetaMask
- **Blockchain Immutability**: Smart contracts for secure, transparent agreements
- **Role-Based UI**: Dynamic interfaces based on user permissions
- **Automated Workflows**: Streamlined contract creation and signing
- **Real-time Notifications**: Live updates and email notifications

### Technology Stack
- **Frontend**: React 18, Material-UI, Ethers.js, React Query
- **Backend**: Node.js, Express.js, Sequelize ORM, PostgreSQL
- **Blockchain**: Hardhat, Solidity, OpenZeppelin
- **Security**: JWT, HTTPS, Client-side signing

## 📚 Documentation

### Core Guides
- **[Setup Guide](./SETUP_GUIDE.md)** - Complete installation and configuration
- **[User Guide](./USER_GUIDE.md)** - How to use the application
- **[Wallet Guide](./WALLET_GUIDE.md)** - MetaMask setup and wallet management
- **[Architecture Guide](./ARCHITECTURE_GUIDE.md)** - System design and technical details

### Reference Materials
- **[Test Wallets](./TEST_WALLETS.md)** - Development wallet information
- **[API Documentation](./API_DOCS.md)** - Backend API reference

## 🔐 Security Features

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

### TDP (Training Data Provider)
1. Create and manage datasets
2. Auto-sign contracts when created by TDC
3. Monitor contract status and history
4. Receive payments for data access

### TDC (Training Data Consumer)
1. Browse available datasets
2. Select CCRP for contract review
3. Create contracts with dataset and CCRP
4. Sign contracts to finalize agreements

### CCRP (Confidential Clean Room Provider)
1. Receive notifications for contract review
2. Review contract terms and conditions
3. Sign contracts after compliance validation
4. Maintain audit trail of approvals

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