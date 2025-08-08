# 🔌 API Reference

Complete API documentation for the Contract Management System. This reference consolidates all API-related documentation.

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Contract Management](#contract-management)
4. [Dataset Management](#dataset-management)
5. [Cloud Credentials](#cloud-credentials)
6. [Blockchain Integration](#blockchain-integration)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

## 🔐 Authentication

### **Base URL**
```
http://localhost:5001/api
```

### **Authentication Headers**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### **Login**
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 50,
    "email": "user@example.com",
    "partyType": "TDC",
    "name": "User Name",
    "depaId": "DEPA123456"
  }
}
```

### **Logout**
```http
POST /auth/logout
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### **Refresh Token**
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Register User**
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "partyType": "TDC",
  "organization": "Example Corp",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 54,
    "email": "newuser@example.com",
    "partyType": "TDC",
    "name": "New User"
  }
}
```

## 👥 User Management

### **Get User Profile**
```http
GET /auth/profile
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 50,
    "email": "user@example.com",
    "partyType": "TDC",
    "name": "User Name",
    "organization": "Example Corp",
    "phoneNumber": "+1234567890",
    "website": "https://example.com",
    "location": "New York, NY",
    "depaId": "DEPA123456",
    "createdAt": "2025-08-03T21:52:36.235Z",
    "updatedAt": "2025-08-03T21:52:36.235Z"
  }
}
```

### **Update User Profile**
```http
PUT /auth/profile
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "organization": "Updated Corp",
  "phoneNumber": "+1234567890",
  "website": "https://updated.com",
  "location": "San Francisco, CA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 50,
    "name": "Updated Name",
    "organization": "Updated Corp"
  }
}
```

### **Change Password**
```http
PUT /auth/change-password
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### **Forgot Password**
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### **Reset Password**
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## 📄 Contract Management

### **List Contracts**
```http
GET /contracts
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (draft, pending, active, completed, cancelled, failed)
- `partyType`: Filter by party type (TDC, TDP, CCRP)

**Response:**
```json
{
  "success": true,
  "contracts": [
    {
      "id": 1,
      "contractId": "CONTRACT-2025-001",
      "title": "Dataset Purchase Agreement",
      "status": "active",
      "partyType": "TDC",
      "datasetName": "AI Training Dataset",
      "price": 1000.00,
      "createdAt": "2025-08-03T21:52:36.235Z",
      "updatedAt": "2025-08-03T21:52:36.235Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### **Get Contract Details**
```http
GET /contracts/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "contractId": "CONTRACT-2025-001",
    "title": "Dataset Purchase Agreement",
    "description": "Purchase agreement for AI training dataset",
    "status": "active",
    "partyType": "TDC",
    "datasetId": 1,
    "datasetName": "AI Training Dataset",
    "price": 1000.00,
    "currency": "USD",
    "startDate": "2025-08-03T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.000Z",
    "terms": "Standard terms and conditions apply",
    "depaId": "DEPA123456",
    "createdAt": "2025-08-03T21:52:36.235Z",
    "updatedAt": "2025-08-03T21:52:36.235Z"
  }
}
```

### **Create Contract**
```http
POST /contracts
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Dataset Purchase Agreement",
  "description": "Purchase agreement for AI training dataset",
  "datasetId": 1,
  "price": 1000.00,
  "currency": "USD",
  "startDate": "2025-08-03T00:00:00.000Z",
  "endDate": "2025-12-31T23:59:59.000Z",
  "terms": "Standard terms and conditions apply",
  "trainingEnvironment": {
    "provider": "AWS",
    "region": "us-east-1",
    "instanceType": "t3.medium",
    "storage": "100GB"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract created successfully",
  "contract": {
    "id": 1,
    "contractId": "CONTRACT-2025-001",
    "title": "Dataset Purchase Agreement",
    "status": "pending"
  }
}
```

### **Update Contract**
```http
PUT /contracts/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Updated Contract Title",
  "description": "Updated description",
  "price": 1200.00,
  "terms": "Updated terms and conditions"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract updated successfully",
  "contract": {
    "id": 1,
    "title": "Updated Contract Title",
    "price": 1200.00
  }
}
```

### **Delete Contract**
```http
DELETE /contracts/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Contract deleted successfully"
}
```

## 📊 Dataset Management

### **List Datasets**
```http
GET /datasets
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Filter by dataset type
- `provider`: Filter by provider
- `priceMin`: Minimum price
- `priceMax`: Maximum price

**Response:**
```json
{
  "success": true,
  "datasets": [
    {
      "id": 1,
      "name": "AI Training Dataset",
      "description": "Comprehensive dataset for AI model training",
      "type": "image_classification",
      "size": "2.5GB",
      "price": 1000.00,
      "currency": "USD",
      "provider": "TDP Provider",
      "depaId": "DEPA123456",
      "createdAt": "2025-08-03T21:52:36.235Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

### **Get Dataset Details**
```http
GET /datasets/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "dataset": {
    "id": 1,
    "name": "AI Training Dataset",
    "description": "Comprehensive dataset for AI model training",
    "type": "image_classification",
    "size": "2.5GB",
    "format": "CSV",
    "price": 1000.00,
    "currency": "USD",
    "provider": "TDP Provider",
    "depaId": "DEPA123456",
    "metadata": {
      "numSamples": 10000,
      "numFeatures": 784,
      "numClasses": 10
    },
    "licensing": "Commercial use allowed",
    "createdAt": "2025-08-03T21:52:36.235Z",
    "updatedAt": "2025-08-03T21:52:36.235Z"
  }
}
```

### **Create Dataset**
```http
POST /datasets
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "New AI Dataset",
  "description": "Dataset for machine learning",
  "type": "image_classification",
  "size": "1.5GB",
  "format": "CSV",
  "price": 500.00,
  "currency": "USD",
  "metadata": {
    "numSamples": 5000,
    "numFeatures": 784,
    "numClasses": 5
  },
  "licensing": "Commercial use allowed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dataset created successfully",
  "dataset": {
    "id": 2,
    "name": "New AI Dataset",
    "status": "pending"
  }
}
```

### **Update Dataset**
```http
PUT /datasets/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Updated Dataset Name",
  "description": "Updated description",
  "price": 750.00
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dataset updated successfully",
  "dataset": {
    "id": 1,
    "name": "Updated Dataset Name",
    "price": 750.00
  }
}
```

### **Delete Dataset**
```http
DELETE /datasets/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Dataset deleted successfully"
}
```

## ☁️ Cloud Credentials

### **List Cloud Credentials**
```http
GET /ccrp/cloud-credentials
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "credentials": [
    {
      "id": 1,
      "cloudProvider": "AWS",
      "projectId": "my-project",
      "secretName": "aws-credentials",
      "secretManager": "vault",
      "isValid": true,
      "createdAt": "2025-08-03T21:52:36.235Z"
    }
  ]
}
```

### **Add Cloud Credentials**
```http
POST /ccrp/cloud-credentials
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "cloudProvider": "AWS",
  "projectId": "my-project",
  "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
  "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "us-east-1",
  "secretManager": "vault"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cloud credentials added successfully",
  "credential": {
    "id": 1,
    "cloudProvider": "AWS",
    "projectId": "my-project"
  }
}
```

### **Validate Cloud Credentials**
```http
POST /ccrp/cloud-credentials/:id/validate
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Credentials validated successfully",
  "validation": {
    "isValid": true,
    "permissions": ["s3:GetObject", "ec2:DescribeInstances"],
    "regions": ["us-east-1", "us-west-2"]
  }
}
```

### **Delete Cloud Credentials**
```http
DELETE /ccrp/cloud-credentials/:id
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Cloud credentials deleted successfully"
}
```

## ⛓️ Blockchain Integration

### **Get Contract on Blockchain**
```http
GET /blockchain/contracts/:contractId
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "contractId": "CONTRACT-2025-001",
    "blockchainAddress": "0x1234567890abcdef...",
    "blockNumber": 12345,
    "transactionHash": "0xabcdef1234567890...",
    "status": "confirmed",
    "createdAt": "2025-08-03T21:52:36.235Z"
  }
}
```

### **Deploy Contract to Blockchain**
```http
POST /blockchain/contracts
```

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "contractId": "CONTRACT-2025-001",
  "title": "Dataset Purchase Agreement",
  "parties": ["0x1234...", "0x5678..."],
  "terms": "Standard terms and conditions"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract deployed to blockchain",
  "transaction": {
    "hash": "0xabcdef1234567890...",
    "blockNumber": 12345,
    "gasUsed": 150000
  }
}
```

## ❌ Error Handling

### **Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid credentials",
    "details": "Username or password is incorrect"
  }
}
```

### **Common Error Codes**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_FAILED` | 401 | Invalid credentials |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INTERNAL_ERROR` | 500 | Server error |

### **Validation Errors**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

## 🚦 Rate Limiting

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### **Rate Limit Exceeded**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

### **Rate Limits by Endpoint**

| Endpoint | Limit | Window |
|----------|-------|--------|
| Authentication | 10 requests | 1 minute |
| API endpoints | 100 requests | 1 minute |
| File uploads | 5 requests | 1 minute |
| Blockchain | 20 requests | 1 minute |

## 📚 Related Documentation

- **[Quick Start](QUICK_START.md)** - Get started in 5 minutes
- **[Setup Guide](SETUP.md)** - Complete installation and configuration
- **[User Guide](USER_GUIDE.md)** - How to use the system
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Development workflows
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

---

*This API reference consolidates information from multiple API documentation files.* 