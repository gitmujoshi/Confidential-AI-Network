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

TDC **deploy** and **predict** call the same OPA pack (`open_gmase/can_contracts`) when `GMASE_INFERENCE_GATE` is on (default). The Playwright suite asserts allow + AuditLogs and captures the UI screenshots below: `npm run test:e2e:inference`.

## What you will see

```text
Tool proposal  →  Open-GMASE OPA (Rego)  →  CAN AuditLogs (GMASE_TOOL_DECISION)
```

1. A proposed tool call (for example `execute_sql` with `DROP TABLE`) is evaluated by community Rego packs.  
2. Allow or deny comes back **fail-closed** if OPA is unreachable.  
3. The decision is written into CAN’s audit trail so you can show *evidence*, not a slide.  
4. On the Inference app, an **Open-GMASE policy gate** panel shows ALLOW/DENY with package + audit id.

## Screenshots (from E2E)

<figure class="shot">
  <img src="{{ '/assets/gmase/01-tdc-deploy-inference.png' | relative_url }}" alt="TDC Training page after Deploy for inference" loading="lazy" />
  <figcaption>Deploy for inference — OPA authorizes <code>deploy_inference</code> before the model is marked DEPLOYED</figcaption>
</figure>

<figure class="shot">
  <img src="{{ '/assets/gmase/02-tdc-inference-app.png' | relative_url }}" alt="TDC Inference app ready for prediction" loading="lazy" />
  <figcaption>Inference app — request ready</figcaption>
</figure>

<figure class="shot">
  <img src="{{ '/assets/gmase/03-tdc-inference-predict-gmase.png' | relative_url }}" alt="Prediction result with Open-GMASE policy gate ALLOW" loading="lazy" />
  <figcaption>Prediction result with <strong>Open-GMASE policy gate</strong> (ALLOW) and audit id — the inner gate before inference runs</figcaption>
</figure>

The lifecycle product tour’s prediction shot (`24-tdc-inference-predict.png`) also includes this gate when OPA is up.

## Run locally

Prerequisites: Docker (for OPA), CAN backend on port **5001**.

```bash
# OPA (from repo root)
cd open-gmase-core && docker compose up -d

# CAN stack (separate terminal, if not already up)
./start-system.sh

# One-shot smoke
./scripts/demo-gmase-can-slice.sh

# UI + screenshots (from frontend/)
E2E_WAIT_FOR_LOCAL_TRAINING=true BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:inference
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

1. Show the normal CAN [product tour]({{ '/product-tour/' | relative_url }}) (contracts → training → inference).  
2. On the Inference app, point at the **Open-GMASE policy gate** ALLOW panel.  
3. Optionally hit the deny path above; show HTTP 403 / deny reason and AuditLogs.  
4. Say clearly: swarm UI, SPIRE attestation, and CompliancePulse SaaS are still roadmap—this is the **inner gate** wiring.

## Code & full runbook

| Artifact | Location |
| --- | --- |
| Runbook | [`docs/guides/CAN_GMASE_DEMO_SLICE.md`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/CAN_GMASE_DEMO_SLICE.md) |
| Screenshots | [`docs/guides/gmase-integration/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/docs/guides/gmase-integration) |
| Smoke script | [`scripts/demo-gmase-can-slice.sh`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/scripts/demo-gmase-can-slice.sh) |
| OPA client | [`backend/services/gmaseOpaService.js`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/backend/services/gmaseOpaService.js) |
| Policies | [`open-gmase-core/execution-guardrails/opa-policies/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/open-gmase-core/execution-guardrails/opa-policies) |

## Related reading

- [Governed AI for the enterprise — CISO overview]({% post_url 2026-08-14-governed-ai-enterprise-ciso-overview %})  
- [Governing autonomous AI agents]({% post_url 2026-07-31-governing-autonomous-ai-agents-cybersecurity %})  
- [Unified Governed Agentic SecOps Framework]({% post_url 2026-08-14-unified-governed-agentic-secops-framework %})  
- [Open-GMASE Core](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/open-gmase-core)
