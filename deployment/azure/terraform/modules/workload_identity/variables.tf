variable "enabled" {
  type    = bool
  default = true
}

variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "environment" { type = string }

variable "oidc_issuer_url" {
  description = "AKS OIDC issuer URL"
  type        = string
  default     = ""
}

variable "kubernetes_namespace" {
  type    = string
  default = "contract-management"
}

variable "workload_names" {
  description = "Service account names (also used as WI name suffix)"
  type        = list(string)
  default     = ["backend", "training-job", "external-secrets"]
}

variable "kv_access_workloads" {
  type    = list(string)
  default = ["backend", "external-secrets"]
}

variable "blob_access_workloads" {
  type    = list(string)
  default = ["backend", "training-job"]
}

variable "key_vault_id" {
  type    = string
  default = ""
}

variable "storage_account_id" {
  type    = string
  default = ""
}

variable "project_tags" {
  type    = map(string)
  default = {}
}
