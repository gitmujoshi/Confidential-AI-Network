# MetaMask Setup Guide

## Overview
This Contract Management application requires MetaMask to connect to the blockchain and manage your digital identity securely. MetaMask is a browser extension that acts as your digital wallet.

### MetaMask Integration Overview
```mermaid
graph TB
    subgraph "Browser Environment"
        EXT[MetaMask Extension]
        APP[Contract Management App]
        BROWSER[Browser Storage]
    end
    
    subgraph "Blockchain Network"
        BC[Hardhat Node]
        SC[Smart Contracts]
        TX[Transactions]
    end
    
    subgraph "Security Layer"
        PK[Private Keys]
        SIG[Digital Signatures]
        AUTH[Authentication]
    end
    
    EXT <--> APP
    EXT --> PK
    PK --> SIG
    SIG --> TX
    APP --> BC
    BC --> SC
    SC --> TX
    
    style EXT fill:#ff6b35
    style APP fill:#e1f5fe
    style BC fill:#e8f5e8
    style PK fill:#fff3e0
```

## Why MetaMask is Required

1. **Digital Identity Management**: MetaMask securely stores your private keys and manages your blockchain identity
2. **Contract Signing**: You need to sign contracts and transactions with your digital signature
3. **Security**: Your private keys never leave your device, ensuring maximum security
4. **Blockchain Interaction**: MetaMask connects you to the Ethereum blockchain where smart contracts are deployed

### MetaMask Security Model
```mermaid
graph LR
    subgraph "User Device"
        A[Private Key Storage]
        B[Local Signing]
        C[Secure Communication]
    end
    
    subgraph "MetaMask Functions"
        D[Key Management]
        E[Transaction Signing]
        F[Network Connection]
    end
    
    subgraph "Application Benefits"
        G[No Key Transmission]
        H[Client-Side Security]
        I[User Control]
    end
    
    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
```

## Installation Steps

### Step 1: Install MetaMask
1. Visit [metamask.io](https://metamask.io/download/)
2. Click "Download" for your browser (Chrome, Firefox, Edge, or Brave)
3. Follow the installation prompts

### Step 2: Create or Import a Wallet
1. Open MetaMask extension
2. Click "Create a new wallet" or "Import wallet" if you have existing keys
3. Set up a strong password
4. Write down your 12-word recovery phrase and store it securely
5. Confirm your recovery phrase

### Step 3: Connect to Local Network
1. In MetaMask, click the network dropdown (usually shows "Ethereum Mainnet")
2. Click "Add network"
3. Add the following details:
   - **Network Name**: Local Hardhat
   - **New RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH
4. Click "Save"

### Installation Flow
```mermaid
flowchart TD
    A[Visit MetaMask.io] --> B[Download Extension]
    B --> C[Install Extension]
    C --> D[Create New Wallet]
    D --> E[Set Password]
    E --> F[Generate Recovery Phrase]
    F --> G[Confirm Recovery Phrase]
    G --> H[Add Local Network]
    H --> I[Import Test Accounts]
    I --> J[MetaMask Ready]
    
    subgraph "Network Configuration"
        K[Network Name: Local Hardhat]
        L[RPC URL: http://127.0.0.1:8545]
        M[Chain ID: 31337]
        N[Currency: ETH]
    end
    
    H --> K
    H --> L
    H --> M
    H --> N
```

### Step 4: Import Test Accounts
The application comes with pre-configured test accounts. You can import them using their private keys:

**TDP Account (Training Data Provider):**
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

**TDC Account (Training Data Consumer):**
- Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

**CCRP Account (Confidential Clean Room Provider):**
- Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- Private Key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

To import:
1. In MetaMask, click the account icon
2. Click "Import account"
3. Paste the private key
4. Click "Import"

### Test Account Setup
```mermaid
graph TD
    subgraph "Test Accounts"
        TDP[TDP Account<br/>0xf39Fd6e...<br/>Training Data Provider]
        TDC[TDC Account<br/>0x709979...<br/>Training Data Consumer]
        CCRP[CCRP Account<br/>0x3C44Cd...<br/>Confidential Clean Room Provider]
    end
    
    subgraph "Account Functions"
        A[Create Contracts]
        B[Sign Contracts]
        C[Review Contracts]
        D[Manage Datasets]
    end
    
    TDP --> D
    TDP --> B
    TDC --> A
    TDC --> B
    CCRP --> C
    CCRP --> B
    
    style TDP fill:#e3f2fd
    style TDC fill:#f3e5f5
    style CCRP fill:#e8f5e8
```

## Using the Application

### Step 1: Start the Services
Make sure all services are running:
```bash
# Terminal 1: Blockchain node
cd blockchain && npx hardhat node

# Terminal 2: Backend server
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm start
```

### Step 2: Connect Your Wallet
1. Open the application in your browser (http://localhost:3000)
2. Click "Connect Wallet" in the top-right corner
3. MetaMask will prompt you to connect - click "Connect"
4. Select the account you want to use

### Step 3: Register Your Account
1. If this is your first time, you'll need to register
2. Click "User Registration" in the navigation
3. Fill in your details and click "Register"
4. MetaMask will prompt you to sign the registration transaction

### Wallet Connection Flow
```mermaid
sequenceDiagram
    participant U as User
    participant APP as Application
    participant MM as MetaMask
    participant BC as Blockchain
    
    U->>APP: Click "Connect Wallet"
    APP->>MM: Request Connection
    MM->>U: Show Connection Dialog
    U->>MM: Approve Connection
    MM->>APP: Wallet Connected
    APP->>BC: Get Account Address
    BC->>APP: Return Address
    APP->>U: Show Connected Status
    
    U->>APP: Register Account
    APP->>MM: Request Signature
    MM->>U: Show Sign Dialog
    U->>MM: Approve Signature
    MM->>APP: Signed Transaction
    APP->>BC: Submit Registration
    BC->>APP: Registration Complete
    APP->>U: Account Registered
```

## Role-Based Access

The application has three user roles:

### TDC (Training Data Consumer)
- Can create contracts
- Select datasets and CCRP parties
- Manage contract lifecycle

### TDP (Training Data Provider)
- Can sign contracts as data provider
- View contracts they're involved in
- Receive notifications

### CCRP (Confidential Clean Room Provider)
- Can sign contracts as compliance reviewer
- Review contract terms
- Approve or reject contracts

### Role-Based Access Control
```mermaid
graph TB
    subgraph "User Roles"
        TDC[TDC - Training Data Consumer<br/>Contract Initiator]
        TDP[TDP - Training Data Provider<br/>Dataset Owner]
        CCRP[CCRP - Confidential Clean Room Provider<br/>Compliance Checker]
    end
    
    subgraph "Permissions"
        P1[Create Contracts]
        P2[Sign Contracts]
        P3[View Datasets]
        P4[Manage Datasets]
        P5[Select CCRP]
        P6[Review Contracts]
        P7[Complete Contracts]
    end
    
    TDC --> P1
    TDC --> P3
    TDC --> P5
    TDC --> P7
    TDP --> P2
    TDP --> P4
    CCRP --> P2
    CCRP --> P6
    
    style TDC fill:#e3f2fd
    style TDP fill:#f3e5f5
    style CCRP fill:#e8f5e8
```

### User Journey by Role
```mermaid
journey
    title User Journey by Role
    section TDC Journey
      Connect Wallet: 5: TDC
      Browse Datasets: 4: TDC
      Create Contract: 5: TDC
      Select CCRP: 3: TDC
      Monitor Status: 4: TDC
      Complete Contract: 5: TDC
    section TDP Journey
      Connect Wallet: 5: TDP
      View Datasets: 4: TDP
      Auto-Sign Contracts: 5: TDP
      Monitor Revenue: 4: TDP
    section CCRP Journey
      Connect Wallet: 5: CCRP
      Review Requests: 4: CCRP
      Sign Contracts: 5: CCRP
      Monitor Compliance: 4: CCRP
```

## Troubleshooting

### MetaMask Not Detected
- Make sure MetaMask is installed and enabled
- Refresh the page
- Check if MetaMask is unlocked

### Wrong Network
- Ensure you're connected to the Local Hardhat network
- Check that the RPC URL is correct: http://127.0.0.1:8545

### Transaction Failures
- Make sure you have enough ETH in your test account
- Check that the blockchain node is running
- Verify the contract is deployed

### Connection Issues
- Ensure all services are running (blockchain, backend, frontend)
- Check browser console for errors
- Try refreshing the page

### Troubleshooting Decision Tree
```mermaid
flowchart TD
    A[Issue Occurs] --> B{Issue Type?}
    B -->|MetaMask Not Detected| C[Check Installation]
    B -->|Wrong Network| D[Configure Network]
    B -->|Transaction Failures| E[Check Resources]
    B -->|Connection Issues| F[Check Services]
    
    C --> G{Extension Installed?}
    G -->|No| H[Install MetaMask]
    G -->|Yes| I[Check if Enabled]
    
    D --> J{Network Correct?}
    J -->|No| K[Add Local Network]
    J -->|Yes| L[Check RPC URL]
    
    E --> M{Sufficient ETH?}
    M -->|No| N[Import Test Account]
    M -->|Yes| O[Check Blockchain Node]
    
    F --> P{All Services Running?}
    P -->|No| Q[Start Services]
    P -->|Yes| R[Check Console Errors]
    
    H --> S[Issue Resolved]
    I --> S
    K --> S
    L --> S
    N --> S
    O --> S
    Q --> S
    R --> S
```

## Security Notes

- **Never share your private keys** with anyone
- **Store your recovery phrase** in a secure location
- **Use different accounts** for testing and production
- **Keep MetaMask updated** for security patches

### Security Best Practices
```mermaid
graph LR
    subgraph "Key Security"
        A[Never Share Private Keys]
        B[Secure Recovery Phrase]
        C[Use Hardware Wallets]
    end
    
    subgraph "Account Security"
        D[Separate Test/Prod]
        E[Strong Passwords]
        F[Regular Updates]
    end
    
    subgraph "Transaction Security"
        G[Verify Details]
        H[Check Gas Fees]
        I[Confirm Addresses]
    end
    
    A --> J[Maximum Security]
    B --> J
    C --> J
    D --> K[Account Protection]
    E --> K
    F --> K
    G --> L[Safe Transactions]
    H --> L
    I --> L
```

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all services are running
3. Ensure MetaMask is properly configured
4. Check the application logs for backend errors

### Support Flow
```mermaid
flowchart TD
    A[Issue Reported] --> B[Check Browser Console]
    B --> C{Error Found?}
    C -->|Yes| D[Analyze Error]
    C -->|No| E[Check Services]
    
    D --> F{Error Type?}
    F -->|MetaMask| G[Check Extension]
    F -->|Network| H[Check Connection]
    F -->|Transaction| I[Check Blockchain]
    
    E --> J{All Services Running?}
    J -->|No| K[Start Missing Service]
    J -->|Yes| L[Check Logs]
    
    G --> M[Issue Resolved]
    H --> M
    I --> M
    K --> M
    L --> M
```

For development issues, refer to the main README.md file for technical setup instructions. 