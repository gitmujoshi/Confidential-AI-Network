# Contract JSON Template Guide

## Overview

This guide explains how to use the comprehensive JSON template for contracts in the Contract Management System. The template supports multi-party contracts between Training Data Providers (TDP), Training Data Consumers (TDC), and Confidential Clean Room Providers (CCRP).

## 📁 Files

- **`contract_template.json`**: JSON Schema template with validation rules
- **`sample_contract.json`**: Example contract with realistic data
- **`CONTRACT_TEMPLATE_GUIDE.md`**: This documentation

## 🏗️ Template Structure

### 1. Metadata Section
```json
{
  "metadata": {
    "templateVersion": "2.0.0",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "lastModified": "2024-01-15T10:35:00.000Z",
    "contractType": "DATA_SHARING"
  }
}
```

**Purpose**: System information and contract metadata
**Required Fields**: `templateVersion`, `createdAt`, `contractType`

### 2. Contract Identification
```json
{
  "contractId": "CONTRACT-1705312200000",
  "blockchainContractId": 12345,
  "status": "PENDING_TDP_APPROVAL"
}
```

**Purpose**: Unique identifiers and workflow status
**Status Values**:
- `PENDING_TDP_APPROVAL`: TDC created, waiting for TDP auto-sign
- `PENDING_CCRP_APPROVAL`: TDP signed, waiting for CCRP
- `ACTIVE`: All required parties signed
- `COMPLETED`: Contract execution finished
- `CANCELLED`: Contract cancelled

### 3. Parties Section
```json
{
  "parties": {
    "tdp": {
      "id": 1,
      "name": "Acme Data Corp",
      "email": "tdp@acmedata.com",
      "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "did": "did:web:acmedata.com:user:123",
      "partyType": "TDP",
      "organization": "Acme Data Corporation",
      "signed": false,
      "signedAt": null
    }
  }
}
```

**Party Types**:
- **TDP (Training Data Provider)**: Dataset owner, auto-signs when contract created
- **TDC (Training Data Consumer)**: Contract initiator, signs to finalize
- **CCRP (Confidential Clean Room Provider)**: Optional reviewer, provides secure environment

### 4. Dataset Information
```json
{
  "dataset": {
    "id": 1,
    "datasetId": "DS-2024-001",
    "name": "Customer Behavior Dataset 2024",
    "description": "Comprehensive dataset containing customer behavior patterns...",
    "category": "CUSTOMER_DATA",
    "size": "2.5 GB",
    "recordCount": 1000000,
    "price": 5000.00,
    "license": "COMMERCIAL_USE"
  }
}
```

**Categories**: `CUSTOMER_DATA`, `FINANCIAL_DATA`, `HEALTHCARE_DATA`, `RESEARCH_DATA`, `CUSTOM`

### 5. Model Information
```json
{
  "model": {
    "modelId": "MODEL-2024-001",
    "name": "Customer Churn Prediction Model",
    "description": "Machine learning model to predict customer churn...",
    "type": "CLASSIFICATION",
    "algorithm": "XGBoost",
    "framework": "TensorFlow"
  }
}
```

**Model Types**: `CLASSIFICATION`, `REGRESSION`, `CLUSTERING`, `RECOMMENDATION`, `CUSTOM`

### 6. Financial Terms
```json
{
  "financial": {
    "price": 10000.00,
    "currency": "USD",
    "blockchainPrice": "10000000000000000000000",
    "paymentTerms": "UPFRONT"
  }
}
```

**Payment Terms**: `UPFRONT`, `INSTALLMENTS`, `UPON_COMPLETION`

### 7. Timeline
```json
{
  "timeline": {
    "duration": 30,
    "startDate": "2024-01-15",
    "endDate": "2024-02-14",
    "milestones": [...]
  }
}
```

### 8. Data Processing & Compliance
```json
{
  "dataProcessing": {
    "purpose": "Machine learning model training for customer churn prediction",
    "dataTypes": ["customer-behavior", "purchase-history", "demographics"],
    "retentionPeriod": 90,
    "securityMeasures": ["encryption-at-rest", "access-controls"],
    "compliance": ["DPDP_2023", "GDPR", "ISO_27001"]
  }
}
```

### 9. Blockchain Information
```json
{
  "blockchain": {
    "network": "goerli",
    "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "gasUsed": 150000,
    "gasPrice": "20000000000"
  }
}
```

### 10. Audit Trail
```json
{
  "audit": {
    "createdBy": "tdc@aitraining.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "version": 1,
    "changes": [...]
  }
}
```

## 🔄 Contract Workflow

### 1. Contract Creation (TDC)
```json
{
  "status": "PENDING_TDP_APPROVAL",
  "parties": {
    "tdp": { "signed": false },
    "tdc": { /* TDC info */ },
    "ccrp": { /* Optional CCRP */ }
  }
}
```

### 2. TDP Auto-Signing
```json
{
  "status": "PENDING_CCRP_APPROVAL",
  "parties": {
    "tdp": { 
      "signed": true,
      "signedAt": "2024-01-15T10:35:00.000Z"
    }
  }
}
```

### 3. CCRP Signing (if selected)
```json
{
  "status": "ACTIVE",
  "parties": {
    "ccrp": { 
      "signed": true,
      "signedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### 4. Contract Completion
```json
{
  "status": "COMPLETED",
  "timeline": {
    "milestones": [
      { "name": "Project Completion", "completed": true }
    ]
  }
}
```

## 🛠️ Usage Examples

### Creating a New Contract

```javascript
// Using the template to create a new contract
const contractData = {
  metadata: {
    templateVersion: "2.0.0",
    createdAt: new Date().toISOString(),
    contractType: "DATA_SHARING"
  },
  contractId: `CONTRACT-${Date.now()}`,
  status: "PENDING_TDP_APPROVAL",
  parties: {
    tdp: {
      id: tdpUser.id,
      name: tdpUser.name,
      email: tdpUser.email,
      partyType: "TDP",
      signed: false
    },
    tdc: {
      id: tdcUser.id,
      name: tdcUser.name,
      email: tdcUser.email,
      partyType: "TDC"
    }
  },
  dataset: {
    id: dataset.id,
    datasetId: dataset.datasetId,
    name: dataset.name,
    description: dataset.description,
    category: dataset.category,
    size: dataset.size,
    recordCount: dataset.recordCount,
    price: dataset.price,
    license: dataset.license
  },
  model: {
    modelId: modelId,
    name: modelName,
    description: modelDescription,
    type: modelType
  },
  financial: {
    price: totalPrice,
    currency: "USD",
    paymentTerms: "UPFRONT"
  },
  timeline: {
    duration: durationInDays
  },
  termsAndConditions: terms,
  dataProcessing: {
    purpose: dataPurpose,
    dataTypes: dataTypes,
    retentionPeriod: retentionDays,
    securityMeasures: securityMeasures,
    compliance: complianceRequirements
  },
  audit: {
    createdBy: currentUser.email,
    createdAt: new Date().toISOString(),
    version: 1
  }
};
```

### Validating Contract Data

```javascript
// Using JSON Schema validation
const Ajv = require('ajv');
const contractSchema = require('./contract_template.json');

const ajv = new Ajv();
const validate = ajv.compile(contractSchema);

const isValid = validate(contractData);
if (!isValid) {
  console.error('Validation errors:', validate.errors);
}
```

### API Integration

```javascript
// Creating contract via API
const response = await fetch('/api/contracts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    tdpId: contractData.parties.tdp.id,
    datasetId: contractData.dataset.id,
    modelId: contractData.model.modelId,
    price: contractData.financial.price,
    duration: contractData.timeline.duration,
    termsAndConditions: contractData.termsAndConditions,
    ccrpId: contractData.parties.ccrp?.id
  })
});
```

## 🔒 Security Considerations

### 1. Data Privacy
- All personal data is anonymized
- Data retention periods are enforced
- Access controls are implemented

### 2. Blockchain Security
- Private keys never transmitted to backend
- DID-based cryptographic verification
- Immutable audit trail on blockchain

### 3. Compliance
- DPDP Act 2023 compliance
- GDPR compliance for international data
- ISO 27001 security standards

## 📊 Performance Optimization

### 1. Database Indexing
```sql
-- Optimized indexes for contract queries
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_tdp_id ON contracts(tdpId);
CREATE INDEX idx_contracts_tdc_id ON contracts(tdcId);
CREATE INDEX idx_contracts_ccrp_id ON contracts(ccrpId);
```

### 2. Caching Strategy
```javascript
// Cache frequently accessed contracts
const contractCache = new Map();
const cacheContract = (contractId, contractData) => {
  contractCache.set(contractId, {
    data: contractData,
    timestamp: Date.now()
  });
};
```

### 3. Blockchain Fallback
```javascript
// Graceful fallback when blockchain unavailable
if (!blockchainService.isConnected()) {
  // Use database-only mode
  contractData.blockchain = {
    network: "database-only",
    status: "FALLBACK"
  };
}
```

## 🧪 Testing

### 1. Template Validation
```bash
# Validate sample contract against template
npx ajv validate -s contract_template.json -d sample_contract.json
```

### 2. API Testing
```bash
# Test contract creation
curl -X POST http://localhost:5001/api/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @sample_contract.json
```

### 3. Blockchain Testing
```bash
# Test blockchain integration
npm run test:blockchain
```

## 📈 Monitoring

### 1. Contract Metrics
- Contract creation rate
- Average processing time
- Success/failure rates
- Gas usage statistics

### 2. Performance Metrics
- API response times
- Database query performance
- Blockchain transaction success rates

### 3. Compliance Metrics
- DPDP compliance status
- Data retention compliance
- Security measure implementation

## 🔄 Version Control

### Template Versioning
- Major version changes for breaking changes
- Minor version for new features
- Patch version for bug fixes

### Migration Strategy
```javascript
// Version migration helper
const migrateContract = (contractData, targetVersion) => {
  const currentVersion = contractData.metadata.templateVersion;
  // Migration logic here
  return migratedContract;
};
```

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Smart Contract Documentation](./blockchain/contracts/ContractManager.sol)
- [Database Schema](./backend/models/Contract.js)
- [Frontend Components](./frontend/src/pages/Contracts.js)

## 🤝 Support

For questions or issues with the contract template:

1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Review the [sample contract](./sample_contract.json)
3. Validate your contract against the [template](./contract_template.json)
4. Contact the development team

---

**Template Version**: 2.0.0  
**Last Updated**: 2024-01-15  
**Compatibility**: Contract Management System v2.0+ 