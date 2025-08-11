# Cloud API Specifications - ContractFlow Pro

## ☁️ Overview

This document provides detailed API specifications for cloud-related operations in ContractFlow Pro, including multi-cloud integration, infrastructure provisioning, secret management, and confidential computing capabilities.

## 🏗️ Cloud Infrastructure API

### 1. Training Environment Management

#### Create Training Environment
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
  "vmCount": 2,
  "enableGPU": true,
  "gpuType": "V100",
  "gpuCount": 1,
  "enableConfidentialComputing": true,
  "enableEncryption": true,
  "enableMonitoring": true,
  "complianceFramework": "GDPR",
  "dataRetentionDays": 90,
  "auditLogging": true,
  "threatDetection": true,
  "realTimeAlerts": true
}
```

**Response**:
```json
{
  "success": true,
  "environment": {
    "id": 1,
    "environmentId": "env-CONTRACT-001-1733928000000",
    "contractId": "CONTRACT-001",
    "cloudProvider": "AZURE",
    "region": "eastus",
    "status": "PROVISIONING",
    "costEstimate": 150.00,
    "estimatedProvisioningTime": "5-10 minutes",
    "createdAt": "2025-08-11T16:00:00.000Z",
    "infrastructureConfig": {
      "compute": {
        "vmSize": "Standard_D2s_v3",
        "vmCount": 2,
        "gpuEnabled": true,
        "gpuType": "V100",
        "gpuCount": 1
      },
      "storage": {
        "type": "Premium_LRS",
        "sizeGB": 100
      },
      "networking": {
        "vnetAddressSpace": "10.0.0.0/16",
        "privateSubnet": "10.0.1.0/24",
        "publicSubnet": "10.0.2.0/24"
      }
    }
  }
}
```

#### Get Environment Status
```http
GET /api/infrastructure/environments/:environmentId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "id": 1,
  "environmentId": "env-CONTRACT-001-1733928000000",
  "status": "ACTIVE",
  "cloudProvider": "AZURE",
  "region": "eastus",
  "resources": {
    "vms": [
      {
        "id": "vm-001",
        "name": "training-vm-1",
        "status": "RUNNING",
        "ipAddress": "10.0.1.10",
        "privateIP": "10.0.1.10",
        "publicIP": "20.0.0.1",
        "vmSize": "Standard_D2s_v3",
        "osDisk": "100 GB Premium SSD",
        "dataDisks": ["200 GB Premium SSD"]
      }
    ],
    "storage": {
      "total": "100 GB",
      "used": "25 GB",
      "available": "75 GB"
    },
    "networking": {
      "vnetName": "vnet-training-001",
      "subnets": ["private", "public"],
      "nsgRules": 8
    }
  },
  "costs": {
    "current": 45.50,
    "estimated": 150.00,
    "currency": "USD",
    "billingPeriod": "monthly"
  },
  "security": {
    "encryptionStatus": "ENABLED",
    "attestationStatus": "VERIFIED",
    "complianceStatus": "COMPLIANT",
    "lastSecurityScan": "2025-08-11T15:30:00.000Z"
  },
  "monitoring": {
    "cpuUtilization": 65,
    "memoryUtilization": 45,
    "diskUtilization": 30,
    "networkUtilization": 25,
    "lastMetricsUpdate": "2025-08-11T16:00:00.000Z"
  }
}
```

#### Destroy Environment
```http
DELETE /api/infrastructure/environments/:environmentId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Environment destruction initiated",
  "estimatedTime": "5-10 minutes",
  "cleanupTasks": [
    "Terminating VMs",
    "Removing storage",
    "Cleaning up networking",
    "Removing security groups"
  ]
}
```

### 2. Multi-Cloud Provider Support

#### Get Available Cloud Providers
```http
GET /api/infrastructure/cloud-providers
Authorization: Bearer <token>
```

**Response**:
```json
{
  "providers": [
    {
      "name": "AWS",
      "code": "AWS",
      "technology": "Nitro Enclaves",
      "regions": [
        { "name": "US East (N. Virginia)", "code": "us-east-1" },
        { "name": "US West (Oregon)", "code": "us-west-2" },
        { "name": "Europe (Ireland)", "code": "eu-west-1" }
      ],
      "instanceTypes": [
        "t3.medium",
        "c5.large",
        "m5.large",
        "g4dn.xlarge"
      ],
      "storageTypes": ["gp2", "io1", "st1"],
      "features": [
        "Confidential Computing",
        "Hardware Security",
        "Encryption at Rest",
        "IAM Integration"
      ]
    },
    {
      "name": "Azure",
      "code": "AZURE",
      "technology": "SGX Enclaves",
      "regions": [
        { "name": "East US", "code": "eastus" },
        { "name": "West US", "code": "westus" },
        { "name": "West Europe", "code": "westeurope" }
      ],
      "vmSizes": [
        "Standard_D2s_v3",
        "Standard_D4s_v3",
        "Standard_NC6s_v3",
        "Standard_NC12s_v3"
      ],
      "storageSkus": ["Standard_LRS", "Premium_LRS", "Standard_GRS"],
      "features": [
        "Confidential Computing",
        "Azure AD Integration",
        "Key Vault",
        "Managed Identities"
      ]
    },
    {
      "name": "Google Cloud",
      "code": "GCP",
      "technology": "Confidential VMs",
      "regions": [
        { "name": "US Central", "code": "us-central1" },
        { "name": "US East", "code": "us-east1" },
        { "name": "Europe West", "code": "europe-west1" }
      ],
      "machineTypes": [
        "n1-standard-2",
        "n1-standard-4",
        "n1-standard-8",
        "n1-standard-16"
      ],
      "storageClasses": ["STANDARD", "NEARLINE", "COLDLINE"],
      "features": [
        "Confidential Computing",
        "IAM Integration",
        "Cloud KMS",
        "VPC Service Controls"
      ]
    },
    {
      "name": "Oracle Cloud",
      "code": "OCI",
      "technology": "Confidential Computing",
      "regions": [
        { "name": "US East", "code": "us-ashburn-1" },
        { "name": "US West", "code": "us-phoenix-1" },
        { "name": "UK South", "code": "uk-london-1" }
      ],
      "shapes": [
        "VM.Standard2.1",
        "VM.Standard2.2",
        "VM.Standard2.4",
        "VM.GPU2.1"
      ],
      "storageTypes": ["Standard", "Archive", "InfrequentAccess"],
      "features": [
        "Confidential Computing",
        "Oracle Cloud Guard",
        "Vault Integration",
        "Identity Domains"
      ]
    }
  ]
}
```

#### Get Cloud Provider Details
```http
GET /api/infrastructure/cloud-providers/:provider
Authorization: Bearer <token>
```

**Response** (for Azure):
```json
{
  "name": "Azure",
  "code": "AZURE",
  "technology": "SGX Enclaves",
  "description": "Microsoft Azure with Intel SGX technology for confidential computing",
  "regions": [
    {
      "name": "East US",
      "code": "eastus",
      "availability": "HIGH",
      "latency": "Low",
      "compliance": ["SOC2", "ISO27001", "GDPR"]
    }
  ],
  "instanceTypes": [
    {
      "name": "Standard_D2s_v3",
      "cpu": 2,
      "memory": "8 GB",
      "price": 0.096,
      "confidentialComputing": true
    }
  ],
  "storageOptions": [
    {
      "name": "Premium_LRS",
      "type": "SSD",
      "performance": "HIGH",
      "price": 0.000164
    }
  ],
  "securityFeatures": [
    "Encryption at Rest",
    "Encryption in Transit",
    "Managed Identities",
    "Key Vault Integration",
    "Network Security Groups"
  ]
}
```

### 3. Cost Estimation

#### Estimate Environment Costs
```http
POST /api/infrastructure/cost-estimation
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "cloudProvider": "AZURE",
  "region": "eastus",
  "duration": 30,
  "resources": {
    "compute": {
      "vmSize": "Standard_D2s_v3",
      "vmCount": 2,
      "gpuEnabled": true,
      "gpuType": "V100",
      "gpuCount": 1
    },
    "storage": {
      "type": "Premium_LRS",
      "sizeGB": 100
    },
    "networking": {
      "bandwidth": "10 Gbps",
      "dataTransfer": "1000 GB"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "estimation": {
    "totalCost": 450.00,
    "currency": "USD",
    "billingPeriod": "monthly",
    "breakdown": {
      "compute": {
        "vmCost": 280.00,
        "gpuCost": 120.00,
        "total": 400.00
      },
      "storage": {
        "diskCost": 30.00,
        "dataTransfer": 15.00,
        "total": 45.00
      },
      "networking": {
        "bandwidthCost": 5.00,
        "total": 5.00
      }
    },
    "savings": {
      "reservedInstances": 60.00,
      "spotInstances": 80.00,
      "totalSavings": 140.00
    },
    "finalCost": 310.00
  }
}
```

---

## 🔐 Secret Management API

### 1. Cloud Credentials Management

#### Store Cloud Credentials
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
  "authMethod": "SERVICE_PRINCIPAL",
  "defaultLocation": "eastus",
  "defaultResourceGroupPrefix": "training",
  "defaultVMSize": "Standard_D2s_v3",
  "defaultStorageSku": "Premium_LRS",
  "defaultDatabaseSku": "Basic",
  "vnetAddressSpace": "10.0.0.0/16",
  "privateSubnetPrefix": "10.0.1.0/24",
  "publicSubnetPrefix": "10.0.2.0/24",
  "enableEncryption": true,
  "enableMonitoring": true,
  "enableKeyVault": true,
  "budgetLimit": 1000,
  "alertThreshold": 0.8
}
```

**Response**:
```json
{
  "success": true,
  "credential": {
    "id": 1,
    "cloudProvider": "AZURE",
    "secretManager": "VAULT",
    "secretName": "azure-credentials-001",
    "validationStatus": "PENDING",
    "defaultLocation": "eastus",
    "defaultVMSize": "Standard_D2s_v3",
    "enableEncryption": true,
    "enableMonitoring": true,
    "createdAt": "2025-08-11T16:00:00.000Z"
  }
}
```

#### Get Stored Credentials
```http
GET /api/ccrp/cloud-credentials/:userId
Authorization: Bearer <token>
```

**Response**:
```json
{
  "credentials": [
    {
      "id": 1,
      "cloudProvider": "AZURE",
      "secretManager": "VAULT",
      "secretName": "azure-credentials-001",
      "validationStatus": "VALID",
      "lastValidated": "2025-08-11T16:00:00.000Z",
      "defaultLocation": "eastus",
      "defaultVMSize": "Standard_D2s_v3",
      "enableEncryption": true,
      "enableMonitoring": true
    },
    {
      "id": 2,
      "cloudProvider": "AWS",
      "secretManager": "AWS_SECRETS",
      "secretName": "aws-credentials-001",
      "validationStatus": "VALID",
      "lastValidated": "2025-08-11T15:30:00.000Z",
      "defaultLocation": "us-east-1",
      "defaultVMSize": "t3.medium",
      "enableEncryption": true,
      "enableMonitoring": true
    }
  ]
}
```

#### Validate Credentials
```http
POST /api/ccrp/cloud-credentials/:id/validate
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "validation": {
    "status": "VALID",
    "lastValidated": "2025-08-11T16:00:00.000Z",
    "services": {
      "compute": {
        "status": "AVAILABLE",
        "message": "VM creation successful",
        "testResult": "PASSED"
      },
      "storage": {
        "status": "AVAILABLE",
        "message": "Storage account accessible",
        "testResult": "PASSED"
      },
      "networking": {
        "status": "AVAILABLE",
        "message": "VNet creation successful",
        "testResult": "PASSED"
      },
      "security": {
        "status": "AVAILABLE",
        "message": "Key Vault accessible",
        "testResult": "PASSED"
      }
    },
    "permissions": {
      "resourceGroup": "CREATE",
      "virtualMachine": "CREATE",
      "storageAccount": "CREATE",
      "keyVault": "CREATE"
    },
    "quotas": {
      "vmCores": 100,
      "storageAccounts": 200,
      "publicIPs": 50
    }
  }
}
```

### 2. Secret Manager Operations

#### Get Available Secret Managers
```http
GET /api/secret-managers
Authorization: Bearer <token>
```

**Response**:
```json
{
  "secretManagers": [
    {
      "name": "HashiCorp Vault",
      "code": "VAULT",
      "status": "AVAILABLE",
      "features": [
        "Multi-cloud support",
        "Dynamic secrets",
        "Encryption as a service"
      ]
    },
    {
      "name": "AWS Secrets Manager",
      "code": "AWS_SECRETS",
      "status": "AVAILABLE",
      "features": [
        "AWS native integration",
        "Automatic rotation",
        "IAM integration"
      ]
    },
    {
      "name": "Azure Key Vault",
      "code": "AZURE_KEYVAULT",
      "status": "AVAILABLE",
      "features": [
        "Azure native integration",
        "Managed identities",
        "Hardware security modules"
      ]
    },
    {
      "name": "Google Cloud Secret Manager",
      "code": "GCP_SECRETS",
      "status": "AVAILABLE",
      "features": [
        "GCP native integration",
        "IAM integration",
        "Version management"
      ]
    }
  ]
}
```

---

## 🔒 Security & Compliance API

### 1. Attestation & Verification

#### Get Security Status
```http
GET /api/infrastructure/environments/:environmentId/security
Authorization: Bearer <token>
```

**Response**:
```json
{
  "security": {
    "encryption": {
      "atRest": "ENABLED",
      "inTransit": "ENABLED",
      "algorithm": "AES-256",
      "keySource": "Azure Key Vault"
    },
    "attestation": {
      "status": "VERIFIED",
      "type": "SGX",
      "timestamp": "2025-08-11T16:00:00.000Z",
      "report": "attestation-report-001"
    },
    "compliance": {
      "gdpr": "COMPLIANT",
      "hipaa": "COMPLIANT",
      "soc2": "COMPLIANT",
      "iso27001": "COMPLIANT"
    },
    "monitoring": {
      "threatDetection": "ENABLED",
      "auditLogging": "ENABLED",
      "realTimeAlerts": "ENABLED",
      "lastScan": "2025-08-11T15:30:00.000Z"
    }
  }
}
```

### 2. Compliance Reporting

#### Get Compliance Report
```http
GET /api/infrastructure/environments/:environmentId/compliance
Authorization: Bearer <token>
```

**Response**:
```json
{
  "compliance": {
    "overallStatus": "COMPLIANT",
    "lastAssessment": "2025-08-11T16:00:00.000Z",
    "frameworks": [
      {
        "name": "GDPR",
        "status": "COMPLIANT",
        "score": 95,
        "lastCheck": "2025-08-11T16:00:00.000Z",
        "requirements": [
          {
            "requirement": "Data Minimization",
            "status": "MET",
            "details": "Only necessary data is processed"
          },
          {
            "requirement": "Right to Erasure",
            "status": "MET",
            "details": "Automated data deletion after 90 days"
          }
        ]
      }
    ],
    "recommendations": [
      "Enable additional encryption for sensitive data",
      "Implement more frequent security scans"
    ]
  }
}
```

---

## 📊 Monitoring & Metrics API

### 1. Resource Monitoring

#### Get Environment Metrics
```http
GET /api/infrastructure/environments/:environmentId/metrics
Authorization: Bearer <token>
```

**Query Parameters**:
- `timeRange`: 1h, 24h, 7d, 30d
- `interval`: 1m, 5m, 15m, 1h

**Response**:
```json
{
  "metrics": {
    "cpu": {
      "current": 65,
      "average": 45,
      "peak": 85,
      "history": [
        { "timestamp": "2025-08-11T16:00:00.000Z", "value": 65 },
        { "timestamp": "2025-08-11T15:55:00.000Z", "value": 62 }
      ]
    },
    "memory": {
      "current": 45,
      "average": 40,
      "peak": 70,
      "history": [
        { "timestamp": "2025-08-11T16:00:00.000Z", "value": 45 },
        { "timestamp": "2025-08-11T15:55:00.000Z", "value": 43 }
      ]
    },
    "storage": {
      "current": 30,
      "average": 28,
      "peak": 35,
      "history": [
        { "timestamp": "2025-08-11T16:00:00.000Z", "value": 30 },
        { "timestamp": "2025-08-11T15:55:00.000Z", "value": 29 }
      ]
    },
    "network": {
      "current": 25,
      "average": 20,
      "peak": 45,
      "history": [
        { "timestamp": "2025-08-11T16:00:00.000Z", "value": 25 },
        { "timestamp": "2025-08-11T15:55:00.000Z", "value": 22 }
      ]
    }
  },
  "alerts": [
    {
      "id": "alert-001",
      "type": "HIGH_CPU",
      "message": "CPU utilization above 80%",
      "severity": "WARNING",
      "timestamp": "2025-08-11T15:45:00.000Z"
    }
  ]
}
```

---

## 🚨 Error Handling

### Cloud-Specific Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `CLOUD_PROVIDER_UNAVAILABLE` | Cloud provider service unavailable | 503 |
| `CREDENTIALS_INVALID` | Invalid cloud credentials | 401 |
| `QUOTA_EXCEEDED` | Resource quota exceeded | 429 |
| `REGION_UNAVAILABLE` | Requested region unavailable | 400 |
| `INSTANCE_TYPE_UNAVAILABLE` | Requested instance type unavailable | 400 |
| `STORAGE_QUOTA_EXCEEDED` | Storage quota exceeded | 429 |
| `NETWORK_CONFIGURATION_ERROR` | Network configuration failed | 400 |
| `SECURITY_GROUP_ERROR` | Security group configuration failed | 400 |

### Error Response Format
```json
{
  "error": "Cloud provider service unavailable",
  "code": "CLOUD_PROVIDER_UNAVAILABLE",
  "details": {
    "provider": "AZURE",
    "region": "eastus",
    "service": "Compute",
    "retryAfter": 300
  },
  "timestamp": "2025-08-11T16:00:00.000Z"
}
```

---

## 📚 API Versioning

### Version Header
```http
Accept: application/vnd.contractflowpro.cloud.v1+json
```

### Current Version: v1.0.0

---

## 🔒 Rate Limiting

### Cloud API Limits
| Endpoint | Limit |
|----------|-------|
| Environment creation | 5 requests per hour |
| Credential validation | 10 requests per minute |
| Cost estimation | 20 requests per minute |
| Metrics retrieval | 100 requests per minute |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1733928600
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-08-11  
**API Version**: v1.0.0  
**Status**: Cloud API Specifications Complete 