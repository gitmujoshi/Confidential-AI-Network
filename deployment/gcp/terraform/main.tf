terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "identity" {
  source = "./modules/identity"

  project_id  = var.project_id
  environment = var.environment
  app_domain  = var.app_domain

  enable_apis              = var.enable_identity_apis
  enable_identity_platform = var.enable_identity_platform
  enable_google_idp        = var.enable_google_idp
  email_sign_in_enabled    = var.email_sign_in_enabled
  oauth_client_id          = var.gcp_oauth_client_id
  oauth_client_secret      = var.gcp_oauth_client_secret
  redirect_uri             = var.gcp_identity_redirect_uri
  oidc_issuer              = var.gcp_oidc_issuer
  oidc_audience            = var.gcp_oidc_audience
}
