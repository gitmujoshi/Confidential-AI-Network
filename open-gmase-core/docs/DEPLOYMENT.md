# Deployment (local reference)

## Prerequisites

- Docker / Docker Compose
- `curl` (for policy check examples)

## Start SPIRE + OPA

```bash
cd open-gmase-core
docker compose up -d
docker compose ps
```

Services:

| Service | Port | Purpose |
| --- | --- | --- |
| `opa` | 8181 | Policy evaluation (`/v1/data/...`) |
| `spire-server` | 8081 | Local SPIRE server (dev) |

Policies are mounted from `execution-guardrails/opa-policies/`.

## Verify OPA

```bash
./examples/policy-check.sh
```

## Kubernetes / Helm

Community Edition ships Compose first. Helm charts for SPIRE + OPA + sample agents are welcome contributions (see CONTRIBUTING.md). For a fuller SaaS stack (API + UI + Postgres), see `../compliancepulse-ai/docs/DEPLOYMENT.md`.

## Production notes

- Replace demo SPIRE trust domain and join tokens.
- Pin OPA image digests; load signed policy bundles.
- Do not mount long-lived cloud keys into agent pods; federate after OPA allow.
