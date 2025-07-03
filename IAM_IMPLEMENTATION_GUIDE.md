# IAM Implementation Guide
## Practical Implementation Steps for Contract Management System

**Document Version:** 1.0  
**Date:** December 2024  
**Author:** Contract Management System Team

---

## Table of Contents

1. [Quick Start Implementation](#quick-start-implementation)
2. [DID Implementation](#did-implementation)
3. [Zero-Knowledge Proofs](#zero-knowledge-proofs)
4. [Biometric Integration](#biometric-integration)
5. [Enterprise Integration](#enterprise-integration)
6. [Security Hardening](#security-hardening)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Checklist](#deployment-checklist)

---

## 1. Quick Start Implementation

### 1.1 Prerequisites

```bash
# Required software
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 6+
- Kubernetes cluster (optional)

# Required packages
npm install @spruceid/didkit-wasm
npm install @veramo/core @veramo/did-manager @veramo/key-manager
npm install @veramo/credential-w3c @veramo/data-store
npm install @veramo/did-provider-ethr @veramo/did-provider-key
npm install @veramo/credential-ld @veramo/credential-eip712
npm install @veramo/remote-client @veramo/url-handler
npm install @veramo/selective-disclosure
npm install @veramo/credential-status
npm install @veramo/did-comm @veramo/message-handler
npm install @veramo/oidc-provider
npm install @veramo/present-proof
npm install @veramo/credential-ld
npm install @veramo/credential-eip712
npm install @veramo/credential-w3c
npm install @veramo/data-store
npm install @veramo/did-manager
npm install @veramo/key-manager
npm install @veramo/remote-client
npm install @veramo/url-handler
npm install @veramo/selective-disclosure
npm install @veramo/credential-status
npm install @veramo/did-comm
npm install @veramo/message-handler
npm install @veramo/oidc-provider
npm install @veramo/present-proof
```

### 1.2 Basic Setup

```typescript
// 1. Initialize Veramo Agent
import { createAgent, IIdentifier, IKey, TKeyType } from '@veramo/core'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem } from '@veramo/kms-local'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { getResolver as webDidResolver } from 'web-did-resolver'

const agent = createAgent({
  plugins: [
    new KeyManager({
      store: new MemoryKeyStore(),
      kms: {
        local: new KeyManagementSystem(new MemoryPrivateKeyStore()),
      },
    }),
    new DIDManager({
      store: new MemoryDIDStore(),
      defaultProvider: 'did:ethr:goerli',
      providers: {
        'did:ethr:goerli': new EthrDIDProvider({
          defaultKms: 'local',
          network: 'goerli',
        }),
      },
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...ethrDidResolver({ infuraProjectId: 'YOUR_INFURA_PROJECT_ID' }),
        ...webDidResolver(),
      }),
    }),
  ],
})
```

### 1.3 Environment Configuration

```bash
# .env file
# DID Configuration
DID_PROVIDER=did:ethr:goerli
INFURA_PROJECT_ID=your_infura_project_id
PRIVATE_KEY=your_private_key

# Database Configuration
DATABASE_URL=***REMOVED-DB_PASSWORD***ql://username:password@localhost:5432/iam_db
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# OAuth Configuration
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# Biometric Configuration
BIOMETRIC_ENABLED=true
BIOMETRIC_PROVIDER=local

# HSM Configuration
HSM_ENABLED=false
HSM_PROVIDER=aws-kms
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

---

## 2. DID Implementation

### 2.1 DID Creation and Management

```typescript
// DID Service Implementation
export class DIDService {
  private agent: Agent

  constructor(agent: Agent) {
    this.agent = agent
  }

  async createDID(alias?: string): Promise<IIdentifier> {
    const identifier = await this.agent.didManagerCreate({
      alias: alias || `user-${Date.now()}`,
      provider: 'did:ethr:goerli',
    })
    return identifier
  }

  async resolveDID(did: string): Promise<any> {
    const doc = await this.agent.resolveDid({ didUrl: did })
    return doc
  }

  async updateDID(did: string, document: any): Promise<void> {
    await this.agent.didManagerUpdate({
      did,
      document,
    })
  }

  async deactivateDID(did: string): Promise<void> {
    await this.agent.didManagerDelete({ did })
  }

  async listDIDs(): Promise<IIdentifier[]> {
    return await this.agent.didManagerFind()
  }
}
```

### 2.2 Verifiable Credentials

```typescript
// Verifiable Credential Service
export class CredentialService {
  private agent: Agent

  constructor(agent: Agent) {
    this.agent = agent
  }

  async issueCredential(
    subject: string,
    issuer: string,
    type: string[],
    claims: any
  ): Promise<VerifiableCredential> {
    const credential = await this.agent.createVerifiableCredential({
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', ...type],
        issuer: { id: issuer },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: subject,
          ...claims,
        },
      },
      proofFormat: 'EthereumEip712Signature2021',
    })

    return credential
  }

  async verifyCredential(credential: VerifiableCredential): Promise<boolean> {
    const result = await this.agent.verifyCredential({
      credential,
    })
    return result.verified
  }

  async presentCredential(
    credential: VerifiableCredential,
    holder: string
  ): Promise<VerifiablePresentation> {
    const presentation = await this.agent.createVerifiablePresentation({
      presentation: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        holder: holder,
        verifiableCredential: [credential],
      },
      proofFormat: 'EthereumEip712Signature2021',
    })

    return presentation
  }
}
```

### 2.3 Smart Contract Integration

```solidity
// DID Registry Smart Contract
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DIDRegistry {
    struct DIDDocument {
        string did;
        string document;
        address controller;
        uint256 created;
        uint256 updated;
        bool active;
    }

    mapping(bytes32 => DIDDocument) public didDocuments;
    mapping(address => bytes32[]) public userDIDs;

    event DIDCreated(bytes32 indexed didHash, string did, address indexed controller);
    event DIDUpdated(bytes32 indexed didHash, string did, address indexed controller);
    event DIDDeactivated(bytes32 indexed didHash, string did);

    modifier onlyController(bytes32 didHash) {
        require(didDocuments[didHash].controller == msg.sender, "Not authorized");
        _;
    }

    function createDID(string memory did, string memory document) external {
        bytes32 didHash = keccak256(abi.encodePacked(did));
        require(!didDocuments[didHash].active, "DID already exists");

        didDocuments[didHash] = DIDDocument({
            did: did,
            document: document,
            controller: msg.sender,
            created: block.timestamp,
            updated: block.timestamp,
            active: true
        });

        userDIDs[msg.sender].push(didHash);
        emit DIDCreated(didHash, did, msg.sender);
    }

    function updateDID(string memory did, string memory document) external {
        bytes32 didHash = keccak256(abi.encodePacked(did));
        require(didDocuments[didHash].active, "DID does not exist");
        require(didDocuments[didHash].controller == msg.sender, "Not authorized");

        didDocuments[didHash].document = document;
        didDocuments[didHash].updated = block.timestamp;

        emit DIDUpdated(didHash, did, msg.sender);
    }

    function deactivateDID(string memory did) external {
        bytes32 didHash = keccak256(abi.encodePacked(did));
        require(didDocuments[didHash].active, "DID does not exist");
        require(didDocuments[didHash].controller == msg.sender, "Not authorized");

        didDocuments[didHash].active = false;
        emit DIDDeactivated(didHash, did);
    }

    function resolveDID(string memory did) external view returns (DIDDocument memory) {
        bytes32 didHash = keccak256(abi.encodePacked(did));
        require(didDocuments[didHash].active, "DID not found or inactive");
        return didDocuments[didHash];
    }
}
```

---

## 3. Zero-Knowledge Proofs

### 3.1 ZK Proof Implementation

```typescript
// ZK Proof Service using Circom
import { buildPoseidon } from 'circomlibjs'
import { groth16 } from 'snarkjs'

export class ZKProofService {
  private poseidon: any

  constructor() {
    this.initializePoseidon()
  }

  private async initializePoseidon() {
    this.poseidon = await buildPoseidon()
  }

  async generateAgeProof(age: number, threshold: number): Promise<ZKProof> {
    // This is a simplified example - in practice, you'd use Circom circuits
    const circuit = await this.loadCircuit('age_verification')
    const input = {
      age: age,
      threshold: threshold,
      hash: this.poseidon([age, threshold])
    }

    const { proof, publicSignals } = await groth16.fullProve(input, circuit.wasm, circuit.zkey)
    
    return {
      proof: proof,
      publicInputs: publicSignals,
      verificationKey: circuit.vkey
    }
  }

  async generateLocationProof(
    latitude: number, 
    longitude: number, 
    radius: number
  ): Promise<ZKProof> {
    const circuit = await this.loadCircuit('location_verification')
    const input = {
      lat: latitude,
      lng: longitude,
      radius: radius,
      hash: this.poseidon([latitude, longitude, radius])
    }

    const { proof, publicSignals } = await groth16.fullProve(input, circuit.wasm, circuit.zkey)
    
    return {
      proof: proof,
      publicInputs: publicSignals,
      verificationKey: circuit.vkey
    }
  }

  async verifyProof(proof: ZKProof): Promise<boolean> {
    try {
      const result = await groth16.verify(proof.verificationKey, proof.publicInputs, proof.proof)
      return result
    } catch (error) {
      console.error('Proof verification failed:', error)
      return false
    }
  }
}
```

### 3.2 ZK Proof API Endpoints

```typescript
// ZK Proof API Routes
import express from 'express'
import { ZKProofService } from '../services/ZKProofService'

const router = express.Router()
const zkService = new ZKProofService()

// Generate age verification proof
router.post('/proofs/age', async (req, res) => {
  try {
    const { age, threshold } = req.body
    
    if (!age || !threshold) {
      return res.status(400).json({ error: 'Age and threshold are required' })
    }

    const proof = await zkService.generateAgeProof(age, threshold)
    res.json({ proof })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate age proof' })
  }
})

// Generate location verification proof
router.post('/proofs/location', async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.body
    
    if (!latitude || !longitude || !radius) {
      return res.status(400).json({ error: 'Latitude, longitude, and radius are required' })
    }

    const proof = await zkService.generateLocationProof(latitude, longitude, radius)
    res.json({ proof })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate location proof' })
  }
})

// Verify proof
router.post('/proofs/verify', async (req, res) => {
  try {
    const { proof } = req.body
    
    if (!proof) {
      return res.status(400).json({ error: 'Proof is required' })
    }

    const isValid = await zkService.verifyProof(proof)
    res.json({ verified: isValid })
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify proof' })
  }
})

export default router
```

---

## 4. Biometric Integration

### 4.1 WebAuthn Implementation

```typescript
// Biometric Authentication Service
export class BiometricService {
  async registerBiometric(userId: string): Promise<PublicKeyCredential> {
    const challenge = this.generateChallenge()
    
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: "Contract Management System",
        id: window.location.hostname,
      },
      user: {
        id: this.stringToArrayBuffer(userId),
        name: userId,
        displayName: userId,
      },
      pubKeyCredParams: [
        {
          type: "public-key",
          alg: -7, // ES256
        },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "direct",
    }

    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    }) as PublicKeyCredential

    return credential
  }

  async authenticateBiometric(challenge: ArrayBuffer): Promise<PublicKeyCredential> {
    const assertionOptions: PublicKeyCredentialRequestOptions = {
      challenge: challenge,
      rpId: window.location.hostname,
      userVerification: "required",
      timeout: 60000,
    }

    const assertion = await navigator.credentials.get({
      publicKey: assertionOptions,
    }) as PublicKeyCredential

    return assertion
  }

  private generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return array.buffer
  }

  private stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder()
    return encoder.encode(str).buffer
  }
}
```

### 4.2 Biometric API Integration

```typescript
// Biometric API Routes
import express from 'express'
import { BiometricService } from '../services/BiometricService'

const router = express.Router()
const biometricService = new BiometricService()

// Register biometric credential
router.post('/biometric/register', async (req, res) => {
  try {
    const { userId, credential } = req.body
    
    if (!userId || !credential) {
      return res.status(400).json({ error: 'User ID and credential are required' })
    }

    // Store credential in database
    await this.storeBiometricCredential(userId, credential)
    
    res.json({ success: true, message: 'Biometric credential registered' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to register biometric credential' })
  }
})

// Authenticate with biometric
router.post('/biometric/authenticate', async (req, res) => {
  try {
    const { userId, assertion } = req.body
    
    if (!userId || !assertion) {
      return res.status(400).json({ error: 'User ID and assertion are required' })
    }

    // Verify assertion
    const isValid = await this.verifyBiometricAssertion(userId, assertion)
    
    if (isValid) {
      // Generate session token
      const token = this.generateSessionToken(userId)
      res.json({ success: true, token })
    } else {
      res.status(401).json({ error: 'Biometric authentication failed' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to authenticate with biometric' })
  }
})

export default router
```

---

## 5. Enterprise Integration

### 5.1 OAuth 2.0/OIDC Implementation

```typescript
// OAuth 2.0 Service
import { OAuth2Client } from 'google-auth-library'
import { Issuer } from 'openid-client'

export class OAuthService {
  private googleClient: OAuth2Client
  private microsoftIssuer: any

  constructor() {
    this.initializeClients()
  }

  private async initializeClients() {
    // Google OAuth
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    // Microsoft OAuth
    this.microsoftIssuer = await Issuer.discover('https://login.microsoftonline.com/common/v2.0/.well-known/openid_configuration')
  }

  async authenticateWithGoogle(code: string): Promise<any> {
    const { tokens } = await this.googleClient.getToken(code)
    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    
    return {
      user: ticket.getPayload(),
      tokens: tokens,
    }
  }

  async authenticateWithMicrosoft(code: string): Promise<any> {
    const client = new this.microsoftIssuer.Client({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      redirect_uris: [process.env.MICROSOFT_REDIRECT_URI],
      response_types: ['code'],
    })

    const tokenSet = await client.callback(
      process.env.MICROSOFT_REDIRECT_URI,
      { code },
      { code_verifier: 'your_code_verifier' }
    )

    const userinfo = await client.userinfo(tokenSet)
    
    return {
      user: userinfo,
      tokens: tokenSet,
    }
  }
}
```

### 5.2 SAML 2.0 Implementation

```typescript
// SAML 2.0 Service
import { SAML } from 'passport-saml'

export class SAMLService {
  private samlStrategy: SAML

  constructor() {
    this.initializeSAML()
  }

  private initializeSAML() {
    this.samlStrategy = new SAML({
      entryPoint: process.env.SAML_ENTRY_POINT,
      issuer: process.env.SAML_ISSUER,
      callbackUrl: process.env.SAML_CALLBACK_URL,
      cert: process.env.SAML_CERT,
      privateCert: process.env.SAML_PRIVATE_CERT,
      decryptionPvk: process.env.SAML_DECRYPTION_KEY,
    })
  }

  async authenticateSAML(samlResponse: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.samlStrategy.validate(samlResponse, (err, profile) => {
        if (err) {
          reject(err)
        } else {
          resolve(profile)
        }
      })
    })
  }

  generateSAMLRequest(): string {
    return this.samlStrategy.generateAuthorizeRequest()
  }
}
```

---

## 6. Security Hardening

### 6.1 Rate Limiting

```typescript
// Rate Limiting Middleware
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export const createRateLimit = (options: {
  windowMs: number
  max: number
  message?: string
}) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rate_limit:',
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// Apply rate limits
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts
  message: 'Too many failed login attempts, please try again later.',
})

export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
})
```

### 6.2 Input Validation

```typescript
// Input Validation Middleware
import Joi from 'joi'

export const validateDID = (req: any, res: any, next: any) => {
  const schema = Joi.object({
    did: Joi.string().pattern(/^did:[a-z0-9]+:[a-zA-Z0-9._%-]+(:[a-zA-Z0-9._%-]+)*$/).required(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }
  next()
}

export const validateCredential = (req: any, res: any, next: any) => {
  const schema = Joi.object({
    type: Joi.array().items(Joi.string()).min(1).required(),
    issuer: Joi.string().required(),
    subject: Joi.string().required(),
    claims: Joi.object().required(),
  })

  const { error } = schema.validate(req.body)
  if (error) {
    return res.status(400).json({ error: error.details[0].message })
  }
  next()
}
```

### 6.3 Audit Logging

```typescript
// Audit Logging Service
export class AuditService {
  async logEvent(event: {
    userId: string
    action: string
    resource: string
    details: any
    ip: string
    userAgent: string
  }) {
    const auditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      details: event.details,
      ip: event.ip,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
    }

    // Store in database
    await this.storeAuditLog(auditLog)

    // Send to external audit system if configured
    if (process.env.AUDIT_WEBHOOK_URL) {
      await this.sendToAuditSystem(auditLog)
    }
  }

  private generateId(): string {
    return crypto.randomUUID()
  }
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// DID Service Tests
import { DIDService } from '../services/DIDService'
import { Agent } from '@veramo/core'

describe('DIDService', () => {
  let didService: DIDService
  let mockAgent: jest.Mocked<Agent>

  beforeEach(() => {
    mockAgent = {
      didManagerCreate: jest.fn(),
      didManagerFind: jest.fn(),
      resolveDid: jest.fn(),
    } as any

    didService = new DIDService(mockAgent)
  })

  describe('createDID', () => {
    it('should create a new DID', async () => {
      const mockIdentifier = {
        did: 'did:ethr:goerli:0x123...',
        alias: 'test-user',
      }

      mockAgent.didManagerCreate.mockResolvedValue(mockIdentifier)

      const result = await didService.createDID('test-user')

      expect(result).toEqual(mockIdentifier)
      expect(mockAgent.didManagerCreate).toHaveBeenCalledWith({
        alias: 'test-user',
        provider: 'did:ethr:goerli',
      })
    })
  })
})
```

### 7.2 Integration Tests

```typescript
// Integration Tests
import request from 'supertest'
import { app } from '../app'

describe('IAM API Integration', () => {
  describe('POST /api/v1/dids', () => {
    it('should create a new DID', async () => {
      const response = await request(app)
        .post('/api/v1/dids')
        .send({ alias: 'test-user' })
        .expect(201)

      expect(response.body).toHaveProperty('did')
      expect(response.body.did).toMatch(/^did:ethr:goerli:/)
    })
  })

  describe('POST /api/v1/credentials', () => {
    it('should issue a verifiable credential', async () => {
      const credentialData = {
        type: ['VerifiableCredential', 'AgeCredential'],
        issuer: 'did:ethr:goerli:0x123...',
        subject: 'did:ethr:goerli:0x456...',
        claims: { age: 25 },
      }

      const response = await request(app)
        .post('/api/v1/credentials')
        .send(credentialData)
        .expect(201)

      expect(response.body).toHaveProperty('proof')
      expect(response.body.proof).toHaveProperty('type')
    })
  })
})
```

### 7.3 Security Tests

```typescript
// Security Tests
describe('Security Tests', () => {
  describe('Rate Limiting', () => {
    it('should block excessive requests', async () => {
      const requests = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/v1/auth/login')
          .send({ username: 'test', password: 'wrong' })
      )

      const responses = await Promise.all(requests)
      const lastResponse = responses[responses.length - 1]

      expect(lastResponse.status).toBe(429)
    })
  })

  describe('Input Validation', () => {
    it('should reject malformed DIDs', async () => {
      const response = await request(app)
        .post('/api/v1/dids/resolve')
        .send({ did: 'invalid-did' })
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })
})
```

---

## 8. Deployment Checklist

### 8.1 Pre-Deployment Checklist

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Security tests passing
- [ ] Performance tests meeting requirements
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented

### 8.2 Deployment Steps

```bash
# 1. Build Docker images
docker build -f k8s/Dockerfile.backend -t contract-management-iam:latest .

# 2. Deploy to Kubernetes
kubectl apply -f k8s/iam-deployment.yaml

# 3. Verify deployment
kubectl get pods -n contract-management
kubectl get services -n contract-management

# 4. Run health checks
kubectl exec deployment/iam-backend -n contract-management -- curl http://localhost:5000/health

# 5. Monitor logs
kubectl logs -f deployment/iam-backend -n contract-management
```

### 8.3 Post-Deployment Verification

- [ ] All services running
- [ ] Health checks passing
- [ ] DID resolution working
- [ ] Credential issuance working
- [ ] Authentication flows working
- [ ] Rate limiting working
- [ ] Audit logging working
- [ ] Monitoring alerts configured
- [ ] Backup jobs running
- [ ] Performance metrics normal

### 8.4 Rollback Plan

```bash
# Rollback to previous version
kubectl rollout undo deployment/iam-backend -n contract-management

# Verify rollback
kubectl rollout status deployment/iam-backend -n contract-management

# Check logs for issues
kubectl logs deployment/iam-backend -n contract-management
```

---

## 9. Monitoring and Alerting

### 9.1 Key Metrics

```typescript
// Metrics Collection
export class MetricsService {
  async recordDIDOperation(operation: string, duration: number, success: boolean) {
    // Record DID operation metrics
    this.incrementCounter('did_operations_total', { operation, success: success.toString() })
    this.recordHistogram('did_operation_duration', duration, { operation })
  }

  async recordAuthenticationAttempt(success: boolean, method: string) {
    // Record authentication metrics
    this.incrementCounter('authentication_attempts_total', { success: success.toString(), method })
  }

  async recordCredentialOperation(operation: string, duration: number, success: boolean) {
    // Record credential operation metrics
    this.incrementCounter('credential_operations_total', { operation, success: success.toString() })
    this.recordHistogram('credential_operation_duration', duration, { operation })
  }
}
```

### 9.2 Alerting Rules

```yaml
# Prometheus Alert Rules
groups:
  - name: iam_alerts
    rules:
      - alert: HighAuthenticationFailureRate
        expr: rate(authentication_attempts_total{success="false"}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High authentication failure rate"
          description: "Authentication failure rate is {{ $value }} failures per second"

      - alert: DIDResolutionHighLatency
        expr: histogram_quantile(0.95, rate(did_operation_duration_bucket[5m])) > 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High DID resolution latency"
          description: "95th percentile DID resolution latency is {{ $value }} seconds"
```

---

**Implementation Guide End** 