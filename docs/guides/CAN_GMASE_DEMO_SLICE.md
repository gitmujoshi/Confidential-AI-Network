# CAN ↔ Open-GMASE demo slice

**Status:** Research demo path — not a full unified production runtime.

**Blog (GitHub Pages):** [Try it: CAN ↔ Open-GMASE policy gate](https://gitmujoshi.github.io/Confidential-AI-Network/guides/2026/08/14/can-gmase-demo-slice/)

Live integration of the three-offering story:

```text
Side effect (train / deploy / predict)
  →  Open-GMASE OPA (Rego)
  →  CAN AuditLogs (GMASE_TOOL_DECISION)
  →  optional CompliancePulse POST /api/v1/audit/ingest
```

| Gate | Env (default **on**) | Tool name |
| --- | --- | --- |
| Training start | `GMASE_TRAINING_GATE` | `start_training` |
| Inference deploy/predict | `GMASE_INFERENCE_GATE` | `deploy_inference` / `run_inference` |
| Forward to CompliancePulse | `COMPLIANCEPULSE_INGEST_URL` | (best-effort POST) |

This does **not** yet ship multi-tenant CompliancePulse SaaS, SPIRE attestation, or the G-MASE swarm UI. It proves the control-plane seam you can show stakeholders next to a normal CAN contract→train→infer demo.

## Prerequisites

1. Docker (for OPA)
2. CAN backend running (`./start-system.sh` or your usual local start) on port **5001**
3. Open-GMASE OPA on port **8181**
4. Optional: CompliancePulse backend + `COMPLIANCEPULSE_INGEST_URL=http://localhost:3001` on the CAN process

## Quick demo

```bash
# Terminal A — CAN stack (if not already up)
./start-system.sh

# Terminal B — one-shot smoke (starts OPA if needed)
chmod +x scripts/demo-gmase-can-slice.sh
./scripts/demo-gmase-can-slice.sh
```

Or manually:

```bash
cd open-gmase-core && docker compose up -d

curl -s http://localhost:5001/api/debug/gmase-opa-health

curl -s -X POST http://localhost:5001/api/debug/gmase-tool-check \
  -H 'Content-Type: application/json' \
  -d '{
    "tool_name": "execute_sql",
    "environment": "production",
    "parameters": { "query": "DROP TABLE users;" },
    "metadata": { "contract_id": "demo-1" }
  }'

curl -s http://localhost:5001/api/debug/gmase-tool-decisions?limit=5
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/debug/gmase-opa-health` | Is OPA reachable? |
| `POST` | `/api/debug/gmase-tool-check` | Evaluate tool + write `AuditLogs` |
| `GET` | `/api/debug/gmase-tool-decisions` | Read back recent decisions |
| `POST` | `/api/tdc/training/contracts/:id/start` | Training start (OPA + `job.governance`) |
| `POST` | `/api/tdc/inference/models/:id/deploy\|predict` | Inference (OPA + `governance`) |
| `POST` | CompliancePulse `/api/v1/audit/ingest` | Optional decision receiver |

Env:

| Variable | Default |
| --- | --- |
| `OPA_URL` | `http://localhost:8181` |
| `OPA_POLICY_PACKAGE` | `open_gmase/tools` |
| `OPA_TIMEOUT_MS` | `2000` |
| `GMASE_TRAINING_GATE` | on |
| `GMASE_INFERENCE_GATE` | on |
| `COMPLIANCEPULSE_INGEST_URL` | unset (no forward) |

Override package per debug request with `"policy_package": "open_gmase/can_contracts"`.

## Policies used

- `open-gmase-core/execution-guardrails/opa-policies/base-tool-guardrails.rego` (`open_gmase.tools`)
- `open-gmase-core/execution-guardrails/opa-policies/can-contracts.rego` (`open_gmase.can_contracts`) — contract-aware training / export / inference gates

## Stakeholder talking points

1. Show CAN product tour / local training as usual.  
2. Show a **denied** DROP TABLE / raw export via the debug endpoint (HTTP 403 + reason).  
3. Show the same decision in `/api/debug/gmase-tool-decisions` (CAN audit trail).  
4. Show Inference **Open-GMASE policy gate** ALLOW panel (and training-start toast).  
5. Be explicit: swarm UI, SPIRE attestation, and multi-tenant SaaS are still research roadmap; this is the **inner gate** wiring (+ optional ingest).

## Next engineering steps

- ~~Call `authorizeTool` from `startTrainingForContract`~~ — **done** (`GMASE_TRAINING_GATE`).  
- ~~Call authorize on TDC inference~~ — **done** (`GMASE_INFERENCE_GATE`).  
- ~~CompliancePulse ingest receiver~~ — **done** (`POST /api/v1/audit/ingest`).  
- Attach real SPIFFE IDs to `metadata.agent_id`.  
- Promote debug routes behind auth for non-local environments.  
- Multi-tenant CompliancePulse control plane / policy packs UI.
