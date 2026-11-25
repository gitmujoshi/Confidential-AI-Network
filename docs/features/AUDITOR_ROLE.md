# Auditor role — Merkle audit & contract review

The screen walk is the [Auditor user guide](../guides/role-user-guides/AUDITOR_USER_GUIDE.md). This page is the API and the seal rule.

## Purpose

**Auditor** is a read-only role for compliance / incident reviewers. Auditors can:

- List all contracts
- Open the Ricardian **contract** a training job was based on
- Inspect a **Merkle audit tree** whose root is sealed when a model is registered (or on the first auditor review of a completed training job)
- Verify a leaf against that saved root. The result shows the sealed leaf, the calculated root, the published root, and the check time

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
| POST | `/api/auditor/verify-proof` | Body: `{ contractId, nodeId }`. Checks the sealed leaf against the saved root. |
| POST | `/api/auditor/provenance/:id/tombstone` | Append-only PII tombstone. Body: `{ reason, redactedFields? }`. The Merkle leaf stays. The same id returns the first record. This is not an external SRO filing. The gateway path is `POST /v1/aichain/provenance/{id}/tombstone`. |

Also: contract provenance report and job provenance allow `Auditor` (same as AppAdmin read paths).

## Review flow

1. The operator registers `partyType: Auditor`. The public form lists TDP, TDC, and TSP only.
2. The auditor signs in and opens `/auditor/dashboard`.
3. `GET /api/auditor/contracts` returns every contract. Search is by contract id, status, TDC name, or DEPA ID.
4. `GET /api/auditor/contracts/:id/audit-tree` builds the leaves from the provenance report: one `contract` leaf, one `training_job` leaf per job, one `scitt_claim` leaf per claim, and one `ai_model` leaf per registered model.
5. If a training job on that contract is `COMPLETED` and no `CONTRACT_AUDIT` root exists, this read seals the root. Registering a model seals it the same way. The root is written once to `merkle_trees`. Later edits do not replace it.
6. `POST /api/auditor/verify-proof` with `{ contractId, nodeId }` checks the stored inclusion proof against that saved root. The response includes the sealed payload, the leaf hash, the calculated root, the published root, `verifiedAt`, and `currentRecordMatches`.
7. `/auditor/contracts/:id` is the Ricardian contract. The auditor does not sign it and does not start training.
8. `POST /api/auditor/provenance/:id/tombstone` appends a PII tombstone in this database. The leaf stays. Repeating the id returns the first record.

An unsealed tree is the current rows only. **Verify** is available after the root is published. **Rebuild tree** reloads the sealed root.

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
- The audit root is written once to `merkle_trees` (`tree_type = CONTRACT_AUDIT`) with leaf payloads and proofs in `provenance_nodes`. A later edit to the contract or job does not replace that root. Verify reports whether the current database row still matches the sealed leaf.
- Trees are built from durable DB evidence (not the disabled in-memory `/api/provenance` session store).
- Related: [MERKLE_TREE_PROVENANCE_IMPLEMENTATION.md](../security/MERKLE_TREE_PROVENANCE_IMPLEMENTATION.md)
