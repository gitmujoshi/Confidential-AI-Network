variable "tenant_id" {
  description = "Entra tenant ID (directory)"
  type        = string
}

variable "environment" {
  description = "Environment name (dev|test|staging|prod)"
  type        = string
}

variable "app_domain" {
  description = "Public app hostname (e.g. app.dev.example.com)"
  type        = string
}

variable "create_apps" {
  description = "Create SPA + API Entra app registrations"
  type        = bool
  default     = true
}

variable "create_api_client_secret" {
  description = "Create a client secret on the API app (client credentials / optional BFF)"
  type        = bool
  default     = true
}

variable "grant_admin_consent" {
  description = "Grant admin consent for SPA → API access_as_user"
  type        = bool
  default     = true
}

variable "redirect_uri" {
  description = "SPA OIDC redirect URI (default https://{app_domain}/login)"
  type        = string
  default     = ""
}

variable "post_logout_redirect_uri" {
  description = "SPA logout URI (default https://{app_domain}/)"
  type        = string
  default     = ""
}

variable "api_audience" {
  description = "API identifier URI / JWT audience (default api://cms-{env}-api)"
  type        = string
  default     = ""
}

variable "api_display_name" {
  type    = string
  default = ""
}

variable "frontend_display_name" {
  type    = string
  default = ""
}

variable "owners" {
  description = "Object IDs of Entra users who own the app registrations"
  type        = list(string)
  default     = []
}

# Fallback when create_apps=false
variable "existing_client_id" {
  description = "Existing SPA client ID when create_apps=false"
  type        = string
  default     = ""
}

variable "existing_api_client_id" {
  description = "Existing API client ID when create_apps=false"
  type        = string
  default     = ""
}

variable "existing_api_audience" {
  description = "Existing API audience when create_apps=false"
  type        = string
  default     = ""
}

variable "existing_client_secret" {
  description = "Existing API/client secret when create_apps=false"
  type        = string
  default     = ""
  sensitive   = true
}
