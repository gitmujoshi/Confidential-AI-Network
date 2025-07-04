# User Onboarding & Profile Management Guide
## Complete Workflow for DID Creation, Profile Management, and Contract Signing

**Document Version:** 1.0  
**Date:** December 2024  
**Author:** Contract Management System Team

---

## Table of Contents

1. [Onboarding Overview](#onboarding-overview)
2. [Step-by-Step Onboarding Process](#step-by-step-onboarding-process)
3. [Profile Management](#profile-management)
4. [DID Creation & Management](#did-creation--management)
5. [Contract Signing Workflow](#contract-signing-workflow)
6. [User Interface Design](#user-interface-design)
7. [Technical Implementation](#technical-implementation)
8. [Security Considerations](#security-considerations)

---

## 1. Onboarding Overview

### 1.1 Onboarding Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Onboarding Flow                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Initial   │  │   Wallet    │  │   DID       │            │
│  │  Registration│  │  Connection │  │  Creation   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│         │                │                │                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Profile   │  │  Identity   │  │  Contract   │            │
│  │  Completion │  │ Verification│  │  Signing    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│         │                │                │                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Active User Dashboard                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 User Journey Stages

1. **Discovery & Registration** - User learns about the system and creates initial account
2. **Wallet Connection** - User connects their blockchain wallet (MetaMask)
3. **DID Creation** - System creates decentralized identifier for the user
4. **Profile Completion** - User provides detailed profile information
5. **Identity Verification** - User completes KYC/AML verification
6. **Contract Signing Setup** - User configures signing preferences
7. **Active Usage** - User can participate in contract management

---

## 2. Step-by-Step Onboarding Process

### 2.1 Stage 1: Initial Registration

#### 2.1.1 Registration Form
```typescript
interface RegistrationData {
  // Basic Information
  email: string;
  password: string;
  confirmPassword: string;
  
  // Personal Information
  firstName: string;
  lastName: string;
  phoneNumber: string;
  
  // Organization Information
  organizationName: string;
  organizationType: 'TDP' | 'TDC' | 'CCRP';
  jobTitle: string;
  
  // Terms and Conditions
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
  marketingConsent: boolean;
}
```

#### 2.1.2 Registration API
```typescript
// Registration API Endpoint
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "organizationName": "Tech Corp",
  "organizationType": "TDC",
  "jobTitle": "Data Scientist",
  "acceptTerms": true,
  "acceptPrivacyPolicy": true,
  "marketingConsent": false
}

// Response
{
  "success": true,
  "userId": "user_123",
  "verificationEmailSent": true,
  "nextStep": "email_verification"
}
```

### 2.2 Stage 2: Email Verification

#### 2.2.1 Verification Process
```typescript
// Email verification endpoint
GET /api/v1/auth/verify-email?token=verification_token

// Response
{
  "success": true,
  "emailVerified": true,
  "nextStep": "wallet_connection"
}
```

#### 2.2.2 Verification Email Template
```html
<!-- Email Template -->
<div>
  <h2>Welcome to Contract Management System</h2>
  <p>Please verify your email address to continue:</p>
  <a href="https://app.example.com/verify-email?token={{token}}">
    Verify Email Address
  </a>
  <p>This link expires in 24 hours.</p>
</div>
```

### 2.3 Stage 3: Wallet Connection

#### 2.3.1 Wallet Connection Flow
```typescript
interface WalletConnectionData {
  walletAddress: string;
  walletType: 'metamask' | 'walletconnect' | 'coinbase';
  network: 'ethereum' | 'polygon' | 'arbitrum';
  publicKey: string;
}
```

#### 2.3.2 MetaMask Integration
```typescript
// Wallet connection service
export class WalletService {
  async connectMetaMask(): Promise<WalletConnectionData> {
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    const account = accounts[0];
    
    // Get public key (if supported)
    const publicKey = await this.getPublicKey(account);

    return {
      walletAddress: account,
      walletType: 'metamask',
      network: 'ethereum',
      publicKey: publicKey
    };
  }

  async getPublicKey(address: string): Promise<string> {
    // Implementation depends on wallet capabilities
    return '0x' + 'a'.repeat(64) + 'b'.repeat(64);
  }
}
```

### 2.4 Stage 4: DID Creation

#### 2.4.1 DID Creation Process
```typescript
// DID creation service
export class DIDOnboardingService {
  async createUserDID(userId: string, walletData: WalletConnectionData): Promise<DIDData> {
    // Create DID using Veramo
    const identifier = await this.agent.didManagerCreate({
      alias: `user-${userId}`,
      provider: 'did:ethr:goerli',
      kms: 'local'
    });

    // Link DID to user account
    await this.linkDIDToUser(userId, identifier.did);

    // Create initial verifiable credential
    const credential = await this.createIdentityCredential(identifier.did, walletData);

    return {
      did: identifier.did,
      credential: credential,
      walletAddress: walletData.walletAddress
    };
  }

  async createIdentityCredential(did: string, walletData: WalletConnectionData): Promise<VerifiableCredential> {
    return await this.agent.createVerifiableCredential({
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'IdentityCredential'],
        issuer: { id: did },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: did,
          walletAddress: walletData.walletAddress,
          walletType: walletData.walletType,
          network: walletData.network
        }
      },
      proofFormat: 'EthereumEip712Signature2021'
    });
  }
}
```

### 2.5 Stage 5: Profile Completion

#### 2.5.1 Profile Data Structure
```typescript
interface UserProfile {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationality: string;
  
  // Professional Information
  organizationName: string;
  organizationType: 'TDP' | 'TDC' | 'CCRP';
  jobTitle: string;
  department: string;
  employeeId: string;
  
  // Address Information
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  
  // Verification Information
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDocuments: KYCDocument[];
  
  // Preferences
  notificationPreferences: NotificationPreferences;
  privacySettings: PrivacySettings;
}
```

#### 2.5.2 Profile Completion API
```typescript
// Profile completion endpoint
PUT /api/v1/users/profile
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "nationality": "US",
  "organizationName": "Tech Corp",
  "jobTitle": "Data Scientist",
  "department": "AI/ML",
  "employeeId": "EMP123",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "US",
    "postalCode": "10001"
  }
}

// Response
{
  "success": true,
  "profileCompleted": true,
  "completionPercentage": 100,
  "nextStep": "kyc_verification"
}
```

---

## 3. Profile Management

### 3.1 Profile Dashboard

#### 3.1.1 Dashboard Components
```typescript
interface ProfileDashboard {
  // User Information
  userInfo: UserProfile;
  
  // Identity Information
  did: string;
  walletAddress: string;
  kycStatus: string;
  
  // Statistics
  contractsCreated: number;
  contractsSigned: number;
  totalValue: number;
  
  // Recent Activity
  recentActivity: ActivityItem[];
  
  // Quick Actions
  quickActions: QuickAction[];
}
```

#### 3.1.2 Profile Management API
```typescript
// Get user profile
GET /api/v1/users/profile

// Update profile
PUT /api/v1/users/profile

// Upload profile picture
POST /api/v1/users/profile/picture

// Update preferences
PUT /api/v1/users/preferences

// Get activity history
GET /api/v1/users/activity
```

### 3.2 DID Management Interface

#### 3.2.1 DID Dashboard
```typescript
interface DIDDashboard {
  // Primary DID
  primaryDID: {
    did: string;
    status: 'active' | 'inactive';
    created: string;
    lastUpdated: string;
  };
  
  // Verifiable Credentials
  credentials: VerifiableCredential[];
  
  // Key Management
  keys: KeyInfo[];
  
  // DID Document
  didDocument: DIDDocument;
}
```

#### 3.2.2 DID Operations
```typescript
// DID management API
export class DIDManagementAPI {
  // Get DID information
  async getDIDInfo(did: string): Promise<DIDInfo> {
    const doc = await this.agent.resolveDid({ didUrl: did });
    return this.formatDIDInfo(doc);
  }

  // Update DID document
  async updateDID(did: string, updates: DIDUpdate): Promise<void> {
    await this.agent.didManagerUpdate({
      did,
      document: updates
    });
  }

  // Rotate keys
  async rotateKeys(did: string): Promise<KeyRotationResult> {
    const newKey = await this.agent.keyManagerCreate({
      kms: 'local',
      type: 'Secp256k1'
    });

    await this.agent.didManagerAddKey({
      did,
      key: newKey
    });

    return { newKeyId: newKey.kid };
  }

  // Deactivate DID
  async deactivateDID(did: string): Promise<void> {
    await this.agent.didManagerDelete({ did });
  }
}
```

---

## 4. DID Creation & Management

### 4.1 DID Creation Workflow

#### 4.1.1 Step-by-Step Process
```typescript
export class DIDCreationWorkflow {
  async createDIDForUser(userId: string): Promise<DIDCreationResult> {
    // Step 1: Generate key pair
    const keyPair = await this.generateKeyPair();
    
    // Step 2: Create DID document
    const didDocument = await this.createDIDDocument(keyPair);
    
    // Step 3: Register on blockchain
    const did = await this.registerOnBlockchain(didDocument);
    
    // Step 4: Store in database
    await this.storeDIDInDatabase(userId, did, keyPair);
    
    // Step 5: Create initial credentials
    const credentials = await this.createInitialCredentials(did);
    
    return {
      did,
      keyPair,
      credentials,
      didDocument
    };
  }

  private async generateKeyPair(): Promise<KeyPair> {
    return await this.agent.keyManagerCreate({
      kms: 'local',
      type: 'Secp256k1'
    });
  }

  private async createDIDDocument(keyPair: KeyPair): Promise<DIDDocument> {
    return {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: `did:ethr:goerli:${keyPair.publicKey}`,
      verificationMethod: [{
        id: `did:ethr:goerli:${keyPair.publicKey}#controller`,
        type: 'EcdsaSecp256k1VerificationKey2019',
        controller: `did:ethr:goerli:${keyPair.publicKey}`,
        publicKeyHex: keyPair.publicKey
      }],
      authentication: [`did:ethr:goerli:${keyPair.publicKey}#controller`],
      assertionMethod: [`did:ethr:goerli:${keyPair.publicKey}#controller`]
    };
  }
}
```

### 4.2 Verifiable Credentials Management

#### 4.2.1 Credential Types
```typescript
enum CredentialType {
  IDENTITY = 'IdentityCredential',
  ORGANIZATION = 'OrganizationCredential',
  KYC = 'KYCCredential',
  CONTRACT_SIGNING = 'ContractSigningCredential',
  ROLE = 'RoleCredential'
}

interface CredentialTemplate {
  type: CredentialType;
  schema: string;
  requiredFields: string[];
  optionalFields: string[];
  expirationDays: number;
}
```

#### 4.2.2 Credential Issuance
```typescript
export class CredentialIssuanceService {
  async issueCredential(
    type: CredentialType,
    subject: string,
    claims: any
  ): Promise<VerifiableCredential> {
    const template = this.getCredentialTemplate(type);
    
    const credential = await this.agent.createVerifiableCredential({
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', type],
        issuer: { id: this.getIssuerDID() },
        issuanceDate: new Date().toISOString(),
        expirationDate: this.calculateExpiration(template.expirationDays),
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

  async verifyCredential(credential: VerifiableCredential): Promise<VerificationResult> {
    const result = await this.agent.verifyCredential({
      credential
    });

    return {
      verified: result.verified,
      errors: result.error ? [result.error] : [],
      warnings: result.warnings || []
    };
  }
}
```

---

## 5. Contract Signing Workflow

### 5.1 Contract Signing Process

#### 5.1.1 Signing Workflow
```typescript
interface ContractSigningWorkflow {
  // Step 1: Contract Review
  reviewContract(contractId: string): Promise<ContractDetails>;
  
  // Step 2: DID Authentication
  authenticateWithDID(did: string, signature: string): Promise<AuthResult>;
  
  // Step 3: Sign Contract
  signContract(contractId: string, signature: string): Promise<SigningResult>;
  
  // Step 4: Store on Blockchain
  storeOnBlockchain(contractId: string, signature: string): Promise<BlockchainResult>;
  
  // Step 5: Notify Parties
  notifyParties(contractId: string): Promise<void>;
}
```

#### 5.1.2 Contract Signing API
```typescript
// Contract signing endpoints
export class ContractSigningAPI {
  // Get contract for signing
  async getContractForSigning(contractId: string): Promise<ContractForSigning> {
    const contract = await this.contractService.getContract(contractId);
    const userDID = await this.getUserDID();
    
    return {
      contract,
      userDID,
      signingRequirements: this.getSigningRequirements(contract),
      estimatedGas: await this.estimateGas(contract)
    };
  }

  // Sign contract with DID
  async signContractWithDID(
    contractId: string, 
    did: string, 
    signature: string
  ): Promise<SigningResult> {
    // Verify DID ownership
    const isOwner = await this.verifyDIDOwnership(did, signature);
    if (!isOwner) {
      throw new Error('DID ownership verification failed');
    }

    // Create verifiable credential for signing
    const signingCredential = await this.createSigningCredential(did, contractId);

    // Store signature on blockchain
    const txHash = await this.storeSignatureOnBlockchain(contractId, did, signature);

    // Update contract status
    await this.updateContractStatus(contractId, 'signed', did);

    return {
      success: true,
      transactionHash: txHash,
      credential: signingCredential,
      timestamp: new Date().toISOString()
    };
  }

  // Verify contract signature
  async verifyContractSignature(
    contractId: string, 
    did: string, 
    signature: string
  ): Promise<VerificationResult> {
    // Verify signature on blockchain
    const isValid = await this.verifySignatureOnBlockchain(contractId, did, signature);
    
    // Verify DID credential
    const credential = await this.getSigningCredential(did, contractId);
    const credentialValid = await this.verifyCredential(credential);

    return {
      signatureValid: isValid,
      credentialValid: credentialValid.verified,
      timestamp: await this.getSignatureTimestamp(contractId, did)
    };
  }
}
```

### 5.2 Smart Contract Integration

#### 5.2.1 Contract Signing Smart Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContractSigning {
    struct Signature {
        string did;
        bytes signature;
        uint256 timestamp;
        bool verified;
    }

    struct Contract {
        string contractId;
        string contractHash;
        address[] parties;
        mapping(address => Signature) signatures;
        uint256 signatureCount;
        uint256 requiredSignatures;
        bool executed;
        uint256 createdAt;
        uint256 expiresAt;
    }

    mapping(bytes32 => Contract) public contracts;
    mapping(string => bytes32) public contractIdToHash;

    event ContractCreated(bytes32 indexed contractHash, string contractId);
    event ContractSigned(bytes32 indexed contractHash, string did, address signer);
    event ContractExecuted(bytes32 indexed contractHash);

    function createContract(
        string memory contractId,
        string memory contractHash,
        address[] memory parties,
        uint256 requiredSignatures,
        uint256 expiresAt
    ) external {
        bytes32 contractHashBytes = keccak256(abi.encodePacked(contractId));
        
        require(contractIdToHash[contractId] == 0, "Contract already exists");
        require(parties.length > 0, "At least one party required");
        require(requiredSignatures <= parties.length, "Invalid required signatures");

        Contract storage newContract = contracts[contractHashBytes];
        newContract.contractId = contractId;
        newContract.contractHash = contractHash;
        newContract.parties = parties;
        newContract.requiredSignatures = requiredSignatures;
        newContract.createdAt = block.timestamp;
        newContract.expiresAt = expiresAt;

        contractIdToHash[contractId] = contractHashBytes;

        emit ContractCreated(contractHashBytes, contractId);
    }

    function signContract(
        string memory contractId,
        string memory did,
        bytes memory signature
    ) external {
        bytes32 contractHash = contractIdToHash[contractId];
        require(contractHash != 0, "Contract not found");

        Contract storage contract = contracts[contractHash];
        require(block.timestamp < contract.expiresAt, "Contract expired");
        require(!contract.executed, "Contract already executed");

        // Verify signer is a party
        bool isParty = false;
        for (uint i = 0; i < contract.parties.length; i++) {
            if (contract.parties[i] == msg.sender) {
                isParty = true;
                break;
            }
        }
        require(isParty, "Not authorized to sign");

        // Verify signature not already provided
        require(!contract.signatures[msg.sender].verified, "Already signed");

        // Store signature
        contract.signatures[msg.sender] = Signature({
            did: did,
            signature: signature,
            timestamp: block.timestamp,
            verified: true
        });

        contract.signatureCount++;

        emit ContractSigned(contractHash, did, msg.sender);

        // Check if contract can be executed
        if (contract.signatureCount >= contract.requiredSignatures) {
            contract.executed = true;
            emit ContractExecuted(contractHash);
        }
    }

    function getContractSignatures(string memory contractId) 
        external 
        view 
        returns (Signature[] memory) 
    {
        bytes32 contractHash = contractIdToHash[contractId];
        require(contractHash != 0, "Contract not found");

        Contract storage contract = contracts[contractHash];
        Signature[] memory signatures = new Signature[](contract.parties.length);

        for (uint i = 0; i < contract.parties.length; i++) {
            signatures[i] = contract.signatures[contract.parties[i]];
        }

        return signatures;
    }
}
```

---

## 6. User Interface Design

### 6.1 Onboarding UI Components

#### 6.1.1 Multi-Step Form
```typescript
// React component for multi-step onboarding
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
  validation?: (data: any) => boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'registration',
    title: 'Create Account',
    description: 'Enter your basic information to get started',
    component: RegistrationForm,
    validation: (data) => data.email && data.password && data.acceptTerms
  },
  {
    id: 'wallet-connection',
    title: 'Connect Wallet',
    description: 'Connect your blockchain wallet to create your DID',
    component: WalletConnection,
    validation: (data) => data.walletAddress
  },
  {
    id: 'profile-completion',
    title: 'Complete Profile',
    description: 'Provide additional information for your profile',
    component: ProfileCompletion,
    validation: (data) => data.firstName && data.lastName && data.organizationName
  },
  {
    id: 'kyc-verification',
    title: 'Identity Verification',
    description: 'Verify your identity to access all features',
    component: KYCVerification,
    validation: (data) => data.kycStatus === 'verified'
  }
];
```

#### 6.1.2 Progress Tracking
```typescript
// Progress tracking component
interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  progressPercentage: number;
}

const OnboardingProgress: React.FC<{ progress: OnboardingProgress }> = ({ progress }) => {
  return (
    <div className="onboarding-progress">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress.progressPercentage}%` }}
        />
      </div>
      <div className="step-indicators">
        {onboardingSteps.map((step, index) => (
          <div 
            key={step.id}
            className={`step-indicator ${
              index < progress.currentStep ? 'completed' :
              index === progress.currentStep ? 'current' : 'pending'
            }`}
          >
            <span className="step-number">{index + 1}</span>
            <span className="step-title">{step.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 6.2 Profile Management UI

#### 6.2.1 Profile Dashboard
```typescript
// Profile dashboard component
const ProfileDashboard: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [did, setDid] = useState<string>('');
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    const [profileData, didData, credentialsData] = await Promise.all([
      api.getUserProfile(),
      api.getUserDID(),
      api.getUserCredentials()
    ]);

    setProfile(profileData);
    setDid(didData.did);
    setCredentials(credentialsData);
  };

  return (
    <div className="profile-dashboard">
      <div className="profile-header">
        <div className="profile-avatar">
          <img src={profile?.avatar || '/default-avatar.png'} alt="Profile" />
        </div>
        <div className="profile-info">
          <h1>{profile?.firstName} {profile?.lastName}</h1>
          <p>{profile?.organizationName} • {profile?.jobTitle}</p>
          <div className="did-info">
            <span className="did-label">DID:</span>
            <span className="did-value">{did}</span>
            <button onClick={() => copyToClipboard(did)}>Copy</button>
          </div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <h3>Contracts Created</h3>
          <p className="stat-number">{profile?.stats?.contractsCreated || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Contracts Signed</h3>
          <p className="stat-number">{profile?.stats?.contractsSigned || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Value</h3>
          <p className="stat-number">${profile?.stats?.totalValue || 0}</p>
        </div>
      </div>

      <div className="credentials-section">
        <h2>Verifiable Credentials</h2>
        <div className="credentials-grid">
          {credentials.map(credential => (
            <CredentialCard key={credential.id} credential={credential} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 7. Technical Implementation

### 7.1 Backend API Implementation

#### 7.1.1 User Onboarding Controller
```typescript
// User onboarding controller
@Controller('onboarding')
export class OnboardingController {
  constructor(
    private onboardingService: OnboardingService,
    private didService: DIDService,
    private profileService: ProfileService
  ) {}

  @Post('register')
  async register(@Body() registrationData: RegistrationData): Promise<RegistrationResult> {
    return await this.onboardingService.registerUser(registrationData);
  }

  @Post('connect-wallet')
  async connectWallet(@Body() walletData: WalletConnectionData): Promise<WalletConnectionResult> {
    return await this.onboardingService.connectWallet(walletData);
  }

  @Post('create-did')
  async createDID(@Body() didData: DIDCreationData): Promise<DIDCreationResult> {
    return await this.didService.createUserDID(didData.userId, didData.walletData);
  }

  @Put('complete-profile')
  async completeProfile(@Body() profileData: UserProfile): Promise<ProfileCompletionResult> {
    return await this.profileService.completeProfile(profileData);
  }

  @Post('verify-kyc')
  async verifyKYC(@Body() kycData: KYCData): Promise<KYCVerificationResult> {
    return await this.onboardingService.verifyKYC(kycData);
  }
}
```

#### 7.1.2 Profile Management Controller
```typescript
// Profile management controller
@Controller('profile')
export class ProfileController {
  constructor(
    private profileService: ProfileService,
    private didService: DIDService
  ) {}

  @Get()
  async getProfile(): Promise<UserProfile> {
    return await this.profileService.getUserProfile();
  }

  @Put()
  async updateProfile(@Body() profileData: Partial<UserProfile>): Promise<UserProfile> {
    return await this.profileService.updateProfile(profileData);
  }

  @Get('did')
  async getDID(): Promise<DIDInfo> {
    return await this.didService.getUserDID();
  }

  @Put('did')
  async updateDID(@Body() didUpdates: DIDUpdate): Promise<DIDInfo> {
    return await this.didService.updateDID(didUpdates);
  }

  @Get('credentials')
  async getCredentials(): Promise<VerifiableCredential[]> {
    return await this.profileService.getUserCredentials();
  }

  @Post('credentials/issue')
  async issueCredential(@Body() credentialData: CredentialIssueData): Promise<VerifiableCredential> {
    return await this.profileService.issueCredential(credentialData);
  }
}
```

### 7.2 Database Schema

#### 7.2.1 User Tables
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  date_of_birth DATE,
  nationality VARCHAR(3),
  organization_name VARCHAR(255),
  organization_type VARCHAR(10) CHECK (organization_type IN ('TDP', 'TDC', 'CCRP')),
  job_title VARCHAR(100),
  department VARCHAR(100),
  employee_id VARCHAR(50),
  kyc_status VARCHAR(20) DEFAULT 'pending',
  profile_completed BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User addresses
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(3) NOT NULL,
  postal_code VARCHAR(20),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User DIDs
CREATE TABLE user_dids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  did VARCHAR(255) UNIQUE NOT NULL,
  did_document JSONB NOT NULL,
  wallet_address VARCHAR(42),
  wallet_type VARCHAR(20),
  network VARCHAR(20),
  is_primary BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verifiable credentials
CREATE TABLE verifiable_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credential_id VARCHAR(255) UNIQUE NOT NULL,
  credential_type VARCHAR(50) NOT NULL,
  issuer_did VARCHAR(255) NOT NULL,
  subject_did VARCHAR(255) NOT NULL,
  credential_data JSONB NOT NULL,
  proof JSONB NOT NULL,
  issued_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KYC documents
CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(100),
  document_file_url VARCHAR(500),
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. Security Considerations

### 8.1 Data Protection

#### 8.1.1 PII Encryption
```typescript
// PII encryption service
export class PIIEncryptionService {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.PII_ENCRYPTION_KEY;
  }

  async encryptPII(data: any): Promise<string> {
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  async decryptPII(encryptedData: string): Promise<any> {
    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }
}
```

#### 8.1.2 Access Control
```typescript
// Access control middleware
export const profileAccessControl = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.userId || req.body.userId;
  const requestingUserId = req.user.id;

  // Users can only access their own profile
  if (userId !== requestingUserId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
};
```

### 8.2 Audit Logging

#### 8.2.1 Audit Trail
```typescript
// Audit logging service
export class AuditService {
  async logProfileAccess(userId: string, action: string, details: any): Promise<void> {
    const auditLog = {
      id: crypto.randomUUID(),
      userId,
      action,
      details,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      sessionId: req.session.id
    };

    await this.auditRepository.create(auditLog);
  }

  async logDIDOperation(userId: string, did: string, operation: string, details: any): Promise<void> {
    await this.logProfileAccess(userId, `DID_${operation}`, {
      did,
      operation,
      details
    });
  }
}
```

---

**User Onboarding Guide End** 