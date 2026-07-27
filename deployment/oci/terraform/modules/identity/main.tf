# OCI IAM Identity Domains — domain, OIDC apps, role groups
#
# Creates (when enabled):
#   - oci_identity_domain
#   - Groups: cms-{env}-all-users, tdc/tdp/ccrp/app-admins, platform-admins
#   - SPA (public PKCE) + API (confidential / resource) OIDC apps
#
# Docs: docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md §3.1
#       docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md §1.3 / §1.5

terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.40.0"
    }
  }
}

locals {
  redirect_uri = var.redirect_uri != "" ? var.redirect_uri : "https://${var.app_domain}/login"
  logout_uri   = var.post_logout_redirect_uri != "" ? var.post_logout_redirect_uri : "https://${var.app_domain}/"

  group_defs = {
    all_users = {
      display_name = "cms-${var.environment}-all-users"
      description  = "All Confidential AI Network users (${var.environment})"
    }
    tdc = {
      display_name = "cms-${var.environment}-tdc-users"
      description  = "Training Data Consumers (${var.environment})"
    }
    tdp = {
      display_name = "cms-${var.environment}-tdp-users"
      description  = "Training Data Providers (${var.environment})"
    }
    ccrp = {
      display_name = "cms-${var.environment}-ccrp-users"
      description  = "Confidential Clean Room Providers / TSP (${var.environment})"
    }
    app_admins = {
      display_name = "cms-${var.environment}-app-admins"
      description  = "Application administrators (${var.environment})"
    }
    platform_admins = {
      display_name = "cms-${var.environment}-platform-admins"
      description  = "Platform / ops administrators (${var.environment})"
    }
  }

  # Prefer newly created domain; else existing OCID lookup; else caller URL.
  domain_url = (
    var.create_domain
    ? oci_identity_domain.this[0].url
    : (
      var.existing_domain_id != ""
      ? data.oci_identity_domain.existing[0].url
      : var.existing_domain_url
    )
  )

  idcs_endpoint = local.domain_url
}

# -----------------------------------------------------------------------------
# Domain
# -----------------------------------------------------------------------------

resource "oci_identity_domain" "this" {
  count = var.create_domain ? 1 : 0

  compartment_id     = var.compartment_id
  display_name       = var.domain_display_name != "" ? var.domain_display_name : "cms-${var.environment}-id"
  description        = var.domain_description != "" ? var.domain_description : "Confidential AI Network Identity Domain (${var.environment})"
  home_region        = var.home_region
  license_type       = var.license_type
  is_hidden_on_login = var.is_hidden_on_login

  # Optional bootstrap admin (all four required together when used)
  admin_email              = var.admin_email != "" ? var.admin_email : null
  admin_first_name         = var.admin_first_name != "" ? var.admin_first_name : null
  admin_last_name          = var.admin_last_name != "" ? var.admin_last_name : null
  admin_user_name          = var.admin_user_name != "" ? var.admin_user_name : null
  is_notification_bypassed = var.admin_email != "" ? var.is_notification_bypassed : null

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags

  timeouts {
    create = "40m"
    update = "20m"
    delete = "20m"
  }

  lifecycle {
    precondition {
      condition     = var.home_region != ""
      error_message = "home_region is required when create_domain=true"
    }
  }
}

data "oci_identity_domain" "existing" {
  count     = !var.create_domain && var.existing_domain_id != "" ? 1 : 0
  domain_id = var.existing_domain_id
}

# -----------------------------------------------------------------------------
# Role groups (app roles)
# -----------------------------------------------------------------------------

resource "oci_identity_domains_group" "roles" {
  for_each = var.create_groups ? local.group_defs : {}

  idcs_endpoint = local.idcs_endpoint
  display_name  = each.value.display_name
  schemas       = ["urn:ietf:params:scim:schemas:core:2.0:Group"]

  urnietfparamsscimschemasoracleidcsextensiongroup_group {
    description = each.value.description
  }

  attribute_sets = ["all"]

  lifecycle {
    ignore_changes = [
      # Provider drift workarounds seen in OCI IAM landing zones
      attribute_sets,
      attributes,
      schemas,
    ]
  }

  depends_on = [oci_identity_domain.this]
}

# -----------------------------------------------------------------------------
# OIDC apps — SPA (public) + API (confidential resource)
# -----------------------------------------------------------------------------

resource "oci_identity_domains_app" "frontend" {
  count = var.create_apps ? 1 : 0

  idcs_endpoint = local.idcs_endpoint
  display_name  = "cms-${var.environment}-frontend"
  name          = "cms-${var.environment}-frontend"
  active        = true
  schemas       = ["urn:ietf:params:scim:schemas:oracle:idcs:App"]

  based_on_template {
    value         = "CustomWebAppTemplateId"
    well_known_id = "CustomWebAppTemplateId"
  }

  is_oauth_client           = true
  client_type               = "public"
  allowed_grants            = ["authorization_code", "refresh_token"]
  redirect_uris             = [local.redirect_uri]
  post_logout_redirect_uris = [local.logout_uri]
  all_url_schemes_allowed   = var.allow_all_url_schemes
  client_ip_checking        = "anywhere"
  bypass_consent            = true
  show_in_my_apps           = true
  trust_scope               = "Explicit"
  force_delete              = true

  depends_on = [oci_identity_domain.this]
}

resource "oci_identity_domains_app" "api" {
  count = var.create_apps ? 1 : 0

  idcs_endpoint = local.idcs_endpoint
  display_name  = "cms-${var.environment}-api"
  name          = "cms-${var.environment}-api"
  active        = true
  schemas       = ["urn:ietf:params:scim:schemas:oracle:idcs:App"]

  based_on_template {
    value         = "CustomWebAppTemplateId"
    well_known_id = "CustomWebAppTemplateId"
  }

  is_oauth_client    = true
  is_oauth_resource  = true
  client_type        = "confidential"
  audience           = var.api_audience != "" ? var.api_audience : "api://cms-${var.environment}-api"
  allowed_grants     = ["client_credentials", "authorization_code", "refresh_token"]
  client_ip_checking = "anywhere"
  bypass_consent     = true
  trust_scope        = "Explicit"
  force_delete       = true

  depends_on = [oci_identity_domain.this]
}

resource "terraform_data" "identity_target_guard" {
  lifecycle {
    precondition {
      condition = (
        var.create_domain ||
        var.existing_domain_id != "" ||
        var.existing_domain_url != ""
      )
      error_message = "Set create_domain=true, or provide existing_domain_id / existing_domain_url."
    }
  }
}
