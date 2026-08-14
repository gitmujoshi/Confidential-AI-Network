# CAN ↔ Open-GMASE demo slice

**Status:** Research demo path — not a full unified production runtime.

**Blog (GitHub Pages):** [Try it: CAN ↔ Open-GMASE policy gate](https://gitmujoshi.github.io/Confidential-AI-Network/guides/2026/08/14/can-gmase-demo-slice/)

Smallest live integration of the three-offering story:

```text
Tool proposal  →  Open-GMASE OPA (Rego)  →  CAN AuditLogs (GMASE_TOOL_DECISION)
```

This does **not** yet wrap real TDC training Docker jobs or ship CompliancePulse multi-tenant SaaS. It proves the control-plane seam you can show stakeholders next to a normal CAN contract→train demo.

## Prerequisites

1. Docker (for OPA)
2. CAN backend running (`./start-system.sh` or your usual local start) on port **5001**
3. Open-GMASE OPA on port **8181**

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

Env:

| Variable | Default |
| --- | --- |
| `OPA_URL` | `http://localhost:8181` |
| `OPA_POLICY_PACKAGE` | `open_gmase/tools` |
| `OPA_TIMEOUT_MS` | `2000` |

Override package per request with `"policy_package": "open_gmase/can_contracts"`.

## Policies used

- `open-gmase-core/execution-guardrails/opa-policies/base-tool-guardrails.rego` (`open_gmase.tools`)
- `open-gmase-core/execution-guardrails/opa-policies/can-contracts.rego` (`open_gmase.can_contracts`) — contract-aware export / training gates

## Stakeholder talking points

1. Show CAN product tour / local training as usual.  
2. Show a **denied** DROP TABLE / raw export via this endpoint (HTTP 403 + reason).  
3. Show the same decision in `/api/debug/gmase-tool-decisions` (CAN audit trail).  
4. Be explicit: agents/swarm UI and real SPIRE attestation are still research roadmap; this is the **inner gate** wiring.

## Next engineering steps (not in this slice)

- Call `gmaseOpaService.authorizeTool` from `tdcTrainingExecutionService.startTrainingForContract` before spawn.  
- ~~Call authorize on TDC inference~~ — **done**: deploy/predict use `open_gmase/can_contracts` (`GMASE_INFERENCE_GATE`, default on); covered by `npm run test:e2e:inference`.  
- Attach real SPIFFE IDs to `metadata.agent_id`.  
- Promote debug routes behind auth for non-local environments.
