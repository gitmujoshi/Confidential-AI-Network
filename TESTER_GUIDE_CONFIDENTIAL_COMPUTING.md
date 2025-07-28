# 🧪 Confidential Computing Test Guide

## Overview

This guide provides comprehensive test data and scenarios for testing confidential computing features in the Contract Management System.

## 🚀 Quick Start

### 1. Generate Test Data

```bash
# Run the test data generation script
node backend/create-test-data-confidential-computing.js
```

This will create:
- **9 Test Users** (3 TDP, 2 TDC, 3 CCRP, 1 Admin)
- **3 CCRP Azure Credentials** with different configurations
- **3 AI Models** (LLM, Vision, Audio)
- **6 Datasets** (3 confidential, 3 standard)
- **4 Contracts** with different confidential computing scenarios
- **2 Training Environments** (confidential and standard)

### 2. Start the Application

```bash
# Start backend
cd backend && npm start

# Start frontend (in another terminal)
cd frontend && npm start
```

## 👥 Test Users

### TDP Users (Training Data Providers)

| User | Email | Organization | Specialization |
|------|-------|--------------|----------------|
| Medical Data Corp | medical@test.com | Medical Data Corporation | Healthcare data |
| Financial Analytics Inc | financial@test.com | Financial Analytics Inc | Financial data |
| Retail Insights Ltd | retail@test.com | Retail Insights Ltd | Retail data |

### TDC Users (Training Data Consumers)

| User | Email | Organization | Specialization |
|------|-------|--------------|----------------|
| AI Research Lab | ai-research@test.com | AI Research Laboratory | AI/ML research |
| Healthcare Analytics | healthcare@test.com | Healthcare Analytics Inc | Healthcare analytics |

### CCRP Users (Confidential Clean Room Providers)

| User | Email | Organization | Cloud Providers | Location |
|------|-------|--------------|-----------------|----------|
| Secure Cloud Analytics | secure-cloud@test.com | Secure Cloud Analytics LLC | AWS, Azure, GCP | US |
| Privacy First Computing | privacy-first@test.com | Privacy First Computing Inc | Azure, GCP | Canada |
| Confidential Computing Lab | confidential-lab@test.com | Confidential Computing Laboratory | GCP, OCI | Germany |

## 📊 Test Datasets

### Confidential Computing Required Datasets

| Dataset | Category | Price | Size | Records | Confidential Computing |
|---------|----------|-------|------|---------|----------------------|
| Medical Speech Dataset | Audio | $150 | 500MB | 10,000 | ✅ Required |
| Financial Transaction Dataset | Tabular | $200 | 300MB | 50,000 | ✅ Required |
| Patient Health Records | Tabular | $300 | 800MB | 25,000 | ✅ Required |

### Standard Processing Datasets

| Dataset | Category | Price | Size | Records | Confidential Computing |
|---------|----------|-------|------|---------|----------------------|
| Public Image Dataset | Computer Vision | $50 | 200MB | 5,000 | ❌ Not Required |
| Retail Sales Dataset | Tabular | $75 | 150MB | 15,000 | ❌ Not Required |
| NLP Text Dataset | Natural Language Processing | $60 | 100MB | 8,000 | ❌ Not Required |

## 📋 Test Contracts

### 1. Confidential Computing Contract
- **Contract ID**: `CONFIDENTIAL-CONTRACT-001`
- **TDC**: AI Research Lab
- **CCRP**: Secure Cloud Analytics
- **Dataset**: Medical Speech Dataset
- **Confidential Computing**: ✅ Required
- **Enhanced Security**: Hardware security modules, secure enclaves, attestation

### 2. Multi-Confidential Contract
- **Contract ID**: `MULTI-CONFIDENTIAL-CONTRACT-001`
- **TDC**: Healthcare Analytics
- **CCRP**: Privacy First Computing
- **Datasets**: Financial Transaction + Patient Health Records
- **Confidential Computing**: ✅ Required (both datasets)
- **Enhanced Security**: Multi-dataset confidential processing

### 3. Mixed Contract
- **Contract ID**: `MIXED-CONTRACT-001`
- **TDC**: AI Research Lab
- **CCRP**: Confidential Computing Lab
- **Datasets**: Medical Speech (confidential) + Public Images (standard)
- **Confidential Computing**: ✅ Required (applied due to confidential dataset)
- **Enhanced Security**: Applied for all datasets in contract

### 4. Standard Contract
- **Contract ID**: `STANDARD-CONTRACT-001`
- **TDC**: Healthcare Analytics
- **CCRP**: Secure Cloud Analytics
- **Datasets**: Public Images + Retail Sales + NLP Text
- **Confidential Computing**: ❌ Not Required
- **Standard Security**: Basic security configuration

## 🏗️ Test Training Environments

### 1. Confidential Environment
- **Environment ID**: `CONFIDENTIAL-ENV-001`
- **Contract**: Confidential Computing Contract
- **Cloud Provider**: Azure
- **Region**: East US
- **Enhanced Security Features**:
  - Hardware Security Module
  - Secure Enclaves
  - Attestation Required
  - VPN Required
  - Multi-Factor Authentication
  - Real-time Alerts
  - Anomaly Detection
  - Compliance Monitoring

### 2. Standard Environment
- **Environment ID**: `STANDARD-ENV-001`
- **Contract**: Standard Contract
- **Cloud Provider**: Azure
- **Region**: East US
- **Standard Security Features**:
  - Basic Encryption
  - Standard Monitoring
  - No VPN Required
  - No Multi-Factor Authentication

## 🧪 Test Scenarios

### Scenario 1: Confidential Computing Dataset Processing

**Objective**: Test processing of datasets requiring confidential computing

**Steps**:
1. Login as TDC user (`ai-research@test.com`)
2. Browse datasets and filter by "Confidential Computing Required"
3. Select "Medical Speech Dataset"
4. Create contract with CCRP "Secure Cloud Analytics"
5. Verify enhanced security configuration is applied
6. Provision training environment
7. Verify confidential computing features are enabled

**Expected Results**:
- Dataset shows "Confidential Computing Required" indicator
- Contract creation includes enhanced security options
- Training environment has hardware security modules and secure enclaves
- Infrastructure uses confidential computing instance types

### Scenario 2: Multi-Confidential Dataset Contract

**Objective**: Test contract with multiple confidential computing datasets

**Steps**:
1. Login as TDC user (`healthcare@test.com`)
2. Select both "Financial Transaction Dataset" and "Patient Health Records"
3. Create contract with CCRP "Privacy First Computing"
4. Verify both datasets have confidential computing requirements
5. Check that enhanced security is applied for all datasets

**Expected Results**:
- Both datasets show confidential computing indicators
- Contract applies enhanced security for all datasets
- Infrastructure configuration includes all confidential computing features

### Scenario 3: Mixed Confidential and Standard Datasets

**Objective**: Test contract with both confidential and standard datasets

**Steps**:
1. Login as TDC user (`ai-research@test.com`)
2. Select "Medical Speech Dataset" (confidential) and "Public Image Dataset" (standard)
3. Create contract with CCRP "Confidential Computing Lab"
4. Verify enhanced security is applied due to confidential dataset

**Expected Results**:
- Mixed dataset contract applies enhanced security
- All datasets in contract get confidential computing features
- Infrastructure uses enhanced security configuration

### Scenario 4: Standard Processing Only

**Objective**: Test standard processing without confidential computing

**Steps**:
1. Login as TDC user (`healthcare@test.com`)
2. Select only standard datasets (Public Images, Retail Sales, NLP Text)
3. Create contract with CCRP "Secure Cloud Analytics"
4. Verify standard security configuration is applied

**Expected Results**:
- No confidential computing indicators
- Standard security configuration
- Basic infrastructure setup

### Scenario 5: API Testing

**Objective**: Test API endpoints for confidential computing features

**Steps**:
1. Test dataset filtering API:
   ```bash
   curl "http://localhost:3001/api/datasets/search?confidentialComputingRequired=true"
   ```
2. Test dataset statistics API:
   ```bash
   curl "http://localhost:3001/api/datasets/stats/overview"
   ```
3. Test contract creation with confidential datasets
4. Test infrastructure provisioning with enhanced security

**Expected Results**:
- API returns only confidential computing datasets when filtered
- Statistics show counts for confidential vs standard datasets
- Contract creation includes confidential computing information
- Infrastructure provisioning applies enhanced security

### Scenario 6: Frontend Component Testing

**Objective**: Test frontend components for confidential computing

**Steps**:
1. Test dataset cards show confidential computing indicators
2. Test dataset filtering by confidential computing requirement
3. Test infrastructure provisioning UI with confidential computing options
4. Test environment details show security indicators
5. Test contract creation with confidential computing datasets

**Expected Results**:
- Dataset cards display security icons and chips
- Filtering works correctly for confidential computing
- Infrastructure UI shows enhanced security options
- Environment details display security indicators

## 🔐 Security Features to Test

### Enhanced Security for Confidential Computing

1. **Hardware Security**:
   - Hardware Security Modules (HSM)
   - Secure Enclaves
   - Trusted Execution Environment

2. **Enhanced Encryption**:
   - AES-256-GCM encryption
   - Key rotation (30 days)
   - Encrypted storage and transmission

3. **Network Security**:
   - VPN required
   - Private subnets
   - Network security groups
   - Firewall enabled

4. **Access Control**:
   - Multi-factor authentication
   - Reduced session timeout (30 minutes)
   - Role-based access control
   - No privileged access

5. **Monitoring and Compliance**:
   - Real-time alerts
   - Anomaly detection
   - Compliance monitoring
   - Audit logging (1 year retention)
   - Breach notification

6. **Regulatory Compliance**:
   - GDPR, HIPAA, SOX, FedRAMP, ISO-27001
   - Data residency requirements
   - Regular audits

### Standard Security Features

1. **Basic Encryption**:
   - AES-256-GCM encryption
   - No key rotation
   - Standard storage encryption

2. **Network Security**:
   - Private subnets
   - Basic firewall
   - No VPN required

3. **Access Control**:
   - Standard authentication
   - 1-hour session timeout
   - Role-based access control

4. **Monitoring**:
   - Basic monitoring
   - 30-day log retention
   - No real-time alerts

## 📊 Test Data Statistics

### Dataset Distribution
- **Total Datasets**: 6
- **Confidential Computing Required**: 3 (50%)
- **Standard Processing**: 3 (50%)

### Contract Distribution
- **Total Contracts**: 4
- **Confidential Computing Contracts**: 2 (50%)
- **Mixed Contracts**: 1 (25%)
- **Standard Contracts**: 1 (25%)

### User Distribution
- **TDP Users**: 3 (Training Data Providers)
- **TDC Users**: 2 (Training Data Consumers)
- **CCRP Users**: 3 (Confidential Clean Room Providers)
- **Admin Users**: 1 (System Administrator)

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   ```bash
   # Check database connection
   node backend/test-database-connection.js
   ```

2. **Test Data Not Created**:
   ```bash
   # Recreate test data
   node backend/create-test-data-confidential-computing.js
   ```

3. **API Endpoints Not Working**:
   ```bash
   # Check backend logs
   tail -f backend/logs/app.log
   ```

4. **Frontend Not Loading**:
   ```bash
   # Check frontend logs
   tail -f frontend/logs/app.log
   ```

### Verification Commands

```bash
# Verify test data creation
curl "http://localhost:3001/api/users" | jq '.length'
curl "http://localhost:3001/api/datasets" | jq '.length'
curl "http://localhost:3001/api/contracts" | jq '.length'

# Verify confidential computing datasets
curl "http://localhost:3001/api/datasets/search?confidentialComputingRequired=true" | jq '.datasets | length'

# Verify dataset statistics
curl "http://localhost:3001/api/datasets/stats/overview" | jq '.confidentialComputingDatasets'
```

## 📝 Test Checklist

- [ ] Test data generation script runs successfully
- [ ] All test users can login
- [ ] Dataset filtering by confidential computing works
- [ ] Contract creation with confidential datasets works
- [ ] Infrastructure provisioning applies enhanced security
- [ ] Training environment shows security indicators
- [ ] API endpoints return correct confidential computing data
- [ ] Frontend components display confidential computing indicators
- [ ] Error handling works for edge cases
- [ ] Performance is acceptable with test data

## 🎯 Success Criteria

1. **Functionality**: All confidential computing features work correctly
2. **Security**: Enhanced security is properly applied for confidential datasets
3. **UI/UX**: Frontend clearly indicates confidential computing requirements
4. **API**: All endpoints handle confidential computing data correctly
5. **Performance**: System performs well with test data volume
6. **Error Handling**: Graceful handling of edge cases and errors

## 📞 Support

For issues or questions about testing confidential computing features:

1. Check the logs for error messages
2. Verify test data was created correctly
3. Test individual components in isolation
4. Review the API documentation
5. Check the database schema and relationships

---

**Happy Testing! 🧪✨** 