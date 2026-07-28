variable "enabled" {
  description = "Write edge design ConfigMap (WAF + API Gateway + Cloud Gate placeholders)"
  type        = bool
  default     = false
}

variable "compartment_id" {
  description = "Edge/network compartment OCID (required when enabled)"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name (dev|test|staging|prod)"
  type        = string
}

variable "app_domain" {
  description = "Base DNS domain for app/api hostnames (required when enabled, e.g. dev.example.com)"
  type        = string
  default     = ""
}

variable "app_namespace" {
  description = "Kubernetes namespace for edge design ConfigMap"
  type        = string
  default     = "contract-management"
}

variable "waf_policy_name" {
  description = "Intended WAF policy name (default cms-waf-{env})"
  type        = string
  default     = ""
}

variable "api_gateway_name" {
  description = "Intended API Gateway name (default cms-api-gw-{env})"
  type        = string
  default     = ""
}

variable "api_gateway_deployment_path" {
  description = "Base path prefix for API Gateway deployment (default /api)"
  type        = string
  default     = ""
}

variable "jwt_issuer" {
  description = "Identity Domain OIDC issuer placeholder"
  type        = string
  default     = ""
}

variable "jwt_jwks_url" {
  description = "Identity Domain JWKS URL placeholder"
  type        = string
  default     = ""
}

variable "jwt_audience" {
  description = "API resource audience / client id placeholder"
  type        = string
  default     = ""
}

variable "api_hostname" {
  description = "Public API hostname (default api.{app_domain})"
  type        = string
  default     = ""
}

variable "app_hostname" {
  description = "Public browser app hostname (default app.{app_domain})"
  type        = string
  default     = ""
}
