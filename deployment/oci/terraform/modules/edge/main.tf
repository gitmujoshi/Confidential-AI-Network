# Edge module — WAF + API Gateway + Cloud Gate design scaffold
#
# Does NOT create incomplete OCI WAF / API Gateway resources (many required
# fields would break terraform plan). Instead writes a ConfigMap with edge
# design keys for operators and downstream Helm wiring.
#
# Design: docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md §9–§11

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
  }
}

locals {
  waf_policy_name             = var.waf_policy_name != "" ? var.waf_policy_name : "cms-waf-${var.environment}"
  api_gateway_name            = var.api_gateway_name != "" ? var.api_gateway_name : "cms-api-gw-${var.environment}"
  api_gateway_deployment_path = var.api_gateway_deployment_path != "" ? var.api_gateway_deployment_path : "/api"
  jwt_issuer                  = var.jwt_issuer != "" ? var.jwt_issuer : replace("https://identity.{env}.example.com", "{env}", var.environment)
  jwt_jwks_url                = var.jwt_jwks_url != "" ? var.jwt_jwks_url : "${local.jwt_issuer}/.well-known/jwks.json"
  api_hostname                = var.api_hostname != "" ? var.api_hostname : "api.${var.app_domain}"
  app_hostname                = var.app_hostname != "" ? var.app_hostname : "app.${var.app_domain}"
}

resource "terraform_data" "edge_preconditions" {
  count = var.enabled ? 1 : 0

  lifecycle {
    precondition {
      condition     = var.compartment_id != ""
      error_message = "compartment_id is required when edge module enabled=true (edge/network compartment OCID)"
    }
    precondition {
      condition     = var.app_domain != ""
      error_message = "app_domain is required when edge module enabled=true (e.g. dev.example.com)"
    }
  }
}

resource "kubernetes_config_map" "edge_design" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "oci-edge-design"
    namespace = var.app_namespace
    labels = {
      "app.kubernetes.io/part-of" = "confidential-ai-network"
      "cms-component"             = "edge"
    }
  }

  data = {
    EDGE_ENABLED                = "true"
    EDGE_DESIGN_DOC             = "docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md"
    WAF_POLICY_NAME             = local.waf_policy_name
    API_GATEWAY_NAME            = local.api_gateway_name
    API_GATEWAY_DEPLOYMENT_PATH = local.api_gateway_deployment_path
    JWT_ISSUER                  = local.jwt_issuer
    JWT_JWKS_URL                = local.jwt_jwks_url
    JWT_AUDIENCE                = var.jwt_audience != "" ? var.jwt_audience : "cms-${var.environment}-api"
    API_HOSTNAME                = local.api_hostname
    APP_HOSTNAME                = local.app_hostname
    CLOUD_GATE_APP_FRONTEND     = "cms-frontend-${var.environment}"
    CLOUD_GATE_APP_OPS          = "cms-ops-${var.environment}"
    COMPARTMENT_ID              = var.compartment_id
    ENVIRONMENT                 = var.environment
    OCI_IDENTITY_AUDIENCE       = var.jwt_audience != "" ? var.jwt_audience : "cms-${var.environment}-api"
    SCAFFOLD_NOTE               = "OCI WAF/API Gateway/Cloud Gate resources are design-documented; apply manually or extend this module after first live edge deploy."
  }

  depends_on = [terraform_data.edge_preconditions]
}
