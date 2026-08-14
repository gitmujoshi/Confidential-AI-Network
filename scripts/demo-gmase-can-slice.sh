#!/usr/bin/env bash
# Demo slice: Open-GMASE OPA → CAN /api/debug/gmase-tool-check → AuditLogs
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OPA_URL="${OPA_URL:-http://localhost:8181}"
CAN_API="${CAN_API:-http://localhost:5001}"

echo "== 1) Ensure Open-GMASE OPA is up =="
if ! curl -sf "${OPA_URL}/health" >/dev/null 2>&1; then
  echo "Starting open-gmase-core OPA via docker compose..."
  (cd "${ROOT}/open-gmase-core" && docker compose up -d)
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -sf "${OPA_URL}/health" >/dev/null 2>&1; then break; fi
    sleep 1
  done
fi
curl -sf "${OPA_URL}/health" >/dev/null || { echo "OPA not reachable at ${OPA_URL}"; exit 1; }
echo "OPA OK"

echo ""
echo "== 2) CAN health (optional) =="
if curl -sf "${CAN_API}/api/debug/gmase-opa-health" >/dev/null 2>&1; then
  curl -s "${CAN_API}/api/debug/gmase-opa-health" | head -c 400; echo
else
  echo "CAN backend not reachable at ${CAN_API} — start with ./start-system.sh"
  echo "You can still exercise OPA directly; skipping CAN audit steps."
  exit 0
fi

echo ""
echo "== 3) DENY: DROP TABLE in production (open_gmase/tools) =="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${CAN_API}/api/debug/gmase-tool-check" \
  -H 'Content-Type: application/json' \
  -d '{
    "tool_name": "execute_sql",
    "environment": "production",
    "parameters": { "query": "DROP TABLE users;" },
    "confidence_score": 0.99,
    "metadata": { "contract_id": "demo-contract-1" }
  }'

echo ""
echo "== 4) DENY: raw export without contract allowance (open_gmase/can_contracts) =="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${CAN_API}/api/debug/gmase-tool-check" \
  -H 'Content-Type: application/json' \
  -d '{
    "tool_name": "export_raw_dataset",
    "policy_package": "open_gmase/can_contracts",
    "parameters": {},
    "metadata": {
      "contract_id": "demo-contract-1",
      "contract_allows_raw_export": false
    }
  }'

echo ""
echo "== 5) ALLOW: signed training start (open_gmase/can_contracts) =="
curl -s -w "\nHTTP %{http_code}\n" -X POST "${CAN_API}/api/debug/gmase-tool-check" \
  -H 'Content-Type: application/json' \
  -d '{
    "tool_name": "start_training",
    "policy_package": "open_gmase/can_contracts",
    "parameters": {},
    "metadata": {
      "contract_id": "demo-contract-1",
      "contract_status": "SIGNED",
      "dataset_classification": "internal",
      "training_region": "private-vpc"
    }
  }'

echo ""
echo "== 6) Recent decisions from CAN AuditLogs =="
curl -s "${CAN_API}/api/debug/gmase-tool-decisions?limit=5"
echo
echo ""
echo "Done. This is the unified *demo slice* (not full CompliancePulse/G-MASE swarm runtime)."
