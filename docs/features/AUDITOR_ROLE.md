# Auditor role — Merkle audit & contract review

## Purpose

**Auditor** is a read-only role for compliance / incident reviewers. Auditors can:

- List all contracts
- Open the Ricardian **contract** a training job was based on
- Inspect a **Merkle audit tree** (root + leaf inclusion proofs) derived from durable provenance evidence
- Verify inclusion proofs via API

Auditors **cannot** sign contracts, start training, deploy models, or manage users.

## Setup

```bash
# 1. Add ENUM value + seed demo user
node backend/scripts/migration/add-auditor-party-type.js
node backend/scripts/dev/seed-auditor-user.js

# 2. Ensure Keycloak realm role exists, then sync users
cd backend && node scripts/source/setup-keycloak-realm.js
npm run keycloak:sync
```

Demo login (after Keycloak sync): `auditor@example.com` / sync default password (often `TestNewPassword123!` from `KEYCLOAK_SYNC_DEFAULT_PASSWORD`) → `/auditor/dashboard`

If you need a known local password before sync, set it in Keycloak Admin or re-run seed then reset password via Keycloak.

## APIs

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/auditor/contracts` | List contracts |
| GET | `/api/auditor/contracts/:id/provenance-report` | Full provenance JSON |
| GET | `/api/auditor/contracts/:id/audit-tree` | Merkle tree + leaf proofs |
| POST | `/api/auditor/verify-proof` | Body: `{ proof, rootHash? }` |

Also: contract provenance report and job provenance allow `Auditor` (same as AppAdmin read paths).

## UI

- `/auditor/dashboard` — contract list + links
- `/auditor/contracts/:id/audit-tree` — tree inspector + verify
- `/auditor/contracts/:id` — contract detail (read-only in practice)

## Product tour / E2E

Included at the end of the lifecycle screenshot tour (steps 25–27):

```bash
cd frontend
BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:lifecycle-guide   # full path
BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:auditor-guide     # auditor screens only
```

Public product tour: [product-tour/#auditor](https://gitmujoshi.github.io/Confidential-AI-Network/product-tour/#auditor)

## Implementation notes

- Leaves are built from contract fields, training jobs, SCITT claims, and registered models (`auditorAuditTreeService`).
- Trees are computed on read from durable DB evidence (not the disabled in-memory `/api/provenance` session store).
- Related: [MERKLE_TREE_PROVENANCE_IMPLEMENTATION.md](../security/MERKLE_TREE_PROVENANCE_IMPLEMENTATION.md)
