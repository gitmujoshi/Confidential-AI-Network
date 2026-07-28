# SCITT module — optional SCITT CCF on OKE scaffold
#
# ConfigMap-only scaffold for SCITT CCF URL and deployment hints.
# Does NOT install a CCF Helm chart (would break plan without full chart).
#
# Design: docs/features/scitt/SCITT_CCF_ARCHITECTURE.md
# Features: docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md §3.9

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
  }
}

locals {
  scitt_ccf_url   = var.scitt_ccf_url != "" ? var.scitt_ccf_url : "https://scitt.${var.environment}.example.com"
  scitt_namespace = var.scitt_namespace != "" ? var.scitt_namespace : "cms-scitt"
}

resource "kubernetes_config_map" "scitt_design" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "scitt-ccf-config"
    namespace = var.app_namespace
    labels = {
      "app.kubernetes.io/part-of" = "confidential-ai-network"
      "cms-component"             = "scitt"
    }
  }

  data = {
    SCITT_CCF_ENABLED = "true"
    SCITT_CCF_URL     = local.scitt_ccf_url
    SCITT_DEPLOYMENT  = var.deployment_mode
    SCITT_NAMESPACE   = local.scitt_namespace
    SCITT_DESIGN_DOC  = "docs/features/scitt/SCITT_CCF_ARCHITECTURE.md"
    SCITT_PORT        = "9000"
    SCITT_HEALTH_PATH = "/health"
    SCAFFOLD_NOTE     = "OKE Deployment/Service for SCITT CCF is documented in README; apply chart/manifests separately."
  }
}
