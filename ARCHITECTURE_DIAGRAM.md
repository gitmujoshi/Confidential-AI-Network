# System Architecture Diagram
## Secure Contract Management System

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        FRONTEND LAYER (React)                                              │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   Dashboard     │  │   Contracts     │  │   Datasets      │  │   Users         │  │ Notifications   │   │
│  │                 │  │                 │  │                 │  │                 │  │                 │   │
│  │ • Overview      │  │ • List View     │  │ • Browse        │  │ • User Mgmt     │  │ • Real-time     │   │
│  │ • Statistics    │  │ • Detail View   │  │ • Create        │  │ • Role Mgmt     │  │ • Email         │   │
│  │ • Quick Actions │  │ • Signing       │  │ • Edit          │  │ • Permissions   │  │ • In-app        │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│           │                     │                     │                     │                     │         │
│           └─────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┘         │
│                                 │                     │                     │                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                    CLIENT-SIDE SERVICES                                               │   │
│  │                                                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │   │
│  │  │   API Service   │  │  Ethers.js      │  │  React Query    │  │  State Mgmt     │                │   │
│  │  │                 │  │                 │  │                 │  │                 │                │   │
│  │  │ • HTTP Client   │  │ • Wallet Mgmt   │  │ • Data Fetching │  │ • Local State   │                │   │
│  │  │ • Auth Headers  │  │ • Transaction   │  │ • Caching       │  │ • UI State      │                │   │
│  │  │ • Error Handling│  │ • Signing       │  │ • Background    │  │ • Form State    │                │   │
│  │  │ • Interceptors  │  │ • Gas Estimation│  │ • Sync          │  │ • Navigation    │                │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           │ HTTPS/API Calls
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        BACKEND LAYER (Node.js/Express)                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                    API ROUTES                                                         │   │
│  │                                                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │   │
│  │  │  /api/contracts │  │ /api/datasets   │  │   /api/users    │  │ /api/notifications│               │   │
│  │  │                 │  │                 │  │                 │  │                 │                │   │
│  │  │ • Create        │  │ • CRUD          │  │ • CRUD          │  │ • Send          │                │   │
│  │  │ • Sign (Secure) │  │ • Search        │  │ • Registration  │  │ • List          │                │   │
│  │  │ • List          │  │ • Categories    │  │ • Roles         │  │ • Mark Read     │                │   │
│  │  │ • Details       │  │ • Stats         │  │ • Permissions   │  │ • Email         │                │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                    BUSINESS LOGIC                                                     │   │
│  │                                                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │   │
│  │  │ Contract Service│  │ Dataset Service │  │  User Service   │  │Notification Svc │                │   │
│  │  │                 │  │                 │  │                 │  │                 │                │   │
│  │  │ • Validation    │  │ • Validation    │  │ • Validation    │  │ • Email         │                │   │
│  │  │ • Workflow      │  │ • Processing    │  │ • Registration  │  │ • Templates     │                │   │
│  │  │ • Status Mgmt   │  │ • Categories    │  │ • Role Mgmt     │  │ • Queuing       │                │   │
│  │  │ • Notifications │  │ • Pricing       │  │ • Permissions   │  │ • Delivery      │                │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                    BLOCKCHAIN SERVICE                                                  │   │
│  │                                                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │   │
│  │  │ Contract Mgmt   │  │  Party Mgmt     │  │ Transaction Mgmt│  │  Network Mgmt   │                │   │
│  │  │                 │  │                 │  │                 │  │                 │                │   │
│  │  │ • Deploy        │  │ • Register      │  │ • Sign          │  │ • Connection    │                │   │
│  │  │ • Create        │  │ • Verify        │  │ • Broadcast     │  │ • Health Check  │                │   │
│  │  │ • Sign          │  │ • Roles         │  │ • Confirm       │  │ • Gas Estimation│                │   │
│  │  │ • Complete      │  │ • Permissions   │  │ • Receipt       │  │ • Nonce Mgmt    │                │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           │ Database Queries
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        DATA LAYER (PostgreSQL)                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │     Users       │  │   Contracts     │  │    Datasets     │  │ Notifications   │  │   Metadata      │   │
│  │                 │  │                 │  │                 │  │                 │  │                 │   │
│  │ • wallet_address│  │ • contract_id   │  │ • dataset_id    │  │ • type          │  │ • audit_logs    │   │
│  │ • party_type    │  │ • blockchain_id │  │ • name          │  │ • title         │  │ • system_config│   │
│  │ • name          │  │ • status        │  │ • description   │  │ • message       │  │ • user_sessions│   │
│  │ • email         │  │ • price         │  │ • category      │  │ • metadata      │  │ • api_logs      │   │
│  │ • is_registered │  │ • parties       │  │ • price         │  │ • user_id       │  │ • performance   │   │
│  │ • created_at    │  │ • signing_status│  │ • owner_id      │  │ • created_at    │  │ • analytics     │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           │ JSON-RPC Calls
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      BLOCKCHAIN LAYER (Hardhat/Ethereum)                                  │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                    SMART CONTRACTS                                                    │   │
│  │                                                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                              ContractManager.sol                                                 │ │   │
│  │  │                                                                                                 │ │   │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │ │   │
│  │  │  │ Contract State  │  │ Party Mgmt      │  │ Signing Logic   │  │ Access Control  │            │ │   │
│  │  │  │                 │  │                 │  │                 │  │                 │            │ │   │
│  │  │  │ • contractId    │  │ • registerParty │  │ • signContract  │  │ • onlyOwner     │            │ │   │
│  │  │  │ • parties       │  │ • isRegistered  │  │ • complete      │  │ • onlyParty     │            │ │   │
│  │  │  │ • terms         │  │ • partyTypes    │  │ • cancel        │  │ • onlyContract  │            │ │   │
│  │  │  │ • status        │  │ • permissions   │  │ • signatures    │  │ • modifiers     │            │ │   │
│  │  │  │ • price         │  │ • roles         │  │ • timestamps    │  │ • validations   │            │ │   │
│  │  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘            │ │   │
│  │  └─────────────────────────────────────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                    NETWORK LAYER                                                      │   │
│  │                                                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │   │
│  │  │   Hardhat Node  │  │   JSON-RPC      │  │   WebSocket     │  │   Accounts      │                │   │
│  │  │                 │  │                 │  │                 │  │                 │                │   │
│  │  │ • Local Network │  │ • HTTP API      │  │ • Real-time     │  │ • Test Accounts │                │   │
│  │  │ • Auto Mining   │  │ • Method Calls  │  │ • Events        │  │ • Private Keys  │                │   │
│  │  │ • Block Time    │  │ • Response      │  │ • Subscriptions │  │ • Balances      │                │   │
│  │  │ • Gas Limit     │  │ • Error Handling│  │ • Notifications │  │ • Nonces        │                │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │  Frontend   │    │   Backend   │    │ Blockchain  │
│             │    │             │    │             │    │             │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ 1. Enter Private │                  │                  │
       │    Key           │                  │                  │
       │                  │                  │                  │
       │                  │ 2. Create        │                  │
       │                  │    Transaction   │                  │
       │                  │                  │                  │
       │                  │ 3. Sign Locally  │                  │
       │                  │    with Ethers   │                  │
       │                  │                  │                  │
       │                  │ 4. Send Signed   │                  │
       │                  │    Transaction   │                  │
       │                  │                  │                  │
       │                  │                  │ 5. Validate &    │
       │                  │                  │    Broadcast     │
       │                  │                  │                  │
       │                  │                  │ 6. Submit to     │
       │                  │                  │    Blockchain    │
       │                  │                  │                  │
       │                  │                  │                  │ 7. Mine Block
       │                  │                  │                  │
       │                  │                  │ 8. Return        │
       │                  │                  │    Receipt       │
       │                  │                  │                  │
       │                  │ 9. Update UI     │                  │
       │                  │    with Status   │                  │
       │                  │                  │                  │
       │ 10. See Success  │                  │                  │
       │     Message      │                  │                  │
       │                  │                  │                  │
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SECURITY LAYERS                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                    CLIENT-SIDE SECURITY                                               │   │
│  │                                                                                                     │   │
│  │  • Private keys never transmitted over network                                                      │   │
│  │  • All cryptographic operations in browser memory                                                    │   │
│  │  • Memory cleared after signing                                                                      │   │
│  │  • Input validation and sanitization                                                                 │   │
│  │  • HTTPS encryption for all communications                                                           │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                    NETWORK SECURITY                                                   │   │
│  │                                                                                                     │   │
│  │  • HTTPS/TLS encryption                                                                              │   │
│  │  • Rate limiting on API endpoints                                                                    │   │
│  │  • CORS configuration                                                                                │   │
│  │  • Request validation and sanitization                                                               │   │
│  │  • DDoS protection                                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                    APPLICATION SECURITY                                               │   │
│  │                                                                                                     │   │
│  │  • Role-based access control (RBAC)                                                                  │   │
│  │  • Input validation and sanitization                                                                 │   │
│  │  • SQL injection prevention                                                                          │   │
│  │  • XSS protection                                                                                    │   │
│  │  • CSRF protection                                                                                   │   │
│  │  • Audit logging                                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                    BLOCKCHAIN SECURITY                                                │   │
│  │                                                                                                     │   │
│  │  • Smart contract access control                                                                     │   │
│  │  • Multi-signature requirements                                                                      │   │
│  │  • Immutable contract terms                                                                          │   │
│  │  • Gas optimization                                                                                  │   │
│  │  • Reentrancy protection                                                                             │   │
│  │  • Overflow protection                                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                    DATA SECURITY                                                      │   │
│  │                                                                                                     │   │
│  │  • Database encryption at rest                                                                       │   │
│  │  • Connection encryption (SSL/TLS)                                                                   │   │
│  │  • Access control and permissions                                                                    │   │
│  │  • Regular backups                                                                                   │   │
│  │  • Data retention policies                                                                           │   │
│  │  • Audit trails                                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

### Contract Creation Flow
```
1. User (TDC) → Frontend: Select dataset
2. Frontend → Backend: GET /api/datasets/:id
3. Backend → Database: Query dataset details
4. Database → Backend: Return dataset data
5. Backend → Frontend: Return dataset information
6. User → Frontend: Fill contract details
7. Frontend → Backend: POST /api/contracts
8. Backend → Blockchain: Deploy contract
9. Blockchain → Backend: Return contract ID
10. Backend → Database: Store contract
11. Backend → Notification Service: Send notifications
12. Backend → Frontend: Return contract details
13. Frontend → User: Show success message
```

### Contract Signing Flow
```
1. User → Frontend: Click "Sign Contract"
2. Frontend → Backend: GET /api/contracts/:id/signing-data
3. Backend → Blockchain: Get transaction data
4. Blockchain → Backend: Return transaction data
5. Backend → Frontend: Return signing data
6. User → Frontend: Enter private key
7. Frontend → Ethers.js: Create wallet and sign
8. Ethers.js → Frontend: Return signed transaction
9. Frontend → Backend: POST /api/contracts/:id/sign
10. Backend → Blockchain: Broadcast transaction
11. Blockchain → Backend: Return transaction receipt
12. Backend → Database: Update contract status
13. Backend → Notification Service: Send notifications
14. Backend → Frontend: Return success response
15. Frontend → User: Show signing confirmation
```

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Lazy load components
- **Caching**: React Query for API data
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: Compress and lazy load images

### Backend Optimization
- **Database Indexing**: Optimize query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: Prevent abuse and overload

### Blockchain Optimization
- **Gas Optimization**: Efficient smart contract functions
- **Batch Operations**: Group multiple operations
- **Event Listening**: Use events for real-time updates
- **Network Selection**: Use appropriate networks

### Monitoring and Logging
- **Application Logs**: Track user actions and errors
- **Performance Metrics**: Monitor response times
- **Error Tracking**: Capture and analyze errors
- **Health Checks**: Monitor service availability 