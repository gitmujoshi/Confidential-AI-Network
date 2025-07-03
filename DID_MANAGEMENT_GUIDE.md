# DID Management Guide
## Decentralized Identifier Implementation & Management

**Document Version:** 1.0  
**Date:** December 2024  
**Author:** Contract Management System Team

---

## Table of Contents

1. [DID Overview](#did-overview)
2. [DID Creation & Registration](#did-creation--registration)
3. [Key Management](#key-management)
4. [Verifiable Credentials](#verifiable-credentials)
5. [DID Resolution & Verification](#did-resolution--verification)
6. [Integration with Contract Signing](#integration-with-contract-signing)
7. [Security & Best Practices](#security--best-practices)
8. [API Reference](#api-reference)

---

## 1. DID Overview

### 1.1 What is a DID?

A Decentralized Identifier (DID) is a globally unique identifier that enables verifiable, self-sovereign digital identity. In our system, DIDs are used for:

- **User Identity**: Each user gets a unique DID linked to their wallet
- **Contract Signing**: DIDs provide cryptographic proof of identity
- **Credential Management**: Verifiable credentials are issued to DIDs
- **Trust Framework**: DIDs enable trust without central authorities

### 1.2 DID Structure

```
did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678
│   │    │      │
│   │    │      └── Ethereum Address (Public Key)
│   │    └── Network (Goerli Testnet)
│   └── Method (Ethereum)
└── DID Scheme
```

### 1.3 DID Document Structure

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678",
  "verificationMethod": [
    {
      "id": "did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678#controller",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678",
      "publicKeyHex": "0x1234567890abcdef1234567890abcdef12345678"
    }
  ],
  "authentication": [
    "did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678#controller"
  ],
  "assertionMethod": [
    "did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678#controller"
  ],
  "service": [
    {
      "id": "did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678#linked-domain",
      "type": "LinkedDomains",
      "serviceEndpoint": "https://example.com"
    }
  ]
}
```

---

## 2. DID Creation & Registration

### 2.1 DID Creation Process

#### 2.1.1 Step-by-Step Creation
```typescript
export class DIDCreationService {
  private agent: Agent;

  constructor() {
    this.agent = new Agent({
      plugins: [
        new DIDManager({
          store: new MemoryDIDStore(),
          defaultProvider: 'did:ethr:goerli'
        }),
        new KeyManager({
          store: new MemoryKeyStore(),
          kms: {
            local: new KeyManagementSystem()
          }
        }),
        new CredentialPlugin(),
        new DIDResolverPlugin({
          resolver: new Resolver({
            ...getResolver()
          })
        })
      ]
    });
  }

  async createUserDID(userId: string, walletAddress: string): Promise<DIDCreationResult> {
    try {
      // Step 1: Generate key pair
      const keyPair = await this.generateKeyPair();
      
      // Step 2: Create DID using the wallet address
      const identifier = await this.agent.didManagerCreate({
        alias: `user-${userId}`,
        provider: 'did:ethr:goerli',
        kms: 'local',
        options: {
          key: keyPair.kid
        }
      });

      // Step 3: Update DID document with wallet information
      const updatedDoc = await this.updateDIDDocument(identifier.did, walletAddress);
      
      // Step 4: Store in database
      await this.storeDIDInDatabase(userId, identifier.did, walletAddress);

      return {
        success: true,
        did: identifier.did,
        didDocument: updatedDoc,
        walletAddress: walletAddress,
        keyId: keyPair.kid
      };

    } catch (error) {
      console.error('DID creation failed:', error);
      throw new Error(`DID creation failed: ${error.message}`);
    }
  }

  private async generateKeyPair(): Promise<ManagedKeyInfo> {
    return await this.agent.keyManagerCreate({
      kms: 'local',
      type: 'Secp256k1'
    });
  }

  private async updateDIDDocument(did: string, walletAddress: string): Promise<DIDDocument> {
    const doc = await this.agent.resolveDid({ didUrl: did });
    
    // Add wallet address as service
    const updatedDoc = {
      ...doc.didDocument,
      service: [
        ...(doc.didDocument.service || []),
        {
          id: `${did}#wallet`,
          type: 'WalletService',
          serviceEndpoint: {
            walletAddress: walletAddress,
            network: 'goerli'
          }
        }
      ]
    };

    // Update DID document
    await this.agent.didManagerUpdate({
      did,
      document: updatedDoc
    });

    return updatedDoc;
  }
}
```

#### 2.1.2 Database Storage
```sql
-- DID storage table
CREATE TABLE user_dids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  did VARCHAR(255) UNIQUE NOT NULL,
  did_document JSONB NOT NULL,
  wallet_address VARCHAR(42) NOT NULL,
  wallet_type VARCHAR(20) DEFAULT 'metamask',
  network VARCHAR(20) DEFAULT 'goerli',
  key_id VARCHAR(255),
  is_primary BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_user_dids_user_id (user_id),
  INDEX idx_user_dids_did (did),
  INDEX idx_user_dids_wallet_address (wallet_address)
);

-- DID operations audit log
CREATE TABLE did_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  did VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  operation_data JSONB,
  transaction_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_did_operations_user_id (user_id),
  INDEX idx_did_operations_did (did),
  INDEX idx_did_operations_operation (operation)
);
```

### 2.2 DID Registration on Blockchain

#### 2.2.1 Ethereum DID Registry
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DIDRegistry {
    struct DIDDocument {
        string did;
        string didDocument;
        address owner;
        uint256 created;
        uint256 updated;
        bool active;
    }

    mapping(string => DIDDocument) public didDocuments;
    mapping(address => string[]) public ownerDIDs;
    mapping(string => address) public didOwners;

    event DIDRegistered(string indexed did, address indexed owner);
    event DIDUpdated(string indexed did, address indexed owner);
    event DIDDeactivated(string indexed did, address indexed owner);

    modifier onlyDIDOwner(string memory did) {
        require(didOwners[did] == msg.sender, "Not DID owner");
        _;
    }

    function registerDID(
        string memory did,
        string memory didDocument
    ) external {
        require(bytes(did).length > 0, "DID cannot be empty");
        require(didDocuments[did].owner == address(0), "DID already exists");

        didDocuments[did] = DIDDocument({
            did: did,
            didDocument: didDocument,
            owner: msg.sender,
            created: block.timestamp,
            updated: block.timestamp,
            active: true
        });

        didOwners[did] = msg.sender;
        ownerDIDs[msg.sender].push(did);

        emit DIDRegistered(did, msg.sender);
    }

    function updateDID(
        string memory did,
        string memory didDocument
    ) external onlyDIDOwner(did) {
        require(didDocuments[did].active, "DID is not active");

        didDocuments[did].didDocument = didDocument;
        didDocuments[did].updated = block.timestamp;

        emit DIDUpdated(did, msg.sender);
    }

    function deactivateDID(string memory did) external onlyDIDOwner(did) {
        didDocuments[did].active = false;
        didDocuments[did].updated = block.timestamp;

        emit DIDDeactivated(did, msg.sender);
    }

    function getDIDDocument(string memory did) external view returns (DIDDocument memory) {
        return didDocuments[did];
    }

    function getOwnerDIDs(address owner) external view returns (string[] memory) {
        return ownerDIDs[owner];
    }

    function isDIDOwner(string memory did, address owner) external view returns (bool) {
        return didOwners[did] == owner;
    }
}
```

---

## 3. Key Management

### 3.1 Key Generation & Storage

#### 3.1.1 Key Management Service
```typescript
export class KeyManagementService {
  private agent: Agent;

  constructor() {
    this.agent = new Agent({
      plugins: [
        new KeyManager({
          store: new MemoryKeyStore(),
          kms: {
            local: new KeyManagementSystem()
          }
        })
      ]
    });
  }

  async generateKeyPair(): Promise<ManagedKeyInfo> {
    return await this.agent.keyManagerCreate({
      kms: 'local',
      type: 'Secp256k1'
    });
  }

  async getKey(keyId: string): Promise<ManagedKeyInfo> {
    return await this.agent.keyManagerGet({ kid: keyId });
  }

  async deleteKey(keyId: string): Promise<boolean> {
    return await this.agent.keyManagerDelete({ kid: keyId });
  }

  async signMessage(keyId: string, message: string): Promise<string> {
    const signature = await this.agent.keyManagerSign({
      kid: keyId,
      data: message,
      algorithm: 'ES256K'
    });

    return signature;
  }

  async verifySignature(
    publicKey: string, 
    message: string, 
    signature: string
  ): Promise<boolean> {
    try {
      const result = await this.agent.keyManagerVerify({
        kid: publicKey,
        data: message,
        signature: signature,
        algorithm: 'ES256K'
      });

      return result;
    } catch (error) {
      return false;
    }
  }
}
```

#### 3.1.2 Key Rotation
```typescript
export class KeyRotationService {
  async rotateDIDKeys(did: string): Promise<KeyRotationResult> {
    // Generate new key pair
    const newKey = await this.keyManagementService.generateKeyPair();

    // Add new key to DID document
    const updatedDoc = await this.addKeyToDID(did, newKey);

    // Update DID document
    await this.agent.didManagerUpdate({
      did,
      document: updatedDoc
    });

    // Mark old key for rotation
    await this.markKeyForRotation(did, newKey.kid);

    return {
      success: true,
      newKeyId: newKey.kid,
      didDocument: updatedDoc
    };
  }

  private async addKeyToDID(did: string, key: ManagedKeyInfo): Promise<DIDDocument> {
    const doc = await this.agent.resolveDid({ didUrl: did });
    
    const newVerificationMethod = {
      id: `${did}#${key.kid}`,
      type: 'EcdsaSecp256k1VerificationKey2019',
      controller: did,
      publicKeyHex: key.publicKeyHex
    };

    const updatedDoc = {
      ...doc.didDocument,
      verificationMethod: [
        ...doc.didDocument.verificationMethod,
        newVerificationMethod
      ],
      authentication: [
        ...doc.didDocument.authentication,
        newVerificationMethod.id
      ]
    };

    return updatedDoc;
  }
}
```

### 3.2 Secure Key Storage

#### 3.2.1 Hardware Security Module (HSM) Integration
```typescript
export class HSMManagementService {
  private hsmClient: HSMClient;

  constructor() {
    this.hsmClient = new HSMClient({
      endpoint: process.env.HSM_ENDPOINT,
      credentials: {
        accessKeyId: process.env.HSM_ACCESS_KEY,
        secretAccessKey: process.env.HSM_SECRET_KEY
      }
    });
  }

  async createKeyInHSM(keyId: string): Promise<string> {
    const params = {
      KeyId: keyId,
      KeyUsage: 'SIGN_VERIFY',
      KeySpec: 'ECC_NIST_P256'
    };

    const result = await this.hsmClient.createKey(params).promise();
    return result.KeyMetadata.KeyId;
  }

  async signWithHSM(keyId: string, message: string): Promise<string> {
    const params = {
      KeyId: keyId,
      Message: message,
      MessageType: 'RAW',
      SigningAlgorithm: 'ECDSA_SHA_256'
    };

    const result = await this.hsmClient.sign(params).promise();
    return result.Signature.toString('base64');
  }
}
```

---

## 4. Verifiable Credentials

### 4.1 Credential Types & Schemas

#### 4.1.1 Credential Schema Definition
```typescript
interface CredentialSchema {
  id: string;
  type: string;
  schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  issuer: string;
  version: string;
}

const credentialSchemas: Record<string, CredentialSchema> = {
  'IdentityCredential': {
    id: 'https://example.com/schemas/identity-credential',
    type: 'IdentityCredential',
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        dateOfBirth: { type: 'string', format: 'date' },
        nationality: { type: 'string' }
      },
      required: ['firstName', 'lastName', 'email']
    },
    issuer: 'did:ethr:goerli:0xissuer',
    version: '1.0'
  },
  
  'OrganizationCredential': {
    id: 'https://example.com/schemas/organization-credential',
    type: 'OrganizationCredential',
    schema: {
      type: 'object',
      properties: {
        organizationName: { type: 'string' },
        organizationType: { type: 'string', enum: ['TDP', 'TDC', 'CCRP'] },
        jobTitle: { type: 'string' },
        department: { type: 'string' },
        employeeId: { type: 'string' }
      },
      required: ['organizationName', 'organizationType']
    },
    issuer: 'did:ethr:goerli:0xissuer',
    version: '1.0'
  },
  
  'KYCCredential': {
    id: 'https://example.com/schemas/kyc-credential',
    type: 'KYCCredential',
    schema: {
      type: 'object',
      properties: {
        kycStatus: { type: 'string', enum: ['verified', 'pending', 'rejected'] },
        verificationDate: { type: 'string', format: 'date-time' },
        verificationMethod: { type: 'string' },
        documentType: { type: 'string' },
        documentNumber: { type: 'string' }
      },
      required: ['kycStatus', 'verificationDate']
    },
    issuer: 'did:ethr:goerli:0xissuer',
    version: '1.0'
  }
};
```

#### 4.1.2 Credential Issuance Service
```typescript
export class CredentialIssuanceService {
  async issueCredential(
    type: string,
    subject: string,
    claims: any,
    issuerDID: string
  ): Promise<VerifiableCredential> {
    // Get credential schema
    const schema = credentialSchemas[type];
    if (!schema) {
      throw new Error(`Unknown credential type: ${type}`);
    }

    // Validate claims against schema
    this.validateClaims(claims, schema.schema);

    // Create credential
    const credential = await this.agent.createVerifiableCredential({
      credential: {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          schema.id
        ],
        type: ['VerifiableCredential', type],
        issuer: { id: issuerDID },
        issuanceDate: new Date().toISOString(),
        expirationDate: this.calculateExpiration(type),
        credentialSubject: {
          id: subject,
          ...claims
        }
      },
      proofFormat: 'EthereumEip712Signature2021'
    });

    // Store credential
    await this.storeCredential(credential);

    return credential;
  }

  private validateClaims(claims: any, schema: any): void {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    
    if (!validate(claims)) {
      throw new Error(`Invalid claims: ${ajv.errorsText(validate.errors)}`);
    }
  }

  private calculateExpiration(type: string): string {
    const expirationDays = {
      'IdentityCredential': 365,
      'OrganizationCredential': 365,
      'KYCCredential': 180,
      'ContractSigningCredential': 30
    };

    const days = expirationDays[type] || 365;
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + days);
    
    return expiration.toISOString();
  }
}
```

### 4.2 Credential Verification

#### 4.2.1 Verification Service
```typescript
export class CredentialVerificationService {
  async verifyCredential(credential: VerifiableCredential): Promise<VerificationResult> {
    try {
      // Verify credential structure
      const structureValid = this.verifyCredentialStructure(credential);
      if (!structureValid) {
        return {
          verified: false,
          errors: ['Invalid credential structure']
        };
      }

      // Verify proof
      const proofValid = await this.agent.verifyCredential({
        credential
      });

      if (!proofValid.verified) {
        return {
          verified: false,
          errors: proofValid.error ? [proofValid.error] : ['Proof verification failed']
        };
      }

      // Verify issuer
      const issuerValid = await this.verifyIssuer(credential.issuer.id);
      if (!issuerValid) {
        return {
          verified: false,
          errors: ['Invalid issuer']
        };
      }

      // Check expiration
      const notExpired = this.checkExpiration(credential);
      if (!notExpired) {
        return {
          verified: false,
          errors: ['Credential has expired']
        };
      }

      return {
        verified: true,
        warnings: proofValid.warnings || []
      };

    } catch (error) {
      return {
        verified: false,
        errors: [error.message]
      };
    }
  }

  private verifyCredentialStructure(credential: VerifiableCredential): boolean {
    const required = ['@context', 'type', 'issuer', 'issuanceDate', 'credentialSubject'];
    
    for (const field of required) {
      if (!credential[field]) {
        return false;
      }
    }

    return true;
  }

  private async verifyIssuer(issuerDID: string): Promise<boolean> {
    // Check if issuer is in trusted issuers list
    const trustedIssuers = await this.getTrustedIssuers();
    return trustedIssuers.includes(issuerDID);
  }

  private checkExpiration(credential: VerifiableCredential): boolean {
    if (!credential.expirationDate) {
      return true; // No expiration date means never expires
    }

    const expiration = new Date(credential.expirationDate);
    const now = new Date();

    return now < expiration;
  }
}
```

---

## 5. DID Resolution & Verification

### 5.1 DID Resolution

#### 5.1.1 Resolution Service
```typescript
export class DIDResolutionService {
  private resolver: Resolver;

  constructor() {
    this.resolver = new Resolver({
      ...getResolver()
    });
  }

  async resolveDID(did: string): Promise<DIDResolutionResult> {
    try {
      const result = await this.resolver.resolve(did);
      
      return {
        success: true,
        didDocument: result.didDocument,
        metadata: result.didResolutionMetadata,
        documentMetadata: result.didDocumentMetadata
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async resolveDIDWithMetadata(did: string): Promise<DIDResolutionResult> {
    const result = await this.resolveDID(did);
    
    if (result.success) {
      // Add additional metadata
      result.metadata.lastUpdated = new Date().toISOString();
      result.metadata.resolutionTime = Date.now();
    }

    return result;
  }
}
```

#### 5.1.2 DID Verification
```typescript
export class DIDVerificationService {
  async verifyDIDOwnership(did: string, signature: string, message: string): Promise<boolean> {
    try {
      // Resolve DID
      const resolution = await this.didResolutionService.resolveDID(did);
      if (!resolution.success) {
        return false;
      }

      // Get verification methods
      const verificationMethods = resolution.didDocument.verificationMethod;
      if (!verificationMethods || verificationMethods.length === 0) {
        return false;
      }

      // Try to verify with each verification method
      for (const method of verificationMethods) {
        if (method.type === 'EcdsaSecp256k1VerificationKey2019') {
          const isValid = await this.verifySignature(
            method.publicKeyHex,
            message,
            signature
          );
          
          if (isValid) {
            return true;
          }
        }
      }

      return false;

    } catch (error) {
      console.error('DID ownership verification failed:', error);
      return false;
    }
  }

  private async verifySignature(
    publicKey: string, 
    message: string, 
    signature: string
  ): Promise<boolean> {
    try {
      // Remove '0x' prefix if present
      const cleanPublicKey = publicKey.startsWith('0x') ? publicKey.slice(2) : publicKey;
      const cleanSignature = signature.startsWith('0x') ? signature.slice(2) : signature;

      // Create message hash
      const messageHash = ethers.utils.hashMessage(message);
      
      // Recover address from signature
      const recoveredAddress = ethers.utils.recoverAddress(messageHash, '0x' + cleanSignature);
      
      // Convert public key to address
      const publicKeyAddress = ethers.utils.computeAddress('0x' + cleanPublicKey);
      
      return recoveredAddress.toLowerCase() === publicKeyAddress.toLowerCase();

    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
}
```

---

## 6. Integration with Contract Signing

### 6.1 DID-Based Contract Signing

#### 6.1.1 Contract Signing with DID
```typescript
export class DIDContractSigningService {
  async signContractWithDID(
    contractId: string,
    did: string,
    contractHash: string
  ): Promise<ContractSigningResult> {
    try {
      // Step 1: Verify DID ownership
      const ownershipVerified = await this.verifyDIDOwnership(did);
      if (!ownershipVerified) {
        throw new Error('DID ownership verification failed');
      }

      // Step 2: Create signing message
      const signingMessage = this.createSigningMessage(contractId, contractHash);
      
      // Step 3: Sign message with DID
      const signature = await this.signWithDID(did, signingMessage);
      
      // Step 4: Create verifiable credential for signing
      const signingCredential = await this.createSigningCredential(did, contractId, signature);
      
      // Step 5: Store signature on blockchain
      const txHash = await this.storeSignatureOnBlockchain(contractId, did, signature);
      
      // Step 6: Update contract status
      await this.updateContractStatus(contractId, 'signed', did);

      return {
        success: true,
        contractId,
        did,
        signature,
        credential: signingCredential,
        transactionHash: txHash,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Contract signing failed:', error);
      throw error;
    }
  }

  private createSigningMessage(contractId: string, contractHash: string): string {
    return `I, the holder of DID, hereby sign contract ${contractId} with hash ${contractHash} on ${new Date().toISOString()}`;
  }

  private async signWithDID(did: string, message: string): Promise<string> {
    // Get DID's private key (in production, this would be from secure storage)
    const privateKey = await this.getDIDPrivateKey(did);
    
    // Sign message
    const messageHash = ethers.utils.hashMessage(message);
    const signature = ethers.utils.signMessage(messageHash, privateKey);
    
    return signature;
  }

  private async createSigningCredential(
    did: string, 
    contractId: string, 
    signature: string
  ): Promise<VerifiableCredential> {
    return await this.credentialService.issueCredential(
      'ContractSigningCredential',
      did,
      {
        contractId,
        signature,
        signingDate: new Date().toISOString(),
        signingMethod: 'DID'
      },
      this.getSystemIssuerDID()
    );
  }
}
```

#### 6.1.2 Smart Contract Integration
```solidity
// DID-based contract signing
contract DIDContractSigning {
    struct DIDSignature {
        string did;
        bytes signature;
        uint256 timestamp;
        bool verified;
    }

    mapping(bytes32 => mapping(string => DIDSignature)) public didSignatures;
    mapping(bytes32 => string[]) public contractSigners;

    event ContractSignedWithDID(
        bytes32 indexed contractHash, 
        string did, 
        address signer,
        uint256 timestamp
    );

    function signContractWithDID(
        bytes32 contractHash,
        string memory did,
        bytes memory signature,
        bytes memory message
    ) external {
        // Verify signature
        require(verifyDIDSignature(did, message, signature), "Invalid DID signature");
        
        // Store signature
        didSignatures[contractHash][did] = DIDSignature({
            did: did,
            signature: signature,
            timestamp: block.timestamp,
            verified: true
        });

        // Add to signers list
        contractSigners[contractHash].push(did);

        emit ContractSignedWithDID(contractHash, did, msg.sender, block.timestamp);
    }

    function verifyDIDSignature(
        string memory did,
        bytes memory message,
        bytes memory signature
    ) public pure returns (bool) {
        // In production, this would verify the DID signature
        // For now, we'll use a simplified verification
        return true;
    }

    function getContractSigners(bytes32 contractHash) 
        external 
        view 
        returns (string[] memory) 
    {
        return contractSigners[contractHash];
    }

    function getDIDSignature(
        bytes32 contractHash, 
        string memory did
    ) external view returns (DIDSignature memory) {
        return didSignatures[contractHash][did];
    }
}
```

---

## 7. Security & Best Practices

### 7.1 Security Considerations

#### 7.1.1 Key Security
```typescript
export class SecurityBestPractices {
  // Never store private keys in plain text
  private async encryptPrivateKey(privateKey: string): Promise<string> {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_PASSWORD, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  // Use secure random generation
  private generateSecureRandom(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Implement rate limiting
  private async checkRateLimit(userId: string, operation: string): Promise<boolean> {
    const key = `rate_limit:${userId}:${operation}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, 3600); // 1 hour
    }
    
    const limit = this.getRateLimit(operation);
    return current <= limit;
  }

  // Audit logging
  private async logSecurityEvent(
    userId: string, 
    event: string, 
    details: any
  ): Promise<void> {
    const logEntry = {
      id: crypto.randomUUID(),
      userId,
      event,
      details,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    await this.securityAuditRepository.create(logEntry);
  }
}
```

#### 7.1.2 DID Security
```typescript
export class DIDSecurityService {
  // Verify DID document integrity
  async verifyDIDDocumentIntegrity(did: string): Promise<boolean> {
    const resolution = await this.didResolutionService.resolveDID(did);
    if (!resolution.success) {
      return false;
    }

    // Check for required fields
    const doc = resolution.didDocument;
    if (!doc.verificationMethod || doc.verificationMethod.length === 0) {
      return false;
    }

    // Verify each verification method
    for (const method of doc.verificationMethod) {
      if (!this.verifyVerificationMethod(method)) {
        return false;
      }
    }

    return true;
  }

  // Monitor for suspicious activity
  async monitorDIDActivity(did: string): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    // Check for unusual signing patterns
    const recentSignatures = await this.getRecentSignatures(did);
    if (recentSignatures.length > 10) {
      alerts.push({
        type: 'HIGH_SIGNATURE_COUNT',
        severity: 'WARNING',
        message: `Unusual number of signatures for DID: ${did}`
      });
    }

    // Check for failed verification attempts
    const failedAttempts = await this.getFailedVerifications(did);
    if (failedAttempts.length > 5) {
      alerts.push({
        type: 'MULTIPLE_FAILED_ATTEMPTS',
        severity: 'HIGH',
        message: `Multiple failed verification attempts for DID: ${did}`
      });
    }

    return alerts;
  }
}
```

### 7.2 Compliance & Governance

#### 7.2.1 DID Governance
```typescript
export class DIDGovernanceService {
  // DID lifecycle management
  async manageDIDLifecycle(did: string, action: 'activate' | 'suspend' | 'revoke'): Promise<void> {
    switch (action) {
      case 'activate':
        await this.activateDID(did);
        break;
      case 'suspend':
        await this.suspendDID(did);
        break;
      case 'revoke':
        await this.revokeDID(did);
        break;
    }
  }

  // Compliance checks
  async performComplianceCheck(did: string): Promise<ComplianceResult> {
    const checks = [
      this.checkKYCCredential(did),
      this.checkOrganizationCredential(did),
      this.checkIdentityCredential(did)
    ];

    const results = await Promise.all(checks);
    
    return {
      compliant: results.every(r => r.valid),
      checks: results,
      timestamp: new Date().toISOString()
    };
  }

  // Policy enforcement
  async enforcePolicy(did: string, policy: string): Promise<PolicyResult> {
    const policyRules = await this.getPolicyRules(policy);
    const didCredentials = await this.getDIDCredentials(did);
    
    const violations = [];
    
    for (const rule of policyRules) {
      if (!this.evaluateRule(rule, didCredentials)) {
        violations.push(rule);
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
      timestamp: new Date().toISOString()
    };
  }
}
```

---

## 8. API Reference

### 8.1 DID Management API

#### 8.1.1 DID Creation
```typescript
// Create DID for user
POST /api/v1/dids
{
  "userId": "user_123",
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "walletType": "metamask",
  "network": "goerli"
}

// Response
{
  "success": true,
  "did": "did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678",
  "didDocument": { /* DID Document */ },
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "keyId": "key_123"
}
```

#### 8.1.2 DID Resolution
```typescript
// Resolve DID
GET /api/v1/dids/{did}

// Response
{
  "success": true,
  "didDocument": { /* DID Document */ },
  "metadata": {
    "resolutionTime": 1234567890,
    "lastUpdated": "2024-01-01T00:00:00Z"
  }
}
```

#### 8.1.3 DID Verification
```typescript
// Verify DID ownership
POST /api/v1/dids/verify
{
  "did": "did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678",
  "message": "Sign this message to verify DID ownership",
  "signature": "0x..."
}

// Response
{
  "verified": true,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 8.2 Credential Management API

#### 8.2.1 Credential Issuance
```typescript
// Issue credential
POST /api/v1/credentials/issue
{
  "type": "IdentityCredential",
  "subject": "did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678",
  "claims": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }
}

// Response
{
  "success": true,
  "credential": { /* Verifiable Credential */ },
  "credentialId": "credential_123"
}
```

#### 8.2.2 Credential Verification
```typescript
// Verify credential
POST /api/v1/credentials/verify
{
  "credential": { /* Verifiable Credential */ }
}

// Response
{
  "verified": true,
  "warnings": [],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 8.3 Contract Signing API

#### 8.3.1 DID-Based Signing
```typescript
// Sign contract with DID
POST /api/v1/contracts/{contractId}/sign
{
  "did": "did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678",
  "signature": "0x...",
  "message": "Contract signing message"
}

// Response
{
  "success": true,
  "contractId": "contract_123",
  "did": "did:ethr:goerli:0x1234567890abcdef1234567890abcdef12345678",
  "transactionHash": "0x...",
  "credential": { /* Signing Credential */ },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

**DID Management Guide End** 