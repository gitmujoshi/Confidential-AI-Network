variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "Default GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev|test|staging|prod)"
  type        = string
  default     = "dev"
}

variable "app_domain" {
  description = "Public app hostname"
  type        = string
}

variable "enable_identity_apis" {
  type    = bool
  default = true
}

variable "enable_identity_platform" {
  type    = bool
  default = true
}

variable "enable_google_idp" {
  type    = bool
  default = true
}

variable "email_sign_in_enabled" {
  type    = bool
  default = false
}

variable "gcp_oauth_client_id" {
  description = "OAuth 2.0 Web client ID from Cloud Console"
  type        = string
  default     = ""
}

variable "gcp_oauth_client_secret" {
  description = "OAuth 2.0 Web client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "gcp_identity_redirect_uri" {
  type    = string
  default = ""
}

variable "gcp_oidc_issuer" {
  type    = string
  default = ""
}

variable "gcp_oidc_audience" {
  type    = string
  default = ""
}
