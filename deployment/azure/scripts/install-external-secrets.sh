#!/bin/sh
# Install External Secrets Operator and the Key Vault store.
# Exits before any install when kubectl or the vault settings are missing.
set -eu

: "${AZURE_KEY_VAULT_NAME:?Set AZURE_KEY_VAULT_NAME. External Secrets was not installed.}"
: "${AZURE_TENANT_ID:?Set AZURE_TENANT_ID. External Secrets was not installed.}"
: "${AZURE_CLIENT_ID:?Set AZURE_CLIENT_ID to the external-secrets workload identity. External Secrets was not installed.}"
: "${AZURE_ENVIRONMENT:?Set AZURE_ENVIRONMENT (dev, test, staging, or prod). External Secrets was not installed.}"

kubectl cluster-info >/dev/null

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
helm repo add external-secrets https://charts.external-secrets.io
helm repo update external-secrets
helm upgrade --install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace \
  --values "$ROOT/helm/external-secrets/values.yaml"

kubectl annotate serviceaccount external-secrets \
  --namespace external-secrets \
  azure.workload.identity/client-id="$AZURE_CLIENT_ID" \
  --overwrite
kubectl label serviceaccount external-secrets \
  --namespace external-secrets \
  azure.workload.identity/use=true \
  --overwrite

sed \
  -e "s/__VAULT_NAME__/${AZURE_KEY_VAULT_NAME}/g" \
  -e "s/__ENVIRONMENT__/${AZURE_ENVIRONMENT}/g" \
  "$ROOT/manifests/external-secrets/keyvault-store.yaml" | kubectl apply -f -

echo "External Secrets is installed. Secrets sync from ${AZURE_KEY_VAULT_NAME}."
