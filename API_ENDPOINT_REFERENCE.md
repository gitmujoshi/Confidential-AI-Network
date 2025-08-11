# API Endpoint Reference - ContractFlow Pro

## 🔐 Authentication

All protected endpoints require JWT token in Authorization header:
```http
Authorization: Bearer <jwt_token>
```

---

## 📋 Contract Endpoints

### Create Ricardian Contract
```http
POST /api/contracts/ricardian
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "datasetSelections": [
    {
      "datasetId": "DS-001",
      "individualPrice": 1000
    }
  ],
  "duration": 30,
  "termsAndConditions": "Custom terms...",
  "contractType": "AI_TRAINING",
  "privacyRequirements": {
    "differentialPrivacy": true,
    "maxPrivacyLoss": 0.1
  }
}
```

**Response**:
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "contractId": "RICARDIAN-1733928000000-abc123",
    "status": "PENDING_TDP_APPROVAL"
  }
}
```

### Get Contract Details
```http
GET /api/contracts/:id
Authorization: Bearer <token>
```

**Response**:
```json
{
  "id": 1,
  "contractId": "RICARDIAN-1733928000000-abc123",
  "status": "PENDING_TDP_APPROVAL",
  "price": 1000,
  "duration": 30,
  "legalDocumentHash": "0x1234...",
  "smartContractAddress": "0x9abc..."
}
```

---

## 📊 Dataset Endpoints

### Get Public Datasets
```http
GET /api/datasets/public
```

**Query Parameters**:
- `category`: Filter by category
- `priceRange`: Filter by price
- `size`: Filter by size

**Response**:
```json
{
  "datasets": [
    {
      "id": 1,
      "name": "Customer Dataset",
      "category": "CUSTOMER_DATA",
      "price": 1000,
      "size": "2.5 GB"
    }
  ]
}
```

---

## 🏗️ Infrastructure Endpoints

### Create Training Environment
```http
POST /api/infrastructure/environments
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "contractId": "CONTRACT-001",
  "cloudProvider": "AZURE",
  "region": "eastus",
  "vmSize": "Standard_D2s_v3",
  "enableConfidentialComputing": true
}
```

**Response**:
```json
{
  "success": true,
  "environment": {
    "id": 1,
    "environmentId": "env-CONTRACT-001-1733928000000",
    "status": "PROVISIONING"
  }
}
```

---

## 🔐 Cloud Credentials Endpoints

### Store Cloud Credentials
```http
POST /api/ccrp/cloud-credentials
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "cloudProvider": "AZURE",
  "secretManager": "VAULT",
  "authMethod": "SERVICE_PRINCIPAL"
}
```

**Response**:
```json
{
  "success": true,
  "credential": {
    "id": 1,
    "cloudProvider": "AZURE",
    "validationStatus": "PENDING"
  }
}
```

---

## 👥 Dashboard Endpoints

### TDC Dashboard
```http
GET /api/tdc/dashboard/:userId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "user": { "name": "John Doe", "partyType": "TDC" },
  "contracts": [
    {
      "id": 1,
      "status": "ACTIVE",
      "price": 2500
    }
  ],
  "payments": {
    "totalSpent": 5000,
    "pendingPayments": 1000
  }
}
```

### TDP Dashboard
```http
GET /api/tdp/dashboard/:userId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "user": { "name": "Data Corp", "partyType": "TDP" },
  "datasets": [
    {
      "id": 1,
      "name": "Customer Dataset",
      "price": 1000,
      "downloads": 5
    }
  ],
  "payments": {
    "totalEarned": 5000,
    "pendingPayments": 1000
  }
}
```

### CCRP Dashboard
```http
GET /api/ccrp/dashboard/:userId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "user": { "name": "Cloud LLC", "partyType": "CCRP" },
  "environments": [
    {
      "id": 1,
      "status": "ACTIVE",
      "cloudProvider": "AZURE"
    }
  ],
  "resourceUtilization": {
    "cpu": 65,
    "memory": 45
  }
}
```

---

## 🔍 Search Endpoints

### Search Datasets
```http
GET /api/datasets/search?q=customer&category=CUSTOMER_DATA&priceMax=1000
```

**Response**:
```json
{
  "datasets": [
    {
      "id": 1,
      "name": "Customer Behavior Dataset",
      "category": "CUSTOMER_DATA",
      "price": 800,
      "score": 0.95
    }
  ],
  "facets": {
    "categories": [
      { "name": "CUSTOMER_DATA", "count": 5 }
    ]
  }
}
```

---

## 📈 Analytics Endpoints

### Contract Analytics
```http
GET /api/analytics/contracts?startDate=2025-08-01&endDate=2025-08-31
Authorization: Bearer <token>
```

**Response**:
```json
{
  "totalContracts": 150,
  "activeContracts": 45,
  "totalValue": 250000,
  "monthlyTrends": [
    {
      "month": "2025-08",
      "contracts": 25,
      "value": 45000
    }
  ]
}
```

---

## 🚨 Error Responses

### Authentication Error
```json
{
  "error": "Authentication failed",
  "code": "AUTHENTICATION_FAILED",
  "timestamp": "2025-08-11T16:00:00.000Z"
}
```

### Validation Error
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "duration": "Duration must be positive"
  }
}
```

### Resource Not Found
```json
{
  "error": "Contract not found",
  "code": "RESOURCE_NOT_FOUND",
  "timestamp": "2025-08-11T16:00:00.000Z"
}
```

---

## 📊 Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## 🔒 Rate Limits

| Endpoint | Limit |
|----------|-------|
| Authentication | 5/min |
| Contract Creation | 10/hour |
| General API | 100/min |

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-08-11  
**Status**: API Endpoint Reference Complete 