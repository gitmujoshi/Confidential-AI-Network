# Test Data Reference for Testers

This document provides a summary of all test users, datasets, AI models, and contracts available in the Contract Management System for testing purposes.

---

## Test Users

### Application Admin
- **Email:** appadmin@example.com  
- **Temporary Password:** Kcpm6By%yIub
- **Role:** AppAdmin
- **Description:** System administrator for the contract management application
- **Organization:** Contract Management System

### TDP (Training Data Providers)
| Name                    | Email                        | Temporary Password | Organization              | Description                                    |
|-------------------------|------------------------------|-------------------|---------------------------|------------------------------------------------|
| Medical Data Provider   | tdp.medical@example.com      | EAhOzhi$G$xr     | Medical Data Corp         | Leading provider of medical datasets for AI training |
| NLP Research Foundation | tdp.nlp@example.com          | VCpKg3^nSOm@     | NLP Research Foundation   | Specialized in natural language processing datasets |

### TDC (Training Data Consumers)
| Name                    | Email                        | Temporary Password | Organization              | Description                                    |
|-------------------------|------------------------------|-------------------|---------------------------|------------------------------------------------|
| AI Healthcare Innovations | tdc.healthcare@example.com   | dbf121#WQlo5     | Healthcare AI Labs        | Developing AI solutions for healthcare applications |
| FinTech AI Labs         | tdc.fintech@example.com      | nzY6hJX18YUi     | FinTech Solutions Inc     | AI-powered financial technology solutions |

### CCRP (Confidential Clean Room Providers)
| Name                    | Email                        | Temporary Password | Organization              | Description                                    |
|-------------------------|------------------------------|-------------------|---------------------------|------------------------------------------------|
| SecureCloud Computing   | ccrp.securecloud@example.com | ore%Thm$nETX     | SecureCloud Technologies  | Secure cloud infrastructure for confidential computing |

---

## System Admin (Keycloak Only)
- **Email:** admin@contractmanagement.com
- **Username:** admin
- **Role:** Keycloak Administrator
- **Note:** This user exists only in Keycloak for system administration

---

## User Sync Status

### ✅ Users in Sync (100% Sync Rate)
All database users are properly synced with Keycloak:

| Email                        | Database ID | Keycloak ID                           | Party Type |
|------------------------------|-------------|---------------------------------------|------------|
| tdp.medical@example.com      | 83          | 69094bb2-e621-43b3-a055-9738cd24b8ea | TDP        |
| tdp.nlp@example.com          | 84          | 69bf94df-3d6c-4efa-ab7b-6e9ac82611a2 | TDP        |
| tdc.healthcare@example.com   | 85          | 05ba8eac-6932-45af-9afc-39449ebebd18 | TDC        |
| tdc.fintech@example.com      | 86          | b17a07c3-1ee6-4734-b4eb-e1e83abea149 | TDC        |
| ccrp.securecloud@example.com | 87          | 07e98110-7df7-416f-b662-a92f7d80ce56 | CCRP       |
| appadmin@example.com         | 88          | 9f3e8762-4931-40d1-a7bc-41135be4e2f7 | AppAdmin   |

---

## AI Models

| Model ID                                   | Name        | Type        | Framework   |
|---------------------------------------------|-------------|-------------|-------------|
| MODEL-a5f0573f-b63c-4ff3-878d-472b6fe482ed  | VisionNet   | cnn         | TensorFlow  |
| MODEL-4003c63a-221e-433d-87ef-8e2ce49b4ff3  | TextGen     | transformer | PyTorch     |
| MODEL-097cdca3-c511-4112-8b88-10f18853e01e  | TabularPro  | other       | Other       |

---

## Datasets

| Dataset ID                                   | Name          | Category                    | Price   |
|-----------------------------------------------|---------------|-----------------------------|---------|
| DATASET-4a2201f5-e465-4a96-9ab3-b45062e1ccdf  | Vision Images | Computer Vision             | $5000   |
| DATASET-f40cfb8c-8071-4aa3-923c-403698f494d4  | NLP Texts     | Natural Language Processing | $3000   |
| DATASET-6d4322df-af09-49a9-bf52-ae1e8b822bd6  | Tabular Data  | Tabular                     | $2000   |

---

## Contracts

| Contract ID                                   | Price   | Status  |
|-----------------------------------------------|---------|---------|
| CONTRACT-98452b1b-d0c0-47fa-9ffe-8417f1d31046 | $5000   | SIGNED  |
| CONTRACT-a0cdebab-d025-4e01-a6ed-05df0231a13c | $3000   | SIGNED  |
| CONTRACT-637d94c1-6299-4c9b-b6d0-58cbb0a28d39 | $2000   | SIGNED  |

---

## Authentication Notes

### Login Process
1. **Use the temporary passwords** provided above for initial login
2. **Change password on first login** - Keycloak requires password change for security
3. **Use email as username** for login
4. **All users are properly synced** between Keycloak and database

### Registration API
- **Endpoint:** `POST /api/auth/register`
- **Creates users in both Keycloak and database**
- **Generates temporary passwords automatically**
- **Sets up proper IAM integration** with `iamUserId` linking
- **Creates system-generated DIDs** for users

### User Types
- **TDP (Training Data Provider):** Can create and manage datasets
- **TDC (Training Data Consumer):** Can browse and purchase datasets
- **CCRP (Confidential Clean Room Provider):** Provides secure computing environments
- **AppAdmin:** System administrator with full access

---

## Usage Notes
- **All users created via registration API** for proper sync
- **Temporary passwords are randomly generated** for security
- **Users must change password on first login** (Keycloak requirement)
- **All database users are 100% synced** with Keycloak
- **Use the above emails to log in** and test various flows
- **Datasets and models are linked to TDPs**
- **Contracts link TDPs, TDCs, CCRPs, and datasets**
- **For more details on API usage, see `API_DOCUMENTATION.md`**

---

_Last updated: July 18, 2025 - All users created via registration API with proper Keycloak sync_ 