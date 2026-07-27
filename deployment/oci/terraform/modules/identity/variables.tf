variable "compartment_id" {
  description = "Compartment OCID for the Identity Domain"
  type        = string
}

variable "environment" {
  description = "Environment name (dev|test|staging|prod)"
  type        = string
}

variable "home_region" {
  description = "Domain home region (e.g. us-ashburn-1)"
  type        = string
}

variable "app_domain" {
  description = "Public app hostname base (e.g. app.dev.example.com)"
  type        = string
}

variable "create_domain" {
  description = "Create a new Identity Domain (false = use existing_domain_id or existing_domain_url)"
  type        = bool
  default     = true
}

variable "create_groups" {
  description = "Create cms-{env}-* role groups in the domain"
  type        = bool
  default     = true
}

variable "create_apps" {
  description = "Create SPA + API OIDC apps in the domain"
  type        = bool
  default     = true
}

variable "existing_domain_id" {
  description = "Existing Identity Domain OCID (when create_domain=false)"
  type        = string
  default     = ""
}

variable "existing_domain_url" {
  description = "Existing Identity Domain URL when OCID unknown (create_domain=false)"
  type        = string
  default     = ""
}

variable "domain_display_name" {
  description = "Display name for new domain (default cms-{env}-id)"
  type        = string
  default     = ""
}

variable "domain_description" {
  description = "Description for new domain"
  type        = string
  default     = ""
}

variable "license_type" {
  description = "Identity Domain license type (free | premium | …)"
  type        = string
  default     = "free"
}

variable "is_hidden_on_login" {
  description = "Hide domain on tenancy login chooser"
  type        = bool
  default     = false
}

variable "admin_email" {
  description = "Optional domain admin email (requires first/last/user name + is_notification_bypassed)"
  type        = string
  default     = ""
}

variable "admin_first_name" {
  type    = string
  default = ""
}

variable "admin_last_name" {
  type    = string
  default = ""
}

variable "admin_user_name" {
  type    = string
  default = ""
}

variable "is_notification_bypassed" {
  description = "Skip welcome email when creating domain admin"
  type        = bool
  default     = true
}

variable "redirect_uri" {
  description = "SPA OIDC redirect URI (default https://{app_domain}/login)"
  type        = string
  default     = ""
}

variable "post_logout_redirect_uri" {
  description = "SPA post-logout URI (default https://{app_domain}/)"
  type        = string
  default     = ""
}

variable "api_audience" {
  description = "API app audience / JWT audience (default api://cms-{env}-api)"
  type        = string
  default     = ""
}

variable "allow_all_url_schemes" {
  description = "Allow non-https redirect URIs (useful for LB IP pilots)"
  type        = bool
  default     = true
}

variable "freeform_tags" {
  type    = map(string)
  default = {}
}

variable "defined_tags" {
  type    = map(map(string))
  default = {}
}
