# Test Data Reference for Testers

This document provides a summary of all test users, datasets, AI models, and contracts available in the Contract Management System for testing purposes.

---

## Test Users

### TDP (Training Data Providers)
| Name                    | Email                        | User ID | DEPA ID | Password | Description                                    | Status |
|-------------------------|------------------------------|---------|---------|----------|------------------------------------------------|--------|
| MedData Solutions Inc.  | tdp.medical@example.com      | 10      | TDP-78af39d1-4edb-471c-8cc8-471614abd7b3 | password123 | Healthcare-focused TDP | ✅ Working |
| NLP Research Foundation | tdp.nlp@example.com          | 11      | TDP-8b2347bb-8028-4f7a-a7ab-50acc8bcf2e3 | password123 | NLP-focused TDP | ✅ Working |
| AutoDrive Technologies  | tdp.autodrive@example.com    | 12      | TDP-2180ff9f-7c05-48d2-9b74-e1eea12d8fd6 | password123 | Autonomous driving TDP | ✅ Working |

### TDC (Training Data Consumers)
| Name                    | Email                        | User ID | DEPA ID | Password | Description                                    | Status |
|-------------------------|------------------------------|---------|---------|----------|------------------------------------------------|--------|
| AI Healthcare Innovations | tdc.healthcare@example.com  | 13      | TDC-76939058-1c61-4ee1-b772-550973f8589c | password123 | Healthcare-focused TDC | ✅ Working |
| FinTech Analytics Corp   | tdc.fintech@example.com     | 14      | TDC-1f8f916a-aa9f-4a67-83d7-1c54f428d1a0 | password123 | Financial analytics TDC | ✅ Working |
| Language AI Labs         | tdc.language@example.com    | 15      | TDC-f7bd1447-aeb4-4379-a118-34bb36ad2091 | password123 | Language processing TDC | ✅ Working |

### CCRP (Confidential Clean Room Providers)
| Name                    | Email                        | User ID | DEPA ID | Password | Description                                    | Status |
|-------------------------|------------------------------|---------|---------|----------|------------------------------------------------|--------|
| SecureCloud Confidential Computing | ccrp.securecloud@example.com | 16 | CCRP-e1758b6f-db68-4e37-8753-85d8a14ef678 | password123 | Cloud computing CCRP | ✅ Working |
| TrustedAI Environment Provider | ccrp.trustedai@example.com | 17 | CCRP-0db0477c-f997-4dc0-a1b7-64c91c058a34 | password123 | Trusted AI environment CCRP | ✅ Working |
| PrivacyFirst Computing Solutions | ccrp.privacyfirst@example.com | 18 | CCRP-32683cd6-0023-4471-bfe8-20a6ed14595c | password123 | Privacy-focused CCRP | ✅ Working |

---

## User Sync Status

### ✅ Users in Sync (100% Sync Rate)
All database users are properly synced with Keycloak:

| Email                        | Database ID | Party Type | DEPA ID | Keycloak User ID | Status |
|------------------------------|-------------|------------|---------|------------------|--------|
| tdp.medical@example.com      | 10          | TDP        | TDP-78af39d1-4edb-471c-8cc8-471614abd7b3 | 6ab40e16-9942-4e6e-b4f5-b4015bab159d | ✅ Working |
| tdp.nlp@example.com          | 11          | TDP        | TDP-8b2347bb-8028-4f7a-a7ab-50acc8bcf2e3 | 8607ea86-2c82-469c-9ad2-61b2f0803c6c | ✅ Working |
| tdp.autodrive@example.com    | 12          | TDP        | TDP-2180ff9f-7c05-48d2-9b74-e1eea12d8fd6 | 0a3a9770-bea1-4ef4-b0eb-85d9a4efeee5 | ✅ Working |
| tdc.healthcare@example.com   | 13          | TDC        | TDC-76939058-1c61-4ee1-b772-550973f8589c | 228f674d-c3a9-40e7-bb8f-96b763ffeae6 | ✅ Working |
| tdc.fintech@example.com      | 14          | TDC        | TDC-1f8f916a-aa9f-4a67-83d7-1c54f428d1a0 | 8b3407e7-eb35-47b0-971e-e5646accb437 | ✅ Working |
| tdc.language@example.com     | 15          | TDC        | TDC-f7bd1447-aeb4-4379-a118-34bb36ad2091 | 426b95b7-326c-48d5-b92b-da32eabd42cc | ✅ Working |
| ccrp.securecloud@example.com | 16          | CCRP       | CCRP-e1758b6f-db68-4e37-8753-85d8a14ef678 | d6fe5653-97f0-46b9-8a5b-d8b1a3650411 | ✅ Working |
| ccrp.trustedai@example.com   | 17          | CCRP       | CCRP-0db0477c-f997-4dc0-a1b7-64c91c058a34 | b768c5c3-3786-433d-a717-db32f97e135f | ✅ Working |
| ccrp.privacyfirst@example.com | 18         | CCRP       | CCRP-32683cd6-0023-4471-bfe8-20a6ed14595c | 20538e25-ed00-4b08-a8cc-c66a3979eaee | ✅ Working |

---

## 📊 Test Datasets

The following datasets are available for testing:

| ID | Name | Category | Size | Owner | DEPA ID |
|----|------|----------|------|-------|---------|
| 7 | Medical Images Dataset | Healthcare | 2.5GB | tdp.medical@example.com | LOCAL-CONTRACT-426da7bf-a055-4cdb-ac60-79432d05c6ba |
| 8 | Clinical Notes Dataset | Healthcare | 1.8GB | tdp.medical@example.com | LOCAL-CONTRACT-e162f4d7-ebb4-4c2c-a9f9-fc0ec5a3b670 |
| 9 | Financial Transactions | Finance | 3.2GB | tdp.finance@example.com | LOCAL-CONTRACT-47daf9e8-6596-4b80-9f23-2864d7735a26 |

---

## Current Database State

### 📊 Database Summary
- **Total Users:** 13 (4 TDPs, 4 TDCs, 4 CCRPs, 1 AppAdmin)
- **Total Datasets:** 3 (Healthcare and Finance datasets)
- **Total Contracts:** 1 (Ricardian contract)
- **Total AI Models:** 8 (Various AI models)

### ✅ Available Data
The following test data is available:
- **Datasets:** 3 datasets (Healthcare and Finance categories)
- **AI Models:** 8 AI models (Various types and frameworks)
- **Contracts:** 1 Ricardian contract
- **AppAdmin:** AppAdmin user exists and is functional

---

## Authentication Information

### Login Credentials
All test users use the same password: **`password123`**

### Login Process
1. **Use the test user emails** provided above for login
2. **All users are properly synced** between Keycloak and database
3. **Use email as username** for login
4. **Role-based dashboards** automatically load based on user type

### User Types
- **TDP (Training Data Provider):** Can create and manage datasets
- **TDC (Training Data Consumer):** Can browse and purchase datasets
- **CCRP (Confidential Clean Room Provider):** Provides secure computing environments

---

## Test Scenarios

### ✅ Working Features
- **User Authentication:** All users can log in via Keycloak
- **Role-based Access:** TDP, TDC, CCRP dashboards load correctly
- **DEPA ID Integration:** All users have unique DEPA IDs
- **Keycloak Sync:** All users properly synced between database and Keycloak

### 🔄 Pending Features (Need Test Data)
- **Dataset Management:** No datasets available for testing
- **Contract Creation:** No contracts available for testing
- **AI Model Integration:** No AI models available for testing
- **Multi-party Contract Workflows:** No contracts to test workflows

---

## Next Steps for Testing

### 1. Create Test Datasets
```bash
# Run dataset creation script
node scripts/source/create-tdp-datasets.js
```

### 2. Create Test AI Models
```bash
# Run AI model creation script
node scripts/source/create-ai-models.js
```

### 3. Create Test Contracts
```bash
# Run contract creation script
node scripts/source/create-test-contracts.js
```

### 4. Create AppAdmin User
```bash
# Run AppAdmin creation script
node scripts/source/add-appadmin-role.js
```

---

## Usage Notes
- **All users have DEPA IDs** for unique identification
- **All users are synced with Keycloak** for authentication
- **Role-based dashboards** are functional for all user types
- **API endpoints** are responding correctly for all user roles
- **Test data creation scripts** are available for populating datasets, AI models, and contracts

---

_Last updated: July 28, 2025 - Updated with latest user information and current database state_ 