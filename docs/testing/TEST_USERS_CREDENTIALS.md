# Test Users Credentials

This file lists **test users we have actually verified can log in** against the local stack.

## ✅ Verified working users (last verified: 2026-04-23)

### Core fixed test users (recommended for automated tests)

| Party | Email | Password | Notes | Status |
|------|-------|----------|-------|--------|
| TDP | tdp-test@example.com | TestPassword123! | Stable test user used by test scripts | ✅ Login OK |
| TDC | tdc-test@example.com | TestPassword123! | Stable test user used by test scripts | ✅ Login OK |
| CCRP | ccrp-test@example.com | TestPassword123! | Stable test user used by test scripts | ✅ Login OK |
| AppAdmin | admin-test@example.com | TestPassword123! | Stable admin test user | ✅ Login OK |

### Timestamped user (verified during debugging)

| Party | Email | Password | Notes | Status |
|------|-------|----------|-------|--------|
| TDP | tdp.medical.2025-09-05t20-39-55@test.com | O-?@4+n47!jA | Re-created after DB/Keycloak purge | ✅ Login OK |

### E2E default users (used by Playwright global setup)

| Party | Email | Password | Notes | Status |
|------|-------|----------|-------|--------|
| TDC | tdc.healthcare.2025-09-05t20-39-55@test.com | TestNewPassword123! | Primary E2E TDC | ✅ Login OK |
| TDP | tdp.e2e@test.com | TestNewPassword123! | E2E TDP (dataset owner) | ✅ Login OK |
| CCRP | ccrp.e2e@test.com | TestNewPassword123! | E2E CCRP | ✅ Login OK |
| AppAdmin | appadmin.e2e@test.com | TestNewPassword123! | E2E AppAdmin for admin-only routes | ✅ Login OK |

## ❌ Known non-working credentials

These were explicitly tested and **failed** on 2026-04-23 (do not use):

| Email | Password tried | Result |
|------|-----------------|--------|
| tdp-test@example.com | password123 | ❌ AUTHENTICATION_FAILED |
| tdc-test@example.com | password123 | ❌ AUTHENTICATION_FAILED |
| ccrp-test@example.com | password123 | ❌ AUTHENTICATION_FAILED |
| admin-test@example.com | password123 | ❌ AUTHENTICATION_FAILED |

## 🧪 How to re-test quickly

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tdp-test@example.com","password":"TestPassword123!"}'
```

## 🔧 If a user “stops working”

If login returns `USER_NOT_FOUND`, it usually means the user is **missing from the local DB** even if Keycloak is running.

- Recreate via API: `POST /api/auth/register`
- Or re-sync IAM to match DB (backend): `cd backend && npm run ***REMOVED-KEYCLOAK_DB_PASSWORD***:resync`
