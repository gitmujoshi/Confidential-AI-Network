# Google Cloud Identity Platform — OIDC / Identity Toolkit config
#
# Enables Identity Platform on the project and documents OAuth client wiring.
# Web OAuth client IDs are often created in Google Cloud Console (APIs & Services →
# Credentials); pass them via variables when not created here.
#
# Docs: docs/deployment/GCP_FEATURES_AND_CONFIGURATION.md §3.1

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

locals {
  redirect_uri = var.redirect_uri != "" ? var.redirect_uri : "https://${var.app_domain}/login"
  issuer = (
    var.oidc_issuer != ""
    ? var.oidc_issuer
    : "https://securetoken.google.com/${var.project_id}"
  )
  audience = var.oidc_audience != "" ? var.oidc_audience : var.project_id
}

resource "google_project_service" "identitytoolkit" {
  count = var.enable_apis ? 1 : 0

  project            = var.project_id
  service            = "identitytoolkit.googleapis.com"
  disable_on_destroy = false
}

resource "google_identity_platform_config" "default" {
  count = var.enable_identity_platform ? 1 : 0

  project = var.project_id

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled           = var.email_sign_in_enabled
      password_required = true
    }
  }

  depends_on = [google_project_service.identitytoolkit]
}

# Optional: Google as IdP inside Identity Platform (when using federated Google sign-in)
resource "google_identity_platform_default_supported_idp_config" "google" {
  count = var.enable_identity_platform && var.enable_google_idp && var.oauth_client_id != "" ? 1 : 0

  project       = var.project_id
  enabled       = true
  idp_id        = "google.com"
  client_id     = var.oauth_client_id
  client_secret = var.oauth_client_secret

  depends_on = [google_identity_platform_config.default]
}
