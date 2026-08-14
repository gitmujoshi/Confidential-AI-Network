# Open-GMASE Core

**Open reference architecture for governed multi-agent SecOps execution**

Open-GMASE is the **community edition** of the G-MASE (Governed Multi-Agent SecOps Environment) control plane: SPIFFE/SPIRE identity blueprints, OPA/Rego tool guardrails, BAML-style typed schemas, and starter MCP-oriented agents. The model proposes; sidecars dispose.

Commercial multi-tenant SaaS, enterprise IdP packs, and compliance policy packs live in **CompliancePulse AI** (open-core upgrade path). See [OPEN_CORE.md](./OPEN_CORE.md).

| | Open-GMASE Core (this repo path) | CompliancePulse AI (paid / enterprise) |
| --- | --- | --- |
| License | Apache 2.0 | Commercial / SaaS (see `../compliancepulse-ai`) |
| Identity | SPIFFE/SPIRE local blueprints | Okta / Entra / Ping, cross-cloud federation, HSM |
| Policy | Base OPA packs (rate limits, dry-run locks, destructive CLI) | SOC2 / HIPAA / PCI / NIST packs, dynamic threat policies |
| Agents | Orchestrator / triage / responder starters | Advanced swarm algorithms, fine-tuning, consensus |
| Telemetry | Local JSON / file / OTel-friendly traces | Multi-tenant control plane, RLS, CMEK, SOC dashboard |

## Layout

```text
open-gmase-core/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── THREAT_MODEL.md
│   └── DEPLOYMENT.md
├── mcp-agents/
│   ├── shared/           # Base agent types
│   ├── orchestrator/
│   ├── triage/
│   └── responder/
├── execution-guardrails/
│   ├── baml-schemas/     # Type-safe tool argument templates
│   ├── opa-policies/     # Sample Rego packs
│   └── spiffe-spire/     # Local SPIRE server/agent configs
├── examples/
├── docker-compose.yml    # SPIRE + OPA (+ optional sample policy server)
├── OPEN_CORE.md
├── CONTRIBUTING.md
└── LICENSE               # Apache 2.0
```

## Quick start

```bash
cd open-gmase-core
docker compose up -d
# OPA:   http://localhost:8181
# SPIRE: localhost:8081 (server gRPC/admin as configured)

# Example policy check
./examples/policy-check.sh
```

Design whitepaper: [Governing autonomous AI agents in cybersecurity operations](https://gitmujoshi.github.io/Confidential-AI-Network/security/2026/07/31/governing-autonomous-ai-agents-cybersecurity/)

## Status

This is a **reference architecture** for local/sandbox adoption and community policy contributions. Production SaaS features are intentionally out of scope here.
