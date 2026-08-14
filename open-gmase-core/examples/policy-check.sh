#!/usr/bin/env bash
# Exercise community Rego packs against a running OPA (docker compose up -d)
set -euo pipefail
OPA_URL="${OPA_URL:-http://localhost:8181}"

echo "== Deny DROP TABLE in production =="
curl -s -X POST "${OPA_URL}/v1/data/open_gmase/tools" \
  -H 'Content-Type: application/json' \
  -d '{
    "input": {
      "tool_name": "execute_sql",
      "environment": "production",
      "parameters": { "query": "DROP TABLE users;" },
      "confidence_score": 0.99,
      "cost_estimate_usd": 1,
      "metadata": {}
    }
  }' | tee /dev/stderr
echo

echo "== Allow SELECT dry path =="
curl -s -X POST "${OPA_URL}/v1/data/open_gmase/tools" \
  -H 'Content-Type: application/json' \
  -d '{
    "input": {
      "tool_name": "execute_sql",
      "environment": "production",
      "parameters": { "query": "SELECT 1;" },
      "confidence_score": 0.99,
      "cost_estimate_usd": 1,
      "metadata": { "dry_run": false }
    }
  }' | tee /dev/stderr
echo

echo "== kubectl delete without HITL =="
curl -s -X POST "${OPA_URL}/v1/data/open_gmase/kubectl" \
  -H 'Content-Type: application/json' \
  -d '{
    "input": {
      "tool_name": "kubectl",
      "parameters": { "args": "delete pod nginx -n prod" },
      "metadata": {}
    }
  }' | tee /dev/stderr
echo
