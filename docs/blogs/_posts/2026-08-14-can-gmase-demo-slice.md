---
layout: post
title: "Try it: CAN ↔ Open-GMASE policy gate (demo slice)"
date: 2026-08-14
categories: [guides]
tags: [demo, can, open-gmase, opa, audit]
permalink: /guides/2026/08/14/can-gmase-demo-slice/
excerpt: "Smallest live wiring of the three-offering story: a tool proposal hits Open-GMASE OPA, then lands in CAN AuditLogs. Research demo—not a full unified product runtime."
---

**Status:** Research demo path. This proves the **control-plane seam** between Confidential AI Network and Open-GMASE. It does **not** yet gate real TDC training jobs or ship CompliancePulse multi-tenant SaaS.

## What you will see

```text
Tool proposal  →  Open-GMASE OPA (Rego)  →  CAN AuditLogs (GMASE_TOOL_DECISION)
```

1. A proposed tool call (for example `execute_sql` with `DROP TABLE`) is evaluated by community Rego packs.  
2. Allow or deny comes back **fail-closed** if OPA is unreachable.  
3. The decision is written into CAN’s audit trail so you can show *evidence*, not a slide.

## Run locally

Prerequisites: Docker (for OPA), CAN backend on port **5001**.

```bash
# OPA (from repo root)
cd open-gmase-core && docker compose up -d

# CAN stack (separate terminal, if not already up)
./start-system.sh

# One-shot smoke
./scripts/demo-gmase-can-slice.sh
```

Or exercise the debug API directly:

```bash
curl -s http://localhost:5001/api/debug/gmase-opa-health

curl -s -X POST http://localhost:5001/api/debug/gmase-tool-check \
  -H 'Content-Type: application/json' \
  -d '{
    "tool_name": "execute_sql",
    "environment": "production",
    "parameters": { "query": "DROP TABLE users;" },
    "metadata": { "contract_id": "demo-1" }
  }'

curl -s 'http://localhost:5001/api/debug/gmase-tool-decisions?limit=5'
```

Expect a **deny** on the DROP, and a matching `GMASE_TOOL_DECISION` row when you list decisions.

## Stakeholder script (two minutes)

1. Show the normal CAN [product tour]({{ '/product-tour/' | relative_url }}) (contracts → training).  
2. Hit the deny path above; show HTTP 403 / deny reason.  
3. Show the same decision via `gmase-tool-decisions` (audit evidence).  
4. Say clearly: swarm UI, SPIRE attestation, and CompliancePulse SaaS are still roadmap—this is the **inner gate** wiring.

## Code & full runbook

| Artifact | Location |
| --- | --- |
| Runbook | [`docs/guides/CAN_GMASE_DEMO_SLICE.md`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/CAN_GMASE_DEMO_SLICE.md) |
| Smoke script | [`scripts/demo-gmase-can-slice.sh`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/scripts/demo-gmase-can-slice.sh) |
| OPA client | [`backend/services/gmaseOpaService.js`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/backend/services/gmaseOpaService.js) |
| Policies | [`open-gmase-core/execution-guardrails/opa-policies/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/open-gmase-core/execution-guardrails/opa-policies) |

## Related reading

- [Governed AI for the enterprise — CISO overview]({% post_url 2026-08-14-governed-ai-enterprise-ciso-overview %})  
- [Governing autonomous AI agents]({% post_url 2026-07-31-governing-autonomous-ai-agents-cybersecurity %})  
- [Unified Governed Agentic SecOps Framework]({% post_url 2026-08-14-unified-governed-agentic-secops-framework %})  
- [Open-GMASE Core](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/open-gmase-core)
