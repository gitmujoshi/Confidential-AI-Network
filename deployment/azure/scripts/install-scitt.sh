#!/bin/sh
# Deploy this repo's SCITT ledger onto AKS.
# Exits before apply when the cluster, image, or database URL is missing.
set -eu

: "${SCITT_IMAGE:?Set SCITT_IMAGE to the pushed scitt-ccf image. SCITT was not deployed.}"
: "${DATABASE_URL:?Set DATABASE_URL. SCITT was not deployed.}"

kubectl cluster-info >/dev/null
kubectl get namespace contract-management >/dev/null

kubectl create secret generic scitt-db \
  --namespace contract-management \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --dry-run=client -o yaml | kubectl apply -f -

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
sed "s|__SCITT_IMAGE__|${SCITT_IMAGE}|g" \
  "$ROOT/manifests/scitt/scitt.yaml" | kubectl apply -f -

echo "SCITT ledger is applied. It is this repo's service, not a Microsoft CCF network."
