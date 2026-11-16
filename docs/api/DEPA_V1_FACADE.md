# DEPA PRD `/v1` façade (CAN gateway)

**Status:** Translation layer on `gateway/`. The CAN portal still calls `/api`.

The DEPA user manual’s `/v1/*` routes are served at `http://localhost:8000/v1` and forwarded to the existing Express app (`CAN_BACKEND_URL`, default `http://localhost:5001`). Keycloak Bearer tokens are passed through. This is not an 11-service orchestrator.

The route table and request bodies are in [gateway/README.md](../../gateway/README.md).

## Checks on this façade

| Call | Result |
|------|--------|
| `POST /v1/providers` | Verifies a compact JWT organization credential, then `POST /api/auth/register`. Requires `DEPA_VC_ISSUER_PEM` and `DEPA_VC_TRUSTED_ISSUERS`. |
| `POST /v1/ccr/{id}/attestation` | Verifies a SEV-SNP guest report (`report`, `vcekPem`, `askPem`) and stores it on the training job. Requires `SEV_SNP_ARK_PEM`. |
| `GET /v1/ccr/{id}/attestation` | `mode: sev-snp` only when that stored quote verified. Otherwise `simulated`. |
| `POST /v1/aichain/provenance/{id}/tombstone` | Append-only audit row for an Auditor or AppAdmin. The provenance leaf stays. Not an external SRO filing. |

`POST /v1/contracts` still requires CAN `datasetIds`.
