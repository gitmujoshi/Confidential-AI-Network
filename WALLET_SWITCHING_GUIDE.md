# Wallet Switching Guide

## Overview

The Contract Management system supports three different user roles, each with their own wallet:
- **TDP (Training Data Provider)**: Can create and manage datasets
- **TDC (Training Data Consumer)**: Can browse datasets and create contracts  
- **CCRP (Contract Compliance & Risk Provider)**: Can review and sign contracts

To switch between roles, you need to switch wallets in MetaMask and refresh the application.

### Wallet Switching Overview
```mermaid
graph TB
    subgraph "User Roles"
        TDP[TDP - Data Provider<br/>0xf39Fd6e...]
        TDC[TDC - Data Consumer<br/>0x709979...]
        CCRP[CCRP - Review Party<br/>0x3C44Cd...]
    end
    
    subgraph "MetaMask Accounts"
        MM1[Account 1<br/>TDP Wallet]
        MM2[Account 2<br/>TDC Wallet]
        MM3[Account 3<br/>CCRP Wallet]
    end
    
    subgraph "Application State"
        UI[User Interface]
        CONTEXT[User Context]
        API[Backend API]
    end
    
    TDP --> MM1
    TDC --> MM2
    CCRP --> MM3
    
    MM1 --> UI
    MM2 --> UI
    MM3 --> UI
    
    UI --> CONTEXT
    CONTEXT --> API
    
    style TDP fill:#e3f2fd
    style TDC fill:#f3e5f5
    style CCRP fill:#e8f5e8
```

## How Wallet Switching Works

### Technical Background

1. **MetaMask Account Management**: MetaMask maintains a list of imported accounts
2. **Active Account**: Only one account can be "active" at a time in MetaMask
3. **Event Limitations**: MetaMask's `accountsChanged` event only fires when:
   - User manually switches accounts in MetaMask
   - User connects/disconnects MetaMask
   - User adds/removes accounts
   - **It does NOT fire when clicking on already-imported accounts**

### The Problem

When you click on an already-imported account in MetaMask to make it active, the application doesn't automatically detect this change because MetaMask doesn't fire the `accountsChanged` event.

### The Solution

The application provides a manual refresh mechanism that:
1. Detects the current active MetaMask account
2. Fetches the corresponding user data from the backend
3. Updates the UI to reflect the new role

### Account Detection Flow
```mermaid
sequenceDiagram
    participant U as User
    participant MM as MetaMask
    participant APP as Application
    participant API as Backend
    
    U->>MM: Switch Account
    MM->>APP: accountsChanged Event (if new)
    APP->>API: Get User by Wallet
    API->>APP: User Data
    APP->>U: Update UI
    
    Note over U,APP: Manual Refresh Flow
    U->>APP: Click "Refresh App"
    APP->>MM: Get Current Account
    MM->>APP: Current Account Address
    APP->>API: Get User by Wallet
    API->>APP: User Data
    APP->>U: Update UI
```

## Step-by-Step Wallet Switching Process

### Prerequisites

1. **MetaMask Installed**: Make sure MetaMask is installed in your browser
2. **Test Wallets Imported**: The test wallets should already be imported in MetaMask
3. **Application Running**: The Contract Management app should be running

### Step 1: Open Wallet Switcher

1. Click the **"Switch Wallet"** button in the top navigation bar
2. The wallet switcher dialog will open showing available test wallets

### Step 2: Select Target Wallet

1. Click on the wallet you want to switch to (TDP, TDC, or CCRP)
2. The private key will be automatically copied to your clipboard
3. You'll see instructions for the next steps

### Step 3: Switch Account in MetaMask

1. **Open MetaMask** (click the MetaMask extension icon)
2. **Look for the account** in your account list
3. **Click on the account** to make it the active one
4. **Note**: If you see a "duplicate account" error, that's normal - the account is already imported

### Step 4: Refresh the Application

1. **Click the "Refresh App" button** in the wallet switcher dialog
2. The application will:
   - Detect the current MetaMask account
   - Fetch the corresponding user data
   - Update the UI to show the new role

### Step 5: Verify the Switch

1. **Check the top navigation bar** - it should show the new user name and role
2. **Check the debug dialog** - click the bug icon (🐛) to see detailed information
3. **Verify menu items** - different roles have access to different features

### Wallet Switching Workflow
```mermaid
flowchart TD
    A[Click Switch Wallet] --> B[Open Wallet Switcher]
    B --> C[Select Target Wallet]
    C --> D[Copy Private Key]
    D --> E[Switch Account in MetaMask]
    E --> F[Click Refresh App]
    F --> G[Detect Current Account]
    G --> H[Fetch User Data]
    H --> I[Update UI]
    I --> J[Verify Switch]
    
    subgraph "MetaMask Actions"
        K[Open MetaMask]
        L[Find Account]
        M[Click to Activate]
    end
    
    E --> K
    K --> L
    L --> M
    
    subgraph "Verification Steps"
        N[Check Navigation Bar]
        O[Check Debug Dialog]
        P[Verify Menu Items]
    end
    
    J --> N
    N --> O
    O --> P
```

## Troubleshooting

### Issue: App Still Shows Old Role After Switching

**Symptoms**: You switched accounts in MetaMask but the app still shows the previous role.

**Solutions**:
1. **Click "Refresh App"** in the wallet switcher dialog
2. **Check the debug dialog** to see what account is being detected
3. **Verify the account is active** in MetaMask (it should be highlighted)
4. **Try refreshing the page** if the manual refresh doesn't work

### Issue: "Duplicate Account" Error in MetaMask

**Symptoms**: When trying to import a wallet, MetaMask shows "KeyringController - The account you are trying to import is a duplicate"

**Solution**: This is normal! The account is already imported. Just click on it in MetaMask to make it active.

### Issue: No Accounts Found

**Symptoms**: The app shows "No accounts found" or similar error

**Solutions**:
1. **Unlock MetaMask** - Make sure MetaMask is unlocked
2. **Check network** - Ensure MetaMask is connected to the correct network (localhost:8545)
3. **Import accounts** - If no test accounts are imported, import them using the private keys

### Issue: Debug Dialog Shows Wrong Account

**Symptoms**: The debug dialog shows a different account than what's active in MetaMask

**Solutions**:
1. **Refresh the app** using the "Refresh App" button
2. **Check MetaMask** - Ensure the correct account is active
3. **Clear browser cache** - Try clearing browser cache and refreshing

### Troubleshooting Decision Tree
```mermaid
flowchart TD
    A[Issue Occurs] --> B{Issue Type?}
    B -->|Old Role Still Shows| C[Click Refresh App]
    B -->|Duplicate Account| D[Click Account in MetaMask]
    B -->|No Accounts Found| E[Check MetaMask Status]
    B -->|Wrong Account| F[Verify Active Account]
    
    C --> G{UI Updated?}
    G -->|No| H[Refresh Page]
    G -->|Yes| I[Issue Resolved]
    
    D --> J[Account Activated]
    J --> I
    
    E --> K{MetaMask Unlocked?}
    K -->|No| L[Unlock MetaMask]
    K -->|Yes| M[Check Network]
    
    F --> N{Account Active?}
    N -->|No| O[Switch Account]
    N -->|Yes| P[Clear Cache]
    
    H --> I
    L --> I
    M --> I
    O --> I
    P --> I
```

## Test Wallet Information

### Available Test Wallets

| Role | Name | Address | Private Key |
|------|------|---------|-------------|
| TDP | TDP Provider 1 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| TDC | TDC Consumer 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| CCRP | CCRP Provider 1 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

### Test Wallet Setup
```mermaid
graph TD
    subgraph "Test Wallets"
        TDP[TDP Provider 1<br/>0xf39Fd6e...<br/>Data Provider Role]
        TDC[TDC Consumer 1<br/>0x709979...<br/>Data Consumer Role]
        CCRP[CCRP Provider 1<br/>0x3C44Cd...<br/>Review Party Role]
    end
    
    subgraph "Wallet Functions"
        A[Create Datasets]
        B[Browse Datasets]
        C[Create Contracts]
        D[Sign Contracts]
        E[Review Contracts]
        F[Manage Contracts]
    end
    
    TDP --> A
    TDP --> D
    TDP --> F
    TDC --> B
    TDC --> C
    TDC --> D
    TDC --> F
    CCRP --> D
    CCRP --> E
    CCRP --> F
    
    style TDP fill:#e3f2fd
    style TDC fill:#f3e5f5
    style CCRP fill:#e8f5e8
```

### Role-Specific Features

#### TDP (Training Data Provider)
- Create and manage datasets
- View contracts where you're the TDP
- Access to dataset management features

#### TDC (Training Data Consumer)
- Browse available datasets
- Create contracts with TDPs
- Select CCRP for contract review
- View contracts where you're the TDC

#### CCRP (Contract Compliance & Risk Provider)
- Review contracts assigned to you
- Sign contracts after review
- View contracts where you're the CCRP

### Role-Based Feature Matrix
```mermaid
graph LR
    subgraph "TDP Features"
        TDP1[Create Datasets]
        TDP2[Manage Datasets]
        TDP3[View TDP Contracts]
        TDP4[Auto-Sign Contracts]
    end
    
    subgraph "TDC Features"
        TDC1[Browse Datasets]
        TDC2[Create Contracts]
        TDC3[Select CCRP]
        TDC4[View TDC Contracts]
        TDC5[Complete Contracts]
    end
    
    subgraph "CCRP Features"
        CCRP1[Review Contracts]
        CCRP2[Sign Contracts]
        CCRP3[View CCRP Contracts]
        CCRP4[Provide Feedback]
    end
    
    style TDP1 fill:#e3f2fd
    style TDC1 fill:#f3e5f5
    style CCRP1 fill:#e8f5e8
```

## Technical Implementation Details

### Account Detection Flow

1. **Initial Load**: App detects current MetaMask account on page load
2. **Event Listening**: App listens for MetaMask `accountsChanged` events
3. **Manual Refresh**: User can manually trigger account detection
4. **Data Fetching**: App fetches user data from backend based on wallet address
5. **UI Update**: App updates interface based on user role

### Technical Architecture
```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[User Interface]
        CONTEXT[User Context]
        WALLET[Wallet Service]
    end
    
    subgraph "MetaMask Integration"
        MM[MetaMask Extension]
        EVENTS[Event Listeners]
        ACCOUNTS[Account Management]
    end
    
    subgraph "Backend Layer"
        API[Backend API]
        DB[(Database)]
        AUTH[Authentication]
    end
    
    UI --> CONTEXT
    CONTEXT --> WALLET
    WALLET --> MM
    MM --> EVENTS
    EVENTS --> ACCOUNTS
    WALLET --> API
    API --> DB
    API --> AUTH
```

### Backend Integration

- **User Lookup**: Backend looks up users by wallet address (case-insensitive)
- **Role Validation**: Backend validates user roles and permissions
- **Data Caching**: Frontend caches user data to improve performance

### Backend Integration Flow
```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend
    participant D as Database
    
    F->>B: GET /api/users/wallet/:address
    B->>D: Query User by Wallet
    D->>B: User Data
    B->>F: User Response
    
    Note over F,D: Role Validation
    F->>B: POST /api/contracts (if TDC)
    B->>D: Validate User Role
    D->>B: Role Confirmed
    B->>F: Contract Created
```

### Security Considerations

- **Private Keys**: Never share private keys - they're only used for importing accounts
- **Account Validation**: Backend validates wallet addresses and user permissions
- **Session Management**: User sessions are tied to wallet addresses

### Security Architecture
```mermaid
graph LR
    subgraph "Client Security"
        A[Private Key Storage]
        B[Local Signing]
        C[Account Validation]
    end
    
    subgraph "Network Security"
        D[HTTPS Communication]
        E[JWT Tokens]
        F[API Authentication]
    end
    
    subgraph "Backend Security"
        G[Wallet Validation]
        H[Role Verification]
        I[Session Management]
    end
    
    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
```

## Best Practices

1. **Always use the "Refresh App" button** after switching accounts in MetaMask
2. **Check the debug dialog** if you encounter issues
3. **Keep MetaMask unlocked** while using the application
4. **Use the correct network** (localhost:8545 for development)
5. **Don't share private keys** - they're for testing only

### Best Practices Flow
```mermaid
flowchart TD
    A[Switch Wallet] --> B[Use Refresh App Button]
    B --> C[Check Debug Dialog]
    C --> D{Issues Found?}
    D -->|Yes| E[Follow Troubleshooting]
    D -->|No| F[Verify Role Change]
    F --> G[Use Correct Network]
    G --> H[Keep MetaMask Unlocked]
    H --> I[Don't Share Private Keys]
    I --> J[Wallet Switch Complete]
    
    E --> K[Issue Resolved]
    K --> J
```

## Support

If you continue to experience issues:

1. **Check the browser console** for error messages
2. **Verify MetaMask connection** to the correct network
3. **Try refreshing the page** completely
4. **Check the debug dialog** for detailed information
5. **Ensure all services are running** (blockchain node, backend, frontend)

### Support Flow
```mermaid
flowchart TD
    A[Issue Reported] --> B[Check Browser Console]
    B --> C{Error Found?}
    C -->|Yes| D[Analyze Error]
    C -->|No| E[Check MetaMask Connection]
    
    D --> F{Error Type?}
    F -->|Network| G[Check Network Settings]
    F -->|Account| H[Check Account Status]
    F -->|API| I[Check Backend Services]
    
    E --> J{Connected to Correct Network?}
    J -->|No| K[Switch to Local Network]
    J -->|Yes| L[Check Services Status]
    
    G --> M[Issue Resolved]
    H --> M
    I --> M
    K --> M
    L --> M
``` 