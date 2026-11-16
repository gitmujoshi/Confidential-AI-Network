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
| `GET /v1/ccr/{id}/attestation` | `GET /api/tdc/training/jobs/{id}` (simulated quote) |
| `POST /v1/ccr/{id}/teardown` | `POST /api/tdc/training/jobs/{id}/abort` |
| `GET /v1/providers?type=InfrastructureProvider` | `GET /api/users/tsp` |

Not implemented on this façade (orchestrator-only): VC org onboarding, hardware SEV-SNP quotes, SRO PII tombstone.

Contract create from the user manual still needs **`datasetIds`** (CAN catalog slugs). Template `S3` sets local DP defaults on `trainingParams`.
