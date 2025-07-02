# Role-Based UI Implementation Guide

## Overview

The Contract Management System now implements role-based user interfaces that customize the experience based on user types: TDC (Training Data Consumer), TDP (Training Data Provider), and CCRP (Confidential Clean Room Provider).

### System Architecture Overview
```mermaid
graph TB
    subgraph "User Interface Layer"
        UI[React UI]
        WC[Wallet Connect]
        RB[Role-Based Components]
    end
    
    subgraph "Authentication Layer"
        AUTH[User Context]
        WALLET[MetaMask Integration]
        ROLE[Role Verification]
    end
    
    subgraph "Business Logic Layer"
        TDC[TDC Workflows]
        TDP[TDP Workflows]
        CCRP[CCRP Workflows]
    end
    
    subgraph "Data Layer"
        API[Backend API]
        BC[Blockchain]
        DB[(Database)]
    end
    
    UI --> AUTH
    WC --> WALLET
    RB --> ROLE
    AUTH --> TDC
    AUTH --> TDP
    AUTH --> CCRP
    TDC --> API
    TDP --> API
    CCRP --> API
    API --> DB
    API --> BC
```

## User Roles and Responsibilities

### TDC (Training Data Consumer)
- **Primary Role**: Initiates contracts by selecting datasets and CCRP providers
- **UI Features**:
  - Can access "Create Contract" functionality
  - Views datasets available for purchase
  - Manages their initiated contracts
  - Selects CCRP providers for contracts
  - Completes contracts when training is finished

### TDP (Training Data Provider)
- **Primary Role**: Provides datasets and automatically signs contracts
- **UI Features**:
  - Views their owned datasets
  - Automatically signs contracts when created (no manual action needed)
  - Reviews contract requests
  - Manages dataset listings

### CCRP (Confidential Clean Room Provider)
- **Primary Role**: Provides secure environments and signs contracts
- **UI Features**:
  - Reviews contract requests where they are selected
  - Signs contracts to approve participation
  - Views contracts they are involved in

### Role Hierarchy and Permissions
```mermaid
graph TD
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
    end
    
    TDC --> P1
    TDC --> P3
    TDC --> P5
    TDP --> P2
    TDP --> P4
    CCRP --> P2
    CCRP --> P6
    
    style TDC fill:#e3f2fd
    style TDP fill:#f3e5f5
    style CCRP fill:#e8f5e8
```

## Implementation Details

### 1. User Authentication & Context

**File**: `frontend/src/contexts/UserContext.js`

- Manages wallet connection and user authentication
- Provides role-based helper functions (`isTDC`, `isTDP`, `isCCRP`)
- Handles user data fetching based on wallet address

```javascript
const { currentUser, isTDC, isTDP, isCCRP, isAuthenticated } = useUser();
```

### Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant W as Wallet
    participant C as UserContext
    participant A as API
    participant B as Blockchain
    
    U->>W: Connect MetaMask
    W->>C: Wallet Connected
    C->>A: Get User by Wallet
    A->>B: Verify Address
    B->>A: Address Valid
    A->>C: User Data
    C->>U: Role-Based UI
```

### 2. Role-Based Navigation

**File**: `frontend/src/components/Layout.js`

- Dynamic menu items based on user role
- Only TDC users see "Create Contract" option
- Wallet connection status displayed in sidebar
- User role and wallet address shown in navigation

### Navigation Structure
```mermaid
graph TD
    subgraph "Common Navigation"
        DASH[Dashboard]
        CONTRACTS[Contracts]
        DATASETS[Datasets]
        NOTIF[Notifications]
    end
    
    subgraph "TDC Navigation"
        CREATE[Create Contract]
        MY_CONTRACTS[My Contracts]
    end
    
    subgraph "TDP Navigation"
        MY_DATASETS[My Datasets]
        PENDING[Pending Requests]
    end
    
    subgraph "CCRP Navigation"
        REVIEW[Review Contracts]
        APPROVALS[Pending Approvals]
    end
    
    DASH --> CREATE
    DASH --> MY_DATASETS
    DASH --> REVIEW
    CONTRACTS --> MY_CONTRACTS
    CONTRACTS --> PENDING
    CONTRACTS --> APPROVALS
    
    style CREATE fill:#e3f2fd
    style MY_DATASETS fill:#f3e5f5
    style REVIEW fill:#e8f5e8
```

### 3. Contract Creation Flow

**File**: `frontend/src/pages/CreateContract.js`

- **Access Control**: Only TDC users can access
- **Process**:
  1. TDC selects a dataset
  2. TDC configures contract details (price, duration, terms)
  3. TDC optionally selects a CCRP
  4. Contract is created with TDP automatically signed
  5. CCRP is notified if selected

### Contract Creation Workflow
```mermaid
flowchart TD
    A[TDC User] --> B[Browse Datasets]
    B --> C[Select Dataset]
    C --> D[Configure Contract]
    D --> E[Select CCRP<br/>Optional]
    E --> F[Review Contract]
    F --> G[Submit Contract]
    G --> H[TDP Auto-Sign]
    H --> I{CCRP Selected?}
    I -->|Yes| J[Notify CCRP]
    I -->|No| K[Contract Active]
    J --> L[CCRP Review]
    L --> M[CCRP Sign]
    M --> K
    
    style A fill:#e3f2fd
    style H fill:#f3e5f5
    style M fill:#e8f5e8
    style K fill:#c8e6c9
```

### 4. Contract Management

**File**: `frontend/src/pages/ContractDetail.js`

- **Role-Based Actions**:
  - **TDP**: Can sign contracts (automatically done at creation)
  - **TDC**: Can select CCRP, complete contracts
  - **CCRP**: Can sign contracts when selected
  - **All**: Can cancel contracts if not completed

### Contract Management Flow
```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> PendingTDP: TDC Creates
    PendingTDP --> PendingCCRP: TDP Auto-Signs
    PendingCCRP --> Active: CCRP Signs
    PendingTDP --> Active: No CCRP Selected
    Active --> Completed: TDC Completes
    Active --> Cancelled: Any Party Cancels
    Completed --> [*]
    Cancelled --> [*]
    
    note right of Draft
        Contract created by TDC
    end note
    
    note right of PendingTDP
        Waiting for TDP signature
        (Auto-signed at creation)
    end note
    
    note right of PendingCCRP
        Waiting for CCRP signature
        (if CCRP selected)
    end note
    
    note right of Active
        All parties signed
        Contract is active
    end note
```

### 5. Dashboard Customization

**File**: `frontend/src/pages/Dashboard.js`

- **Role-Based Welcome Messages**:
  - TDC: "As a Training Data Consumer, you can browse datasets and create contracts"
  - TDP: "As a Training Data Provider, you can manage your datasets and review contract requests"
  - CCRP: "As a Confidential Clean Room Provider, you can review and sign contracts"

- **Role-Based Statistics**:
  - TDC: Shows "My Contracts" count
  - TDP: Shows "My Datasets" count
  - CCRP: Shows "Pending Approvals" count

### Dashboard Components
```mermaid
graph TB
    subgraph "Dashboard Layout"
        HEADER[Header with Role]
        STATS[Statistics Cards]
        ACTIONS[Quick Actions]
        RECENT[Recent Activity]
    end
    
    subgraph "TDC Dashboard"
        TDC_STATS[My Contracts Count<br/>Available Datasets<br/>Pending Signatures]
        TDC_ACTIONS[Create Contract<br/>Browse Datasets<br/>View Contracts]
    end
    
    subgraph "TDP Dashboard"
        TDP_STATS[My Datasets Count<br/>Active Contracts<br/>Revenue Generated]
        TDP_ACTIONS[Manage Datasets<br/>View Contracts<br/>Analytics]
    end
    
    subgraph "CCRP Dashboard"
        CCRP_STATS[Pending Approvals<br/>Active Contracts<br/>Compliance Rate]
        CCRP_ACTIONS[Review Contracts<br/>Sign Contracts<br/>Reports]
    end
    
    HEADER --> STATS
    STATS --> ACTIONS
    ACTIONS --> RECENT
    
    STATS --> TDC_STATS
    STATS --> TDP_STATS
    STATS --> CCRP_STATS
    
    ACTIONS --> TDC_ACTIONS
    ACTIONS --> TDP_ACTIONS
    ACTIONS --> CCRP_ACTIONS
```

## Contract Workflow

### 1. Contract Initiation (TDC)
```
TDC → Selects Dataset → Configures Contract → (Optional) Selects CCRP → Creates Contract
```

### 2. Contract Signing Flow
```
Contract Created → TDP Auto-Signed → (If CCRP selected) CCRP Signs → Contract Active
```

### 3. Contract Completion
```
Contract Active → TDC Completes Training → Contract Completed
```

### Complete Contract Lifecycle
```mermaid
sequenceDiagram
    participant TDC as TDC User
    participant TDP as TDP User
    participant CCRP as CCRP User
    participant BC as Blockchain
    participant API as Backend API
    
    TDC->>API: Create Contract
    API->>BC: Deploy Contract
    BC->>TDP: Auto-Sign (TDP)
    BC->>API: Contract Created
    
    alt CCRP Selected
        API->>CCRP: Send Notification
        CCRP->>API: Review Contract
        CCRP->>BC: Sign Contract
        BC->>API: Contract Active
    else No CCRP
        API->>TDC: Contract Active
    end
    
    TDC->>API: Complete Contract
    API->>BC: Mark Complete
    BC->>API: Contract Completed
```

## Security Features

### Wallet-Based Authentication
- All actions require connected wallet
- User identity verified through blockchain
- No manual private key input required
- MetaMask integration for secure signing

### Role Verification
- Backend validates user roles before allowing actions
- Frontend shows/hides features based on user role
- Contract parties verified against blockchain records

### Security Architecture
```mermaid
graph TB
    subgraph "Client Security"
        A[Wallet Connection]
        B[Client-Side Signing]
        C[Role Validation]
        D[Input Sanitization]
    end
    
    subgraph "Network Security"
        E[JWT Authentication]
        F[HTTPS/TLS]
        G[API Rate Limiting]
        H[CORS Protection]
    end
    
    subgraph "Blockchain Security"
        I[Smart Contract Validation]
        J[Transaction Signing]
        K[Immutable Records]
        L[Public Key Verification]
    end
    
    A --> E
    B --> J
    C --> I
    D --> G
    E --> F
    J --> K
    I --> L
```

## API Endpoints

### User Management
- `GET /api/users/wallet/:walletAddress` - Get user by wallet address
- `GET /api/users` - Get all users
- `POST /api/users/register` - Register new user

### Contract Management
- `POST /api/contracts` - Create contract (TDC only)
- `GET /api/contracts/:contractId` - Get contract details
- `POST /api/contracts/:contractId/sign` - Sign contract
- `POST /api/contracts/:contractId/select-ccrp` - Select CCRP (TDC only)

### API Architecture
```mermaid
graph LR
    subgraph "Frontend"
        UI[React UI]
        CONTEXT[User Context]
    end
    
    subgraph "Backend API"
        AUTH[Auth Middleware]
        ROUTES[API Routes]
        VALIDATION[Role Validation]
    end
    
    subgraph "Database"
        DB[(PostgreSQL)]
        CACHE[Redis Cache]
    end
    
    subgraph "Blockchain"
        BC[Smart Contracts]
        NODE[Hardhat Node]
    end
    
    UI --> CONTEXT
    CONTEXT --> AUTH
    AUTH --> ROUTES
    ROUTES --> VALIDATION
    VALIDATION --> DB
    VALIDATION --> BC
    BC --> NODE
```

## Frontend Components

### Core Components
- `UserContext` - Manages authentication and user state
- `Layout` - Role-based navigation and wallet connection
- `CreateContract` - Contract creation (TDC only)
- `ContractDetail` - Contract management with role-based actions
- `Dashboard` - Role-based statistics and welcome messages

### Component Architecture
```mermaid
graph TD
    subgraph "Context Layer"
        USER_CTX[UserContext]
        WALLET_CTX[WalletContext]
    end
    
    subgraph "Layout Layer"
        LAYOUT[Layout]
        NAV[Navigation]
        SIDEBAR[Sidebar]
    end
    
    subgraph "Page Layer"
        DASHBOARD[Dashboard]
        CONTRACTS[Contracts]
        CREATE[CreateContract]
        DETAIL[ContractDetail]
    end
    
    subgraph "Component Layer"
        FORMS[Forms]
        CARDS[Cards]
        MODALS[Modals]
        BUTTONS[Buttons]
    end
    
    USER_CTX --> LAYOUT
    WALLET_CTX --> LAYOUT
    LAYOUT --> NAV
    LAYOUT --> SIDEBAR
    NAV --> DASHBOARD
    NAV --> CONTRACTS
    NAV --> CREATE
    CONTRACTS --> DETAIL
    CREATE --> FORMS
    DETAIL --> CARDS
    DASHBOARD --> MODALS
```

### Key Features
- **Wallet Connection**: MetaMask integration with automatic user detection
- **Role-Based UI**: Different interfaces for different user types
- **Real-time Updates**: Contract status updates and notifications
- **Secure Signing**: Client-side transaction signing with MetaMask

## Usage Examples

### For TDC Users
1. Connect wallet (MetaMask)
2. Browse available datasets
3. Create new contract
4. Select CCRP (optional)
5. Monitor contract status
6. Complete contract when training is done

### For TDP Users
1. Connect wallet (MetaMask)
2. View owned datasets
3. Review incoming contract requests
4. Contracts are automatically signed at creation
5. Monitor contract status

### For CCRP Users
1. Connect wallet (MetaMask)
2. Review contract requests where selected
3. Sign contracts to approve participation
4. Monitor active contracts

### User Journey Flow
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

## Technical Implementation

### State Management
- React Context for user authentication
- React Query for data fetching and caching
- Local state for UI interactions

### Blockchain Integration
- Ethers.js for blockchain interactions
- MetaMask for wallet connection
- Smart contract integration for contract management

### Error Handling
- Wallet connection errors
- Contract creation failures
- Network connectivity issues
- Role-based access violations

### Error Handling Flow
```mermaid
flowchart TD
    A[Error Occurs] --> B{Error Type?}
    B -->|Wallet| C[Wallet Connection Error]
    B -->|Network| D[Network Error]
    B -->|Contract| E[Contract Error]
    B -->|Role| F[Access Denied]
    
    C --> G[Show MetaMask Guide]
    D --> H[Show Network Status]
    E --> I[Show Contract Details]
    F --> J[Show Role Requirements]
    
    G --> K[Retry Connection]
    H --> L[Check Services]
    I --> M[Review Contract]
    J --> N[Switch Role]
    
    K --> O[Error Resolved]
    L --> O
    M --> O
    N --> O
```

## Future Enhancements

1. **Advanced Role Management**: Sub-roles and permissions
2. **Multi-Signature Support**: Multiple signers per role
3. **Contract Templates**: Predefined contract structures
4. **Audit Trail**: Complete action history
5. **Mobile Support**: Mobile wallet integration
6. **Off-chain Storage**: IPFS integration for large datasets

### Enhancement Roadmap
```mermaid
gantt
    title Development Roadmap
    dateFormat  YYYY-MM-DD
    section Current
    Role-Based UI    :done, current, 2024-01-01, 2024-01-15
    Wallet Integration :done, current, 2024-01-01, 2024-01-15
    section Phase 2
    Multi-Signature   :active, phase2, 2024-01-16, 2024-02-01
    Contract Templates :phase2, 2024-01-16, 2024-02-01
    section Phase 3
    Audit Trail      :phase3, 2024-02-02, 2024-02-15
    Mobile Support   :phase3, 2024-02-02, 2024-02-15
    section Phase 4
    IPFS Integration :phase4, 2024-02-16, 2024-03-01
    Advanced Roles   :phase4, 2024-02-16, 2024-03-01
```

## Troubleshooting

### Common Issues
1. **Wallet Not Connected**: Ensure MetaMask is installed and connected
2. **Role Not Recognized**: Verify user registration with correct party type
3. **Contract Creation Failed**: Check blockchain connection and gas fees
4. **Signing Failed**: Ensure wallet has sufficient funds for gas

### Debug Information
- Check browser console for detailed error messages
- Verify blockchain node is running on port 8545
- Ensure backend server is running on port 5001
- Check user registration in database

### Troubleshooting Decision Tree
```mermaid
flowchart TD
    A[Issue Reported] --> B{UI Issue?}
    B -->|Yes| C[Check Browser Console]
    B -->|No| D{Connection Issue?}
    
    C --> E[Check React Errors]
    D --> F[Check Network Tab]
    
    E --> G{Wallet Error?}
    F --> H{API Error?}
    
    G -->|Yes| I[Check MetaMask]
    G -->|No| J[Check User Context]
    
    H -->|Yes| K[Check Backend Logs]
    H -->|No| L[Check Blockchain]
    
    I --> M[Verify Wallet Connection]
    J --> N[Check User Registration]
    K --> O[Check API Status]
    L --> P[Check Hardhat Node]
    
    M --> Q[Issue Resolved]
    N --> Q
    O --> Q
    P --> Q
``` 