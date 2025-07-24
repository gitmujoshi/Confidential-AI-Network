# Test Data Reference for Testers

This document provides a summary of all test users, datasets, AI models, and contracts available in the Contract Management System for testing purposes.

---

## Test Users

### Application Admin
- **Email:** appadmin@example.com  
- **Role:** AppAdmin
- **User ID:** 46
- **DEPA ID:** APPADMIN-16f7419e-7e9c-46c6-9d9f-7b3219885cb0
- **Description:** System administrator for the contract management application
- **Status:** ✅ Working - Full system access

### TDP (Training Data Providers)
| Name                    | Email                        | User ID | DEPA ID | Description                                    | Status |
|-------------------------|------------------------------|---------|---------|------------------------------------------------|--------|
| Test TDP                | tdpuser@example.com          | 43      | TDP-9be865bd-7355-4b1c-bad5-efe0a65d07d7 | Basic TDP user with 10 datasets | ✅ Working |
| Healthcare TDP          | tdp.healthcare@example.com   | 53      | TDP-7c5c4d26-a8e4-4665-9a0d-f62064ad4c77 | Healthcare-focused TDP | ✅ Working |

### TDC (Training Data Consumers)
| Name                    | Email                        | User ID | DEPA ID | Description                                    | Status |
|-------------------------|------------------------------|---------|---------|------------------------------------------------|--------|
| Test TDC                | tdcuser@example.com          | 44      | TDC-c1b96af9-2c9e-4420-86d8-d1fc38fb4b57 | Basic TDC user | ✅ Working |
| TDC Healthcare          | tdc.healthcare@example.com   | 47      | TDC-32f07570-cbbc-4d95-b3bc-c71e2b29bf32 | Healthcare-focused TDC | ✅ Working |

### CCRP (Confidential Clean Room Providers)
| Name                    | Email                        | User ID | DEPA ID | Description                                    | Status |
|-------------------------|------------------------------|---------|---------|------------------------------------------------|--------|
| Test CCRP               | ccrpuser@example.com         | 45      | CCRP-fb448f7a-be09-4273-9dda-8dbf37f4fa40 | Basic CCRP user | ✅ Working |

---

## User Sync Status

### ✅ Users in Sync (100% Sync Rate)
All database users are properly synced with Keycloak:

| Email                        | Database ID | Party Type | DEPA ID | Status |
|------------------------------|-------------|------------|---------|--------|
| appadmin@example.com         | 46          | AppAdmin   | APPADMIN-16f7419e-7e9c-46c6-9d9f-7b3219885cb0 | ✅ Working |
| tdpuser@example.com          | 43          | TDP        | TDP-9be865bd-7355-4b1c-bad5-efe0a65d07d7 | ✅ Working |
| tdp.healthcare@example.com   | 53          | TDP        | TDP-7c5c4d26-a8e4-4665-9a0d-f62064ad4c77 | ✅ Working |
| tdcuser@example.com          | 44          | TDC        | TDC-c1b96af9-2c9e-4420-86d8-d1fc38fb4b57 | ✅ Working |
| tdc.healthcare@example.com   | 47          | TDC        | TDC-32f07570-cbbc-4d95-b3bc-c71e2b29bf32 | ✅ Working |
| ccrpuser@example.com         | 45          | CCRP       | CCRP-fb448f7a-be09-4273-9dda-8dbf37f4fa40 | ✅ Working |

---

## Datasets (TDP User: tdpuser@example.com)

| Dataset ID                                   | Name                    | Category                    | Price   | Size (MB) | Records | Status |
|-----------------------------------------------|-------------------------|-----------------------------|---------|-----------|---------|--------|
| DATASET-905028b4-f721-4872-9025-839d2ec232c8 | Product Reviews         | Natural Language Processing | $1.75   | 250       | 50,000  | ✅ Public |
| DATASET-5410d95f-6d64-493e-8ca3-29ad745d4de8 | Customer Purchase History| Tabular                    | $3.00   | 600       | 100,000 | ✅ Private |
| DATASET-ac752d95-f9a2-4d43-96c3-849213082c1b | Climate Data            | Tabular                    | $2.00   | 400       | 30,000  | ✅ Public |
| DATASET-f3b9563b-87c8-4542-998a-01482ad95caf | Academic Papers         | Natural Language Processing | $1.50   | 500       | 75,000  | ✅ Public |
| DATASET-cad222ca-855f-4fc5-b654-3bea3720b0af | Credit Card Transactions| Tabular                    | $4.25   | 1200      | 500,000 | ✅ Private |
| DATASET-3f501c81-cfb6-4de2-9e73-a88827f1e0d7 | Stock Market Data       | Tabular                    | $3.75   | 800       | 100,000 | ✅ Public |
| DATASET-95d11524-cf51-4844-b7e0-6c580ebafc1f | Patient Vital Signs     | Tabular                    | $2.50   | 150       | 25,000  | ✅ Public |
| DATASET-a0516401-0901-44d8-a0cb-3158dac84bb8 | Medical Images Dataset  | Computer Vision            | $1.50   | 5000      | 10,000  | ✅ Public |
| DATASET-96d6b972-1a08-417e-923d-c1e93d25c414 | Financial Transactions  | Tabular                    | $0.30   | 100       | 20,000  | ✅ Private |
| DATASET-7672d0f9-91a7-4b5f-b744-9d7d7c6ec1ce | Clinical Notes Dataset  | Natural Language Processing | $0.80   | 200       | 50,000  | ✅ Public |

---

## Contracts

| Contract ID                                   | TDP | TDC | CCRP | Price   | Status  | DEPA ID |
|-----------------------------------------------|-----|-----|------|---------|---------|---------|
| RICARDIAN-1753221640395-yjn2w0h1q | 43 | 47 | 45 | $2.30 | PENDING_TDP_APPROVAL | CONTRACT-437b2a0e-d406-4e08-bfa9-6adf220bf298 |
| RICARDIAN-1753232122400-nswrjzlrd | 43 | 47 | 45 | $3.75 | PENDING_TDP_APPROVAL | CONTRACT-* |

---

## Working Features

### ✅ TDP Flow (FROZEN - Working)
- **TDP Dashboard**: Shows 10 datasets, 2 contracts, revenue metrics
- **Datasets Page**: Displays all 10 datasets in grid/table view
- **API Endpoints**: `/api/tdp/dashboard/:userId`, `/api/tdp/datasets/:userId`
- **Data Display**: Metrics cards, tables, grid views all working

### ✅ TDC Flow (FROZEN - Working)
- **TDC Dashboard**: Shows available datasets, contracts, training progress
- **API Endpoints**: `/api/tdc/dashboard/:userId`, `/api/tdc/contracts/:userId`
- **Data Display**: Contract status, training progress, payments working

### ✅ Authentication (Working)
- **Keycloak Integration**: All users properly synced
- **JWT Tokens**: Working for all user types
- **Role-based Access**: TDP, TDC, CCRP, AppAdmin working
- **DEPA IDs**: All users have unique DEPA IDs

---

## Authentication Notes

### Login Process
1. **Use the test user emails** provided above for login
2. **All users are properly synced** between Keycloak and database
3. **Use email as username** for login
4. **Role-based dashboards** automatically load based on user type

### User Types
- **TDP (Training Data Provider):** Can create and manage datasets
- **TDC (Training Data Consumer):** Can browse and purchase datasets
- **CCRP (Confidential Clean Room Provider):** Provides secure computing environments
- **AppAdmin:** System administrator with full access

---

## Usage Notes
- **TDP and TDC flows are FROZEN** - no further changes to these components
- **All users have DEPA IDs** for unique identification
- **Datasets are linked to TDP users** (tdpuser@example.com has 10 datasets)
- **Contracts link TDPs, TDCs, CCRPs, and datasets**
- **Dashboard and Datasets pages working correctly** for all user types
- **API endpoints responding correctly** for all user roles

---

_Last updated: July 23, 2025 - TDP and TDC flows frozen, all test users working correctly_ 