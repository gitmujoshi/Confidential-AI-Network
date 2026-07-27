# Microsoft Entra ID — SPA + API app registrations and app roles
#
# Creates (when enabled):
#   - API app (resource) with app roles TDC / TDP / CCRP / AppAdmin + access_as_user scope
#   - SPA app (public) with redirect URI for React OIDC login
#   - Service principals + optional API password (client credentials)
#
# Docs: docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md §3.1

terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = ">= 2.47.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.5.0"
    }
  }
}

locals {
  redirect_uri = var.redirect_uri != "" ? var.redirect_uri : "https://${var.app_domain}/login"
  logout_uri   = var.post_logout_redirect_uri != "" ? var.post_logout_redirect_uri : "https://${var.app_domain}/"
  api_audience = var.api_audience != "" ? var.api_audience : "api://cms-${var.environment}-api"
  authority    = "https://login.microsoftonline.com/${var.tenant_id}/v2.0"
}

resource "random_uuid" "app_role_tdc" {}
resource "random_uuid" "app_role_tdp" {}
resource "random_uuid" "app_role_ccrp" {}
resource "random_uuid" "app_role_appadmin" {}
resource "random_uuid" "scope_access_as_user" {}

# -----------------------------------------------------------------------------
# API application (JWT audience + app roles)
# -----------------------------------------------------------------------------

resource "azuread_application" "api" {
  count = var.create_apps ? 1 : 0

  display_name     = var.api_display_name != "" ? var.api_display_name : "cms-${var.environment}-api"
  identifier_uris  = [local.api_audience]
  sign_in_audience = "AzureADMyOrg"

  api {
    mapped_claims_enabled          = true
    requested_access_token_version = 2

    oauth2_permission_scope {
      admin_consent_description  = "Allow the app to access the Confidential AI Network API as the signed-in user."
      admin_consent_display_name = "Access CAN API"
      enabled                    = true
      id                         = random_uuid.scope_access_as_user.result
      type                       = "User"
      user_consent_description   = "Allow the app to access the Confidential AI Network API on your behalf."
      user_consent_display_name  = "Access CAN API"
      value                      = "access_as_user"
    }
  }

  app_role {
    allowed_member_types = ["User", "Application"]
    description          = "Training Data Consumer"
    display_name         = "TDC"
    enabled              = true
    id                   = random_uuid.app_role_tdc.result
    value                = "TDC"
  }

  app_role {
    allowed_member_types = ["User", "Application"]
    description          = "Training Data Provider"
    display_name         = "TDP"
    enabled              = true
    id                   = random_uuid.app_role_tdp.result
    value                = "TDP"
  }

  app_role {
    allowed_member_types = ["User", "Application"]
    description          = "Confidential Clean Room Provider / TSP"
    display_name         = "CCRP"
    enabled              = true
    id                   = random_uuid.app_role_ccrp.result
    value                = "CCRP"
  }

  app_role {
    allowed_member_types = ["User", "Application"]
    description          = "Application administrator"
    display_name         = "AppAdmin"
    enabled              = true
    id                   = random_uuid.app_role_appadmin.result
    value                = "AppAdmin"
  }

  owners = var.owners
}

resource "azuread_service_principal" "api" {
  count = var.create_apps ? 1 : 0

  client_id                    = azuread_application.api[0].client_id
  app_role_assignment_required = false
  owners                       = var.owners
}

resource "azuread_application_password" "api" {
  count = var.create_apps && var.create_api_client_secret ? 1 : 0

  application_id = azuread_application.api[0].id
  display_name   = "cms-${var.environment}-api-terraform"
}

# -----------------------------------------------------------------------------
# SPA application (public OIDC client for React login redirect)
# -----------------------------------------------------------------------------

resource "azuread_application" "frontend" {
  count = var.create_apps ? 1 : 0

  display_name     = var.frontend_display_name != "" ? var.frontend_display_name : "cms-${var.environment}-frontend"
  sign_in_audience = "AzureADMyOrg"

  single_page_application {
    redirect_uris = [local.redirect_uri]
  }

  web {
    logout_url = local.logout_uri
  }

  required_resource_access {
    resource_app_id = azuread_application.api[0].client_id

    resource_access {
      id   = random_uuid.scope_access_as_user.result
      type = "Scope"
    }
  }

  owners = var.owners

  depends_on = [azuread_application.api]
}

resource "azuread_service_principal" "frontend" {
  count = var.create_apps ? 1 : 0

  client_id                    = azuread_application.frontend[0].client_id
  app_role_assignment_required = false
  owners                       = var.owners
}

# Admin consent for SPA → API delegated scope
resource "azuread_service_principal_delegated_permission_grant" "frontend_api" {
  count = var.create_apps && var.grant_admin_consent ? 1 : 0

  service_principal_object_id          = azuread_service_principal.frontend[0].object_id
  resource_service_principal_object_id = azuread_service_principal.api[0].object_id
  claim_values                         = ["access_as_user"]
}
