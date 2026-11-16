# DEPA PRD `/v1` façade (CAN gateway)

**Status:** Implemented on `gateway/` as a translation layer. The CAN portal is unchanged.

The DEPA user manual’s `/v1/*` routes are served at `http://localhost:8000/v1` and forwarded to the existing Express app (`CAN_BACKEND_URL`, default `http://localhost:5001`). Keycloak Bearer tokens are passed through.

See [gateway/README.md](../../gateway/README.md) for the route table, honesty limits (no VC onboarding, no hardware TEE quote, no tombstone), and the extra `datasetIds` field required on `POST /v1/contracts`.
