# CAN Quickstart (Local MVP)

This repo now includes a **parallel** Confidential AI Network (CAN) MVP path under `/api/can/*`.

## What this is (and isn’t)
- **Is**: a minimal Job Coordination Service (JCS) + CCR session records + simulated attestation bundle + escrow state machine + SSE events.
- **Is not**: real TEE attestation, attested TLS, or principal certificate auth yet. Those are Phase 2–3 in `docs/CAN_GAP_DECISION_MEMO.md`.

## API namespaces
- Portal/legacy: `/api/*` (Keycloak + existing workflows)
- CAN (parallel): `/api/can/jcs/*` and `/api/can/ccr/*`

## Required headers (MVP)
All CAN endpoints require:
- `X-CAN-Principal-Id: <string>`

## Environment variables (optional)
- `CAN_PLATFORM_SIGNING_SECRET`: HMAC secret used to sign the simulated attestation bundle. Defaults to `dev-can-signing-secret`.
- `CAN_WEBHOOK_URLS`: Comma-separated webhook URLs to receive CAN events (MVP).
- `CAN_WEBHOOK_SECRET`: HMAC secret for `X-CAN-Signature` (defaults to `dev-can-webhook-secret`).
- `CAN_WEBHOOK_TIMEOUT_MS`: Per-request timeout (defaults to 5000).
- `CAN_WEBHOOK_MAX_ATTEMPTS`: Retry count (defaults to 3).
- `CAN_ESCROW_SWEEPER_ENABLED`: Set to `false` to disable background deadline enforcement.
- `CAN_ESCROW_SWEEPER_INTERVAL_MS`: Sweeper interval (defaults to 5000).

## Try it (example curl sequence)

Prereq: ensure the backend you’re hitting is running **from the CAN branch** (it must include `/api/can/*` routes). If you see `Route /api/can/... not found`, you’re pointing at an older backend process.

1) Create a job (creates escrow + CCR session + simulated attestation):

```bash
curl -s -X POST "http://localhost:5001/api/can/jcs/jobs" \
  -H "Content-Type: application/json" \
  -H "X-CAN-Principal-Id: did:can:dp:demo" \
  -d '{"contractId":"RICARDIAN-EXAMPLE-LOCAL-001","ccrProvider":"local"}' | jq
```

Notes:
- `contractId` is stored/validated as a **string** for CAN jobs (Ricardian IDs are not UUIDs).

2) Stream events (SSE):

```bash
curl -N "http://localhost:5001/api/can/jcs/jobs/<jobId>/events" \
  -H "X-CAN-Principal-Id: did:can:dp:demo"
```

3) Fetch attestation bundle:

```bash
curl -s "http://localhost:5001/api/can/jcs/jobs/<jobId>/attestation" \
  -H "X-CAN-Principal-Id: did:can:dp:demo" | jq
```

4) Signal DEK + MEK released (no key material sent):

```bash
curl -s -X POST "http://localhost:5001/api/can/jcs/jobs/<jobId>/key-released" \
  -H "Content-Type: application/json" \
  -H "X-CAN-Principal-Id: did:can:dp:demo" \
  -d '{"keyType":"DEK"}' | jq

curl -s -X POST "http://localhost:5001/api/can/jcs/jobs/<jobId>/key-released" \
  -H "Content-Type: application/json" \
  -H "X-CAN-Principal-Id: did:can:mo:demo" \
  -d '{"keyType":"MEK"}' | jq
```

5) Release to scheduler (MVP flips job to RELEASED and CCR to RUNNING):

```bash
curl -s -X POST "http://localhost:5001/api/can/jcs/jobs/<jobId>/release" \
  -H "X-CAN-Principal-Id: did:can:ccrp:demo" | jq

6) Check local training status (MVP local CCRP auto-runs after release):

```bash
curl -s "http://localhost:5001/api/can/jcs/jobs/<jobId>/training" \
  -H "X-CAN-Principal-Id: did:can:dp:demo" | jq
```
```

## Webhook payload (MVP)
If `CAN_WEBHOOK_URLS` is set, JCS will POST JSON like:

```json
{
  "jobId": "uuid",
  "seq": 3,
  "eventType": "ATTESTATION_READY",
  "payload": { "ccrSessionId": "uuid", "keyDeliveryEndpoint": "...", "expiresAt": "..." }
}
```

Headers:
- `X-CAN-Timestamp`: ISO8601 timestamp
- `X-CAN-Signature`: `HMAC_SHA256(secret, timestamp + "." + body)`
- `X-CAN-Signature-Version`: `v1`

## Notes
- This MVP intentionally avoids accepting key material in the Node backend to prevent accidental “platform sees keys” behavior.
- Database schema is added via `backend/migrations/20260430104300-can-jcs-tables.js` and Sequelize models in `backend/models/CAN*.js`.

