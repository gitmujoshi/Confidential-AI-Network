# ContractFlow Pro - Official SDKs & Tools

This directory contains official SDKs, testing tools, and integration resources for the ContractFlow Pro API.

## 📚 What's Included

### 🚀 SDKs (Software Development Kits)
- **Node.js SDK** (`contractflow-pro-sdk.js`) - Full-featured JavaScript/Node.js client
- **Python SDK** (`contractflow_pro_sdk.py`) - Comprehensive Python client
- **Postman Collection** (`ContractFlow_Pro_API_Collection.json`) - Ready-to-use API testing

### 🧪 Testing Tools
- **API Test Suite** (`../tests/api-test-suite.js`) - Quick API validation
- **Comprehensive Test Runner** (`../scripts/test-api-comprehensive.js`) - Full system testing
- **Test Results** - JSON and HTML reports

## 🛠️ Quick Start

### Node.js SDK

```bash
# Install dependencies
cd backend/sdk
npm install

# Run quick tests
npm run test:quick

# Run comprehensive tests
npm run test

# View examples
npm run example
```

```javascript
const { ContractFlowProSDK, ContractManager } = require('./contractflow-pro-sdk');

// Initialize SDK
const sdk = new ContractFlowProSDK({
  baseURL: 'https://api.contractflowpro.com',
  timeout: 30000
});

// Login
await sdk.login('user@example.com', 'password');

// Use convenience classes
const contractManager = new ContractManager(sdk);
const contract = await contractManager.createAITrainingContract(
  ['DS-001', 'DS-002'],
  30,
  'Standard AI training terms'
);

console.log('Contract created:', contract.contract.contractId);
```

### Python SDK

```bash
# Install dependencies
cd backend/sdk
pip install -r requirements.txt

# Run Python examples
python examples/basic_usage.py
```

```python
from contractflow_pro_sdk import ContractFlowProSDK, ContractManager

# Initialize SDK
sdk = ContractFlowProSDK({
    'base_url': 'https://api.contractflowpro.com',
    'timeout': 30
})

# Login
response = sdk.login('user@example.com', 'password')
print(f"Login successful: {response['success']}")

# Use convenience classes
contract_manager = ContractManager(sdk)
contract = contract_manager.create_ai_training_contract(
    dataset_ids=['DS-001', 'DS-002'],
    duration=30,
    terms='Standard AI training terms'
)

print(f"Contract created: {contract['contract']['contractId']}")
```

## 🔧 SDK Features

### Core Functionality
- **Authentication** - Login, registration, token management
- **Contract Management** - Create, read, update Ricardian contracts
- **Dataset Operations** - Browse, search, manage datasets
- **Infrastructure** - Provision training environments
- **Cloud Integration** - Multi-cloud support (AWS, Azure, GCP, OCI)
- **Secret Management** - Secure credential storage
- **Dashboards** - Role-based dashboard access
- **Analytics** - Contract and system analytics

### Convenience Classes
- **ContractManager** - Simplified contract operations
- **DatasetManager** - Easy dataset discovery and management
- **InfrastructureManager** - Cloud environment provisioning

### Advanced Features
- **Batch Operations** - Process multiple items efficiently
- **Error Handling** - Comprehensive error management
- **Performance Monitoring** - Response time tracking
- **Auto-retry** - Built-in retry logic for failed requests

## 🧪 Testing Your API

### Quick API Validation
```bash
# Test basic API functionality
npm run test:quick

# Test specific functionality
npm run test:auth
```

### Comprehensive Testing
```bash
# Run full test suite
npm run test

# View detailed reports
open test-results/api-test-results.html
```

### Manual Testing with Postman
1. Import `ContractFlow_Pro_API_Collection.json` into Postman
2. Set environment variables:
   - `base_url`: Your API base URL
   - `auth_token`: Your authentication token
3. Start with "Health Check" endpoint
4. Run "User Login" to get authentication token
5. Test all endpoints systematically

## 📊 Test Results

After running tests, you'll find detailed reports in `../test-results/`:

- **`api-test-results.json`** - Machine-readable test results
- **`api-test-results.html`** - Human-readable HTML report with:
  - Test summary and success rates
  - Performance metrics
  - Detailed error information
  - Response time analysis

## 🌐 API Endpoints Covered

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Contracts
- `POST /api/contracts/ricardian` - Create Ricardian contract
- `GET /api/contracts/:id` - Get contract details
- `GET /api/contracts` - List contracts
- `PUT /api/contracts/:id` - Update contract

### Datasets
- `GET /api/datasets/public` - Browse public datasets
- `GET /api/datasets/search` - Search datasets
- `GET /api/tdp/datasets/:userId` - Get TDP datasets

### Infrastructure
- `POST /api/infrastructure/environments` - Create training environment
- `GET /api/infrastructure/environments/:id` - Get environment details
- `GET /api/infrastructure/cloud-providers` - List cloud providers

### Cloud Credentials
- `POST /api/ccrp/cloud-credentials` - Store credentials
- `GET /api/ccrp/cloud-credentials/:userId` - Get stored credentials
- `POST /api/ccrp/cloud-credentials/:id/validate` - Validate credentials

### Dashboards
- `GET /api/tdc/dashboard/:userId` - TDC dashboard
- `GET /api/tdp/dashboard/:userId` - TDP dashboard
- `GET /api/ccrp/dashboard/:userId` - CCRP dashboard

## 🔐 Authentication

All protected endpoints require JWT authentication:

```javascript
// Set token after login
sdk.setToken('your-jwt-token');

// Token is automatically included in requests
const profile = await sdk.getProfile();

// Clear token on logout
sdk.logout();
```

## 🌍 Multi-Cloud Support

The SDKs support all major cloud providers:

- **AWS** - Nitro Enclaves, EC2, S3, KMS
- **Azure** - SGX Enclaves, VMs, Blob Storage, Key Vault
- **GCP** - Confidential VMs, Compute Engine, Cloud Storage, KMS
- **OCI** - Confidential Computing, Compute, Object Storage, Vault

## 🚀 Examples

### Create AI Training Contract
```javascript
const contractData = {
  datasetSelections: [
    { datasetId: 'DS-001', individualPrice: 1000 }
  ],
  duration: 30,
  termsAndConditions: 'AI training terms',
  contractType: 'AI_TRAINING',
  privacyRequirements: {
    differentialPrivacy: true,
    maxPrivacyLoss: 0.1
  }
};

const contract = await sdk.createRicardianContract(contractData);
```

### Provision Training Environment
```javascript
const environmentData = {
  contractId: contract.contract.id,
  cloudProvider: 'AZURE',
  region: 'eastus',
  vmSize: 'Standard_D2s_v3',
  enableConfidentialComputing: true
};

const environment = await sdk.createTrainingEnvironment(environmentData);
```

### Search Datasets
```javascript
const datasets = await sdk.searchDatasets('customer', {
  category: 'CUSTOMER_DATA',
  priceMax: 1000
});
```

## 📝 Error Handling

The SDKs provide comprehensive error handling:

```javascript
try {
  const result = await sdk.createRicardianContract(contractData);
} catch (error) {
  if (error.status === 401) {
    console.log('Authentication failed');
  } else if (error.status === 400) {
    console.log('Invalid request:', error.message);
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## 🔧 Configuration

### SDK Configuration Options

```javascript
const sdk = new ContractFlowProSDK({
  baseURL: 'https://api.contractflowpro.com',  // API base URL
  timeout: 30000,                              // Request timeout (ms)
  token: 'existing-token'                      // Pre-existing token
});
```

### Environment Variables

```bash
export API_BASE_URL=https://api.contractflowpro.com
export API_TIMEOUT=30000
export API_TOKEN=your-token
```

## 📚 Documentation

- **API Specifications**: `../COMPLETE_API_SPECIFICATIONS.md`
- **Endpoint Reference**: `../API_ENDPOINT_REFERENCE.md`
- **Cloud API Specs**: `../CLOUD_API_SPECIFICATIONS.md`
- **Test Results**: `../test-results/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: See docs/ directory
- **Examples**: See examples/ directory
- **Testing**: Run test suite for validation

---

**Happy coding with ContractFlow Pro! 🚀✨** 