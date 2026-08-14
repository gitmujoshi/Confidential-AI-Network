# Open-Core Model

## What is open source (Community Edition)

| Component | Included here |
| --- | --- |
| **Identity & attestation** | SPIFFE/SPIRE local server/agent configs and workload ID patterns |
| **Guardrails & policy** | Base OPA/Rego packs (destructive SQL/CLI, rate limits, confidence stubs, dry-run locks) |
| **Type safety** | BAML-style schema templates for triage / tool args |
| **Agent protocols** | Starter orchestrator, triage, and responder agent skeletons (MCP-oriented) |
| **Telemetry** | Guidance for local structured logs and OpenTelemetry-friendly traces |

## What stays proprietary / enterprise (CompliancePulse)

| Component | Commercial layer |
| --- | --- |
| **Identity** | Okta, Azure AD / Entra, Ping; automated cross-cloud federation; HSM-backed keys |
| **Policy** | Out-of-the-box SOC 2, HIPAA, PCI-DSS, NIST 800-53 packs; real-time threat-behavior policies; managed circuit breakers |
| **Agents** | Proprietary SecOps swarm algorithms, fine-tuning pipelines, multi-agent consensus |
| **Control plane** | Multi-tenant SaaS, PostgreSQL RLS, CMEK, BigQuery analytics, real-time SOC dashboard |

## Funnel

1. Clone `open-gmase-core` → `docker compose up` → validate guardrails in a sandbox.
2. Contribute Rego packs / agent templates via PRs ([CONTRIBUTING.md](./CONTRIBUTING.md)).
3. Upgrade to **CompliancePulse AI** when you need multi-tenant ops, enterprise IdP, or certified compliance packs (`../compliancepulse-ai`).

## Licensing note

- **Open-GMASE Core:** Apache 2.0 (this directory).
- **CompliancePulse AI** currently ships in the same GitHub org for reference; treat enterprise features as the product upgrade path. A separate commercial license may apply to future hosted offerings.
