variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_user" {
  description = "Database user"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "registry_url" {
  description = "Container registry URL"
  type        = string
}

variable "image_tag" {
  description = "Pinned container image tag"
  type        = string
}

variable "release_version" {
  description = "Application release version exposed to pods"
  type        = string
}

variable "app_domain" {
  description = "Application domain"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "ethereum_network" {
  description = "Ethereum network"
  type        = string
}

variable "infura_project_id" {
  description = "Infura project ID"
  type        = string
}

# OCI IAM Identity Domains (sole IdP on OCI — no Keycloak)
variable "oci_identity_domain_url" {
  description = "OCI Identity Domain base URL (https://idcs-….identity.oraclecloud.com)"
  type        = string
  default     = ""
}

variable "oci_identity_client_id" {
  description = "SPA / OIDC client id in Identity Domain"
  type        = string
  default     = ""
}

variable "oci_identity_api_client_id" {
  description = "API audience / resource client id"
  type        = string
  default     = ""
}

variable "oci_identity_client_secret" {
  description = "Confidential client secret (optional; Vault preferred)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "oci_identity_issuer" {
  description = "JWT issuer (defaults to domain URL when empty in app)"
  type        = string
  default     = ""
}

variable "oci_identity_audience" {
  description = "JWT audience"
  type        = string
  default     = ""
}

variable "oci_identity_jwks_url" {
  description = "JWKS URL override (optional; discovery used when empty)"
  type        = string
  default     = ""
}

variable "oci_identity_role_claim" {
  description = "JWT claim carrying role groups"
  type        = string
  default     = "groups"
}

variable "oci_identity_redirect_uri" {
  description = "OIDC redirect URI (defaults to https://{app_domain}/login)"
  type        = string
  default     = ""
}

variable "oci_cloud_gate_enabled" {
  description = "Whether Cloud Gate fronts the SPA"
  type        = bool
  default     = true
}

variable "lb_ip" {
  description = "Deprecated optional legacy LB IP (unused when using OKE native LB)"
  type        = string
  default     = ""
}

variable "db_ssl" {
  description = "Require SSL for PostgreSQL connections"
  type        = bool
  default     = true
}

variable "frontend_api_base_url" {
  description = "API base URL baked into guidance (use /api with nginx proxy)"
  type        = string
  default     = "/api"
}

variable "backend_replicas" {
  type    = number
  default = 2
}

variable "frontend_replicas" {
  type    = number
  default = 2
}

variable "expose_backend_load_balancer" {
  description = "Also create a public LB Service for the API (debug). Prefer nginx /api proxy."
  type        = bool
  default     = false
}

variable "ocir_host" {
  description = "OCIR hostname for imagePullSecret (e.g. iad.ocir.io)"
  type        = string
  default     = ""
}

variable "ocir_username" {
  description = "OCIR username (tenancy-namespace/username)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "ocir_auth_token" {
  description = "OCIR auth token for pulling private images"
  type        = string
  default     = ""
  sensitive   = true
}

variable "oci_vault_ocid" {
  type    = string
  default = ""
}

variable "oci_vault_key_id" {
  type    = string
  default = ""
}

variable "object_storage_namespace" {
  type    = string
  default = ""
}

variable "object_storage_datasets_bucket" {
  type    = string
  default = ""
}

variable "object_storage_outputs_bucket" {
  type    = string
  default = ""
}

variable "object_storage_artifacts_bucket" {
  type    = string
  default = ""
}
