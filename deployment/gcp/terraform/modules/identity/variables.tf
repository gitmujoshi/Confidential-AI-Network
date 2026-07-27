variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "app_domain" {
  description = "Public app hostname (e.g. app.dev.example.com)"
  type        = string
}

variable "environment" {
  description = "Environment name (dev|test|staging|prod)"
  type        = string
}

variable "enable_apis" {
  description = "Enable Identity Toolkit API"
  type        = bool
  default     = true
}

variable "enable_identity_platform" {
  description = "Create google_identity_platform_config"
  type        = bool
  default     = true
}

variable "enable_google_idp" {
  description = "Configure Google as a default supported IdP (needs OAuth client)"
  type        = bool
  default     = true
}

variable "email_sign_in_enabled" {
  description = "Allow email/password in Identity Platform (usually false for SSO-only)"
  type        = bool
  default     = false
}

variable "oauth_client_id" {
  description = "OAuth 2.0 Web client ID (Console → APIs & Services → Credentials)"
  type        = string
  default     = ""
}

variable "oauth_client_secret" {
  description = "OAuth 2.0 Web client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "redirect_uri" {
  description = "OIDC redirect URI (default https://{app_domain}/login)"
  type        = string
  default     = ""
}

variable "oidc_issuer" {
  description = "JWT issuer (default https://securetoken.google.com/{project_id})"
  type        = string
  default     = ""
}

variable "oidc_audience" {
  description = "JWT audience (default project_id for Identity Platform tokens)"
  type        = string
  default     = ""
}
