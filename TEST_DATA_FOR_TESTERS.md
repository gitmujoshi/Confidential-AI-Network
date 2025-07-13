# Test Data Reference for Testers

This document provides a summary of all test users, datasets, and AI models available in the Contract Management System for testing purposes.

---

## Test Users

### Application Admin
- **Email:** appadmin@example.com
- **Password:** AppAdmin123!
- **Role:** AppAdmin

### TDP (Training Data Providers)
| Name                    | Email                    | Password  | Description                                 |
|-------------------------|--------------------------|-----------|---------------------------------------------|
| Healthcare Data Corp    | healthcare@example.com   | Test123!  | Leading provider of healthcare datasets     |
| Financial Analytics Inc | financial@example.com    | Test123!  | Specialized in financial market datasets    |
| Retail Insights Ltd     | retail@example.com       | Test123!  | Consumer behavior and retail analytics data |
| Manufacturing Data Co   | manufacturing@example.com| Test123!  | Industrial and manufacturing datasets       |
| Transportation Data Hub | transport@example.com    | Test123!  | Logistics and transportation datasets       |

### TDC (Training Data Consumers)
| Name                    | Email                    | Password  | Description                                 |
|-------------------------|--------------------------|-----------|---------------------------------------------|
| UI TDC User             | uitdc@example.com        | Test123!  | A TDC user created via API for UI-like flow |
| Test TDC User           | testtdc@example.com      | Test123!  | A test TDC user for contract creation       |

### CCRP (Confidential Clean Room Providers)
| Name                    | Email                        | Password  |
|-------------------------|------------------------------|-----------|
| Enterprise Security Hub | enterprise-security@example.com | Test123! |
| Confidential Computing Lab | confidential-lab@example.com | Test123! |
| Cloud Security Solutions | cloud-security@example.com    | Test123! |
| Privacy First Computing | privacy-first@example.com      | Test123! |
| Secure Compute Hub      | secure-compute@example.com     | Test123! |

---

## Datasets by TDP

| Dataset ID                  | Name                        | Owner (TDP)                | Category                  | Price   |
|-----------------------------|-----------------------------|----------------------------|---------------------------|---------|
| HEALTH-PATIENT-001          | Patient Health Records      | Healthcare Data Corp       | Tabular                   | $5000   |
| HEALTH-IMAGING-001          | Medical Imaging Dataset     | Healthcare Data Corp       | Computer Vision           | $7500   |
| FINANCE-TRADING-001         | Market Trading Data         | Financial Analytics Inc    | Tabular                   | $3000   |
| FINANCE-CREDIT-001          | Credit Risk Assessment Data | Financial Analytics Inc    | Tabular                   | $4500   |
| RETAIL-PURCHASE-001         | Customer Purchase History   | Retail Insights Ltd        | Tabular                   | $2500   |
| RETAIL-REVIEWS-001          | Product Reviews Dataset     | Retail Insights Ltd        | Natural Language Processing| $2000   |
| MANUFACTURING-SENSOR-001    | Production Line Sensor Data | Manufacturing Data Co      | Tabular                   | $4000   |
| MANUFACTURING-DEFECT-001    | Quality Control Images      | Manufacturing Data Co      | Computer Vision           | $3500   |
| TRANSPORT-LOGISTICS-001     | Logistics Network Data      | Transportation Data Hub    | Tabular                   | $2000   |
| TRANSPORT-TRAFFIC-001       | Traffic Pattern Analysis    | Transportation Data Hub    | Tabular                   | $3000   |

---

## AI Models by TDP

> **Note:** AI model creation API is now available, but only one integration model exists by default. Add more as needed using the `/api/ai-models` endpoint.

| Model ID                    | Name                        | Owner (TDP)                | Type      | Framework   |
|-----------------------------|-----------------------------|----------------------------|-----------|-------------|
| integration-model-001       | Integration Model           | (Sample)                   | cnn       | TensorFlow  |

---

## Usage Notes
- All test users (except AppAdmin) use the password: `Test123!`
- Use the above emails and passwords to log in and test various flows.
- Datasets are owned by TDPs and can be used for contract creation and analytics.
- AI models can be created and managed via the `/api/ai-models` endpoint.
- For more details on API usage, see `API_DOCUMENTATION.md`.

---

_Last updated: July 2025_ 