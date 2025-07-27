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
5. [Authentication Methods](#authentication-methods)
6. [Authorization Framework](#authorization-framework)
7. [Security Controls](#security-controls)
8. [Audit and Compliance](#audit-and-compliance)
9. [Implementation Details](#implementation-details)
10. [API Specifications](#api-specifications)

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
  const keycloakResult = await keycloakService.createUser(userData);
  
  // Step 2: Create in database
  const dbUser = await db.User.create({
    // ... user data
    depaId: depaIdService.generateUserDEPAId(partyType),
    iamUserId: keycloakResult.keycloakUserId
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
const keycloakUserData = {
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

### 1. DEPA ID System

#### 1.1 DEPA ID Format
```
[ENTITY_TYPE]-[GUID]
Examples:
- TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
- TDP-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
- CCRP-1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e
- CONTRACT-2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f
```

#### 1.2 DEPA ID Generation
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

#### 2.1 User Table Constraints
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

#### 3.1 DID Resolution and Validation
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

### 1. Dataset Identity Management

#### 1.1 Dataset DEPA ID Generation
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
```
DATASET-[GUID]
Examples:
- DATASET-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
- DATASET-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
```

#### 1.3 Dataset Uniqueness Guarantee
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

#### 2.1 Training Environment DEPA ID Generation
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
```
ENVIRONMENT-[GUID]
Examples:
- ENVIRONMENT-1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e
- ENVIRONMENT-2c3d4e5f-6a7b-8c9d-0e1f-2a3b4c5d6e7f
```

#### 2.3 CCRP Infrastructure Resources
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
```
RESOURCE-[GUID]
Examples:
- RESOURCE-3c4d5e6f-7a8b-9c0d-0e1f-2a3b4c5d6e7f
- RESOURCE-4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a
```

### 3. Global Uniqueness Guarantee During Onboarding

#### 3.1 Transaction-Based DEPA ID Assignment
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

### 4. CCRP Infrastructure and Environment Functions

#### 4.1 Infrastructure Provisioning
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

#### 5.1 Multi-Step Onboarding with DEPA IDs
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
    const validationResult = await keycloakService.validateToken(token);
    
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
        authType: 'keycloak'
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

### 1. Database Schema

#### 1.1 Users Table
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

#### 2.1 Environment Variables
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
KEYCLOAK_ADMIN_PASSWORD=admin123
KEYCLOAK_ENABLED=true

# Security
SESSION_SECRET=your-super-secret-session-key-here
CORS_ORIGIN=https://app.company.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Middleware Stack

#### 3.1 Authentication Middleware
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
```javascript
// Role-based route protection
app.get('/api/tdp/*', requireTDP);
app.get('/api/tdc/*', requireTDC);
app.get('/api/ccrp/*', requireCCRP);
app.get('/api/admin/*', requireAnyAdmin);
```

---

## API Specifications

### 1. Authentication Endpoints

#### 1.1 User Registration
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

#### 2.1 Get User Profile
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

#### 3.1 Verify DID Ownership
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

#### 4.1 Get Enterprise Domains
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