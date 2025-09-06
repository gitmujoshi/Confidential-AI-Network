# SCITT CCF API Specifications

## 🔗 Base URLs

### **Development Environment**
- **Main App**: `http://localhost:5001`
- **SCITT CCF**: `http://localhost:9000`
- **API Gateway**: `http://localhost:8000`

### **Production Environment**
- **Main App**: `https://api.contractmanagement.com`
- **SCITT CCF**: `https://scitt.contractmanagement.com`
- **API Gateway**: `https://gateway.contractmanagement.com`

## 🔐 Authentication

### **Headers Required**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Service-Key: <INTERNAL_SERVICE_KEY>  # For service-to-service calls
```

### **JWT Token Structure**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["TDP", "TDC", "CCRP", "ADMIN"],
  "iat": 1640995200,
  "exp": 1641081600
}
```

## 📋 SCITT CCF Service Endpoints

### **1. Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-28T15:30:00Z",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "response_time": 15
    },
    "redis": {
      "status": "healthy", 
      "response_time": 2
    },
    "merkle_tree_generation": {
      "status": "healthy",
      "response_time": 45
    }
  }
}
```

### **2. Create SCITT Claim**
```http
POST /api/claims
```

**Request Body:**
```json
{
  "contract_id": "CONTRACT-123e4567-e89b-12d3-a456-426614174000",
  "data_hash": "sha256:abc123def456...",
  "claim_type": "DATA_PROVENANCE",
  "metadata": {
    "data_source": "training_dataset_v1",
    "data_version": "1.0.0",
    "hash_algorithm": "SHA256"
  }
}
```

**Response:**
```json
{
  "success": true,
  "claim": {
    "claim_id": "CLAIM-789e0123-e89b-12d3-a456-426614174000",
    "contract_id": "CONTRACT-123e4567-e89b-12d3-a456-426614174000",
    "claim_type": "DATA_PROVENANCE",
    "data_hash": "sha256:abc123def456...",
    "status": "CREATED",
    "created_at": "2025-08-28T15:30:00Z"
  },
  "merkle_tree": {
    "tree_id": "TREE-456e7890-e89b-12d3-a456-426614174000",
    "root_hash": "sha256:def456ghi789...",
    "node_count": 7,
    "max_depth": 3
  }
}
```

### **3. Get SCITT Claim**
```http
GET /api/claims/{claim_id}
```

**Response:**
```json
{
  "success": true,
  "claim": {
    "claim_id": "CLAIM-789e0123-e89b-12d3-a456-426614174000",
    "contract_id": "CONTRACT-123e4567-e89b-12d3-a456-426614174000",
    "claim_type": "DATA_PROVENANCE",
    "data_hash": "sha256:abc123def456...",
    "status": "VERIFIED",
    "created_at": "2025-08-28T15:30:00Z",
    "verified_at": "2025-08-28T15:35:00Z"
  },
  "merkle_tree": {
    "tree_id": "TREE-456e7890-e89b-12d3-a456-426614174000",
    "root_hash": "sha256:def456ghi789...",
    "node_count": 7,
    "max_depth": 3,
    "nodes": [
      {
        "node_id": "NODE-001",
        "level": 0,
        "position": 0,
        "data_hash": "sha256:abc123def456...",
        "is_verified": true
      }
    ]
  }
}
```

### **4. Verify Merkle Proof**
```http
POST /api/claims/{claim_id}/verify
```

**Request Body:**
```json
{
  "data_hash": "sha256:abc123def456...",
  "merkle_proof": {
    "path": [0, 1, 0],
    "siblings": [
      "sha256:sibling1hash...",
      "sha256:sibling2hash...",
      "sha256:sibling3hash..."
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "verification": {
    "verification_id": "VERIFY-123e4567-e89b-12d3-a456-426614174000",
    "status": "VERIFIED",
    "verified_at": "2025-08-28T15:40:00Z",
    "details": {
      "proof_valid": true,
      "root_hash_matches": true,
      "verification_time_ms": 25
    }
  }
}
```

### **5. List Claims by Contract**
```http
GET /api/contracts/{contract_id}/claims
```

**Query Parameters:**
- `limit`: Number of claims to return (default: 20, max: 100)
- `offset`: Number of claims to skip (default: 0)
- `status`: Filter by claim status (optional)
- `claim_type`: Filter by claim type (optional)

**Response:**
```json
{
  "success": true,
  "claims": [
    {
      "claim_id": "CLAIM-789e0123-e89b-12d3-a456-426614174000",
      "claim_type": "DATA_PROVENANCE",
      "status": "VERIFIED",
      "created_at": "2025-08-28T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

## 🔗 Main App Integration Endpoints

### **1. Create Contract with Provenance**
```http
POST /api/contracts
```

**Request Body:**
```json
{
  "title": "Data Training Contract",
  "description": "Contract for training data provision",
  "tdp_id": 1,
  "tdc_id": 2,
  "ccrp_id": 3,
  "enable_provenance": true,  // NEW: Enable SCITT CCF integration
  "provenance_config": {
    "claim_type": "DATA_PROVENANCE",
    "hash_algorithm": "SHA256"
  }
}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 123,
    "contract_id": "CONTRACT-123e4567-e89b-12d3-a456-426614174000",
    "title": "Data Training Contract",
    "status": "ACTIVE",
    "created_at": "2025-08-28T15:30:00Z"
  },
  "provenance": {
    "enabled": true,
    "claim_id": "CLAIM-789e0123-e89b-12d3-a456-426614174000",
    "status": "CREATED"
  }
}
```

### **2. Get Contract with Provenance**
```http
GET /api/contracts/{contract_id}
```

**Response:**
```json
{
  "success": true,
  "contract": {
    "id": 123,
    "contract_id": "CONTRACT-123e4567-e89b-12d3-a456-426614174000",
    "title": "Data Training Contract",
    "status": "ACTIVE",
    "created_at": "2025-08-28T15:30:00Z"
  },
  "provenance": {
    "enabled": true,
    "claim_id": "CLAIM-789e0123-e89b-12d3-a456-426614174000",
    "status": "VERIFIED",
    "last_verified": "2025-08-28T15:35:00Z"
  }
}
```

### **3. Verify Data Provenance**
```http
POST /api/contracts/{contract_id}/verify-provenance
```

**Request Body:**
```json
{
  "data_hash": "sha256:abc123def456...",
  "verification_method": "MERKLE_PROOF"
}
```

**Response:**
```json
{
  "success": true,
  "verification": {
    "verified": true,
    "claim_id": "CLAIM-789e0123-e89b-12d3-a456-426614174000",
    "verified_at": "2025-08-28T15:40:00Z",
    "details": {
      "proof_valid": true,
      "root_hash_matches": true,
      "verification_time_ms": 25
    }
  }
}
```

## 🚨 Error Responses

### **Standard Error Format**
```json
{
  "success": false,
  "error": {
    "code": "SCITT_CCF_UNAVAILABLE",
    "message": "SCITT CCF service is currently unavailable",
    "details": "Service timeout after 5000ms",
    "timestamp": "2025-08-28T15:30:00Z"
  }
}
```

### **Common Error Codes**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `SCITT_CCF_UNAVAILABLE` | 503 | SCITT CCF service is down |
| `SCITT_CCF_TIMEOUT` | 504 | SCITT CCF request timed out |
| `INVALID_CLAIM_DATA` | 400 | Invalid claim data provided |
| `CLAIM_NOT_FOUND` | 404 | Claim with specified ID not found |
| `VERIFICATION_FAILED` | 422 | Merkle proof verification failed |
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |

## 📊 Rate Limiting

### **Limits**
- **SCITT CCF API**: 100 requests per minute per user
- **Main App Integration**: 50 requests per minute per user
- **Health Checks**: 10 requests per minute per IP

### **Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995260
```

## 🔍 Health Check Endpoints

### **Main App Health**
```http
GET /health
```

### **SCITT CCF Health**
```http
GET /health
```

### **API Gateway Health**
```http
GET /health
```

### **Aggregated Health**
```http
GET /health/aggregated
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-28T15:30:00Z",
  "services": {
    "main_app": {
      "status": "healthy",
      "response_time": 15
    },
    "scitt_ccf": {
      "status": "healthy",
      "response_time": 25
    },
    "api_gateway": {
      "status": "healthy",
      "response_time": 5
    }
  }
}
```

## 📝 Request/Response Examples

### **Complete Workflow Example**

#### **Step 1: Create Contract with Provenance**
```bash
curl -X POST http://localhost:8000/api/contracts \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Training Data Contract",
    "description": "Contract for providing AI training data",
    "tdp_id": 1,
    "tdc_id": 2,
    "ccrp_id": 3,
    "enable_provenance": true
  }'
```

#### **Step 2: Verify Data Provenance**
```bash
curl -X POST http://localhost:8000/api/contracts/123/verify-provenance \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "data_hash": "sha256:abc123def456...",
    "verification_method": "MERKLE_PROOF"
  }'
```

#### **Step 3: Get SCITT Claim Details**
```bash
curl -X GET http://localhost:8000/api/scitt/claims/CLAIM-789e0123-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## 🔧 Development & Testing

### **Mock SCITT CCF Service**
```bash
# Start mock service for testing
npm run scitt:mock

# Mock service runs on port 9001
# Returns predefined responses for testing
```

### **Integration Test Suite**
```bash
# Run integration tests
npm run test:integration:scitt

# Test failure scenarios
npm run test:integration:scitt:failures
```

### **Performance Testing**
```bash
# Load test SCITT CCF integration
npm run test:load:scitt

# Benchmark Merkle tree generation
npm run test:benchmark:merkle
```
