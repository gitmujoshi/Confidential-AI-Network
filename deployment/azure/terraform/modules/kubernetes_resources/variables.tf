variable "db_host" {
  type = string
}

variable "db_port" {
  type = string
}

variable "db_name" {
  type = string
}

variable "db_user" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "lb_ip" {
  type = string
}

variable "registry_url" {
  type = string
}

variable "image_tag" {
  type = string
}

variable "release_version" {
  type = string
}

variable "app_domain" {
  type = string
}

variable "environment" {
  type = string
}

variable "entra_tenant_id" {
  type = string
}

variable "entra_client_id" {
  type = string
}

variable "entra_api_client_id" {
  type = string
}

variable "entra_client_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "entra_authority" {
  type = string
}

variable "entra_issuer" {
  type = string
}

variable "entra_api_audience" {
  type = string
}

variable "entra_api_scope" {
  type    = string
  default = ""
}

variable "entra_jwks_url" {
  type    = string
  default = ""
}

variable "entra_role_claim" {
  type    = string
  default = "roles"
}

variable "entra_redirect_uri" {
  type    = string
  default = ""
}

variable "workload_identity_enabled" {
  type    = bool
  default = false
}

variable "backend_workload_client_id" {
  type    = string
  default = ""
}

variable "storage_account_name" {
  type    = string
  default = ""
}

variable "key_vault_uri" {
  type    = string
  default = ""
}

variable "blob_datasets_container" {
  type    = string
  default = ""
}

variable "blob_outputs_container" {
  type    = string
  default = ""
}

variable "blob_artifacts_container" {
  type    = string
  default = ""
}
