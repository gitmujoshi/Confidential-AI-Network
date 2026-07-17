# Working Test Users

## Current Test Users with Working Login

### 1. UI TDC User (TDC - Training Data Consumer)
- **Email:** `uitdc@example.com`
- **Password:** `Test123!`
- **User ID:** 40
- **Role:** TDC (Training Data Consumer)
- **Wallet Address:** None (wallet optional)
- **Status:** ✅ Working login
- **Last Login:** 2025-07-13T14:48:11.015Z
- **Description:** TDC user created via API for UI-like flow

### 2. Test Registration User (TDP - Training Data Provider)
- **Email:** `testregistration@example.com`
- **Password:** `Test123!`
- **User ID:** 38
- **Role:** TDP (Training Data Provider)
- **Wallet Address:** None (wallet optional)
- **Status:** ✅ Working login
- **Last Login:** 2025-07-13T13:35:09.150Z
- **Description:** Test user created via registration flow

### 3. Test TDC User (TDC - Training Data Consumer)
- **Email:** `testtdc@example.com`
- **Password:** `Test123!`
- **User ID:** 39
- **Role:** TDC (Training Data Consumer)
- **Wallet Address:** `0xca3ee39af71bf000000000000000000000000000`
- **Status:** ✅ Working login
- **Last Login:** 2025-07-13T13:40:07.163Z
- **Description:** Test TDC user with wallet address

## Test Scenarios

### Scenario 1: TDC without Wallet (UI TDC User)
- **Use Case:** Testing contract creation for users without blockchain wallets
- **User:** `uitdc@example.com`
- **Features:** 
  - Can register and login without wallet
  - Can create Ricardian contracts
  - Supports modern authentication flow

### Scenario 2: TDP without Wallet (Test Registration User)
- **Use Case:** Testing dataset ownership and contract signing for TDPs without wallets
- **User:** `testregistration@example.com`
- **Features:**
  - Can register and login without wallet
  - Can own datasets
  - Can sign contracts

### Scenario 3: TDC with Wallet (Test TDC User)
- **Use Case:** Testing blockchain integration for users with wallets
- **User:** `testtdc@example.com`
- **Features:**
  - Has wallet address
  - Can perform blockchain transactions
  - Full blockchain integration

## Contract Creation Test

### Successfully Created Contract
- **Contract ID:** `CONTRACT-1752418010504`
- **Created By:** UI TDC User (`uitdc@example.com`)
- **TDP:** Test User (ID: 27)
- **Dataset:** Test Dataset (TEST-001)
- **Status:** `PENDING_CCRP_APPROVAL`
- **Price:** $50.00
- **Duration:** 30 days

## API Testing Commands

### Login Test
```bash
# Test UI TDC User login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "uitdc@example.com", "password": "Test123!"}'

# Test TDP User login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testregistration@example.com", "password": "Test123!"}'

# Test TDC with wallet login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "testtdc@example.com", "password": "Test123!"}'
```

### Contract Creation Test
```bash
# Create contract (requires fresh token)
TOKEN="your_access_token_here"
curl -X POST http://localhost:5001/api/contracts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tdpId": 27,
    "datasetId": "TEST-001",
    "price": 50,
    "duration": 30,
    "termsAndConditions": "Test Ricardian contract terms."
  }'
```

## Notes

- **Rate Limiting:** The system has rate limiting on login attempts (wait ~40 seconds between attempts)
- **Password Reset:** Use Keycloak admin API to reset passwords if needed
- **Wallet Optional:** Users can work without wallet addresses
- **Ricardian Contracts:** System supports full Ricardian contract creation and management
- **Authentication:** Uses Keycloak for authentication with JWT tokens

## Troubleshooting

If login fails:
1. Check if user exists in database
2. Reset password in Keycloak: `node -e "const keycloakService = require('./services/keycloakService'); const service = new keycloakService(); service.setUserPasswordByEmail('email@example.com', 'Test123!', false).then(console.log).catch(console.error);"`
3. Wait for rate limit to reset (40 seconds)
4. Try login again 