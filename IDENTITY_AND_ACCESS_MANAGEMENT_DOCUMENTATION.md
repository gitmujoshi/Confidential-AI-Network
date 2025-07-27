# Identity and Access Management (IAM) Documentation

## Contract Management System

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Author:** Contract Management System Team  
**Classification:** Internal Technical Specification

---

## Table of Contents

1. [Overview](#overview)
2. [Identity Types](#identity-types)
3. [Identity Creation and Management](#identity-creation-and-management)
4. [Global Uniqueness Mechanisms](#global-uniqueness-mechanisms)
5. [Dataset and CCRP Infrastructure Management with DEPA IDs](#dataset-and-ccrp-infrastructure-management-with-depa-ids)
6. [Global DEPA ID Uniqueness Across Multiple Deployments](#global-depa-id-uniqueness-across-multiple-deployments)
7. [Authentication Methods](#authentication-methods)
8. [Authorization Framework](#authorization-framework)
9. [Security Controls](#security-controls)
10. [Audit and Compliance](#audit-and-compliance)
11. [Implementation Details](#implementation-details)
12. [API Specifications](#api-specifications)

---

## Overview

The Contract Management System implements a comprehensive Identity and Access Management (IAM) framework designed for enterprise-grade security and compliance. The system supports multiple identity types, authentication methods, and authorization mechanisms to ensure secure access to contract management functionalities.

### Key Features
- **Multi-Identity Support**: User identities, DID identities, and enterprise identities
- **Multi-Authentication Methods**: JWT tokens, Keycloak integration, DID-based authentication
- **Role-Based Access Control**: TDP, TDC, CCRP, and Admin roles with granular permissions
- **Global Uniqueness**: DEPA ID system for globally unique entity identification
- **Enterprise Integration**: Keycloak SSO and enterprise DID support
- **Compliance Ready**: DPDP 2023, GDPR, and SOX compliance features

---

## Identity Types

### 1. User Identities

#### 1.1 Training Data Provider (TDP)
- **Purpose**: Dataset owners who create and manage training datasets
- **Permissions**: 
  - Create and manage datasets
  - Sign contracts as TDP party
  - View own contracts and datasets
  - Update profile and DID information
- **Data Access**: Own datasets and contracts only

#### 1.2 Training Data Consumer (TDC)
- **Purpose**: Contract initiators who create contracts for data access
- **Permissions**:
  - Browse available datasets
  - Create contracts
  - Sign contracts as TDC party
  - View own contracts
- **Data Access**: Public datasets and own contracts

#### 1.3 Confidential Clean Room Provider (CCRP)
- **Purpose**: Runtime environment providers for secure data analytics
- **Permissions**:
  - Manage clean room environments
  - Complete contracts
  - Cancel contracts
  - View contract execution status
- **Data Access**: Contract execution data and clean room configurations

#### 1.4 System Administrator (AppAdmin)
- **Purpose**: System-wide administration and management
- **Permissions**:
  - Manage all users
  - View system audit logs
  - Configure enterprise settings
  - Manage DID domains
  - Access all data
- **Data Access**: Full system access

### 2. Decentralized Identifiers (DIDs)

#### 2.1 DID Types Supported
- **did:web**: Web-hosted DID documents for enterprise users
- **did:ethr**: Ethereum-based DIDs for blockchain users
- **did:key**: Simple key-based DIDs for testing

#### 2.2 DID Functions
- **Cryptographic Verification**: Digital signature verification
- **Identity Proof**: Ownership verification for blockchain operations
- **Enterprise Integration**: Domain-based identity for enterprise users
- **Privacy Preservation**: Self-sovereign identity management

### 3. Enterprise Identities

#### 3.1 Enterprise DID Integration
- **Domain-Based Identity**: `did:web:company.com:user:username`
- **Organization Verification**: Domain ownership verification
- **Enterprise SSO**: Integration with Keycloak for enterprise authentication
- **Multi-Tenant Support**: Support for multiple enterprise domains

#### 3.2 Enterprise User Management
- **Centralized Authentication**: Keycloak-based user management
- **Role Synchronization**: Automatic role assignment from enterprise systems
- **Audit Integration**: Enterprise audit trail integration
- **Compliance Support**: Enterprise compliance requirements

---

## Identity Creation and Management

### 1. User Registration Process

#### 1.1 Registration Flow
```javascript
// Registration endpoint: POST /api/auth/register
{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "partyType": "TDP",
  "organization": "DataCorp Inc",
  "existingDID": "did:web:company.com:user:john.doe", // Optional
  "didVerificationSignature": "signature" // Optional
}
```

#### 1.2 Identity Creation Steps
1. **Input Validation**: Validate required fields and format
2. **Email Uniqueness Check**: Ensure email is not already registered
3. **DID Validation**: Validate existing DID if provided
4. **Keycloak User Creation**: Create user in Keycloak IAM
5. **Database User Creation**: Create user in local database
6. **DEPA ID Generation**: Generate globally unique DEPA ID
7. **Notification Creation**: Create welcome notification
8. **Email Verification**: Trigger email verification process

#### 1.3 Transaction-Based Creation
```javascript
// Transaction ensures data consistency
const transaction = await db.sequelize.transaction();
try {
  // Step 1: Create in Keycloak
  const ***REMOVED-KEYCLOAK_DB_PASSWORD***Result = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.createUser(userData);
  
  // Step 2: Create in database
  const dbUser = await db.User.create({
    // ... user data
    depaId: depaIdService.generateUserDEPAId(partyType),
    iamUserId: ***REMOVED-KEYCLOAK_DB_PASSWORD***Result.***REMOVED-KEYCLOAK_DB_PASSWORD***UserId
  }, { transaction });
  
  // Step 3: Create notification
  await db.Notification.create({
    userId: dbUser.id,
    type: 'USER_REGISTERED'
  }, { transaction });
  
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  // Cleanup orphaned Keycloak user if needed
}
```

### 2. DID Management

#### 2.1 DID Creation
```javascript
// System-generated DID for enterprise users
const domain = email.split('@')[1] || 'example.com';
const did = `did:web:${domain}:user:${email.split('@')[0]}`;

// User-provided DID validation
if (existingDID) {
  const didAvailability = await didService.isDIDAvailable(existingDID);
  if (!didAvailability.available) {
    throw new Error('DID not available');
  }
}
```

#### 2.2 DID Verification
```javascript
// DID ownership verification
const message = `I, the holder of DID ${existingDID}, hereby verify ownership with wallet address ${walletAddress} on ${new Date().toISOString()}`;
const isVerified = await didService.verifyDIDOwnership(
  existingDID, 
  walletAddress, 
  didVerificationSignature, 
  message
);
```

### 3. Enterprise Identity Management

#### 3.1 Keycloak Integration
```javascript
// Keycloak user creation
const ***REMOVED-KEYCLOAK_DB_PASSWORD***UserData = {
  username: userData.email,
  email: userData.email,
  firstName: userData.name?.split(' ')[0] || '',
  lastName: userData.name?.split(' ').slice(1).join(' ') || '',
  enabled: true,
  emailVerified: false,
  credentials: [{
    type: 'password',
    value: temporaryPassword,
    temporary: true
  }],
  attributes: {
    partyType: [userData.partyType],
    organization: [userData.organization] || [],
    // ... other attributes
  }
};
```

#### 3.2 Enterprise Domain Management
```javascript
// Enterprise domain validation
const validateEnterpriseDID = async (did) => {
  const domain = did.replace('did:web:', '').split(':')[0];
  const allowedDomains = await getEnterpriseDomains();
  
  return {
    isValid: allowedDomains.includes(domain),
    isDomainAllowed: allowedDomains.includes(domain),
    domain: domain
  };
};
```

---

## Global Uniqueness Mechanisms

The global uniqueness mechanisms ensure that all entities in the system have unique identifiers that can be trusted across all deployments and jurisdictions. This is critical for maintaining data integrity, preventing conflicts, and supporting cross-border operations.

### 1. DEPA ID System

The DEPA ID (Decentralized Entity Provider Architecture ID) system provides globally unique identifiers for all entities in the contract management system. Each DEPA ID consists of an entity type prefix followed by a globally unique identifier, ensuring no two entities can have the same identifier.

#### 1.1 DEPA ID Format

The DEPA ID format is designed to be human-readable while ensuring global uniqueness. The format includes an entity type prefix that immediately identifies the type of entity, followed by a UUID that guarantees uniqueness.

```
[ENTITY_TYPE]-[GUID]
Examples:
- TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
- TDP-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
- CCRP-1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e
- CONTRACT-2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f
```

This format provides:
- **Immediate Recognition**: Entity type is clearly identifiable
- **Global Uniqueness**: UUID component ensures no collisions
- **Consistency**: Same format across all system deployments
- **Scalability**: Supports unlimited number of entities

#### 1.2 DEPA ID Generation

The DEPA ID generation process ensures that each entity receives a unique identifier that follows the established format. The generation process includes validation to ensure the entity type is valid and the resulting DEPA ID is properly formatted.

The generation process provides:
- **Validation**: Ensures entity type is supported
- **Uniqueness**: Uses cryptographically secure UUID generation
- **Format Compliance**: Ensures proper DEPA ID format
- **Error Handling**: Graceful handling of generation failures

```javascript
class DEPAIdService {
  generateDEPAId(entityType) {
    // Validate entity type
    if (!this.validEntityTypes.includes(entityType)) {
      throw new Error(`Invalid entity type: ${entityType}`);
    }
    
    // Generate UUID
    const guid = uuidv4();
    
    // Create DEPA ID
    const depaId = `${entityType}-${guid}`;
    
    return depaId;
  }
  
  validateDEPAId(depaId) {
    return this.depaIdPattern.test(depaId);
  }
}
```

#### 1.3 DEPA ID Validation

DEPA ID validation ensures that all identifiers in the system follow the correct format and can be trusted for system operations. The validation process uses regular expressions to verify the format and includes additional checks for entity type validity.

The validation process includes:
- **Format Validation**: Ensures proper DEPA ID structure
- **Entity Type Validation**: Verifies entity type is supported
- **GUID Validation**: Confirms UUID format is correct
- **Case Insensitivity**: Handles both uppercase and lowercase formats

```javascript
// Regex pattern for validation
const depaIdPattern = /^(TDC|TDP|CCRP|CONTRACT)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validation function
validateDEPAId(depaId) {
  if (!depaId || typeof depaId !== 'string') {
    return false;
  }
  return this.depaIdPattern.test(depaId);
}
```

### 2. Database Uniqueness Constraints

Database-level uniqueness constraints provide the foundation for ensuring that no duplicate identifiers can exist in the system. These constraints are enforced at the database level, providing reliability even if application-level validation fails.

#### 2.1 User Table Constraints

The users table implements multiple uniqueness constraints to ensure that each user has unique identifiers across all identity types. This prevents conflicts and ensures proper user identification.

The constraints provide:
- **Email Uniqueness**: Ensures no duplicate email addresses
- **Wallet Address Uniqueness**: Prevents duplicate blockchain addresses
- **DID Uniqueness**: Ensures unique decentralized identifiers
- **DEPA ID Uniqueness**: Guarantees unique system identifiers
- **IAM User ID Uniqueness**: Prevents conflicts with enterprise systems

```sql
-- Email uniqueness
email VARCHAR(255) UNIQUE NOT NULL

-- Wallet address uniqueness (when not null)
walletAddress VARCHAR(255) UNIQUE,
-- Index with WHERE clause for non-null values
CREATE UNIQUE INDEX idx_wallet_address_unique 
ON users(walletAddress) WHERE walletAddress IS NOT NULL;

-- DID uniqueness
did VARCHAR(255) UNIQUE

-- DEPA ID uniqueness
depaId VARCHAR(255) UNIQUE NOT NULL

-- IAM user ID uniqueness
iamUserId VARCHAR(255) UNIQUE
```

#### 2.2 Composite Uniqueness

Composite uniqueness ensures that combinations of fields maintain uniqueness while allowing individual fields to have some flexibility. This is particularly important for fields that may be null or optional.

The composite approach provides:
- **Flexibility**: Handles optional fields gracefully
- **Performance**: Optimized indexes for fast lookups
- **Reliability**: Database-level enforcement
- **Scalability**: Efficient for large datasets

```javascript
// User model indexes for performance and uniqueness
indexes: [
  {
    unique: true,
    fields: ['walletAddress'],
    where: { walletAddress: { [Sequelize.Op.ne]: null } }
  },
  {
    unique: true,
    fields: ['iamUserId']
  },
  {
    unique: true,
    fields: ['did']
  },
  {
    unique: true,
    fields: ['depaId']
  }
]
```

### 3. DID-Based Uniqueness

Decentralized Identifiers (DIDs) provide an additional layer of uniqueness through their inherent global uniqueness properties. The system validates DID availability and ensures no conflicts exist.

#### 3.1 DID Resolution and Validation

DID resolution and validation ensures that DIDs are properly formatted, resolvable, and available for use in the system. This process includes checking both local system state and external DID document availability.

The validation process includes:
- **Local Availability Check**: Verifies DID isn't already registered
- **DID Document Resolution**: Checks external DID document availability
- **Format Validation**: Ensures proper DID format
- **Error Handling**: Graceful handling of resolution failures

```javascript
// DID availability check
async isDIDAvailable(did) {
  // Check if DID is already registered
  const existingUser = await db.User.findOne({ where: { did } });
  
  if (existingUser) {
    return {
      available: false,
      message: 'DID is already registered'
    };
  }
  
  // For did:web, check if DID document exists
  if (did.startsWith('did:web:')) {
    const domain = did.replace('did:web:', '').split(':')[0];
    const didDocumentUrl = `https://${domain}/.well-known/did.json`;
    
    try {
      const response = await fetch(didDocumentUrl);
      return {
        available: response.ok,
        message: response.ok ? 'DID is available' : 'DID document not found'
      };
    } catch (error) {
      return {
        available: false,
        message: 'Failed to verify DID document'
      };
    }
  }
  
  return { available: true, message: 'DID is available' };
}
```

---

## Dataset and CCRP Infrastructure Management with DEPA IDs

This section covers how datasets and CCRP (Confidential Clean Room Provider) infrastructure are managed with globally unique DEPA IDs. Each dataset and infrastructure component receives a unique identifier that ensures traceability, ownership verification, and compliance across the entire system.

### 1. Dataset Identity Management

Datasets are critical assets in the contract management system that represent training data provided by TDPs (Training Data Providers). Each dataset must have a globally unique identifier to ensure proper ownership tracking, licensing compliance, and audit trails.

#### 1.1 Dataset DEPA ID Generation

When a TDP creates a dataset, the system automatically generates a unique DEPA ID that follows the format `DATASET-[GUID]`. This identifier is immutable and serves as the primary reference for all dataset-related operations including licensing, access control, and audit logging.

The generation process ensures:
- **Uniqueness**: Each dataset receives a globally unique identifier
- **Immutability**: Once assigned, the DEPA ID cannot be changed
- **Traceability**: All dataset operations are linked to this identifier
- **Compliance**: Supports regulatory requirements for data tracking

```javascript
// Dataset creation with DEPA ID
const createDataset = async (datasetData) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // Generate unique DEPA ID for dataset
    const DEPAIdService = require('../services/depaIdService');
    const depaIdService = new DEPAIdService();
    const depaId = depaIdService.generateDEPAId('DATASET');
    
    // Create dataset with DEPA ID
    const dataset = await db.Dataset.create({
      datasetId: datasetData.datasetId,
      name: datasetData.name,
      description: datasetData.description,
      category: datasetData.category,
      size: datasetData.size,
      recordCount: datasetData.recordCount,
      price: datasetData.price,
      license: datasetData.license,
      tags: datasetData.tags || [],
      metadata: datasetData.metadata || {},
      isPublic: datasetData.isPublic !== undefined ? datasetData.isPublic : true,
      ownerId: datasetData.ownerId,
      depaId: depaId // Global unique DEPA ID
    }, { transaction });
    
    await transaction.commit();
    return dataset;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

#### 1.2 Dataset DEPA ID Format

The dataset DEPA ID follows a standardized format that includes the entity type prefix and a globally unique identifier:

```
DATASET-[GUID]
Examples:
- DATASET-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
- DATASET-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
```

This format ensures that:
- All dataset identifiers are clearly distinguishable from other entity types
- The GUID component provides global uniqueness
- The format is consistent across all system deployments

#### 1.3 Dataset Uniqueness Guarantee

The system implements multiple layers of uniqueness guarantees to ensure that no two datasets can have the same DEPA ID. This is critical for maintaining data integrity, preventing conflicts, and ensuring proper audit trails.

The uniqueness is enforced through:
- **Database Constraints**: Unique constraints at the database level
- **Application Logic**: Validation during dataset creation
- **Transaction Isolation**: Atomic operations prevent race conditions
- **Collision Detection**: Retry mechanisms for rare collision scenarios

```javascript
// Database constraints for dataset uniqueness
const datasetConstraints = {
  // Primary dataset identifier
  datasetId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  
  // Global unique DEPA ID
  depaId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  }
};

// Indexes for performance
indexes: [
  {
    unique: true,
    fields: ['datasetId']
  },
  {
    unique: true,
    fields: ['depaId']
  },
  {
    fields: ['category']
  },
  {
    fields: ['ownerId']
  }
]
```

### 2. CCRP Infrastructure and Environment Management

CCRP (Confidential Clean Room Provider) infrastructure represents the cloud-based computing environments where AI training occurs. Each environment must be uniquely identified to ensure proper resource management, security controls, and cost tracking across multiple cloud providers.

#### 2.1 Training Environment DEPA ID Generation

Training environments are complex infrastructure deployments that include compute resources, storage systems, networking components, and security controls. Each environment receives a unique DEPA ID that tracks its entire lifecycle from creation to destruction.

The environment DEPA ID serves multiple purposes:
- **Resource Tracking**: Links all cloud resources to a specific environment
- **Cost Management**: Enables detailed cost analysis per environment
- **Security Auditing**: Provides audit trail for all environment activities
- **Compliance**: Supports regulatory requirements for infrastructure management

```javascript
// Training environment creation with DEPA ID
const createTrainingEnvironment = async (contractId, config) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // Generate unique environment ID
    const environmentId = `env-${contractId}-${Date.now()}`;
    
    // Generate DEPA ID for environment
    const DEPAIdService = require('../services/depaIdService');
    const depaIdService = new DEPAIdService();
    const depaId = depaIdService.generateDEPAId('ENVIRONMENT');
    
    // Create training environment with DEPA ID
    const trainingEnvironment = await db.TrainingEnvironment.create({
      contractId,
      environmentId,
      depaId: depaId, // Global unique DEPA ID
      cloudProvider: config.cloudProvider,
      region: config.region,
      status: 'PENDING',
      infrastructureConfig: config.infrastructure,
      securityConfig: config.security,
      monitoringConfig: config.monitoring,
      costEstimate: config.costEstimate,
      createdBy: config.createdBy
    }, { transaction });
    
    await transaction.commit();
    return trainingEnvironment;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

#### 2.2 Environment DEPA ID Format

Training environment DEPA IDs follow a specific format that distinguishes them from other entity types:

```
ENVIRONMENT-[GUID]
Examples:
- ENVIRONMENT-1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e
- ENVIRONMENT-2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f
```

This format provides:
- **Clear Identification**: Immediately recognizable as environment entities
- **Global Uniqueness**: GUID ensures no collisions across deployments
- **Consistency**: Same format across all cloud providers and regions

#### 2.3 CCRP Infrastructure Resources

Individual cloud resources within an environment (compute instances, storage buckets, databases, etc.) also receive unique DEPA IDs. This enables granular tracking of resource usage, cost allocation, and security monitoring.

Resource DEPA IDs support:
- **Resource Lifecycle Management**: Track creation, modification, and destruction
- **Cost Attribution**: Link costs to specific resources
- **Security Monitoring**: Monitor access patterns and security events
- **Compliance Reporting**: Generate detailed compliance reports

```javascript
// Environment resource management with DEPA IDs
const createEnvironmentResource = async (environmentId, resourceData) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // Generate DEPA ID for resource
    const DEPAIdService = require('../services/depaIdService');
    const depaIdService = new DEPAIdService();
    const depaId = depaIdService.generateDEPAId('RESOURCE');
    
    // Create resource with DEPA ID
    const resource = await db.EnvironmentResource.create({
      environmentId,
      depaId: depaId, // Global unique DEPA ID
      resourceType: resourceData.type,
      resourceId: resourceData.cloudResourceId,
      resourceName: resourceData.name,
      resourceConfig: resourceData.config,
      status: 'PENDING'
    }, { transaction });
    
    await transaction.commit();
    return resource;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

#### 2.4 Resource DEPA ID Format

Individual resource DEPA IDs follow this format:

```
RESOURCE-[GUID]
Examples:
- RESOURCE-3c4d5e6f-7a8b-9c0d-0e1f-2a3b4c5d6e7f
- RESOURCE-4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a
```

This enables:
- **Granular Tracking**: Each resource has its own unique identifier
- **Hierarchical Organization**: Resources are linked to environments
- **Detailed Auditing**: Complete audit trail for each resource

### 3. Global Uniqueness Guarantee During Onboarding

The onboarding process is critical for establishing user identities and associated entities with guaranteed global uniqueness. This process ensures that all entities created during onboarding have unique DEPA IDs that can be trusted across the entire system.

#### 3.1 Transaction-Based DEPA ID Assignment

Onboarding uses database transactions to ensure atomic operations that guarantee uniqueness. If any step fails, the entire process is rolled back, preventing partial states that could lead to conflicts.

The transaction-based approach provides:
- **Atomicity**: All operations succeed or fail together
- **Consistency**: Database remains in a valid state
- **Isolation**: Concurrent onboarding processes don't interfere
- **Durability**: Changes are permanent once committed

```javascript
// Onboarding process with guaranteed uniqueness
const onboardUser = async (userData) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // Step 1: Generate DEPA ID
    const DEPAIdService = require('../services/depaIdService');
    const depaIdService = new DEPAIdService();
    const depaId = depaIdService.generateUserDEPAId(userData.partyType);
    
    // Step 2: Verify DEPA ID uniqueness in transaction
    const existingUser = await db.User.findOne({
      where: { depaId },
      transaction
    });
    
    if (existingUser) {
      throw new Error('DEPA ID collision detected - retry required');
    }
    
    // Step 3: Create user with DEPA ID
    const user = await db.User.create({
      ...userData,
      depaId: depaId
    }, { transaction });
    
    // Step 4: Create associated entities with DEPA IDs
    if (userData.partyType === 'TDP') {
      // Create default dataset with DEPA ID
      const datasetDEPAId = depaIdService.generateDEPAId('DATASET');
      await db.Dataset.create({
        datasetId: `dataset-${user.id}`,
        name: 'Default Dataset',
        description: 'Default dataset created during onboarding',
        category: 'Tabular',
        size: 0,
        recordCount: 0,
        price: 0.00,
        license: 'MIT',
        ownerId: user.id,
        depaId: datasetDEPAId
      }, { transaction });
    }
    
    if (userData.partyType === 'CCRP') {
      // Create default infrastructure configuration
      const infrastructureDEPAId = depaIdService.generateDEPAId('INFRASTRUCTURE');
      await db.CCRPInfrastructure.create({
        ccrpUserId: user.id,
        depaId: infrastructureDEPAId,
        cloudProviders: ['AWS', 'Azure', 'GCP'],
        defaultRegion: 'us-east-1',
        isActive: true
      }, { transaction });
    }
    
    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

#### 3.2 DEPA ID Collision Prevention

Despite the extremely low probability of UUID collisions, the system implements robust collision detection and retry mechanisms to handle any potential conflicts.

The collision prevention system includes:
- **Retry Logic**: Multiple attempts with different UUIDs
- **Database Verification**: Check for existing DEPA IDs before assignment
- **Logging**: Detailed logs for collision detection and resolution
- **Alerting**: Notifications for unusual collision patterns

```javascript
// DEPA ID service with collision detection
class DEPAIdService {
  async generateUniqueDEPAId(entityType, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const depaId = this.generateDEPAId(entityType);
      
      // Check uniqueness in database
      const existing = await db.sequelize.query(
        `SELECT id FROM ${this.getTableName(entityType)} WHERE "depaId" = :depaId`,
        {
          replacements: { depaId },
          type: db.sequelize.QueryTypes.SELECT
        }
      );
      
      if (existing.length === 0) {
        return depaId;
      }
      
      console.log(`⚠️ DEPA ID collision detected on attempt ${attempt}, retrying...`);
    }
    
    throw new Error(`Failed to generate unique DEPA ID after ${maxRetries} attempts`);
  }
  
  getTableName(entityType) {
    const tableMap = {
      'TDC': 'users',
      'TDP': 'users',
      'CCRP': 'users',
      'CONTRACT': 'contracts',
      'DATASET': 'datasets',
      'ENVIRONMENT': 'training_environments',
      'RESOURCE': 'environment_resources'
    };
    return tableMap[entityType];
  }
}
```

#### 3.3 Database-Level Uniqueness Constraints

The database schema enforces uniqueness at multiple levels to prevent any possibility of duplicate DEPA IDs:

```sql
-- Users table
ALTER TABLE users ADD CONSTRAINT unique_user_depa_id UNIQUE ("depaId");

-- Datasets table
ALTER TABLE datasets ADD CONSTRAINT unique_dataset_depa_id UNIQUE ("depaId");

-- Contracts table
ALTER TABLE contracts ADD CONSTRAINT unique_contract_depa_id UNIQUE ("depaId");

-- Training environments table
ALTER TABLE training_environments ADD CONSTRAINT unique_environment_depa_id UNIQUE ("depaId");

-- Environment resources table
ALTER TABLE environment_resources ADD CONSTRAINT unique_resource_depa_id UNIQUE ("depaId");
```

These constraints provide:
- **Database-Level Enforcement**: Prevents duplicate DEPA IDs at the database level
- **Application Independence**: Works regardless of application logic
- **Performance**: Indexed for fast uniqueness checks
- **Reliability**: Database guarantees uniqueness even during concurrent operations

### 4. CCRP Infrastructure and Environment Functions

CCRP infrastructure management involves complex operations for provisioning, monitoring, and managing cloud-based training environments. Each operation is tracked with DEPA IDs to ensure proper audit trails and compliance.

#### 4.1 Infrastructure Provisioning

Infrastructure provisioning creates the cloud resources needed for AI training. This process involves multiple cloud providers, complex resource configurations, and security controls.

The provisioning process includes:
- **Resource Planning**: Determine required compute, storage, and networking resources
- **Security Configuration**: Set up encryption, access controls, and monitoring
- **Cost Estimation**: Calculate expected costs for the infrastructure
- **Compliance Verification**: Ensure infrastructure meets regulatory requirements

```javascript
// CCRP infrastructure provisioning with DEPA IDs
const provisionCCRPInfrastructure = async (ccrpUserId, config) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // Generate infrastructure DEPA ID
    const DEPAIdService = require('../services/depaIdService');
    const depaIdService = new DEPAIdService();
    const infrastructureDEPAId = depaIdService.generateDEPAId('INFRASTRUCTURE');
    
    // Create infrastructure configuration
    const infrastructure = await db.CCRPInfrastructure.create({
      ccrpUserId,
      depaId: infrastructureDEPAId,
      cloudProviders: config.cloudProviders,
      defaultRegion: config.defaultRegion,
      securityConfig: config.security,
      monitoringConfig: config.monitoring,
      costEstimate: config.costEstimate,
      isActive: true
    }, { transaction });
    
    // Provision cloud resources
    const cloudProvider = config.cloudProviders[0];
    const provider = getCloudProvider(cloudProvider);
    
    const provisionResult = await provider.provisionInfrastructure(
      infrastructureDEPAId,
      config.resources,
      config.security,
      config.monitoring
    );
    
    // Update infrastructure with provisioned resources
    await infrastructure.update({
      status: 'ACTIVE',
      provisionedResources: provisionResult.resources,
      actualCost: provisionResult.cost
    }, { transaction });
    
    await transaction.commit();
    return infrastructure;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

#### 4.2 Environment Management

Training environment management involves the complete lifecycle of environments from creation to destruction. Each operation is tracked with DEPA IDs for audit and compliance purposes.

Environment management includes:
- **Lifecycle Operations**: Start, stop, pause, and destroy environments
- **Resource Monitoring**: Track resource usage and performance
- **Cost Management**: Monitor and optimize costs
- **Security Auditing**: Track all access and modifications

```javascript
// Training environment lifecycle with DEPA IDs
const manageTrainingEnvironment = async (environmentDEPAId, action) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const environment = await db.TrainingEnvironment.findOne({
      where: { depaId: environmentDEPAId }
    });
    
    if (!environment) {
      throw new Error('Environment not found');
    }
    
    switch (action) {
      case 'START':
        await environment.update({ status: 'RUNNING' }, { transaction });
        break;
        
      case 'STOP':
        await environment.update({ status: 'ACTIVE' }, { transaction });
        break;
        
      case 'DESTROY':
        await environment.update({ status: 'DESTROYING' }, { transaction });
        
        // Destroy cloud resources
        const provider = getCloudProvider(environment.cloudProvider);
        await provider.destroyInfrastructure(environmentDEPAId);
        
        await environment.update({ status: 'DESTROYED' }, { transaction });
        break;
    }
    
    await transaction.commit();
    return environment;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

### 5. Onboarding Uniqueness Guarantee Process

The onboarding process ensures that all users and their associated entities receive globally unique DEPA IDs. This process is critical for maintaining system integrity and supporting compliance requirements.

#### 5.1 Multi-Step Onboarding with DEPA IDs

Onboarding follows a structured process that creates users and their associated entities with guaranteed uniqueness. Each step is validated and can be rolled back if any issues occur.

The onboarding process includes:
- **User Creation**: Create user account with unique DEPA ID
- **Entity Creation**: Create party-specific entities (datasets for TDPs, infrastructure for CCRPs)
- **Verification**: Verify all entities were created successfully
- **Completion**: Mark onboarding as complete

```javascript
// Complete onboarding process with uniqueness guarantee
const completeOnboarding = async (userData) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // Step 1: Generate user DEPA ID
    const depaIdService = new DEPAIdService();
    const userDEPAId = await depaIdService.generateUniqueDEPAId(
      userData.partyType, 
      5 // max retries
    );
    
    // Step 2: Create user with DEPA ID
    const user = await db.User.create({
      ...userData,
      depaId: userDEPAId,
      onboardingStatus: 'IN_PROGRESS'
    }, { transaction });
    
    // Step 3: Create party-specific entities with DEPA IDs
    if (userData.partyType === 'TDP') {
      // Create default dataset
      const datasetDEPAId = await depaIdService.generateUniqueDEPAId('DATASET');
      await db.Dataset.create({
        datasetId: `dataset-${user.id}`,
        name: 'Default Dataset',
        description: 'Default dataset for TDP onboarding',
        category: 'Tabular',
        size: 0,
        recordCount: 0,
        price: 0.00,
        license: 'MIT',
        ownerId: user.id,
        depaId: datasetDEPAId
      }, { transaction });
    }
    
    if (userData.partyType === 'CCRP') {
      // Create infrastructure configuration
      const infrastructureDEPAId = await depaIdService.generateUniqueDEPAId('INFRASTRUCTURE');
      await db.CCRPInfrastructure.create({
        ccrpUserId: user.id,
        depaId: infrastructureDEPAId,
        cloudProviders: ['AWS', 'Azure', 'GCP'],
        defaultRegion: 'us-east-1',
        isActive: true
      }, { transaction });
    }
    
    // Step 4: Update onboarding status
    await user.update({
      onboardingStatus: 'COMPLETED',
      profileCompleted: true
    }, { transaction });
    
    await transaction.commit();
    
    return {
      user,
      depaId: userDEPAId,
      onboardingComplete: true
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

#### 5.2 Onboarding Verification

After onboarding completion, the system verifies that all entities were created successfully and have unique DEPA IDs. This verification ensures data integrity and supports compliance requirements.

The verification process includes:
- **Entity Count Verification**: Ensure all expected entities were created
- **DEPA ID Validation**: Verify all DEPA IDs are unique and properly formatted
- **Relationship Verification**: Confirm all relationships between entities are correct
- **Status Verification**: Ensure all entities are in the correct state

```javascript
// Verify onboarding completion with DEPA IDs
const verifyOnboarding = async (userId) => {
  const user = await db.User.findByPk(userId, {
    include: [
      { model: db.Dataset, as: 'datasets' },
      { model: db.CCRPInfrastructure, as: 'infrastructure' }
    ]
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const verification = {
    userDEPAId: user.depaId,
    onboardingStatus: user.onboardingStatus,
    profileCompleted: user.profileCompleted,
    entities: []
  };
  
  // Verify TDP entities
  if (user.partyType === 'TDP' && user.datasets) {
    verification.entities.push({
      type: 'DATASET',
      count: user.datasets.length,
      depaIds: user.datasets.map(d => d.depaId)
    });
  }
  
  // Verify CCRP entities
  if (user.partyType === 'CCRP' && user.infrastructure) {
    verification.entities.push({
      type: 'INFRASTRUCTURE',
      count: user.infrastructure.length,
      depaIds: user.infrastructure.map(i => i.depaId)
    });
  }
  
  return verification;
};
```

---

## Global DEPA ID Uniqueness Across Multiple Deployments

### 1. Multi-Deployment Uniqueness Strategy

The contract management system is designed to be deployed across multiple countries and jurisdictions worldwide. Ensuring DEPA ID uniqueness across all deployments is critical for maintaining system integrity, supporting cross-border operations, and meeting regulatory requirements.

#### 1.1 Deployment-Specific DEPA ID Prefixes

To guarantee global uniqueness across multiple deployments, the system implements deployment-specific prefixes that are combined with the standard DEPA ID format:

```
[DEPLOYMENT_PREFIX]-[ENTITY_TYPE]-[GUID]
Examples:
- US-EAST-TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
- EU-WEST-TDP-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
- AP-SOUTH-CCRP-1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e
- CA-CENTRAL-CONTRACT-2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f
```

This approach provides:
- **Global Uniqueness**: Deployment prefixes prevent collisions across regions
- **Geographic Identification**: Easy identification of deployment location
- **Regulatory Compliance**: Supports jurisdiction-specific requirements
- **Audit Trail**: Complete traceability across all deployments

#### 1.2 Deployment Configuration Management

Each deployment has a unique configuration that includes its geographic identifier, regulatory requirements, and operational parameters:

```javascript
// Deployment configuration with geographic and regulatory settings
const deploymentConfig = {
  deploymentId: 'US-EAST',
  region: 'us-east-1',
  country: 'United States',
  jurisdiction: 'US-Federal',
  dataResidency: 'US',
  regulatoryFramework: ['GDPR', 'CCPA', 'HIPAA'],
  depaIdPrefix: 'US-EAST',
  timezone: 'America/New_York',
  currency: 'USD',
  language: 'en-US'
};

// Enhanced DEPA ID service with deployment awareness
class GlobalDEPAIdService {
  constructor(deploymentConfig) {
    this.deploymentConfig = deploymentConfig;
    this.deploymentPrefix = deploymentConfig.depaIdPrefix;
  }
  
  generateGlobalDEPAId(entityType) {
    const guid = uuidv4();
    return `${this.deploymentPrefix}-${entityType}-${guid}`;
  }
  
  validateGlobalDEPAId(depaId) {
    const pattern = /^[A-Z-]+-[A-Z]+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return pattern.test(depaId);
  }
  
  extractDeploymentInfo(depaId) {
    const parts = depaId.split('-');
    return {
      deploymentPrefix: parts[0],
      entityType: parts[1],
      guid: parts.slice(2).join('-')
    };
  }
}
```

#### 1.3 Cross-Deployment Registry

A global registry maintains information about all deployments and their DEPA ID prefixes to prevent conflicts and enable cross-deployment operations:

```javascript
// Global deployment registry
const globalDeploymentRegistry = {
  deployments: [
    {
      deploymentId: 'US-EAST',
      prefix: 'US-EAST',
      region: 'us-east-1',
      country: 'United States',
      status: 'ACTIVE',
      registeredAt: '2024-01-15T10:00:00Z'
    },
    {
      deploymentId: 'EU-WEST',
      prefix: 'EU-WEST',
      region: 'eu-west-1',
      country: 'Germany',
      status: 'ACTIVE',
      registeredAt: '2024-01-20T14:30:00Z'
    },
    {
      deploymentId: 'AP-SOUTH',
      prefix: 'AP-SOUTH',
      region: 'ap-south-1',
      country: 'Singapore',
      status: 'ACTIVE',
      registeredAt: '2024-02-01T09:15:00Z'
    }
  ],
  
  validateDeploymentPrefix(prefix) {
    const existing = this.deployments.find(d => d.prefix === prefix);
    return !existing;
  },
  
  registerDeployment(deploymentInfo) {
    if (!this.validateDeploymentPrefix(deploymentInfo.prefix)) {
      throw new Error(`Deployment prefix ${deploymentInfo.prefix} already exists`);
    }
    
    this.deployments.push({
      ...deploymentInfo,
      registeredAt: new Date().toISOString()
    });
  }
};
```

#### 1.4 Jurisdiction-Specific Compliance

Different jurisdictions have varying regulatory requirements for data handling, privacy, and cross-border operations. The system supports jurisdiction-specific configurations:

```javascript
// Jurisdiction-specific DEPA ID handling
const jurisdictionConfigs = {
  'US-Federal': {
    dataResidency: 'US',
    encryptionStandards: ['AES-256', 'FIPS-140-2'],
    auditRequirements: ['SOX', 'FedRAMP'],
    depaIdFormat: 'US-[REGION]-[ENTITY_TYPE]-[GUID]'
  },
  'EU-GDPR': {
    dataResidency: 'EU',
    encryptionStandards: ['AES-256', 'GDPR-Article-32'],
    auditRequirements: ['GDPR', 'ISO-27001'],
    depaIdFormat: 'EU-[REGION]-[ENTITY_TYPE]-[GUID]'
  },
  'AP-Singapore': {
    dataResidency: 'Singapore',
    encryptionStandards: ['AES-256', 'MAS-TRM'],
    auditRequirements: ['PDPA', 'ISO-27001'],
    depaIdFormat: 'AP-[REGION]-[ENTITY_TYPE]-[GUID]'
  }
};

// Jurisdiction-aware DEPA ID generation
const generateJurisdictionCompliantDEPAId = (entityType, jurisdiction) => {
  const config = jurisdictionConfigs[jurisdiction];
  if (!config) {
    throw new Error(`Unsupported jurisdiction: ${jurisdiction}`);
  }
  
  const guid = uuidv4();
  const region = getCurrentRegion();
  return config.depaIdFormat
    .replace('[REGION]', region)
    .replace('[ENTITY_TYPE]', entityType)
    .replace('[GUID]', guid);
};
```

#### 1.5 Cross-Deployment Data Exchange

When entities need to be referenced across deployments (e.g., for cross-border contracts), the system uses the full global DEPA ID to ensure uniqueness:

```javascript
// Cross-deployment entity reference
const crossDeploymentReference = {
  sourceDeployment: 'US-EAST',
  targetDeployment: 'EU-WEST',
  entityType: 'CONTRACT',
  globalDEPAId: 'US-EAST-CONTRACT-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
  referenceType: 'CROSS_BORDER_CONTRACT',
  complianceStatus: 'APPROVED',
  dataTransferAgreement: 'DTA-2024-001'
};

// Cross-deployment validation
const validateCrossDeploymentReference = (reference) => {
  const sourceConfig = getDeploymentConfig(reference.sourceDeployment);
  const targetConfig = getDeploymentConfig(reference.targetDeployment);
  
  // Check data residency compliance
  const dataResidencyCompliant = checkDataResidencyCompliance(
    sourceConfig.dataResidency,
    targetConfig.dataResidency,
    reference.entityType
  );
  
  // Check regulatory compliance
  const regulatoryCompliant = checkRegulatoryCompliance(
    sourceConfig.regulatoryFramework,
    targetConfig.regulatoryFramework,
    reference.referenceType
  );
  
  return {
    isValid: dataResidencyCompliant && regulatoryCompliant,
    dataResidencyCompliant,
    regulatoryCompliant,
    complianceDetails: {
      dataResidency: dataResidencyCompliant,
      regulatory: regulatoryCompliant
    }
  };
};
```

#### 1.6 Global Uniqueness Verification

The system implements verification mechanisms to ensure DEPA ID uniqueness across all deployments:

```javascript
// Global uniqueness verification service
class GlobalUniquenessVerificationService {
  async verifyGlobalUniqueness(depaId, entityType) {
    // Check local deployment
    const localExists = await this.checkLocalDeployment(depaId);
    if (localExists) {
      return { unique: false, reason: 'Exists in local deployment' };
    }
    
    // Check global registry
    const globalExists = await this.checkGlobalRegistry(depaId);
    if (globalExists) {
      return { unique: false, reason: 'Exists in global registry' };
    }
    
    // Check cross-deployment references
    const crossDeploymentExists = await this.checkCrossDeploymentReferences(depaId);
    if (crossDeploymentExists) {
      return { unique: false, reason: 'Exists in cross-deployment reference' };
    }
    
    return { unique: true, reason: 'Verified globally unique' };
  }
  
  async checkLocalDeployment(depaId) {
    // Check local database for existing DEPA ID
    const existing = await db.sequelize.query(
      'SELECT id FROM users WHERE "depaId" = :depaId UNION SELECT id FROM contracts WHERE "depaId" = :depaId UNION SELECT id FROM datasets WHERE "depaId" = :depaId',
      {
        replacements: { depaId },
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    return existing.length > 0;
  }
  
  async checkGlobalRegistry(depaId) {
    // Check global deployment registry
    const registryResponse = await fetch(`${GLOBAL_REGISTRY_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depaId })
    });
    
    const result = await registryResponse.json();
    return result.exists;
  }
  
  async checkCrossDeploymentReferences(depaId) {
    // Check cross-deployment reference table
    const existing = await db.CrossDeploymentReference.findOne({
      where: { globalDEPAId: depaId }
    });
    
    return !!existing;
  }
}
```

This comprehensive approach ensures that DEPA IDs remain globally unique across all deployments worldwide, supporting cross-border operations while maintaining compliance with jurisdiction-specific regulatory requirements.

---

## Authentication Methods

### 1. JWT Token Authentication

#### 1.1 Token Structure
```json
{
  "id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "partyType": "TDP|TDC|CCRP|AppAdmin",
  "iat": "issued_at_timestamp",
  "exp": "expiration_timestamp"
}
```

#### 1.2 Token Validation
```javascript
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      return res.status(401).json({ 
        error: 'Token has been invalidated',
        code: 'TOKEN_BLACKLISTED'
      });
    }

    // Validate with Keycloak
    const validationResult = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.validateToken(token);
    
    if (validationResult.valid) {
      // Find user by iamUsername
      const user = await db.User.findOne({ 
        where: { 
          iamUsername: validationResult.user.username,
          isActive: true 
        } 
      });

      req.user = {
        ...validationResult.user,
        localUser: user,
        token: token,
        authType: '***REMOVED-KEYCLOAK_DB_PASSWORD***'
      };

      return next();
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};
```

### 2. Keycloak Integration

#### 2.1 Keycloak Service
```javascript
class KeycloakService {
  async authenticateUserWithPassword(username, password) {
    const response = await axios.post(
      `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`,
      `grant_type=password&client_id=${this.clientId}&client_secret=${this.clientSecret}&username=${username}&password=${password}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    return response.data;
  }

  async validateToken(token) {
    // Decode JWT token to get user information
    const tokenParts = token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    const userInfo = {
      email: payload.email,
      username: payload.preferred_username,
      name: payload.name,
      partyType: payload.partyType,
      dbUserId: payload.sub
    };

    return {
      valid: true,
      user: userInfo
    };
  }
}
```

### 3. DID-Based Authentication

#### 3.1 DID Service
```javascript
class DIDService {
  constructor() {
    this.supportedMethods = ['did:web', 'did:key', 'did:ion'];
  }

  validateDIDFormat(did) {
    if (!did || typeof did !== 'string') {
      return false;
    }
    
    const didRegex = /^did:[a-z0-9]+:[a-zA-Z0-9._%-]+$/;
    return didRegex.test(did);
  }

  async resolveDID(did) {
    if (did.startsWith('did:web:')) {
      return {
        id: did,
        '@context': 'https://www.w3.org/ns/did/v1',
        verificationMethod: [{
          id: `${did}#key-1`,
          type: 'Ed25519VerificationKey2018',
          controller: did,
          publicKeyBase58: 'mock-public-key'
        }]
      };
    }
    return null;
  }
}
```

---

## Authorization Framework

### 1. Role-Based Access Control (RBAC)

#### 1.1 Role Definition
```javascript
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = req.user.roles || [];
    const userPartyType = req.user.partyType;
    
    // Check if user has any of the required roles
    const hasRole = Array.isArray(roles) 
      ? roles.some(role => userRoles.includes(role) || userPartyType === role)
      : userRoles.includes(roles) || userPartyType === roles;

    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: userRoles
      });
    }

    next();
  };
};
```

#### 1.2 Role-Specific Middleware
```javascript
// Role-specific middleware
const requireTDP = requireRole('TDP');
const requireTDC = requireRole('TDC');
const requireCCRP = requireRole('CCRP');
const requireAdmin = requireRole('AppAdmin');
const requireAnyAdmin = requireRole(['AppAdmin', 'ADMIN']);
```

### 2. Permission Matrix

| Action | TDP | TDC | CCRP | AppAdmin |
|--------|-----|-----|------|----------|
| Create Dataset | ✅ | ❌ | ❌ | ✅ |
| Browse Datasets | ✅ | ✅ | ❌ | ✅ |
| Create Contract | ❌ | ✅ | ❌ | ✅ |
| Sign Contract | ✅ | ✅ | ❌ | ✅ |
| Complete Contract | ❌ | ❌ | ✅ | ✅ |
| Cancel Contract | ❌ | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | ✅ |
| System Configuration | ❌ | ❌ | ❌ | ✅ |

### 3. Resource-Based Authorization

#### 3.1 Contract Authorization
```javascript
// Check if user can access specific contract
const canAccessContract = (userId, contract, userPartyType) => {
  return (
    userPartyType === 'AppAdmin' ||
    contract.tdpId === userId ||
    contract.tdcId === userId ||
    contract.ccrpId === userId
  );
};

// Contract access middleware
const requireContractAccess = async (req, res, next) => {
  const { contractId } = req.params;
  const userId = req.user.localUser?.id;
  const userPartyType = req.user.localUser?.partyType;

  const contract = await db.Contract.findOne({ where: { contractId } });
  
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  if (!canAccessContract(userId, contract, userPartyType)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  req.contract = contract;
  next();
};
```

---

## Security Controls

### 1. Authentication Security

#### 1.1 Token Security
```javascript
// Token blacklisting
const tokenBlacklist = {
  blacklistedTokens: new Set(),
  
  blacklistToken(token) {
    this.blacklistedTokens.add(token);
  },
  
  isBlacklisted(token) {
    return this.blacklistedTokens.has(token);
  }
};
```

#### 1.2 Rate Limiting
```javascript
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
```

#### 1.3 Password Security
```javascript
// Password validation
const validatePassword = (password) => {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  // Additional validation rules
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    throw new Error('Password must contain uppercase, lowercase, number, and special character');
  }
};
```

### 2. Authorization Security

#### 2.1 Session Management
```javascript
// Session timeout
const sessionTimeout = 4 * 60 * 60 * 1000; // 4 hours

// Auto-logout on inactivity
const checkSessionTimeout = (lastActivity) => {
  const now = Date.now();
  return (now - lastActivity) > sessionTimeout;
};
```

#### 2.2 Input Validation
```javascript
// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Wallet address validation
const validateWalletAddress = (address) => {
  return ethers.isAddress(address);
};
```

### 3. Data Protection

#### 3.1 Encryption
```javascript
// Password hashing
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Password verification
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

#### 3.2 Data Sanitization
```javascript
// Input sanitization
const sanitizeInput = (input) => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
};
```

---

## Audit and Compliance

### 1. Audit Logging

#### 1.1 Audit Service
```javascript
class AuditService {
  async logEvent(eventType, eventData, userId = null, ipAddress = null, userAgent = null) {
    try {
      const auditLog = await this.db.models.AuditLog.create({
        eventType,
        eventData: JSON.stringify(eventData),
        userId,
        ipAddress,
        userAgent,
        timestamp: new Date()
      });

      console.log(`📝 Audit event logged: ${eventType} for user ${userId || 'system'}`);
      return auditLog;
    } catch (error) {
      console.error('❌ Error logging audit event:', error);
      return null;
    }
  }

  async logSecurityEvent(eventType, userId, details, ipAddress = null, userAgent = null) {
    return this.logEvent(`SECURITY_${eventType.toUpperCase()}`, {
      details,
      timestamp: new Date()
    }, userId, ipAddress, userAgent);
  }
}
```

#### 1.2 Audit Log Structure
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "userId": "user_id",
  "action": "CONTRACT_SIGNED",
  "resource": "contract_id",
  "details": {
    "did": "did:web:example.com",
    "signature": "signature_hash",
    "partyType": "TDP"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "session_id"
}
```

### 2. Compliance Features

#### 2.1 DPDP Compliance
```javascript
// DPDP consent management
const dpdpService = {
  async recordConsent(userId, consentType, purpose, legalBasis) {
    await db.Consent.create({
      userId,
      consentType,
      purpose,
      legalBasis,
      granted: true,
      timestamp: new Date()
    });
  },

  async withdrawConsent(userId, consentType) {
    await db.Consent.update(
      { granted: false, withdrawnAt: new Date() },
      { where: { userId, consentType, granted: true } }
    );
  }
};
```

#### 2.2 GDPR Compliance
```javascript
// GDPR data export
const exportUserData = async (userId) => {
  const user = await db.User.findByPk(userId);
  const contracts = await db.Contract.findAll({ where: { tdcId: userId } });
  const datasets = await db.Dataset.findAll({ where: { ownerId: userId } });
  
  return {
    user: user.toJSON(),
    contracts: contracts.map(c => c.toJSON()),
    datasets: datasets.map(d => d.toJSON()),
    exportDate: new Date().toISOString()
  };
};
```

### 3. Security Monitoring

#### 3.1 Authentication Monitoring
```javascript
// Login attempt monitoring
const logAuthEvent = (eventType) => {
  return (req, res, next) => {
    const auditService = new AuditService();
    
    auditService.logSecurityEvent(eventType, req.user?.id, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    });
    
    next();
  };
};
```

#### 3.2 Anomaly Detection
```javascript
// Failed login attempt tracking
const trackFailedLogins = async (email, ipAddress) => {
  const key = `failed_logins:${email}:${ipAddress}`;
  const attempts = await redis.incr(key);
  
  if (attempts > 5) {
    // Block for 15 minutes
    await redis.expire(key, 900);
    throw new Error('Too many failed login attempts');
  }
};
```

---

## Implementation Details

The implementation details section provides comprehensive information about the technical implementation of the IAM system, including database schemas, configuration settings, and middleware components.

### 1. Database Schema

The database schema is designed to support all IAM functionality while maintaining performance, security, and compliance requirements. Each table includes appropriate indexes, constraints, and audit fields.

#### 1.1 Users Table

The users table is the central repository for all user identity information. It supports multiple identity types, authentication methods, and compliance requirements while maintaining data integrity and performance.

The table design provides:
- **Multi-Identity Support**: Wallet addresses, DIDs, and enterprise IDs
- **Compliance Fields**: Audit trails and verification status
- **Performance Optimization**: Appropriate indexes for common queries
- **Security**: Encrypted fields and access controls
- **Flexibility**: Support for different user types and configurations

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  walletAddress VARCHAR(255) UNIQUE,
  publicKey TEXT,
  partyType ENUM('TDP', 'TDC', 'CCRP', 'AppAdmin') NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  description TEXT,
  organization VARCHAR(255),
  phoneNumber VARCHAR(50),
  website VARCHAR(255),
  location VARCHAR(255),
  isRegistered BOOLEAN DEFAULT FALSE,
  registrationDate TIMESTAMP,
  isActive BOOLEAN DEFAULT TRUE,
  onboardingStatus ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED') DEFAULT 'PENDING',
  profileCompleted BOOLEAN DEFAULT FALSE,
  emailVerified BOOLEAN DEFAULT FALSE,
  lastLoginAt TIMESTAMP,
  iamUserId VARCHAR(255) UNIQUE,
  iamUsername VARCHAR(255),
  did VARCHAR(255) UNIQUE,
  didSource ENUM('SYSTEM_GENERATED', 'USER_PROVIDED'),
  didVerified BOOLEAN DEFAULT FALSE,
  didVerificationMethod VARCHAR(100),
  depaId VARCHAR(255) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 1.2 Audit Logs Table

The audit logs table provides comprehensive tracking of all system activities for compliance, security monitoring, and troubleshooting purposes. Each log entry includes detailed information about the event, user, and outcome.

The audit system provides:
- **Comprehensive Tracking**: All system activities are logged
- **Compliance Support**: Meets regulatory audit requirements
- **Security Monitoring**: Enables threat detection and analysis
- **Troubleshooting**: Detailed information for issue resolution
- **Performance**: Optimized for high-volume logging

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  eventType VARCHAR(100) NOT NULL,
  eventData TEXT NOT NULL,
  userId INTEGER REFERENCES users(id),
  ipAddress VARCHAR(45),
  userAgent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sessionId VARCHAR(255),
  resourceType VARCHAR(100),
  resourceId VARCHAR(255),
  action VARCHAR(100),
  outcome ENUM('SUCCESS', 'FAILURE', 'PARTIAL'),
  errorMessage TEXT
);
```

### 2. Configuration

The configuration system supports different deployment environments and security requirements while maintaining flexibility for customization and compliance.

#### 2.1 Environment Variables

Environment variables provide secure configuration management that supports different deployment environments, security requirements, and compliance needs. The configuration is designed to be secure, flexible, and maintainable.

The configuration system provides:
- **Security**: Sensitive values are stored as environment variables
- **Flexibility**: Supports different deployment environments
- **Compliance**: Configurable settings for regulatory requirements
- **Performance**: Optimized settings for different workloads
- **Monitoring**: Configurable logging and monitoring settings

```env
# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-backend
KEYCLOAK_CLIENT_SECRET=your_client_secret_here
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=***REMOVED-KEYCLOAK_ADMIN_PASSWORD***
KEYCLOAK_ENABLED=true

# Security
SESSION_SECRET=your-super-secret-session-key-here
CORS_ORIGIN=https://app.company.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Middleware Stack

The middleware stack provides security, monitoring, and functionality layers that process all requests to the system. Each middleware component serves a specific purpose in the request processing pipeline.

#### 3.1 Authentication Middleware

Authentication middleware ensures that all protected routes require valid authentication and provides comprehensive logging of authentication attempts for security monitoring and compliance.

The authentication middleware provides:
- **Security**: Ensures all protected routes require authentication
- **Monitoring**: Comprehensive logging of authentication attempts
- **Rate Limiting**: Prevents brute force attacks
- **Session Management**: Proper session handling and cleanup
- **Error Handling**: Graceful handling of authentication failures

```javascript
// Authentication middleware stack
app.use('/api/auth', authRateLimit);
app.use('/api/auth', logAuthEvent('AUTH_ATTEMPT'));

// Protected routes
app.use('/api/contracts', authenticateToken);
app.use('/api/datasets', authenticateToken);
app.use('/api/users', authenticateToken);
```

#### 3.2 Authorization Middleware

Authorization middleware enforces role-based access control by ensuring that users can only access resources and perform actions appropriate to their role and permissions.

The authorization middleware provides:
- **Role-Based Access**: Enforces role-specific permissions
- **Resource Protection**: Prevents unauthorized access to resources
- **Granular Control**: Fine-grained permission management
- **Audit Trail**: Logs all authorization decisions
- **Error Handling**: Proper error responses for unauthorized access

```javascript
// Role-based route protection
app.get('/api/tdp/*', requireTDP);
app.get('/api/tdc/*', requireTDC);
app.get('/api/ccrp/*', requireCCRP);
app.get('/api/admin/*', requireAnyAdmin);
```

---

## API Specifications

The API specifications provide detailed information about all authentication and identity management endpoints, including request formats, response structures, and error handling.

### 1. Authentication Endpoints

Authentication endpoints handle user registration, login, token management, and profile operations. These endpoints are designed to be secure, compliant, and user-friendly.

#### 1.1 User Registration

The user registration endpoint creates new user accounts with comprehensive validation and setup. The process includes DID verification, DEPA ID generation, and enterprise integration.

The registration process provides:
- **Comprehensive Validation**: Validates all user input data
- **DID Integration**: Supports DID-based identity verification
- **Enterprise Setup**: Integrates with enterprise identity systems
- **Security**: Secure password handling and temporary credentials
- **Compliance**: Meets regulatory requirements for user registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@company.com",
  "partyType": "TDP",
  "organization": "DataCorp Inc",
  "phoneNumber": "+1234567890",
  "website": "https://datacorp.com",
  "location": "United States",
  "existingDID": "did:web:company.com:user:john.doe",
  "didVerificationSignature": "signature"
}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@company.com",
    "partyType": "TDP",
    "depaId": "TDP-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b",
    "did": "did:web:company.com:user:john.doe",
    "didVerified": true
  },
  "loginCredentials": {
    "email": "john.doe@company.com",
    "password": "temporary_password"
  }
}
```

#### 1.2 User Login

The user login endpoint authenticates users and provides secure access tokens for subsequent API calls. The process includes validation, session management, and security monitoring.

The login process provides:
- **Secure Authentication**: Validates user credentials securely
- **Token Management**: Provides JWT tokens for API access
- **Session Tracking**: Monitors user sessions for security
- **Rate Limiting**: Prevents brute force attacks
- **Audit Logging**: Comprehensive logging of login attempts

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@company.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "expiresIn": 86400,
  "user": {
    "email": "john.doe@company.com",
    "name": "John Doe",
    "partyType": "TDP",
    "depaId": "TDP-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b"
  }
}
```

#### 1.3 Token Refresh

The token refresh endpoint allows users to obtain new access tokens without re-authentication, improving user experience while maintaining security.

The refresh process provides:
- **User Experience**: Seamless token renewal
- **Security**: Validates refresh tokens securely
- **Session Continuity**: Maintains user sessions
- **Audit Trail**: Logs token refresh activities
- **Error Handling**: Proper handling of invalid tokens

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}

Response:
{
  "message": "Token refreshed successfully",
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token",
  "expiresIn": 86400
}
```

### 2. Profile Management

Profile management endpoints allow users to view and update their profile information while maintaining data integrity and security.

#### 2.1 Get User Profile

The get user profile endpoint provides comprehensive user information including identity details, verification status, and system identifiers.

The profile retrieval provides:
- **Complete Information**: All user data in a single response
- **Security**: Only returns data for authenticated users
- **Verification Status**: Shows DID and email verification status
- **System Identifiers**: Includes DEPA ID and other system IDs
- **Privacy**: Respects user privacy preferences

```http
GET /api/auth/profile
Authorization: Bearer jwt_token

Response:
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@company.com",
    "partyType": "TDP",
    "walletAddress": "0x1234...",
    "publicKey": "public_key_hex",
    "did": "did:web:company.com:user:john.doe",
    "didVerified": true,
    "depaId": "TDP-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b",
    "organization": "DataCorp Inc",
    "profileCompleted": true,
    "emailVerified": true
  }
}
```

#### 2.2 Update User Profile

The update user profile endpoint allows users to modify their profile information while maintaining data integrity and validation.

The profile update provides:
- **Validation**: Ensures data integrity and format
- **Security**: Only allows users to update their own profiles
- **Audit Trail**: Logs all profile changes
- **Flexibility**: Supports partial updates
- **Error Handling**: Proper validation error responses

```http
PUT /api/auth/profile
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "John Doe Updated",
  "organization": "DataCorp Inc Updated",
  "phoneNumber": "+1234567890",
  "website": "https://datacorp.com",
  "location": "United States"
}

Response:
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "John Doe Updated",
    "email": "john.doe@company.com",
    "partyType": "TDP",
    "organization": "DataCorp Inc Updated",
    "profileCompleted": true
  }
}
```

### 3. DID Management

DID management endpoints provide functionality for verifying DID ownership, checking availability, and managing decentralized identities.

#### 3.1 Verify DID Ownership

The verify DID ownership endpoint allows users to prove ownership of their DIDs through cryptographic signatures, enabling secure identity verification.

The verification process provides:
- **Cryptographic Proof**: Uses digital signatures for verification
- **Security**: Prevents unauthorized DID claims
- **Flexibility**: Supports multiple DID methods
- **Audit Trail**: Logs all verification attempts
- **Error Handling**: Proper handling of verification failures

```http
POST /api/did/verify
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "did": "did:web:company.com:user:john.doe",
  "walletAddress": "0x1234...",
  "signature": "signature_hex",
  "message": "Verification message"
}

Response:
{
  "success": true,
  "verified": true,
  "did": "did:web:company.com:user:john.doe",
  "walletAddress": "0x1234..."
}
```

#### 3.2 Check DID Availability

The check DID availability endpoint allows users to verify whether a DID is available for registration, preventing conflicts and ensuring proper DID management.

The availability check provides:
- **Conflict Prevention**: Prevents duplicate DID registrations
- **Real-time Validation**: Checks current system state
- **External Verification**: Validates against external DID documents
- **User Experience**: Helps users choose available DIDs
- **Error Handling**: Proper handling of resolution failures

```http
GET /api/did/check/did:web:company.com:user:john.doe

Response:
{
  "available": true,
  "message": "DID is available",
  "did": "did:web:company.com:user:john.doe"
}
```

### 4. Enterprise Management

Enterprise management endpoints provide functionality for managing enterprise domains, validating enterprise DIDs, and supporting enterprise identity integration.

#### 4.1 Get Enterprise Domains

The get enterprise domains endpoint provides information about allowed enterprise domains for DID registration and validation.

The domain management provides:
- **Domain Control**: Manages allowed enterprise domains
- **Security**: Prevents unauthorized domain usage
- **Flexibility**: Supports multiple enterprise domains
- **Compliance**: Meets enterprise security requirements
- **Audit Trail**: Logs domain access and changes

```http
GET /api/did/enterprise/domains
Authorization: Bearer jwt_token

Response:
{
  "domains": [
    "company.com",
    "enterprise.org",
    "business.net"
  ]
}
```

#### 4.2 Validate Enterprise DID

The validate enterprise DID endpoint verifies that a DID belongs to an allowed enterprise domain and meets enterprise security requirements.

The validation process provides:
- **Domain Validation**: Ensures DID belongs to allowed domain
- **Security Compliance**: Meets enterprise security requirements
- **Real-time Verification**: Validates against current domain list
- **Error Handling**: Proper handling of validation failures
- **Audit Trail**: Logs all validation attempts

```http
GET /api/did/enterprise/validate/did:web:company.com:user:john.doe
Authorization: Bearer jwt_token

Response:
{
  "isValid": true,
  "isDomainAllowed": true,
  "domain": "company.com",
  "did": "did:web:company.com:user:john.doe"
}
```

---

## Conclusion

The Identity and Access Management system provides a comprehensive framework for secure user authentication, authorization, and identity management in the Contract Management System. The implementation supports multiple identity types, authentication methods, and global uniqueness mechanisms while maintaining enterprise-grade security and compliance standards.

### Key Achievements
- ✅ Multi-identity support with global uniqueness
- ✅ Enterprise-grade authentication with Keycloak integration
- ✅ Role-based access control with granular permissions
- ✅ DID-based identity verification
- ✅ Comprehensive audit logging and compliance
- ✅ Security controls and monitoring
- ✅ DPDP 2023 and GDPR compliance features

The system is designed to be scalable, secure, and compliant with enterprise requirements while providing flexibility for different deployment scenarios and user types. 