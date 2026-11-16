# CAN API Gateway — DEPA `/v1` façade

The React portal still talks **CAN `/api`** (default `http://localhost:5001`). This gateway on **:8000** adds the DEPA PRD **`/v1`** surface as a translation layer over that same backend.

It is **not** 11 microservices. Auth is the existing Keycloak Bearer token.

```
CAN UI  ──/api──►  backend :5001
curl/PRD clients ──/v1──►  gateway :8000  ──/api──►  backend :5001
```

## Run

```bash
# backend already on :5001
cd gateway && npm install && npm start
curl -s http://localhost:8000/health
curl -s http://localhost:8000/v1
```

Optional: point the portal at the gateway later with `REACT_APP_API_URL=http://localhost:8000` so `/api` is proxied. Leave it on `:5001` until you want that.

## Mapped routes

| PRD | CAN behind the façade |
|---|---|
| `POST /v1/catalog/ingestion` | `POST /api/datasets` (DCAT → catalog row; pickle rejected) |
| `GET /v1/catalog/search` | `GET /api/datasets/public` or `/search` |
| `POST /v1/contracts` | `POST /api/contracts/ricardian` (needs `datasetIds`) |
| `POST /v1/contracts/{id}/sign` | `POST /api/contracts/{id}/sign` |
| `POST /v1/contracts/{id}/revoke` | `POST /api/contracts/{id}/revoke` (aborts jobs) |
| `GET /v1/contracts/{id}/status` | `GET /api/contracts/{id}` (`SIGNED` → `active`) |
| `POST /v1/ccr/provision` | `POST /api/tdc/training/contracts/{id}/start` |
| `POST /v1/providers` | Verifies an organization VC, then `POST /api/auth/register` |
| `POST /v1/ccr/{id}/attestation` | `POST /api/tdc/training/jobs/{id}/sev-snp-quote` |
| `GET /v1/ccr/{id}/attestation` | Stored quote when verified; otherwise simulated |
| `POST /v1/ccr/{id}/teardown` | `POST /api/tdc/training/jobs/{id}/abort` |
| `POST /v1/aichain/provenance/{id}/tombstone` | `POST /api/auditor/provenance/{id}/tombstone` |
| `GET /v1/providers?type=InfrastructureProvider` | `GET /api/users/tsp` |

## Trust configuration

Set these on the API host (`:5001`). The gateway forwards the credential and the quote; CAN performs the checks.

| Variable | Used by | Value |
|----------|---------|-------|
| `DEPA_VC_ISSUER_PEM` | `POST /v1/providers` | SPKI PEM of the issuer public key |
| `DEPA_VC_TRUSTED_ISSUERS` | `POST /v1/providers` | Comma-separated `iss` values |
| `SEV_SNP_ARK_PEM` | `POST /v1/ccr/{id}/attestation` | AMD ARK certificate PEM |

Organization onboarding body: `{ "verifiableCredential": "<compact JWT>" }`. The credential subject needs `name`, `email`, and `partyType` (`DataProvider`, `DataConsumer`, or `InfrastructureProvider`). A valid credential registers the organization and returns `initialPassword` once.

Quote body: `{ "report": "<base64>", "vcekPem": "<cert>", "askPem": "<cert>" }`. The report is 1184 bytes. It is stored as `sev-snp` only when the ECDSA-P384 signature matches the VCEK and the VCEK chains through the ASK to the pinned ARK. `GET /v1/ccr/{id}/attestation` stays `simulated` until that succeeds.

Tombstone body: `{ "reason": "...", "redactedFields": ["field"] }`. The caller must be an Auditor or AppAdmin. The row is append-only. The provenance leaf stays. This is not a filing with an external SRO.

Contract create from the user manual still needs **`datasetIds`** (CAN catalog slugs). Template `S3` sets local DP defaults on `trainingParams`.
