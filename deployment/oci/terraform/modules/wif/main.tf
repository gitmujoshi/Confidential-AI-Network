# OCI IAM Workload Identity Federation (WIF) — Phase 3
#
# Creates (when enabled):
#   - Token-exchange confidential OAuth app (client_credentials)
#   - Identity Domain Service Users (svc-can-{env}-*)
#   - IdentityPropagationTrust (SPIRE OIDC issuer → UPST impersonation)
#   - K8s Secret + ConfigMap patch keys for OCI_WIF_*
#
# Design: docs/deployment/OCI_SPIFFE_SPIRE_WIF.md §4.2 / §7 Phase 3
# Requires: Identity Domain endpoint + SPIRE OIDC issuer/JWKS (or pinned cert)

terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.40.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
  }
}

locals {
  idcs_endpoint = trimsuffix(var.idcs_endpoint, "/")

  # Default service users mapped from SPIFFE inventory keys
  default_service_users = {
    backend = {
      user_name    = "svc-can-${var.environment}-backend"
      display_name = "CAN ${var.environment} backend (SPIFFE WIF)"
      spiffe_id    = try(var.spiffe_id_inventory["backend"], "")
      description  = "Impersonation target for backend SPIFFE ID"
    }
    trainer = {
      user_name    = "svc-can-${var.environment}-trainer"
      display_name = "CAN ${var.environment} trainer (SPIFFE WIF)"
      spiffe_id    = try(var.spiffe_id_inventory["trainer"], "")
      description  = "Impersonation target for training-job SPIFFE ID"
    }
  }

  service_users = length(var.service_users) > 0 ? var.service_users : local.default_service_users

  # Impersonation rules: exact sub match on SPIFFE ID (never use sub eq * in prod)
  impersonation_rules = {
    for k, u in local.service_users :
    k => {
      rule = u.spiffe_id != "" ? "sub eq '${u.spiffe_id}'" : null
      # value filled after user create
    }
    if u.spiffe_id != ""
  }

  trust_name = var.trust_name != "" ? var.trust_name : "can-${var.environment}-spire-wif"

  public_key_endpoint = var.spire_jwks_url != "" ? var.spire_jwks_url : null
  use_pinned_cert     = var.spire_public_certificate != ""
}

resource "terraform_data" "wif_preconditions" {
  count = var.enabled ? 1 : 0

  lifecycle {
    precondition {
      condition     = var.idcs_endpoint != ""
      error_message = "idcs_endpoint (Identity Domain URL) is required when enable_wif=true"
    }
    precondition {
      condition     = var.spire_oidc_issuer != ""
      error_message = "spire_oidc_issuer is required when enable_wif=true (enable SPIRE Phase 1 or pass issuer)"
    }
    precondition {
      condition = (
        var.spire_jwks_url != "" || var.spire_public_certificate != ""
      )
      error_message = "Provide spire_jwks_url (reachable JWKS) or spire_public_certificate (pinned) for the Propagation Trust"
    }
    precondition {
      condition     = length(local.impersonation_rules) > 0
      error_message = "At least one service user needs a non-empty spiffe_id for impersonation rules"
    }
  }
}

# -----------------------------------------------------------------------------
# Token-exchange OAuth client (confidential; NO Identity Domain Admin role)
# -----------------------------------------------------------------------------

resource "oci_identity_domains_app" "token_exchange" {
  count = var.enabled && var.create_token_exchange_app ? 1 : 0

  idcs_endpoint = local.idcs_endpoint
  display_name  = var.token_exchange_app_name != "" ? var.token_exchange_app_name : "cms-${var.environment}-wif-token-exchange"
  name          = var.token_exchange_app_name != "" ? var.token_exchange_app_name : "cms-${var.environment}-wif-token-exchange"
  active        = true
  schemas       = ["urn:ietf:params:scim:schemas:oracle:idcs:App"]

  based_on_template {
    value         = "CustomWebAppTemplateId"
    well_known_id = "CustomWebAppTemplateId"
  }

  is_oauth_client    = true
  client_type        = "confidential"
  allowed_grants     = ["client_credentials"]
  client_ip_checking = "anywhere"
  bypass_consent     = true
  trust_scope        = "Explicit"
  force_delete       = true
  description        = "OCI WIF token-exchange client for SPIRE JWT-SVID → UPST (${var.environment})"
}

# -----------------------------------------------------------------------------
# Service Users (impersonation targets)
# -----------------------------------------------------------------------------

resource "oci_identity_domains_user" "service" {
  for_each = var.enabled && var.create_service_users ? local.service_users : {}

  idcs_endpoint = local.idcs_endpoint
  schemas = [
    "urn:ietf:params:scim:schemas:core:2.0:User",
    "urn:ietf:params:scim:schemas:oracle:idcs:extension:user:User",
  ]

  user_name    = each.value.user_name
  display_name = each.value.display_name
  description  = try(each.value.description, null)
  active       = true

  emails {
    value   = try(each.value.email, "${each.value.user_name}@wif.invalid")
    type    = "work"
    primary = true
  }

  urnietfparamsscimschemasoracleidcsextensionuser_user {
    is_service_user = true
  }
}

# -----------------------------------------------------------------------------
# Identity Propagation Trust (SPIRE → OCI UPST)
# -----------------------------------------------------------------------------

resource "oci_identity_domains_identity_propagation_trust" "spire" {
  count = var.enabled && var.create_propagation_trust ? 1 : 0

  idcs_endpoint = local.idcs_endpoint
  schemas       = ["urn:ietf:params:scim:schemas:oracle:idcs:IdentityPropagationTrust"]

  name                = local.trust_name
  type                = "JWT"
  issuer              = var.spire_oidc_issuer
  active              = true
  allow_impersonation = true

  # Critical: fetch returned=request fields (impersonation_service_users) to avoid perpetual drift
  attribute_sets = ["all"]

  oauth_clients = [
    var.create_token_exchange_app
    ? oci_identity_domains_app.token_exchange[0].name
    : var.existing_token_exchange_client_id
  ]

  public_key_endpoint = local.use_pinned_cert ? null : local.public_key_endpoint
  public_certificate  = local.use_pinned_cert ? var.spire_public_certificate : null

  subject_type              = "User"
  subject_claim_name        = var.subject_claim_name
  subject_mapping_attribute = var.subject_mapping_attribute

  client_claim_name   = var.client_claim_name != "" ? var.client_claim_name : null
  client_claim_values = length(var.client_claim_values) > 0 ? var.client_claim_values : null

  dynamic "impersonation_service_users" {
    for_each = var.create_service_users ? local.impersonation_rules : var.external_impersonation_rules
    content {
      rule = impersonation_service_users.value.rule
      value = (
        var.create_service_users
        ? oci_identity_domains_user.service[impersonation_service_users.key].id
        : impersonation_service_users.value.service_user_id
      )
    }
  }

  depends_on = [
    oci_identity_domains_app.token_exchange,
    oci_identity_domains_user.service,
    terraform_data.wif_preconditions,
  ]
}

# -----------------------------------------------------------------------------
# Kubernetes: Secret (client secret) + ConfigMap (WIF settings)
# -----------------------------------------------------------------------------

resource "kubernetes_secret" "wif" {
  count = var.enabled && var.write_kubernetes_config ? 1 : 0

  metadata {
    name      = "oci-wif-secret"
    namespace = var.app_namespace
    labels = {
      "app.kubernetes.io/part-of" = "confidential-ai-network"
      "cms-component"             = "wif"
    }
  }

  string_data = {
    OCI_WIF_TOKEN_EXCHANGE_CLIENT_SECRET = (
      var.create_token_exchange_app
      ? oci_identity_domains_app.token_exchange[0].client_secret
      : var.existing_token_exchange_client_secret
    )
  }

  type = "Opaque"
}

resource "kubernetes_config_map" "wif" {
  count = var.enabled && var.write_kubernetes_config ? 1 : 0

  metadata {
    name      = "oci-wif-config"
    namespace = var.app_namespace
    labels = {
      "app.kubernetes.io/part-of" = "confidential-ai-network"
      "cms-component"             = "wif"
    }
  }

  data = {
    OCI_WIF_ENABLED    = "true"
    OCI_WIF_DOMAIN_URL = local.idcs_endpoint
    OCI_WIF_TOKEN_EXCHANGE_CLIENT_ID = (
      var.create_token_exchange_app
      ? oci_identity_domains_app.token_exchange[0].name
      : var.existing_token_exchange_client_id
    )
    OCI_WIF_SUBJECT_TOKEN_TYPE   = "jwt"
    OCI_WIF_REQUESTED_TOKEN_TYPE = "urn:oci:token-type:oci-upst"
    SPIRE_OIDC_ISSUER            = var.spire_oidc_issuer
    SPIRE_OIDC_JWKS_URL          = var.spire_jwks_url
    OCI_AUTH_MODE                = "wif"
    WIF_TRUST_NAME               = local.trust_name
  }
}

# Suggested IAM policy text (classic IAM) — apply manually or via separate policy module
locals {
  suggested_iam_policies = var.enabled ? [
    for k, u in local.service_users : <<-EOT
    # Map Identity Domain service user ${u.user_name} into an IAM group, then:
    # Allow group '<idcs-domain-name>/${u.user_name}-iam-group' to read secret-family in compartment cms-${var.environment}-security
    # Allow group '<idcs-domain-name>/${u.user_name}-iam-group' to read objects in compartment cms-${var.environment}-data
    EOT
  ] : []
}
