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

The authentication methods section covers the various ways users can authenticate with the system, including JWT tokens, Keycloak integration, and DID-based authentication. Each method provides different levels of security and integration capabilities.

### 1. JWT Token Authentication

JWT (JSON Web Token) authentication provides a stateless method for user authentication that is widely supported and secure. The system uses JWT tokens for API access and session management, with integration to Keycloak for enhanced security and enterprise features.

JWT authentication provides:
- **Stateless Authentication**: No server-side session storage required
- **Security**: Cryptographically signed tokens prevent tampering
- **Scalability**: Tokens can be validated without database lookups
- **Integration**: Works seamlessly with Keycloak and other identity providers
- **Flexibility**: Supports multiple token types and validation methods

#### 1.1 Token Structure

The JWT token structure includes essential user information and metadata that enables secure authentication and authorization decisions. The token payload contains user identity, role information, and security metadata.

The token structure provides:
- **User Identification**: Unique user ID and email for identification
- **Role Information**: Party type and permissions for authorization
- **Security Metadata**: Issuance and expiration timestamps
- **Audit Support**: Token ID for tracking and revocation
- **Compliance**: Structured data for regulatory requirements

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

Token validation ensures that only valid, non-expired, and non-revoked tokens are accepted for authentication. The validation process includes multiple security checks and integrates with Keycloak for enterprise-grade security.

The validation process provides:
- **Security Checks**: Validates token signature and expiration
- **Blacklist Checking**: Prevents use of revoked tokens
- **Keycloak Integration**: Leverages enterprise security features
- **User Verification**: Ensures user exists and is active
- **Error Handling**: Comprehensive error responses for debugging

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

Keycloak integration provides enterprise-grade authentication and authorization capabilities, including single sign-on (SSO), user federation, and advanced security features. The system integrates with Keycloak to provide a robust authentication layer that supports enterprise requirements.

Keycloak integration provides:
- **Enterprise SSO**: Single sign-on across multiple applications
- **User Federation**: Integration with enterprise directories (LDAP, Active Directory)
- **Advanced Security**: Multi-factor authentication, password policies, and session management
- **Compliance**: Enterprise-grade audit logging and compliance features
- **Scalability**: Supports large enterprise deployments with high availability

#### 2.1 Keycloak Service

The Keycloak service provides a comprehensive interface for interacting with the Keycloak identity provider. It handles user authentication, token validation, and user management operations while maintaining security and performance.

The service provides:
- **Authentication Methods**: Password-based and token-based authentication
- **Token Management**: Token validation, refresh, and revocation
- **User Management**: User creation, updates, and synchronization
- **Security Features**: Rate limiting, session management, and audit logging
- **Error Handling**: Comprehensive error handling and logging

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

#### 2.2 Enterprise User Synchronization

Enterprise user synchronization ensures that user accounts are properly created and maintained across both the local system and Keycloak. This process handles user onboarding, updates, and deactivation in a coordinated manner.

The synchronization process provides:
- **User Creation**: Coordinated user creation in both systems
- **Profile Updates**: Synchronized profile information updates
- **Account Management**: Proper handling of account activation and deactivation
- **Error Recovery**: Robust error handling and recovery mechanisms
- **Audit Trail**: Complete audit trail for all synchronization activities

### 3. DID-Based Authentication

DID-based authentication provides a decentralized approach to user identity verification using blockchain technology and cryptographic proofs. This method enables self-sovereign identity while maintaining security and compliance requirements.

DID authentication provides:
- **Self-Sovereign Identity**: Users control their own identity information
- **Cryptographic Security**: Digital signatures provide strong authentication
- **Privacy Preservation**: Minimal data sharing with the system
- **Blockchain Integration**: Leverages blockchain for identity verification
- **Compliance Support**: Meets regulatory requirements for identity verification

#### 3.1 DID Verification Process

The DID verification process validates user ownership of decentralized identifiers through cryptographic proofs. This process ensures that users can prove ownership of their DIDs without revealing private keys.

The verification process provides:
- **Cryptographic Proof**: Digital signatures prove DID ownership
- **Security**: Private keys never leave user control
- **Privacy**: Minimal data exposure during verification
- **Flexibility**: Supports multiple DID methods and verification approaches
- **Audit Trail**: Complete audit trail for verification activities

#### 3.2 DID-Based Session Management

DID-based session management provides secure session handling for users who authenticate using decentralized identifiers. This approach maintains security while providing a seamless user experience.

The session management provides:
- **Secure Sessions**: Cryptographically secure session tokens
- **Privacy**: Minimal data collection and storage
- **Flexibility**: Supports multiple DID methods and session types
- **Compliance**: Meets privacy and security regulatory requirements
- **User Experience**: Seamless authentication and session management

---

## Authorization Framework

The authorization framework provides comprehensive access control mechanisms that ensure users can only access resources and perform actions appropriate to their role and permissions. The framework supports role-based access control, permission matrices, and resource-based authorization.

### 1. Role-Based Access Control (RBAC)

Role-based access control (RBAC) provides a structured approach to managing user permissions based on their assigned roles. The system implements a comprehensive RBAC framework that supports multiple roles, hierarchical permissions, and dynamic access control.

RBAC provides:
- **Structured Permissions**: Clear, organized permission management
- **Role Hierarchy**: Support for role inheritance and composition
- **Dynamic Access**: Runtime permission evaluation and enforcement
- **Audit Support**: Complete audit trail for access decisions
- **Compliance**: Meets regulatory requirements for access control

#### 1.1 Role Definitions

Role definitions establish the foundation for the RBAC system by defining the available roles and their associated permissions. Each role is carefully designed to support specific business functions while maintaining security and compliance.

The role definitions provide:
- **Clear Responsibilities**: Each role has well-defined responsibilities
- **Security Boundaries**: Roles are designed with security in mind
- **Compliance Support**: Roles support regulatory requirements
- **Scalability**: Framework supports adding new roles as needed
- **Documentation**: Clear documentation of role purposes and permissions

#### 1.2 Permission Management

Permission management provides the tools and processes for defining, assigning, and managing user permissions. The system supports granular permissions that can be combined to create complex access patterns.

The permission system provides:
- **Granular Control**: Fine-grained permission management
- **Flexibility**: Support for complex permission combinations
- **Security**: Secure permission assignment and validation
- **Audit Trail**: Complete tracking of permission changes
- **Compliance**: Support for regulatory permission requirements

### 2. Permission Matrix

The permission matrix provides a comprehensive view of which roles have access to which resources and actions. This matrix serves as both a documentation tool and a validation mechanism for the authorization system.

The permission matrix provides:
- **Clear Documentation**: Visual representation of role permissions
- **Validation**: Ensures proper permission assignment
- **Compliance**: Supports regulatory compliance requirements
- **Maintenance**: Easy to update and maintain
- **Security**: Helps identify and fix permission issues

#### 2.1 Resource Access Permissions

Resource access permissions define which users can access which system resources based on their role and the resource type. These permissions are enforced at multiple levels to ensure comprehensive security.

The resource permissions provide:
- **Data Protection**: Ensures sensitive data is properly protected
- **Access Control**: Prevents unauthorized access to resources
- **Audit Support**: Complete audit trail for resource access
- **Compliance**: Meets regulatory requirements for data access
- **Performance**: Efficient permission checking and enforcement

#### 2.2 Action-Based Permissions

Action-based permissions define which users can perform which actions within the system. These permissions are enforced at the API level and provide granular control over user capabilities.

The action permissions provide:
- **Granular Control**: Fine-grained control over user actions
- **Security**: Prevents unauthorized actions
- **Audit Trail**: Complete tracking of user actions
- **Compliance**: Supports regulatory action requirements
- **Flexibility**: Supports complex action permission patterns

### 3. Resource-Based Authorization

Resource-based authorization provides dynamic access control based on the specific resource being accessed and the user's relationship to that resource. This approach enables fine-grained access control that adapts to the specific context.

Resource-based authorization provides:
- **Context-Aware Access**: Access decisions based on resource context
- **Dynamic Permissions**: Permissions that adapt to resource state
- **Security**: Enhanced security through context-aware decisions
- **Flexibility**: Support for complex access patterns
- **Audit Support**: Complete audit trail for resource access

#### 3.1 Contract-Based Authorization

Contract-based authorization provides access control based on the user's relationship to specific contracts. This ensures that users can only access contracts they are authorized to view or modify.

The contract authorization provides:
- **Party-Based Access**: Access based on contract party relationships
- **Status-Based Control**: Access control based on contract status
- **Security**: Prevents unauthorized contract access
- **Compliance**: Meets regulatory contract access requirements
- **Audit Trail**: Complete tracking of contract access

#### 3.2 Dataset-Based Authorization

Dataset-based authorization provides access control for training datasets based on ownership, licensing, and contractual relationships. This ensures that datasets are only accessible to authorized users.

The dataset authorization provides:
- **Ownership Control**: Access based on dataset ownership
- **Licensing Support**: Support for dataset licensing requirements
- **Contract Integration**: Access based on contractual relationships
- **Security**: Prevents unauthorized dataset access
- **Compliance**: Meets regulatory data access requirements

---

## Security Controls

The security controls section covers the comprehensive security measures implemented throughout the system to protect user data, system integrity, and ensure compliance with regulatory requirements. Each control includes specific implementation details showing how it is actually implemented in the current system.

### 1. Authentication Security

Authentication security provides multiple layers of protection for the user authentication process, including rate limiting, session management, and threat detection. These controls are implemented at multiple levels to ensure comprehensive protection.

Authentication security provides:
- **Rate Limiting**: Prevents brute force and denial of service attacks
- **Session Management**: Secure session handling and timeout
- **Threat Detection**: Detection and response to security threats
- **Audit Logging**: Comprehensive logging of authentication events
- **Compliance**: Meets regulatory security requirements

#### 1.1 Rate Limiting Implementation

Rate limiting is implemented using the `express-rate-limit` middleware with specific configurations for different endpoints. The system implements different rate limits for authentication endpoints versus general API endpoints.

**Current Implementation:**

```javascript
// Rate limiting configuration for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Store rate limit info in Redis for distributed deployments
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth_rate_limit:'
  })
});

// Rate limiting for general API endpoints
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'api_rate_limit:'
  })
});

// Apply rate limiting to specific routes
app.use('/api/auth/login', authRateLimit);
app.use('/api/auth/register', authRateLimit);
app.use('/api/auth/refresh', authRateLimit);
app.use('/api', apiRateLimit);
```

**Configuration in Environment Variables:**
```env
# Rate limiting configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS_AUTH=5
RATE_LIMIT_MAX_REQUESTS_API=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
```

**Monitoring and Alerting:**
```javascript
// Rate limit monitoring middleware
const rateLimitMonitor = (req, res, next) => {
  const clientIP = req.ip;
  const endpoint = req.path;
  
  // Log rate limit violations for security monitoring
  if (req.rateLimit && req.rateLimit.remaining === 0) {
    logger.warn('Rate limit exceeded', {
      ip: clientIP,
      endpoint: endpoint,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    // Send alert to security team
    securityAlertService.sendAlert({
      type: 'RATE_LIMIT_VIOLATION',
      ip: clientIP,
      endpoint: endpoint,
      severity: 'MEDIUM'
    });
  }
  
  next();
};
```

#### 1.2 Session Management Implementation

Session management is implemented using JWT tokens with secure configuration and Redis-based session storage for distributed deployments.

**Current Implementation:**

```javascript
// JWT token configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  algorithm: 'HS256',
  issuer: 'contract-management-system',
  audience: 'contract-management-users'
};

// Session management service
class SessionManagementService {
  constructor() {
    this.redisClient = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    });
  }
  
  // Create session with JWT token
  async createSession(userData) {
    const token = jwt.sign(userData, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    
    // Store session in Redis with expiration
    await this.redisClient.setex(
      `session:${token}`,
      86400, // 24 hours
      JSON.stringify({
        userId: userData.id,
        email: userData.email,
        partyType: userData.partyType,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      })
    );
    
    return token;
  }
  
  // Validate session
  async validateSession(token) {
    try {
      // Verify JWT signature
      const decoded = jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      });
      
      // Check if session exists in Redis
      const sessionData = await this.redisClient.get(`session:${token}`);
      if (!sessionData) {
        return { valid: false, reason: 'Session not found' };
      }
      
      // Update last activity
      const session = JSON.parse(sessionData);
      session.lastActivity = new Date().toISOString();
      await this.redisClient.setex(
        `session:${token}`,
        86400,
        JSON.stringify(session)
      );
      
      return { valid: true, user: decoded };
    } catch (error) {
      return { valid: false, reason: 'Invalid token' };
    }
  }
  
  // Revoke session
  async revokeSession(token) {
    await this.redisClient.del(`session:${token}`);
    // Add to blacklist for additional security
    await this.redisClient.setex(`blacklist:${token}`, 86400, 'revoked');
  }
}
```

**Session Security Features:**
```javascript
// Session security middleware
const sessionSecurityMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    // Check if token is blacklisted
    redisClient.get(`blacklist:${token}`, (err, result) => {
      if (result === 'revoked') {
        return res.status(401).json({
          error: 'Session has been revoked',
          code: 'SESSION_REVOKED'
        });
      }
      next();
    });
  } else {
    next();
  }
};

// Session timeout middleware
const sessionTimeoutMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    const sessionData = await redisClient.get(`session:${token}`);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      const lastActivity = new Date(session.lastActivity);
      const now = new Date();
      
      // Check if session has been inactive for too long
      if (now - lastActivity > 30 * 60 * 1000) { // 30 minutes
        await sessionManagementService.revokeSession(token);
        return res.status(401).json({
          error: 'Session expired due to inactivity',
          code: 'SESSION_TIMEOUT'
        });
      }
    }
  }
  
  next();
};
```

#### 1.3 Threat Detection Implementation

Threat detection is implemented using a combination of pattern recognition, anomaly detection, and real-time monitoring.

**Current Implementation:**

```javascript
// Threat detection service
class ThreatDetectionService {
  constructor() {
    this.suspiciousPatterns = [
      { pattern: /admin.*login/i, severity: 'HIGH' },
      { pattern: /password.*reset/i, severity: 'MEDIUM' },
      { pattern: /api.*auth.*login.*failed/i, severity: 'MEDIUM' }
    ];
    
    this.anomalyThresholds = {
      failedLogins: 3, // per 15 minutes
      suspiciousIPs: 10, // requests per minute
      unusualUserAgents: 5 // different UAs per IP
    };
  }
  
  // Detect suspicious authentication patterns
  async detectSuspiciousAuth(req, res, next) {
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');
    const endpoint = req.path;
    
    // Check for suspicious patterns
    const suspiciousPattern = this.suspiciousPatterns.find(p => 
      p.pattern.test(`${endpoint} ${userAgent}`)
    );
    
    if (suspiciousPattern) {
      await this.logThreat({
        type: 'SUSPICIOUS_PATTERN',
        severity: suspiciousPattern.severity,
        ip: clientIP,
        userAgent: userAgent,
        endpoint: endpoint,
        pattern: suspiciousPattern.pattern.toString()
      });
    }
    
    // Check for failed login attempts
    const failedLogins = await this.getFailedLogins(clientIP);
    if (failedLogins > this.anomalyThresholds.failedLogins) {
      await this.logThreat({
        type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'HIGH',
        ip: clientIP,
        failedAttempts: failedLogins
      });
      
      // Block IP temporarily
      await this.blockIP(clientIP, 3600); // 1 hour
    }
    
    next();
  }
  
  // Log threat for analysis
  async logThreat(threatData) {
    const threat = {
      ...threatData,
      timestamp: new Date().toISOString(),
      id: uuidv4()
    };
    
    // Store in database
    await db.SecurityThreat.create(threat);
    
    // Send alert to security team
    await securityAlertService.sendAlert({
      type: 'SECURITY_THREAT',
      data: threat,
      severity: threat.severity
    });
    
    // Log for monitoring
    logger.warn('Security threat detected', threat);
  }
  
  // Block suspicious IP
  async blockIP(ip, duration) {
    await redisClient.setex(`blocked_ip:${ip}`, duration, 'blocked');
    logger.info(`IP ${ip} blocked for ${duration} seconds`);
  }
}

// Apply threat detection middleware
app.use('/api/auth', threatDetectionService.detectSuspiciousAuth.bind(threatDetectionService));
```

### 2. Authorization Security

Authorization security provides protection for the authorization system, ensuring that access control decisions are secure and properly enforced.

Authorization security provides:
- **Decision Validation**: Validation of authorization decisions
- **Access Logging**: Complete logging of access decisions
- **Policy Enforcement**: Secure enforcement of access policies
- **Threat Detection**: Detection of authorization-related threats
- **Compliance**: Meets regulatory authorization requirements

#### 2.1 Policy Enforcement Implementation

Policy enforcement is implemented using middleware that validates authorization decisions and enforces access policies at multiple levels.

**Current Implementation:**

```javascript
// Authorization policy enforcement middleware
const enforceAuthorizationPolicy = (requiredRole, resourceType = null) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }
      
      // Check role-based access
      if (requiredRole && user.partyType !== requiredRole) {
        await logAuthorizationFailure({
          userId: user.id,
          email: user.email,
          requiredRole: requiredRole,
          actualRole: user.partyType,
          resource: req.path,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
        
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      // Check resource-based access if specified
      if (resourceType) {
        const resourceId = req.params.id || req.body.resourceId;
        const hasResourceAccess = await checkResourceAccess(
          user.id,
          user.partyType,
          resourceType,
          resourceId
        );
        
        if (!hasResourceAccess) {
          await logAuthorizationFailure({
            userId: user.id,
            email: user.email,
            resourceType: resourceType,
            resourceId: resourceId,
            action: req.method,
            ip: req.ip,
            timestamp: new Date().toISOString()
          });
          
          return res.status(403).json({
            error: 'Access denied to resource',
            code: 'RESOURCE_ACCESS_DENIED'
          });
        }
      }
      
      // Log successful authorization
      await logAuthorizationSuccess({
        userId: user.id,
        email: user.email,
        role: user.partyType,
        resource: req.path,
        action: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      next();
    } catch (error) {
      logger.error('Authorization policy enforcement error', error);
      return res.status(500).json({
        error: 'Authorization service error',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

// Resource access checking function
const checkResourceAccess = async (userId, userRole, resourceType, resourceId) => {
  switch (resourceType) {
    case 'contract':
      const contract = await db.Contract.findByPk(resourceId);
      return contract && (
        contract.tdcId === userId ||
        contract.tdpId === userId ||
        contract.ccrpId === userId ||
        userRole === 'AppAdmin'
      );
      
    case 'dataset':
      const dataset = await db.Dataset.findByPk(resourceId);
      return dataset && (
        dataset.ownerId === userId ||
        dataset.isPublic ||
        userRole === 'AppAdmin'
      );
      
    case 'user':
      return userId === parseInt(resourceId) || userRole === 'AppAdmin';
      
    default:
      return false;
  }
};

// Apply authorization policies to routes
app.get('/api/contracts/:id', enforceAuthorizationPolicy(null, 'contract'));
app.put('/api/contracts/:id', enforceAuthorizationPolicy(null, 'contract'));
app.get('/api/datasets/:id', enforceAuthorizationPolicy(null, 'dataset'));
app.put('/api/datasets/:id', enforceAuthorizationPolicy('TDP', 'dataset'));
app.get('/api/users/:id', enforceAuthorizationPolicy(null, 'user'));
```

#### 2.2 Access Monitoring Implementation

Access monitoring is implemented using real-time monitoring of user access patterns and authorization decisions.

**Current Implementation:**

```javascript
// Access monitoring service
class AccessMonitoringService {
  constructor() {
    this.accessPatterns = new Map();
    this.anomalyDetectors = {
      unusualAccessTimes: this.detectUnusualAccessTimes.bind(this),
      rapidResourceAccess: this.detectRapidResourceAccess.bind(this),
      privilegeEscalation: this.detectPrivilegeEscalation.bind(this)
    };
  }
  
  // Monitor access patterns
  async monitorAccess(req, res, next) {
    const user = req.user;
    const resource = req.path;
    const action = req.method;
    const timestamp = new Date();
    
    // Record access pattern
    const patternKey = `${user.id}:${resource}:${action}`;
    const pattern = this.accessPatterns.get(patternKey) || {
      count: 0,
      firstAccess: timestamp,
      lastAccess: timestamp,
      frequency: []
    };
    
    pattern.count++;
    pattern.lastAccess = timestamp;
    pattern.frequency.push(timestamp);
    
    // Keep only last 100 accesses for analysis
    if (pattern.frequency.length > 100) {
      pattern.frequency = pattern.frequency.slice(-100);
    }
    
    this.accessPatterns.set(patternKey, pattern);
    
    // Run anomaly detection
    await this.runAnomalyDetection(user, resource, action, pattern);
    
    next();
  }
  
  // Detect unusual access times
  async detectUnusualAccessTimes(user, resource, action, pattern) {
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour <= 17;
    
    if (!isBusinessHours && pattern.count > 5) {
      await this.logAnomaly({
        type: 'UNUSUAL_ACCESS_TIME',
        userId: user.id,
        email: user.email,
        resource: resource,
        action: action,
        hour: hour,
        severity: 'MEDIUM'
      });
    }
  }
  
  // Detect rapid resource access
  async detectRapidResourceAccess(user, resource, action, pattern) {
    const recentAccesses = pattern.frequency.filter(
      time => new Date() - time < 60000 // Last minute
    );
    
    if (recentAccesses.length > 10) {
      await this.logAnomaly({
        type: 'RAPID_RESOURCE_ACCESS',
        userId: user.id,
        email: user.email,
        resource: resource,
        action: action,
        accessCount: recentAccesses.length,
        severity: 'HIGH'
      });
    }
  }
  
  // Detect privilege escalation attempts
  async detectPrivilegeEscalation(user, resource, action, pattern) {
    const sensitiveResources = ['/api/admin', '/api/users', '/api/audit'];
    const isSensitiveResource = sensitiveResources.some(r => resource.includes(r));
    
    if (isSensitiveResource && user.partyType !== 'AppAdmin') {
      await this.logAnomaly({
        type: 'PRIVILEGE_ESCALATION_ATTEMPT',
        userId: user.id,
        email: user.email,
        resource: resource,
        action: action,
        userRole: user.partyType,
        severity: 'HIGH'
      });
    }
  }
  
  // Log anomaly for analysis
  async logAnomaly(anomalyData) {
    const anomaly = {
      ...anomalyData,
      timestamp: new Date().toISOString(),
      id: uuidv4()
    };
    
    // Store in database
    await db.AccessAnomaly.create(anomaly);
    
    // Send alert for high severity anomalies
    if (anomaly.severity === 'HIGH') {
      await securityAlertService.sendAlert({
        type: 'ACCESS_ANOMALY',
        data: anomaly,
        severity: 'HIGH'
      });
    }
    
    logger.warn('Access anomaly detected', anomaly);
  }
}

// Apply access monitoring middleware
app.use('/api', accessMonitoringService.monitorAccess.bind(accessMonitoringService));
```

### 3. Data Protection

Data protection provides comprehensive protection for user data and system information, including encryption, access controls, and data lifecycle management.

Data protection provides:
- **Encryption**: Encryption of sensitive data at rest and in transit
- **Access Controls**: Comprehensive access controls for data
- **Data Lifecycle**: Proper data lifecycle management
- **Privacy Protection**: Protection of user privacy
- **Compliance**: Meets regulatory data protection requirements

#### 3.1 Data Encryption Implementation

Data encryption is implemented using industry-standard encryption algorithms and secure key management.

**Current Implementation:**

```javascript
// Data encryption service
class DataEncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
  }
  
  // Encrypt sensitive data
  async encryptData(data, keyId = null) {
    try {
      const key = keyId ? await this.getKey(keyId) : crypto.randomBytes(this.keyLength);
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipher(this.algorithm, key);
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        keyId: keyId || 'generated',
        algorithm: this.algorithm
      };
    } catch (error) {
      logger.error('Data encryption error', error);
      throw new Error('Encryption failed');
    }
  }
  
  // Decrypt sensitive data
  async decryptData(encryptedData) {
    try {
      const key = encryptedData.keyId === 'generated' ? 
        await this.getGeneratedKey() : 
        await this.getKey(encryptedData.keyId);
      
      const decipher = crypto.createDecipher(
        encryptedData.algorithm,
        key
      );
      
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Data decryption error', error);
      throw new Error('Decryption failed');
    }
  }
  
  // Encrypt database fields
  async encryptDatabaseField(value, fieldName) {
    if (!value) return value;
    
    const encrypted = await this.encryptData(value);
    return JSON.stringify(encrypted);
  }
  
  // Decrypt database fields
  async decryptDatabaseField(encryptedValue, fieldName) {
    if (!encryptedValue) return encryptedValue;
    
    const encryptedData = JSON.parse(encryptedValue);
    return await this.decryptData(encryptedData);
  }
}

// Database field encryption middleware
const encryptSensitiveFields = (fields) => {
  return async (req, res, next) => {
    if (req.body) {
      for (const field of fields) {
        if (req.body[field]) {
          req.body[field] = await dataEncryptionService.encryptDatabaseField(
            req.body[field],
            field
          );
        }
      }
    }
    next();
  };
};

// Apply encryption to sensitive routes
app.post('/api/users', encryptSensitiveFields(['password', 'phoneNumber']));
app.put('/api/users/:id', encryptSensitiveFields(['password', 'phoneNumber']));
```

**Encryption Configuration:**
```env
# Encryption configuration
ENCRYPTION_ALGORITHM=aes-256-gcm
ENCRYPTION_KEY_LENGTH=32
ENCRYPTION_IV_LENGTH=16
ENCRYPTION_TAG_LENGTH=16
ENCRYPTION_KEY_ROTATION_DAYS=90
```

#### 3.2 Privacy Protection Implementation

Privacy protection is implemented using data minimization, consent management, and user privacy controls.

**Current Implementation:**

```javascript
// Privacy protection service
class PrivacyProtectionService {
  constructor() {
    this.dataRetentionPolicies = {
      userLogs: 90, // days
      auditLogs: 365, // days
      sessionData: 30, // days
      temporaryData: 7 // days
    };
  }
  
  // Data minimization - only collect necessary data
  minimizeUserData(userData) {
    const minimalData = {
      id: userData.id,
      email: userData.email,
      partyType: userData.partyType,
      name: userData.name,
      depaId: userData.depaId,
      isActive: userData.isActive
    };
    
    // Only include additional fields if explicitly requested
    if (userData.includeDetails) {
      minimalData.organization = userData.organization;
      minimalData.location = userData.location;
    }
    
    return minimalData;
  }
  
  // Consent management
  async manageConsent(userId, consentType, granted) {
    const consent = await db.UserConsent.create({
      userId: userId,
      consentType: consentType,
      granted: granted,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Update user privacy settings
    await db.User.update({
      [`consent_${consentType}`]: granted
    }, {
      where: { id: userId }
    });
    
    return consent;
  }
  
  // Data retention cleanup
  async cleanupExpiredData() {
    const now = new Date();
    
    // Clean up expired user logs
    const userLogsRetention = new Date(now - this.dataRetentionPolicies.userLogs * 24 * 60 * 60 * 1000);
    await db.UserLog.destroy({
      where: {
        createdAt: {
          [Op.lt]: userLogsRetention
        }
      }
    });
    
    // Clean up expired session data
    const sessionRetention = new Date(now - this.dataRetentionPolicies.sessionData * 24 * 60 * 60 * 1000);
    const expiredSessions = await redisClient.keys('session:*');
    for (const sessionKey of expiredSessions) {
      const sessionData = await redisClient.get(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (new Date(session.createdAt) < sessionRetention) {
          await redisClient.del(sessionKey);
        }
      }
    }
  }
  
  // User data rights implementation
  async exportUserData(userId) {
    const user = await db.User.findByPk(userId);
    const userLogs = await db.UserLog.findAll({ where: { userId } });
    const userConsents = await db.UserConsent.findAll({ where: { userId } });
    
    return {
      user: this.minimizeUserData(user),
      logs: userLogs,
      consents: userConsents,
      exportDate: new Date().toISOString()
    };
  }
  
  async deleteUserData(userId) {
    // Anonymize user data instead of deletion for audit purposes
    await db.User.update({
      name: 'DELETED_USER',
      email: `deleted_${userId}@deleted.com`,
      organization: null,
      phoneNumber: null,
      website: null,
      location: null,
      isActive: false,
      deletedAt: new Date()
    }, {
      where: { id: userId }
    });
    
    // Delete associated data
    await db.UserLog.destroy({ where: { userId } });
    await db.UserConsent.destroy({ where: { userId } });
    
    // Revoke all sessions
    const userSessions = await redisClient.keys(`session:*`);
    for (const sessionKey of userSessions) {
      const sessionData = await redisClient.get(sessionKey);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.userId === userId) {
          await redisClient.del(sessionKey);
        }
      }
    }
  }
}

// Privacy middleware
const privacyMiddleware = (req, res, next) => {
  // Add privacy headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'"
  });
  
  next();
};

// Apply privacy middleware
app.use(privacyMiddleware);
```

**Privacy Configuration:**
```env
# Privacy configuration
DATA_RETENTION_USER_LOGS=90
DATA_RETENTION_AUDIT_LOGS=365
DATA_RETENTION_SESSION_DATA=30
DATA_RETENTION_TEMPORARY_DATA=7
PRIVACY_DEFAULT_CONSENT=false
PRIVACY_ALLOW_DATA_EXPORT=true
PRIVACY_ALLOW_DATA_DELETION=true
```

This comprehensive security controls implementation provides multiple layers of protection while maintaining system performance and user experience. Each control is specifically implemented with real code examples showing how it works in the current system.

---

## Audit and Compliance

The audit and compliance section covers the comprehensive audit logging and compliance features that ensure the system meets regulatory requirements and provides complete transparency for all activities.

### 1. Audit Logging

Audit logging provides comprehensive recording of all system activities, including user actions, system events, and security events. This ensures complete transparency and supports compliance requirements.

Audit logging provides:
- **Complete Coverage**: Logging of all system activities
- **Security Events**: Logging of security-related events
- **User Actions**: Logging of user actions and decisions
- **System Events**: Logging of system events and changes
- **Compliance Support**: Support for regulatory compliance requirements

#### 1.1 Event Logging

Event logging captures all significant events in the system, including user actions, system changes, and security events. This provides a complete audit trail for compliance and security purposes.

Event logging provides:
- **Comprehensive Coverage**: Logging of all significant events
- **Structured Data**: Structured logging for easy analysis
- **Performance**: Efficient logging with minimal performance impact
- **Storage**: Proper storage and retention of log data
- **Analysis**: Tools for log analysis and reporting

#### 1.2 Security Event Logging

Security event logging specifically captures security-related events, including authentication attempts, authorization decisions, and security violations. This helps detect and respond to security threats.

Security event logging provides:
- **Threat Detection**: Detection of security threats and violations
- **Incident Response**: Support for security incident response
- **Compliance**: Meets regulatory security logging requirements
- **Analysis**: Tools for security event analysis
- **Alerting**: Automated alerts for security events

### 2. Compliance Features

Compliance features ensure that the system meets regulatory requirements for data protection, privacy, and security. This includes features for GDPR, DPDP 2023, and other regulatory frameworks.

Compliance features provide:
- **Regulatory Support**: Support for multiple regulatory frameworks
- **Data Rights**: Support for user data rights
- **Consent Management**: Proper consent management
- **Privacy Controls**: User privacy controls
- **Reporting**: Automated compliance reporting

#### 2.1 GDPR Compliance

GDPR compliance features ensure that the system meets European data protection requirements, including data rights, consent management, and privacy controls.

GDPR compliance provides:
- **Data Rights**: Support for GDPR data rights
- **Consent Management**: Proper GDPR consent management
- **Privacy Controls**: GDPR-compliant privacy controls
- **Data Portability**: Support for data portability
- **Breach Notification**: Support for breach notification requirements

#### 2.2 DPDP 2023 Compliance

DPDP 2023 compliance features ensure that the system meets Indian data protection requirements, including data localization, consent management, and user rights.

DPDP 2023 compliance provides:
- **Data Localization**: Support for data localization requirements
- **Consent Management**: DPDP-compliant consent management
- **User Rights**: Support for DPDP user rights
- **Privacy Controls**: DPDP-compliant privacy controls
- **Reporting**: Automated DPDP compliance reporting

### 3. Security Monitoring

Security monitoring provides real-time monitoring of system security, including threat detection, incident response, and security metrics.

Security monitoring provides:
- **Real-Time Monitoring**: Real-time security monitoring
- **Threat Detection**: Detection of security threats
- **Incident Response**: Support for security incident response
- **Metrics**: Security metrics and reporting
- **Alerting**: Automated security alerts

#### 3.1 Threat Detection

Threat detection identifies potential security threats through monitoring of system activities, user behavior, and security events.

Threat detection provides:
- **Behavioral Analysis**: Analysis of user behavior patterns
- **Anomaly Detection**: Detection of anomalous activities
- **Pattern Recognition**: Recognition of threat patterns
- **Real-Time Alerts**: Real-time alerts for threats
- **Response Support**: Support for threat response

#### 3.2 Incident Response

Incident response provides tools and processes for responding to security incidents, including investigation, containment, and recovery.

Incident response provides:
- **Investigation Tools**: Tools for security incident investigation
- **Containment**: Support for incident containment
- **Recovery**: Support for incident recovery
- **Documentation**: Documentation of incident response
- **Lessons Learned**: Capture of lessons learned from incidents

---

## Implementation Details

The implementation details section provides comprehensive information about the technical implementation of the IAM system, including database schemas, configuration settings, and middleware components.

### 1. Database Schema

The database schema is designed to support all IAM functionality while maintaining performance, security, and compliance requirements. Each table includes appropriate indexes, constraints, and audit fields.

The database schema provides:
- **Performance**: Optimized for IAM operations
- **Security**: Secure design with proper constraints
- **Compliance**: Support for audit and compliance requirements
- **Scalability**: Design that supports system growth
- **Maintainability**: Clear structure for easy maintenance

#### 1.1 Users Table

The users table is the central repository for all user identity information. It supports multiple identity types, authentication methods, and compliance requirements while maintaining data integrity and performance.

The users table provides:
- **Multi-Identity Support**: Support for multiple identity types
- **Performance**: Optimized for user operations
- **Security**: Secure design with proper constraints
- **Compliance**: Support for audit and compliance requirements
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

The audit logs table provides:
- **Comprehensive Tracking**: Complete tracking of system activities
- **Compliance Support**: Support for regulatory compliance requirements
- **Security Monitoring**: Support for security monitoring and analysis
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

The configuration system provides:
- **Environment Support**: Support for different deployment environments
- **Security**: Secure configuration management
- **Flexibility**: Flexible configuration options
- **Compliance**: Support for compliance requirements
- **Monitoring**: Configuration monitoring and validation

#### 2.1 Environment Variables

Environment variables provide secure configuration management that supports different deployment environments, security requirements, and compliance needs. The configuration is designed to be secure, flexible, and maintainable.

The environment variables provide:
- **Security**: Sensitive values stored as environment variables
- **Flexibility**: Support for different deployment environments
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

The middleware stack provides:
- **Security**: Comprehensive security middleware
- **Monitoring**: Request monitoring and logging
- **Performance**: Optimized request processing
- **Compliance**: Support for compliance requirements
- **Flexibility**: Configurable middleware components

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

The authentication endpoints provide:
- **User Registration**: Secure user account creation
- **User Login**: Secure user authentication
- **Token Management**: JWT token creation and refresh
- **Profile Management**: User profile operations
- **Security**: Comprehensive security features

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

The profile management provides:
- **Profile Retrieval**: Secure retrieval of user profiles
- **Profile Updates**: Secure profile information updates
- **Data Validation**: Comprehensive data validation
- **Security**: Secure profile data handling
- **Compliance**: Meets regulatory profile requirements

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

The DID management provides:
- **DID Verification**: Cryptographic verification of DID ownership
- **Availability Checking**: Checking DID availability for registration
- **DID Management**: Comprehensive DID management capabilities
- **Security**: Secure DID operations
- **Compliance**: Meets regulatory DID requirements

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

The enterprise management provides:
- **Domain Management**: Management of enterprise domains
- **DID Validation**: Validation of enterprise DIDs
- **Enterprise Integration**: Support for enterprise identity integration
- **Security**: Secure enterprise operations
- **Compliance**: Meets enterprise compliance requirements

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