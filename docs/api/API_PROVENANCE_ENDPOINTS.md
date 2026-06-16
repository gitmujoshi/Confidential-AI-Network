# 🔍 **Provenance Tracking API Documentation**

## 📋 **Overview**

This document provides comprehensive API documentation for all provenance tracking endpoints in the Contract Management System. Provenance tracking ensures complete auditability of AI model training processes, data lineage, and code execution.

## 🔐 **Authentication**

All provenance endpoints require authentication via JWT token:

```http
Authorization: Bearer <jwt_token>
```

## 📊 **Base URL**

```
https://api.contractmanagement.com/api/provenance
```

---

## 🌳 **Merkle Tree Management**

### **1. Create Merkle Tree**

**Endpoint:** `POST /api/provenance/trees`

**Description:** Creates a new Merkle tree for tracking provenance of a contract.

**Request Body:**
```json
{
  "contractId": "CONTRACT-001",
  "treeType": "BINARY_MERKLE_TREE",
  "hashAlgorithm": "SHA256",
  "maxDepth": 10,
  "description": "Provenance tree for MNIST training contract"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "treeId": "TREE-001",
    "contractId": "CONTRACT-001",
    "rootHash": "0xabc123...",
    "depth": 0,
    "nodeCount": 0,
    "status": "ACTIVE",
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

### **2. Get Merkle Tree**

**Endpoint:** `GET /api/provenance/trees/{treeId}`

**Description:** Retrieves details of a specific Merkle tree.

**Response:**
```json
{
  "success": true,
  "data": {
    "treeId": "TREE-001",
    "contractId": "CONTRACT-001",
    "rootHash": "0xabc123...",
    "depth": 4,
    "nodeCount": 15,
    "status": "ACTIVE",
    "createdAt": "2025-01-08T10:00:00Z",
    "updatedAt": "2025-01-08T12:00:00Z"
  }
}
```

### **3. List Merkle Trees**

**Endpoint:** `GET /api/provenance/trees`

**Query Parameters:**
- `contractId` (optional): Filter by contract ID
- `status` (optional): Filter by tree status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "trees": [
      {
        "treeId": "TREE-001",
        "contractId": "CONTRACT-001",
        "rootHash": "0xabc123...",
        "status": "ACTIVE",
        "nodeCount": 15,
        "createdAt": "2025-01-08T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0
    }
  }
}
```

---

## 📝 **Provenance Node Management**

### **1. Create Provenance Node**

**Endpoint:** `POST /api/provenance/nodes`

**Description:** Creates a new node in the Merkle tree.

**Request Body:**
```json
{
  "treeId": "TREE-001",
  "nodeType": "DATASET",
  "content": "MNIST training dataset",
  "metadata": {
    "datasetName": "MNIST",
    "size": "11.2MB",
    "recordCount": 70000,
    "dataSource": "TDP-001"
  },
  "parentNodes": [],
  "childNodes": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nodeId": "NODE-001",
    "treeId": "TREE-001",
    "nodeType": "DATASET",
    "dataHash": "0xdef456...",
    "parentHash": null,
    "leftChildHash": null,
    "rightChildHash": null,
    "level": 0,
    "position": 0,
    "metadata": {
      "datasetName": "MNIST",
      "size": "11.2MB",
      "recordCount": 70000,
      "dataSource": "TDP-001"
    },
    "isVerified": true,
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

### **2. Get Provenance Node**

**Endpoint:** `GET /api/provenance/nodes/{nodeId}`

**Description:** Retrieves details of a specific provenance node.

**Response:**
```json
{
  "success": true,
  "data": {
    "nodeId": "NODE-001",
    "treeId": "TREE-001",
    "nodeType": "DATASET",
    "dataHash": "0xdef456...",
    "parentHash": null,
    "leftChildHash": "0x789abc...",
    "rightChildHash": "0x123def...",
    "level": 0,
    "position": 0,
    "metadata": {
      "datasetName": "MNIST",
      "size": "11.2MB",
      "recordCount": 70000,
      "dataSource": "TDP-001"
    },
    "isVerified": true,
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

### **3. List Provenance Nodes**

**Endpoint:** `GET /api/provenance/nodes`

**Query Parameters:**
- `treeId` (optional): Filter by tree ID
- `nodeType` (optional): Filter by node type
- `isVerified` (optional): Filter by verification status
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "nodeId": "NODE-001",
        "treeId": "TREE-001",
        "nodeType": "DATASET",
        "dataHash": "0xdef456...",
        "level": 0,
        "position": 0,
        "isVerified": true,
        "createdAt": "2025-01-08T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0
    }
  }
}
```

---

## 🔍 **Provenance Capture Management**

### **1. Create Provenance Capture**

**Endpoint:** `POST /api/provenance/captures`

**Description:** Captures provenance data at a specific point in time.

**Request Body:**
```json
{
  "contractId": "CONTRACT-001",
  "nodeId": "NODE-001",
  "captureType": "TRAINING_START",
  "dataHash": "0xabc123...",
  "metadata": {
    "trainingJobId": "JOB-001",
    "environmentId": "ENV-001",
    "timestamp": "2025-01-08T10:00:00Z",
    "dataSize": "11.2MB"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "captureId": "CAPTURE-001",
    "contractId": "CONTRACT-001",
    "nodeId": "NODE-001",
    "captureType": "TRAINING_START",
    "dataHash": "0xabc123...",
    "metadata": {
      "trainingJobId": "JOB-001",
      "environmentId": "ENV-001",
      "timestamp": "2025-01-08T10:00:00Z",
      "dataSize": "11.2MB"
    },
    "timestamp": "2025-01-08T10:00:00Z",
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

### **2. Get Provenance Capture**

**Endpoint:** `GET /api/provenance/captures/{captureId}`

**Description:** Retrieves details of a specific provenance capture.

**Response:**
```json
{
  "success": true,
  "data": {
    "captureId": "CAPTURE-001",
    "contractId": "CONTRACT-001",
    "nodeId": "NODE-001",
    "captureType": "TRAINING_START",
    "dataHash": "0xabc123...",
    "metadata": {
      "trainingJobId": "JOB-001",
      "environmentId": "ENV-001",
      "timestamp": "2025-01-08T10:00:00Z",
      "dataSize": "11.2MB"
    },
    "timestamp": "2025-01-08T10:00:00Z",
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

---

## ✅ **Provenance Verification**

### **1. Verify Provenance Node**

**Endpoint:** `POST /api/provenance/verify`

**Description:** Verifies the integrity of a provenance node using Merkle proof.

**Request Body:**
```json
{
  "nodeId": "NODE-001",
  "proof": "0xproof123...",
  "rootHash": "0xabc123...",
  "verificationType": "MERKLE_PROOF"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationId": "VERIFY-001",
    "nodeId": "NODE-001",
    "verificationType": "MERKLE_PROOF",
    "status": "SUCCESS",
    "proof": "0xproof123...",
    "verifiedAt": "2025-01-08T10:00:00Z",
    "details": {
      "isValid": true,
      "verificationTime": "0.001s",
      "proofSize": "256 bytes"
    }
  }
}
```

### **2. Get Verification Status**

**Endpoint:** `GET /api/provenance/verifications/{verificationId}`

**Description:** Retrieves the status of a provenance verification.

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationId": "VERIFY-001",
    "captureId": "CAPTURE-001",
    "verificationType": "MERKLE_PROOF",
    "status": "SUCCESS",
    "proof": "0xproof123...",
    "verifiedAt": "2025-01-08T10:00:00Z",
    "createdAt": "2025-01-08T10:00:00Z"
  }
}
```

---

## 🔗 **Provenance Chain & Lineage**

### **1. Get Provenance Chain**

**Endpoint:** `GET /api/provenance/chain/{contractId}`

**Description:** Retrieves the complete provenance chain for a contract.

**Response:**
```json
{
  "success": true,
  "data": {
    "contractId": "CONTRACT-001",
    "treeId": "TREE-001",
    "rootHash": "0xabc123...",
    "chain": [
      {
        "nodeId": "NODE-001",
        "nodeType": "DATASET",
        "level": 0,
        "position": 0,
        "dataHash": "0xdef456...",
        "captures": [
          {
            "captureId": "CAPTURE-001",
            "captureType": "TRAINING_START",
            "timestamp": "2025-01-08T10:00:00Z"
          }
        ]
      }
    ],
    "totalNodes": 15,
    "verifiedNodes": 15,
    "verificationRate": "100%"
  }
}
```

### **2. Get Data Lineage**

**Endpoint:** `GET /api/provenance/lineage/{datasetId}`

**Description:** Retrieves the complete data lineage for a dataset.

**Response:**
```json
{
  "success": true,
  "data": {
    "datasetId": "DATASET-001",
    "lineage": {
      "source": {
        "nodeId": "NODE-001",
        "nodeType": "DATASET",
        "dataHash": "0xdef456...",
        "metadata": {
          "datasetName": "MNIST",
          "size": "11.2MB",
          "recordCount": 70000
        }
      },
      "transformations": [
        {
          "nodeId": "NODE-002",
          "nodeType": "TRANSFORM",
          "operation": "DATA_PREPROCESSING",
          "dataHash": "0x789abc...",
          "timestamp": "2025-01-08T10:30:00Z"
        }
      ],
      "outputs": [
        {
          "nodeId": "NODE-003",
          "nodeType": "MODEL",
          "dataHash": "0x123def...",
          "metadata": {
            "modelName": "MNIST_CNN",
            "accuracy": "99.2%",
            "framework": "TensorFlow"
          }
        }
      ]
    },
    "verificationStatus": "VERIFIED",
    "lastVerified": "2025-01-08T12:00:00Z"
  }
}
```

---

## 📊 **Provenance Analytics**

### **1. Get Provenance Statistics**

**Endpoint:** `GET /api/provenance/stats`

**Description:** Retrieves provenance tracking statistics.

**Query Parameters:**
- `contractId` (optional): Filter by contract ID
- `timeRange` (optional): Time range filter (e.g., "7d", "30d", "90d")

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTrees": 25,
    "totalNodes": 1500,
    "totalCaptures": 5000,
    "totalVerifications": 4800,
    "verificationRate": "96%",
    "averageTreeDepth": 4.2,
    "averageNodesPerTree": 60,
    "timeRange": "30d",
    "trends": {
      "treesCreated": [5, 8, 12, 15, 18, 22, 25],
      "nodesAdded": [50, 80, 120, 150, 180, 220, 250],
      "verificationsCompleted": [45, 75, 115, 145, 175, 210, 240]
    }
  }
}
```

### **2. Get Audit Trail**

**Endpoint:** `GET /api/provenance/audit/{contractId}`

**Description:** Retrieves the complete audit trail for a contract.

**Response:**
```json
{
  "success": true,
  "data": {
    "contractId": "CONTRACT-001",
    "auditTrail": [
      {
        "timestamp": "2025-01-08T10:00:00Z",
        "action": "TREE_CREATED",
        "details": {
          "treeId": "TREE-001",
          "rootHash": "0xabc123...",
          "initiatedBy": "TDC-001"
        }
      },
      {
        "timestamp": "2025-01-08T10:30:00Z",
        "action": "NODE_ADDED",
        "details": {
          "nodeId": "NODE-001",
          "nodeType": "DATASET",
          "dataHash": "0xdef456...",
          "initiatedBy": "TDP-001"
        }
      }
    ],
    "totalEvents": 15,
    "verificationStatus": "COMPLETE",
    "lastUpdated": "2025-01-08T12:00:00Z"
  }
}
```

---

## 🚨 **Error Responses**

### **Common Error Codes:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": "INVALID_REQUEST",
  "message": "Invalid request parameters",
  "details": {
    "field": "treeId",
    "issue": "Required field missing"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Authentication required",
  "code": "TOKEN_MISSING"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Provenance tree not found",
  "details": {
    "treeId": "TREE-999"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "Provenance service error",
  "requestId": "req-123456"
}
```

---

## 🔧 **Rate Limiting**

- **Standard endpoints**: 100 requests per minute
- **Verification endpoints**: 50 requests per minute
- **Analytics endpoints**: 20 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 📚 **Integration Examples**

### **JavaScript/Node.js:**
```javascript
const axios = require('axios');

const provenanceAPI = axios.create({
  baseURL: 'https://api.contractmanagement.com/api/provenance',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

// Create a Merkle tree
const createTree = async (contractId) => {
  const response = await provenanceAPI.post('/trees', {
    contractId,
    treeType: 'BINARY_MERKLE_TREE',
    hashAlgorithm: 'SHA256',
    maxDepth: 10
  });
  return response.data;
};
```

### **Python:**
```python
import requests

class ProvenanceClient:
    def __init__(self, base_url, jwt_token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json'
        }
    
    def create_tree(self, contract_id):
        response = requests.post(
            f'{self.base_url}/api/provenance/trees',
            json={
                'contractId': contract_id,
                'treeType': 'BINARY_MERKLE_TREE',
                'hashAlgorithm': 'SHA256',
                'maxDepth': 10
            },
            headers=self.headers
        )
        return response.json()
```

---

## 🔄 **Webhook Events**

The provenance system can send webhook notifications for important events:

### **Available Events:**
- `tree.created` - Merkle tree created
- `node.added` - Node added to tree
- `capture.created` - Provenance data captured
- `verification.completed` - Verification completed
- `verification.failed` - Verification failed

### **Webhook Payload:**
```json
{
  "event": "verification.completed",
  "timestamp": "2025-01-08T10:00:00Z",
  "data": {
    "verificationId": "VERIFY-001",
    "nodeId": "NODE-001",
    "status": "SUCCESS",
    "contractId": "CONTRACT-001"
  }
}
```
