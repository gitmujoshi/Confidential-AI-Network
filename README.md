# Contract Management System

A comprehensive contract management system supporting multi-TDP (Training Data Provider) contracts with Ricardian contract functionality, blockchain integration, and Azure Confidential Computing.

## 🚀 Key Features

### Multi-TDP Contract Management
- **Up to 3 Datasets**: Create contracts with multiple datasets from different TDPs
- **Individual Pricing**: Each dataset has its own price within the contract
- **Independent Signing**: Each TDP signs independently for their dataset
- **Payment Tracking**: Individual payment status tracking per TDP
- **Status Monitoring**: Real-time multi-TDP status tracking

### Ricardian Contract Support
- **Legal Documents**: Human-readable legal agreements
- **Smart Contracts**: Machine-executable blockchain contracts
- **Cryptographic Binding**: Legal documents bound to smart contracts
- **Technical Parameters**: AI training parameters and environment specifications
- **Attestation**: Azure Confidential Computing attestation support

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

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with Keycloak integration
- **Blockchain**: Ethereum smart contract integration
- **Notifications**: Email and in-app notifications
- **Testing**: Comprehensive test suite

### Frontend (React + Material-UI)
- **Multi-Dataset Selection**: Interactive dataset selection with pricing
- **Contract Management**: Comprehensive contract display and management
- **Download Capabilities**: Complete contract and legal document downloads
- **Real-time Updates**: Live status tracking and notifications

## 📋 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Docker (for Keycloak)

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
   # Configure database and other settings
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

## 🔧 Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=***REMOVED-DB_PASSWORD***ql://user:password@localhost:5432/contracts

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
```

## 📖 Usage

### Creating Multi-TDP Contracts
1. **Select Datasets**: Choose 1-3 datasets from different TDPs
2. **Set Pricing**: Configure individual prices for each dataset
3. **Configure Contract**: Set duration, terms, and technical parameters
4. **Create Contract**: Contract is created with all selected datasets

### Managing Contracts
1. **View Details**: Comprehensive display of all TDPs and datasets
2. **Track Status**: Real-time updates on signatures and payments
3. **Download Documents**: Complete contract and legal document downloads
4. **Record Payments**: Individual payment tracking per TDP

### Download Functionality
- **Complete Contract**: Downloads all contract data (legal, technical, workflow, signatures)
- **Legal Document**: Downloads only the legal document JSON (when available)
- **Enhanced Coverage**: Includes payment summaries, multi-TDP status, and Ricardian fields

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

## 📚 Documentation

- [Multi-TDP Implementation Guide](MULTI_TDP_IMPLEMENTATION_SUMMARY.md)
- [Frontend Update Summary](FRONTEND_MULTI_TDP_UPDATE_SUMMARY.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Security Guide](SECURITY_GUIDE.md)

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

### Latest Features
- **Multi-TDP Contract Support**: Up to 3 datasets from different TDPs
- **Download Functionality**: Complete contract and legal document downloads
- **Enhanced UI**: Clear button labels and comprehensive data display
- **Ricardian Contract Details**: Full display of legal and technical parameters
- **Payment Tracking**: Individual payment status per TDP
- **Real-time Status**: Live updates on contract progress

### Technical Improvements
- **Database Schema**: Enhanced for multi-TDP support
- **API Endpoints**: New endpoints for multi-TDP management
- **Frontend Components**: New components for dataset selection
- **Error Handling**: Improved error handling and user feedback
- **Testing Coverage**: Comprehensive test suite for all features 