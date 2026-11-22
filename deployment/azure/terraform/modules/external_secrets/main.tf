# Service account the External Secrets Operator uses for Workload Identity.
# The operator chart and the SecretStore are applied by install-external-secrets.sh
# after the CRDs exist. This module does not pretend the operator is installed.

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
  }
}

resource "kubernetes_namespace" "external_secrets" {
  count = var.enabled ? 1 : 0

  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/part-of" = "confidential-ai-network"
    }
  }
}

resource "kubernetes_service_account" "external_secrets" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "external-secrets"
    namespace = kubernetes_namespace.external_secrets[0].metadata[0].name
    annotations = var.client_id != "" ? {
      "azure.workload.identity/client-id" = var.client_id
    } : {}
    labels = {
      "azure.workload.identity/use" = "true"
    }
  }
}
