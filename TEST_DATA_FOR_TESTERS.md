# Test Data Reference for Testers

This document provides a comprehensive summary of all test users, datasets, AI models, contracts, and related entities available in the Contract Management System for testing purposes.

---

## 🎯 **Test Data Overview**

The system contains **comprehensive test data** covering all user roles and business scenarios:

- **👥 Users**: 8 test users across all roles
- **📊 Datasets**: 7 datasets for TDPs (Healthcare, Finance, Retail)
- **🤖 AI Models**: 3 AI models for TDCs
- **🔐 CCRP Credentials**: Cloud provider credentials and Azure configurations
- **📜 Contracts**: 3 sample contracts with different statuses
- **🏗️ Training Environments**: Runtime environments for AI training
- **💰 Privacy Budget**: Differential privacy settings
- **📋 SCITT CCF Integration**: Comprehensive SCITT CCF ledger integration with hybrid mode support
- **🔗 Modern Architecture**: SCITT CCF blockchain with Ricardian smart contracts

---

## 🏗️ **Technical Architecture Notes**

### **📊 Database Schema**
- **Field Naming**: All database columns use snake_case (e.g., `user_id`, `contract_id`)
- **JSONB Fields**: JSON data is stored as JSONB for better performance and indexing
- **Foreign Keys**: Proper foreign key relationships between all tables
- **Indexes**: GIN indexes on JSONB fields for fast tag-based queries

### **🔗 SCITT CCF Mode Support**
- **Blockchain Mode**: Configurable via `SCITT_CCF_MODE` environment variable
  - `SCITT_CCF_ONLY`: Pure SCITT CCF ledger mode (recommended)
  - `DATABASE_ONLY`: Database-only mode for testing
- **Fallback Support**: Automatic fallback to database mode if SCITT CCF unavailable

### **🔐 Authentication & Authorization**
- **Keycloak Integration**: Primary authentication via Keycloak
- **Role-Based Access**: TDP, TDC, CCRP, AppAdmin roles
- **JWT Tokens**: Secure API access with role validation

---

## 👥 **Test Users by Role**

### **🔧 AppAdmin (System Administrator)**
| Name | Email | DEPA ID | Description | Status |
|------|-------|----------|-------------|---------|
| System Administrator | admin@contractmanagement.com | USER-ADMIN-001 | System administrator with full access | ✅ Active |

### **📊 TDP (Training Data Providers)**
| Name | Email | DEPA ID | Organization | Description | Status |
|------|-------|----------|--------------|-------------|---------|
| Healthcare Data Corp | healthcare@tdp.com | USER-TDP-001 | Healthcare Data Corporation | Healthcare datasets (medical imaging, patient records) | ✅ Active |
| Financial Analytics Inc | finance@tdp.com | USER-TDP-002 | Financial Analytics Incorporated | Financial datasets (stock market, credit risk) | ✅ Active |
| Retail Insights Ltd | retail@tdp.com | USER-TDP-003 | Retail Insights Limited | Retail datasets (customer behavior, inventory) | ✅ Active |

### **🤖 TDC (Training Data Consumers)**
| Name | Email | DEPA ID | Organization | Description | Status |
|------|-------|----------|--------------|-------------|---------|
| AI Research Institute | research@tdc.com | USER-TDC-001 | AI Research Institute | Medical AI and financial prediction models | ✅ Active |
| Tech Startup Co | tech@tdc.com | USER-TDC-002 | Tech Startup Company | Customer segmentation and marketing AI | ✅ Active |

### **🔐 CCRP (Confidential Clean Room Providers)**
| Name | Email | DEPA ID | Organization | Description | Status |
|------|-------|----------|--------------|-------------|---------|
| Secure Compute Solutions | secure@ccrp.com | USER-CCRP-001 | Secure Compute Solutions | Azure-based secure computing | ✅ Active |
| Privacy First Computing | privacy@ccrp.com | USER-CCRP-002 | Privacy First Computing | Multi-cloud privacy-focused computing | ✅ Active |

---

## 📊 **Test Datasets**

### **🏥 Healthcare Datasets (Owner: Healthcare Data Corp)**
| Dataset ID | Name | Category | Size | Records | Price | License | Description |
|------------|------|----------|------|---------|-------|---------|-------------|
| DATASET-001 | Medical Imaging Dataset | Computer Vision | 500MB | 100,000 | $5,000 | Commercial | Comprehensive medical imaging dataset for AI training |
| DATASET-002 | Patient Records Dataset | Tabular | 200MB | 50,000 | $3,000 | Research | Anonymized patient records for research purposes |
| DATASET-003 | Clinical Trial Data | Tabular | 150MB | 25,000 | $2,000 | Academic | Clinical trial results and outcomes data |

### **💰 Financial Datasets (Owner: Financial Analytics Inc)**
| Dataset ID | Name | Category | Size | Records | Price | License | Description |
|------------|------|----------|------|---------|-------|---------|-------------|
| DATASET-004 | Stock Market Data | Tabular | 1GB | 1,000,000 | $8,000 | Commercial | Historical stock market data for algorithmic trading |
| DATASET-005 | Credit Risk Dataset | Tabular | 300MB | 75,000 | $4,000 | Commercial | Credit risk assessment data for banking |

### **🛒 Retail Datasets (Owner: Retail Insights Ltd)**
| Dataset ID | Name | Category | Size | Records | Price | License | Description |
|------------|------|----------|------|---------|-------|---------|-------------|
| DATASET-006 | Customer Behavior Data | Tabular | 400MB | 200,000 | $3,500 | Commercial | Customer shopping behavior and preferences |
| DATASET-007 | Inventory Analytics | Tabular | 250MB | 100,000 | $1,500 | Commercial | Inventory management and sales analytics data |

---

## 🤖 **AI Models**

### **🏥 Medical AI Models (Owner: AI Research Institute)**
| Model ID | Name | Type | Framework | Accuracy | Price | Description |
|----------|------|------|-----------|----------|-------|-------------|
| MODEL-001 | Medical AI Model | Computer Vision | PyTorch | 95% | $15,000 | AI model for medical diagnosis and analysis |

### **💰 Financial AI Models (Owner: AI Research Institute)**
| Model ID | Name | Type | Framework | Accuracy | Price | Description |
|----------|------|------|-----------|----------|-------|-------------|
| MODEL-002 | Financial Prediction Model | Tabular | TensorFlow | 87% | $12,000 | AI model for financial market predictions |

### **🛒 Marketing AI Models (Owner: Tech Startup Co)**
| Model ID | Name | Type | Framework | Accuracy | Price | Description |
|----------|------|------|-----------|----------|-------|-------------|
| MODEL-003 | Customer Segmentation Model | Tabular | Scikit-learn | 92% | $8,000 | AI model for customer segmentation and targeting |

---

## 🔐 **CCRP Cloud Credentials**

### **☁️ Azure Credentials (Secure Compute Solutions)**
| Credential ID | Subscription ID | Tenant ID | Location | Resource Group | Status |
|---------------|------------------|-----------|----------|----------------|---------|
| CCRP-AZURE-001 | sub-12345678-1234-1234-1234-123456789012 | tenant-12345678-1234-1234-1234-123456789012 | East US | training-rg-001 | ✅ Active |

### **☁️ Multi-Cloud Credentials (Privacy First Computing)**
| Credential ID | Cloud Provider | Credential Type | Status |
|---------------|----------------|-----------------|---------|
| CCRP-MULTI-001 | AWS | IAM Role | ✅ Active |
| CCRP-MULTI-002 | GCP | Service Account | ✅ Active |
| CCRP-MULTI-003 | Azure | Service Principal | ✅ Active |
| CCRP-MULTI-004 | OCI | API Key | ✅ Active |

---

## 📜 **Contract Templates**

| Template ID | Name | Type | Description | Created By |
|-------------|------|------|-------------|------------|
| TEMPLATE-001 | Standard AI Training Contract | AI_TRAINING | Standard contract template for AI model training | System Admin |
| TEMPLATE-002 | Healthcare Data Contract | HEALTHCARE | Specialized contract for healthcare data usage | System Admin |
| TEMPLATE-003 | Financial Data Contract | FINANCIAL | Contract template for financial data analysis | System Admin |

---

## 📋 **Sample Contracts**

### **🏥 Healthcare AI Training Contract**
| Contract ID | Name | TDP | TDC | CCRP | Status | Value |
|-------------|------|-----|-----|------|--------|-------|
| CONTRACT-001 | Healthcare AI Training Contract | Healthcare Data Corp | AI Research Institute | Secure Compute Solutions | PENDING_TDP_APPROVAL | $8,000 |

### **💰 Financial Analytics Contract**
| Contract ID | Name | TDP | TDC | CCRP | Status | Value |
|-------------|------|-----|-----|------|--------|-------|
| CONTRACT-002 | Financial Analytics Contract | Financial Analytics Inc | AI Research Institute | Privacy First Computing | PENDING_TDP_APPROVAL | $12,000 |

### **🛒 Retail Customer Insights Contract**
| Contract ID | Name | TDP | TDC | CCRP | Status | Value |
|-------------|------|-----|-----|------|--------|-------|
| CONTRACT-003 | Retail Customer Insights Contract | Retail Insights Ltd | Tech Startup Co | Secure Compute Solutions | PENDING_TDP_APPROVAL | $5,000 |

---

## 🏗️ **Training Environments**

### **🔐 Secure Healthcare Environment**
| Environment ID | Name | Cloud Provider | Compute Specs | Status | Contract |
|----------------|------|----------------|---------------|--------|----------|
| ENV-001 | Healthcare Training Environment | Azure | 4 vCPU, 16GB RAM, GPU | CREATING | CONTRACT-001 |

### **🔒 Financial Privacy Environment**
| Environment ID | Name | Cloud Provider | Compute Specs | Status | Contract |
|----------------|------|----------------|---------------|--------|----------|
| ENV-002 | Financial Training Environment | AWS | 8 vCPU, 32GB RAM, Encrypted Storage | CREATING | CONTRACT-002 |

---

## 💰 **Privacy Budget Settings**

### **🔒 Differential Privacy Configuration**
| Contract ID | Budget Type | Total Budget | Used Budget | Privacy Mechanism |
|-------------|-------------|--------------|-------------|-------------------|
| CONTRACT-001 | EPSILON | 1.0 | 0.0 | Laplace Mechanism |
| CONTRACT-002 | DELTA | 0.01 | 0.0 | Gaussian Mechanism |
| CONTRACT-003 | SENSITIVITY | 2.0 | 0.0 | Exponential Mechanism |

---

## 📊 **SCITT CCF Integration Data**

### **🔐 SCITT Claims**
| Claim ID | Type | Status | Contract | Description |
|----------|------|--------|----------|-------------|
| SCITT-CLAIM-001 | contract_creation | PENDING | CONTRACT-001 | Healthcare contract SCITT claim |
| SCITT-CLAIM-002 | contract_creation | PENDING | CONTRACT-002 | Financial contract SCITT claim |
| SCITT-CLAIM-003 | contract_creation | PENDING | CONTRACT-003 | Retail contract SCITT claim |

### **🌐 SCITT CCF Services**
| Service | URL | Status | Description |
|---------|-----|--------|-------------|
| SCITT CCF Node | http://localhost:8000 | ✅ Active | Main SCITT CCF ledger node |
| SCITT CCF Dashboard | http://localhost:8082 | ✅ Active | Web interface for SCITT CCF |
| SCITT CCF Monitor | http://localhost:8001 | ✅ Active | Monitoring and health checks |
| SCITT CCF Redis | localhost:6379 | ✅ Active | Caching and session storage |

### **📋 SCITT CCF Test Endpoints**
| Endpoint | Method | Description | Test Data |
|-----------|--------|-------------|-----------|
| `/api/scitt-ccf/health` | GET | SCITT CCF service health | Check service status |
| `/api/scitt-ccf/metrics` | GET | SCITT CCF performance metrics | View system metrics |
| `/api/scitt-ccf/contracts` | POST | Create contract in SCITT CCF | Submit contract data |
| `/api/scitt-ccf/contracts/:id/status` | GET | Get contract status | Check contract state |
| `/api/scitt-ccf/contracts/:id/provenance` | GET | Get provenance tree | View data lineage |

---

## 🔍 **Test Scenarios**

### **1. TDP Workflow Testing**
- **Login**: Use `healthcare@tdp.com`, `finance@tdp.com`, or `retail@tdp.com`
- **Actions**: 
  - View owned datasets
  - Update dataset information
  - Set pricing and licensing
  - Respond to contract requests

### **2. TDC Workflow Testing**
- **Login**: Use `research@tdc.com` or `tech@tdc.com`
- **Actions**:
  - Browse available datasets
  - View AI models
  - Create training contracts
  - Select CCRP providers

### **3. CCRP Workflow Testing**
- **Login**: Use `secure@ccrp.com` or `privacy@ccrp.com`
- **Actions**:
  - Manage cloud credentials
  - Configure training environments
  - Monitor contract execution
  - Provide attestation reports

### **4. Contract Lifecycle Testing**
- **Contract Creation**: TDC creates contract
- **TDP Approval**: TDP reviews and approves
- **CCRP Selection**: TDC selects CCRP
- **Environment Setup**: CCRP provisions training environment
- **Execution**: AI model training begins
- **Completion**: Contract fulfillment and payment

### **5. SCITT CCF Integration Testing**
- **Hybrid Contract Creation**: Test contracts created in both systems
- **Provenance Tracking**: Verify data lineage in SCITT CCF
- **Attestation**: Test TEE attestation and verification
- **Fallback Scenarios**: Test system behavior when one ledger fails
- **Multi-TDP Contracts**: Test contracts with multiple data providers

### **6. JSONB Field Testing**
- **Tag Queries**: Test fast tag-based searches using GIN indexes
- **Metadata Operations**: Test JSONB field updates and queries
- **Performance**: Verify improved query performance with JSONB

---

## 🚀 **Quick Test Commands**

### **Test User Registration**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "partyType": "TDP",
    "organization": "Test Corp"
  }'
```

### **Test Dataset Creation**
```bash
curl -X POST http://localhost:5001/api/datasets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Dataset",
    "description": "Test dataset for testing",
    "category": "Computer Vision",
    "size": 100,
    "recordCount": 1000,
    "price": 100.00,
    "license": "Test License"
  }'
```

### **Test Contract Creation**
```bash
curl -X POST http://localhost:5001/api/contracts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Contract",
    "description": "Test contract for testing",
    "price": 1000.00,
    "duration": 30,
    "termsAndConditions": "Test terms"
  }'
```

### **Test SCITT CCF Integration**
```bash
# Check SCITT CCF health
curl -X GET http://localhost:5001/api/scitt-ccf/health \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get SCITT CCF metrics
curl -X GET http://localhost:5001/api/scitt-ccf/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create contract in SCITT CCF
curl -X POST http://localhost:5001/api/scitt-ccf/contracts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SCITT CCF Test Contract",
    "description": "Test contract in SCITT CCF",
    "tdcId": "USER-TDC-001",
    "tdpIds": ["USER-TDP-001"],
    "ccrpId": "USER-CCRP-001"
  }'
```

### **Test Hybrid Mode**
```bash
# Test contract creation in hybrid mode
curl -X POST http://localhost:5001/api/contracts/ricardian \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hybrid Test Contract",
    "description": "Test contract in both systems",
    "migrationMode": "HYBRID",
    "tdcId": "USER-TDC-001",
    "tdpIds": ["USER-TDP-001"],
    "ccrpId": "USER-CCRP-001"
  }'
```

---

## 📋 **Data Verification Queries**

### **Check User Counts by Role**
```sql
SELECT party_type, COUNT(*) as user_count 
FROM users 
GROUP BY party_type 
ORDER BY party_type;
```

### **Check Dataset Counts by Owner**
```sql
SELECT u.name as owner, COUNT(d.id) as dataset_count
FROM users u
LEFT JOIN datasets d ON u.id = d.owner_id
WHERE u.party_type = 'TDP'
GROUP BY u.id, u.name
ORDER BY u.name;
```

### **Check Contract Status Distribution**
```sql
SELECT status, COUNT(*) as contract_count
FROM contracts
GROUP BY status
ORDER BY contract_count DESC;
```

### **Test JSONB Field Performance**
```sql
-- Test tag-based queries using GIN indexes
SELECT * FROM contract_templates 
WHERE tags @> '["ai", "machine-learning"]';

-- Test metadata queries
SELECT * FROM datasets 
WHERE metadata @> '{"category": "healthcare"}';

-- Test array containment
SELECT * FROM users 
WHERE cloud_providers @> '["AWS", "Azure"]';
```

### **Verify SCITT CCF Integration**
```sql
-- Check SCITT claims
SELECT * FROM scitt_claims 
WHERE status = 'PENDING';

-- Check provenance nodes
SELECT * FROM provenance_nodes 
WHERE contract_id = 'CONTRACT-001';

-- Check contract datasets
SELECT * FROM contract_datasets 
WHERE contract_id = 'CONTRACT-001';
```

---

## 🔧 **Troubleshooting**

### **Common Issues**
1. **User Not Found**: Ensure user exists in both database and Keycloak
2. **Permission Denied**: Check user role and permissions
3. **Dataset Access**: Verify dataset ownership and contract relationships
4. **Contract Creation**: Ensure all required parties are available

### **Data Reset**
To reset test data to a clean state:
```bash
# Run the test data creation script
node create-test-data.js

# Or reset specific tables
docker exec postgres-app psql -U postgres -d contract_management -c "TRUNCATE users, datasets, contracts, ai_models CASCADE;"
```

---

## 📞 **Support**

For issues with test data:
1. Check this document for correct test scenarios
2. Verify database connectivity and user authentication
3. Review system logs for error messages
4. Contact the development team with specific error details

---

*Last Updated: 2025-08-18*
*Test Data Version: 3.0.0*
*Coverage: 100% of user roles, business scenarios, and technical features*
*Includes: SCITT CCF integration, Hybrid mode, JSONB optimization, and comprehensive testing* 