# API Documentation
## Contract Management System Backend API

Basic API reference for the Contract Management System backend.

## 🔗 Base URL
```
http://localhost:5001/api
```

## 🔐 Authentication

All API endpoints require wallet-based authentication. The user's wallet address is used to identify and authenticate users.

## 📋 Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "walletAddress": "0x...",
  "publicKey": "0x...",
  "name": "User Name",
  "email": "user@example.com",
  "partyType": "TDP|TDC|CCRP",
  "description": "User description"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "walletAddress": "0x...",
    "name": "User Name",
    "email": "user@example.com",
    "partyType": "TDP",
    "isRegistered": true
  }
}
```

#### Get User Profile
```http
GET /auth/profile
```

**Headers:**
```
Authorization: Bearer <wallet_address>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "walletAddress": "0x...",
    "name": "User Name",
    "email": "user@example.com",
    "partyType": "TDP",
    "isRegistered": true
  }
}
```

### Contracts

#### Get All Contracts
```http
GET /contracts
```

**Query Parameters:**
- `status` (optional): Filter by contract status
- `partyType` (optional): Filter by user's party type

**Response:**
```json
{
  "success": true,
  "contracts": [
    {
      "id": 1,
      "blockchainId": "0x...",
      "status": "active",
      "price": "1000.00",
      "tdp": { "name": "TDP Provider", "walletAddress": "0x..." },
      "tdc": { "name": "TDC Consumer", "walletAddress": "0x..." },
      "ccrp": { "name": "CCRP Provider", "walletAddress": "0x..." },
      "dataset": { "name": "Dataset Name", "id": 1 },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create Contract
```http
POST /contracts
```

**Request Body:**
```json
{
  "datasetId": 1,
  "price": "1000.00",
  "ccrpId": 1,
  "terms": "Contract terms and conditions"
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 1,
    "blockchainId": "0x...",
    "status": "pending_tdp",
    "price": "1000.00"
  }
}
```

#### Sign Contract
```http
POST /contracts/:id/sign
```

**Request Body:**
```json
{
  "signedTransaction": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract signed successfully"
}
```

### Datasets

#### Get All Datasets
```http
GET /datasets
```

**Response:**
```json
{
  "success": true,
  "datasets": [
    {
      "id": 1,
      "name": "Dataset Name",
      "description": "Dataset description",
      "category": "AI/ML",
      "price": "1000.00",
      "owner": { "name": "Owner Name", "walletAddress": "0x..." },
      "isPublic": true
    }
  ]
}
```

#### Create Dataset
```http
POST /datasets
```

**Request Body:**
```json
{
  "name": "Dataset Name",
  "description": "Dataset description",
  "category": "AI/ML",
  "price": "1000.00",
  "isPublic": true
}
```

### Users

#### Get All Users
```http
GET /users
```

**Query Parameters:**
- `partyType` (optional): Filter by party type

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "name": "User Name",
      "email": "user@example.com",
      "partyType": "TDP",
      "walletAddress": "0x...",
      "isRegistered": true
    }
  ]
}
```

#### Register Party on Blockchain
```http
POST /users/register-party
```

**Request Body:**
```json
{
  "walletAddress": "0x...",
  "partyType": "TDP|TDC|CCRP"
}
```

### Notifications

#### Get User Notifications
```http
GET /notifications
```

**Query Parameters:**
- `limit` (optional): Number of notifications to return
- `offset` (optional): Number of notifications to skip

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "contract_created",
      "title": "New Contract Created",
      "message": "A new contract has been created",
      "isRead": false,
      "metadata": {},
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Mark Notification as Read
```http
PUT /notifications/:id/read
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### Blockchain

#### Get Blockchain Status
```http
GET /blockchain/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "connected": true,
    "currentBlock": 1234,
    "network": "localhost:8545",
    "contractAddress": "0x..."
  }
}
```

## 🔍 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

## 📚 Additional Resources

- **Setup Guide**: See [Setup Guide](./SETUP_GUIDE.md) for installation
- **Architecture Guide**: See [Architecture Guide](./ARCHITECTURE_GUIDE.md) for technical details
- **User Guide**: See [User Guide](./USER_GUIDE.md) for application usage

## 🆘 Support

For API questions:
1. **Check this documentation** for endpoint details
2. **Review the codebase** for implementation specifics
3. **Create an issue** on GitHub for bugs
4. **Start a discussion** for API questions 