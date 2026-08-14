---
layout: post
title: "Try it: CAN ↔ Open-GMASE ↔ CompliancePulse (demo slice)"
date: 2026-08-14
categories: [guides]
tags: [demo, can, open-gmase, compliancepulse, opa, audit]
permalink: /guides/2026/08/14/can-gmase-demo-slice/
excerpt: "Live three-layer seam: CAN side effects hit Open-GMASE OPA, land in CAN AuditLogs, and forward by default into CompliancePulse ingest. Research demo—not a full multi-tenant SaaS."
---

**Status:** Research demo path for the **control-plane seam** between Confidential AI Network, Open-GMASE, and CompliancePulse.

| Capability | Status |
| --- | --- |
| Open-GMASE OPA on tool proposals | Live (`open_gmase/tools`, `open_gmase/can_contracts`) |
| Gate **TDC training start** | Live (`GMASE_TRAINING_GATE`, default on) |
| Gate **TDC deploy / predict** | Live (`GMASE_INFERENCE_GATE`, default on) |
| Decisions in CAN AuditLogs | Live (`GMASE_TOOL_DECISION`) |
| Forward decisions → **CompliancePulse ingest** | Live by default (`http://localhost:3001`; warn if CP down; `COMPLIANCEPULSE_INGEST_URL=false` to disable) |
| E2E asserts OPA + CP ingest | Live (`npm run test:e2e:inference`) |
| CompliancePulse multi-tenant SaaS / swarm UI / SPIRE | Still research roadmap |

TDC **start training**, **deploy**, and **predict** call `open_gmase/can_contracts` fail-closed. The same allow/deny is written to CAN AuditLogs **and forwarded** to CompliancePulse `POST /api/v1/audit/ingest`. Inference UI shows the policy gate panel; Playwright requires OPA + CP by default.

## Three layers, one decision path

```mermaid
flowchart LR
  subgraph CAN["Confidential AI Network"]
    SE["Side effect<br/>train / deploy / predict"]
    AL["AuditLogs<br/>GMASE_TOOL_DECISION"]
  end
  subgraph OG["Open-GMASE Core"]
    OPA["OPA Rego<br/>open_gmase/can_contracts"]
  end
  subgraph CP["CompliancePulse AI"]
    ING["POST /api/v1/audit/ingest"]
    TR["GET /api/v1/audit/trail<br/>external_ingest"]
  end
  SE -->|authorize fail-closed| OPA
  OPA -->|allow / deny| SE
  SE --> AL
  AL -->|default forward<br/>localhost:3001| ING
  ING --> TR
```

| Layer | Role in this demo |
| --- | --- |
| **CAN** | Product surface (contracts, training, inference) + durable AuditLogs |
| **Open-GMASE** | Community OPA packs — the *inner gate* before the side effect |
| **CompliancePulse** | Commercial-path ingest receiver — stores the same decision for control-plane / evidence conversations |

Honest scope: CP ingest is a **research stub** (in-memory audit store), not a finished multi-tenant SaaS console.

## Model trained & inference (what the screenshots show)

Governance screenshots in this post still use the **fast tabular** path (quick gate regression). A **vision** path is also live for higher visual impact. The product-tour lifecycle uses **NLP** so labels read well for stakeholders.

| | **GMASE gate screenshots** | **Vision (API / Inference app)** | **Lifecycle / product tour** |
| --- | --- | --- | --- |
| **Task** | Tabular classification | Image classification (CIFAR-10) | Text classification (AG News) |
| **Catalog model** | `e2e-model-tabular-logreg` | `MODEL-E2E-001` / CNN | `e2e-model-nlp-distilbert-quality` |
| **Architecture** | Logistic regression | TinyCNN (`taskType: vision`) | DistilBERT / transformer |
| **Dataset** | Iris-style CSV (4 floats) | CIFAR-10 subset (~2k train; FakeData if `E2E_VISION_FAST`) | AG News headlines |
| **Example request** | `{ "features": [5.1, 3.5, 1.4, 0.2] }` | `{ "imageBase64": "…" }` (32×32 demo PNG) | `{ "text": "Wall Street rallies…" }` |
| **Example label** | **setosa** | CIFAR name (e.g. **airplane**) | **Business** |

In all cases the **side effect** (train / deploy / predict) is gated by Open-GMASE. The UI shows the label **and** the policy-gate panel. CompliancePulse receives the **governance decision**, not the pixels or weights (see below).

## What you will see

1. A proposed tool call (for example `execute_sql` with `DROP TABLE`, or `start_training` / `run_inference`) is evaluated by community Rego packs.  
2. Allow or deny comes back **fail-closed** if OPA is unreachable.  
3. The decision is written into CAN’s audit trail.  
4. On the Inference app, an **Open-GMASE policy gate** panel shows ALLOW/DENY with package + audit id.  
5. Training start returns `job.governance` the same way.  
6. CAN **forwards** the decision to CompliancePulse ingest by default (non-blocking; warns if CP is down).  
7. You can list those events on CP as `external_ingest` via the audit trail API.

## Screenshots (from E2E)

<figure class="shot">
  <img src="{{ '/assets/gmase/01-tdc-deploy-inference.png' | relative_url }}" alt="TDC Training page after Deploy for inference" loading="lazy" />
  <figcaption>Deploy for inference — OPA authorizes <code>deploy_inference</code>; the <em>governance decision</em> (not the model artifact) is forwarded to CompliancePulse</figcaption>
</figure>

<figure class="shot">
  <img src="{{ '/assets/gmase/02-tdc-inference-app.png' | relative_url }}" alt="TDC Inference app ready for prediction" loading="lazy" />
  <figcaption>Inference app — iris feature vector ready (<code>task: tabular</code>, logistic-regression)</figcaption>
</figure>

<figure class="shot">
  <img src="{{ '/assets/gmase/03-tdc-inference-predict-gmase.png' | relative_url }}" alt="Prediction result with Open-GMASE policy gate ALLOW" loading="lazy" />
  <figcaption>Label <strong>setosa</strong> plus <strong>Open-GMASE policy gate</strong> ALLOW — same decision ingested by CompliancePulse</figcaption>
</figure>

The lifecycle product tour uses **quality DistilBERT** on AG News (prediction **Business**) and the same gate when OPA is up — see [`24-tdc-inference-predict.png`]({{ '/assets/lifecycle/24-tdc-inference-predict.png' | relative_url }}) on the [product tour]({{ '/product-tour/' | relative_url }}#infer).

## CompliancePulse integration (how to show it)

### What is forwarded (and what is not)

**Yes — deploy for inference is gated and forwarded.** When you click **Deploy for inference** (or run predict / start training), CAN:

1. Asks Open-GMASE OPA (`deploy_inference` / `run_inference` / `start_training`)
2. Writes `GMASE_TOOL_DECISION` to CAN AuditLogs
3. **Forwards that same decision** to CompliancePulse `POST /api/v1/audit/ingest` (default `http://localhost:3001`)

What CP stores is the **control-plane decision**, for example:

| Included | Not included |
| --- | --- |
| `tool_name` (`deploy_inference`, `run_inference`, …) | Training images / CSV / text corpora |
| `allow` / `reason` / deny-warn lists | Inference `imageBase64` / feature vectors |
| `model_id`, `contract_id`, OPA `package` | Model weights (`model.bin`) |
| `auditId`, `source: confidential-ai-network` | Prediction logits / raw outputs |

So the caption “Deploy for inference — gated by OPA; forwarded to CompliancePulse” means the **ALLOW/DENY audit event** is forwarded — not that the dataset or image pixels are copied into CP.

### Start the three processes

```bash
# 1) Open-GMASE OPA
cd open-gmase-core && docker compose up -d

# 2) CompliancePulse ingest receiver (default target for CAN)
cd compliancepulse-ai/backend && npm run dev
# listens on http://localhost:3001

# 3) CAN stack
./start-system.sh
# COMPLIANCEPULSE_INGEST_URL defaults to http://localhost:3001
# Disable: COMPLIANCEPULSE_INGEST_URL=false
```

### Prove the forward after a gated action

After a deploy/predict (or the smoke script below):

```bash
# CAN side — decisions in AuditLogs
curl -s 'http://localhost:5001/api/debug/gmase-tool-decisions?limit=5'

# CompliancePulse side — same decisions as external_ingest
curl -s 'http://localhost:3001/api/v1/audit/trail?eventTypes=external_ingest&limit=5'
```

Expected shape on CP (fields may vary slightly):

```json
{
  "events": [
    {
      "eventType": "external_ingest",
      "action": "ingest:run_inference",
      "result": "success",
      "metadata": {
        "source": "confidential-ai-network",
        "tool_name": "run_inference",
        "allow": true,
        "package": "open_gmase/can_contracts",
        "model_id": "…"
      }
    }
  ]
}
```

E2E (`npm run test:e2e:inference`) **requires** OPA + CP by default and asserts ≥2 ingest events per model (`deploy_inference` + `run_inference`).

## Run locally (full slice)

```bash
cd open-gmase-core && docker compose up -d
cd compliancepulse-ai/backend && npm run dev   # separate terminal
./start-system.sh                             # separate terminal

./scripts/demo-gmase-can-slice.sh

cd frontend
E2E_WAIT_FOR_LOCAL_TRAINING=true BACKEND_URL=http://127.0.0.1:5001 npm run test:e2e:inference
```

Ad-hoc deny path (CAN debug API):

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
curl -s 'http://localhost:3001/api/v1/audit/trail?eventTypes=external_ingest&limit=5'
```

## Stakeholder script (three minutes)

1. Show the CAN [product tour]({{ '/product-tour/' | relative_url }}) (contracts → training → inference).  
2. On the Inference app, point at the **Open-GMASE policy gate** ALLOW panel.  
3. Show the **same decision** in CAN AuditLogs *and* CompliancePulse `audit/trail` (`external_ingest`).  
4. Say clearly: multi-tenant CP SaaS UI, swarm agents, and SPIRE attestation are still roadmap—this is the **inner gate** plus the **commercial-path ingest** seam.

## Code & full runbook

| Artifact | Location |
| --- | --- |
| Runbook | [`docs/guides/CAN_GMASE_DEMO_SLICE.md`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/docs/guides/CAN_GMASE_DEMO_SLICE.md) |
| Screenshots | [`docs/guides/gmase-integration/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/docs/guides/gmase-integration) |
| Side-effect gate + CP forward | [`backend/services/gmaseSideEffectGate.js`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/backend/services/gmaseSideEffectGate.js) |
| CompliancePulse ingest API | [`compliancepulse-ai/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/compliancepulse-ai) — `POST /api/v1/audit/ingest` |
| Smoke script | [`scripts/demo-gmase-can-slice.sh`](https://github.com/gitmujoshi/Confidential-AI-Network/blob/main/scripts/demo-gmase-can-slice.sh) |
| Policies | [`open-gmase-core/execution-guardrails/opa-policies/`](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/open-gmase-core/execution-guardrails/opa-policies) |

## Related reading

- [Governed AI for the enterprise — CISO overview]({% post_url 2026-08-14-governed-ai-enterprise-ciso-overview %})  
- [Governing autonomous AI agents]({% post_url 2026-07-31-governing-autonomous-ai-agents-cybersecurity %})  
- [Unified Governed Agentic SecOps Framework]({% post_url 2026-08-14-unified-governed-agentic-secops-framework %})  
- [Open-GMASE Core](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/open-gmase-core)  
- [CompliancePulse AI](https://github.com/gitmujoshi/Confidential-AI-Network/tree/main/compliancepulse-ai)
