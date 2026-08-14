---
layout: post
title: "Try it: CAN ↔ Open-GMASE policy gate (demo slice)"
date: 2026-08-14
categories: [guides]
tags: [demo, can, open-gmase, opa, audit]
permalink: /guides/2026/08/14/can-gmase-demo-slice/
excerpt: "Live control-plane seam: CAN training + inference side effects hit Open-GMASE OPA, land in AuditLogs, and can forward to CompliancePulse ingest. Research demo—not a full multi-tenant SaaS."
---

**Status:** Research demo path for the **control-plane seam** between Confidential AI Network, Open-GMASE, and CompliancePulse.

| Capability | Status |
| --- | --- |
| Open-GMASE OPA on tool proposals | Live (`open_gmase/tools`, `open_gmase/can_contracts`) |
| Gate **TDC training start** | Live (`GMASE_TRAINING_GATE`, default on) |
| Gate **TDC deploy / predict** | Live (`GMASE_INFERENCE_GATE`, default on) |
| Decisions in CAN AuditLogs | Live (`GMASE_TOOL_DECISION`) |
| Forward decisions → CompliancePulse ingest | Live when `COMPLIANCEPULSE_INGEST_URL` is set |
| CompliancePulse multi-tenant SaaS / swarm UI / SPIRE | Still research roadmap |

TDC **start training**, **deploy**, and **predict** call `open_gmase/can_contracts` fail-closed (unless the matching gate env is set to `false`). Inference UI shows the policy gate panel; Playwright covers it via `npm run test:e2e:inference`.

## What you will see

```text
Side effect (train / deploy / predict)
  →  Open-GMASE OPA (Rego)
  →  CAN AuditLogs (GMASE_TOOL_DECISION)
  →  optional CompliancePulse POST /api/v1/audit/ingest
```

1. A proposed tool call (for example `execute_sql` with `DROP TABLE`, or `start_training` / `run_inference`) is evaluated by community Rego packs.  
2. Allow or deny comes back **fail-closed** if OPA is unreachable.  
3. The decision is written into CAN’s audit trail so you can show *evidence*, not a slide.  
4. On the Inference app, an **Open-GMASE policy gate** panel shows ALLOW/DENY with package + audit id.  
5. Training start returns `job.governance` the same way.

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

# Optional: CompliancePulse backend (ingest receiver)
# cd compliancepulse-ai/backend && npm run dev
# export COMPLIANCEPULSE_INGEST_URL=http://localhost:3001   # on the CAN backend

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
2. On training start / Inference app, point at Open-GMASE **ALLOW** (toast or policy-gate panel).  
3. Optionally hit the deny path above; show HTTP 403 / deny reason and AuditLogs.  
4. Say clearly: multi-tenant CompliancePulse SaaS, swarm UI, and SPIRE attestation are still roadmap—this is the **inner gate** wiring plus optional ingest.

## Code & full runbook

| Artifact | Location |
| --- | --- |
| Runbook | [`docs/guides/CAN_GMASE_DEMO_SLICE.md`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/CAN_GMASE_DEMO_SLICE.md) |
| Screenshots | [`docs/guides/gmase-integration/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/docs/guides/gmase-integration) |
| Side-effect gate | [`backend/services/gmaseSideEffectGate.js`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/backend/services/gmaseSideEffectGate.js) |
| Smoke script | [`scripts/demo-gmase-can-slice.sh`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/scripts/demo-gmase-can-slice.sh) |
| Policies | [`open-gmase-core/execution-guardrails/opa-policies/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/open-gmase-core/execution-guardrails/opa-policies) |
| CompliancePulse ingest | `POST /api/v1/audit/ingest` in [`compliancepulse-ai/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/compliancepulse-ai) |

## Related reading

- [Governed AI for the enterprise — CISO overview]({% post_url 2026-08-14-governed-ai-enterprise-ciso-overview %})  
- [Governing autonomous AI agents]({% post_url 2026-07-31-governing-autonomous-ai-agents-cybersecurity %})  
- [Unified Governed Agentic SecOps Framework]({% post_url 2026-08-14-unified-governed-agentic-secops-framework %})  
- [Open-GMASE Core](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/open-gmase-core)
