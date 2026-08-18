# SPIRE on AKS — namespace + ConfigMap scaffold (Helm chart apply is separate)
#
# enable_spire=true creates the spire namespace and a ConfigMap with trust-domain
# settings. Install the chart with:
#   helm upgrade --install spire spiffe/spire -n spire -f deployment/azure/helm/spire/values.yaml
#
# Design: docs/deployment/AZURE_SPIFFE_SPIRE_WIF.md

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
  }
}

resource "kubernetes_namespace" "spire" {
  count = var.enabled ? 1 : 0

  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/name" = "spire"
      "can.azure/spiffe"       = "true"
    }
  }
}

resource "kubernetes_config_map" "spire_can" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "can-spire-config"
    namespace = kubernetes_namespace.spire[0].metadata[0].name
  }

  data = {
    SPIFFE_TRUST_DOMAIN       = var.trust_domain
    SPIRE_OIDC_DISCOVERY_HINT = var.oidc_discovery_hint
    CAN_ENVIRONMENT           = var.environment
    INSTALL_HINT              = "helm upgrade --install spire spiffe/spire -n ${var.namespace} -f deployment/azure/helm/spire/values.yaml"
  }
}

# ClusterSPIFFEID-style documentation via ConfigMap (CRDs come with SPIRE Operator/Helm)
resource "kubernetes_config_map" "clusterspiffeids" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "can-clusterspiffeid-plan"
    namespace = kubernetes_namespace.spire[0].metadata[0].name
  }

  data = {
    "backend"          = "spiffe://${var.trust_domain}/ns/${var.app_namespace}/sa/backend"
    "training-job"     = "spiffe://${var.trust_domain}/ns/${var.app_namespace}/sa/training-job"
    "can-jcs"          = "spiffe://${var.trust_domain}/ns/${var.app_namespace}/sa/can-jcs"
    "external-secrets" = "spiffe://${var.trust_domain}/ns/external-secrets/sa/external-secrets"
  }
}
