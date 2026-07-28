variable "enabled" {
  description = "Create OCI Vault and master CMK"
  type        = bool
  default     = false
}

variable "compartment_id" {
  description = "Compartment OCID for Vault (typically cms-{env}-data)"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name (dev|test|staging|prod)"
  type        = string
}

variable "vault_display_name" {
  description = "Vault display name (default cms-{env}-vault)"
  type        = string
  default     = ""
}

variable "key_display_name" {
  description = "Master key display name (default cms-{env}-master-key)"
  type        = string
  default     = ""
}

variable "vault_type" {
  description = "DEFAULT for dev; use VIRTUAL_PRIVATE + HSM for prod"
  type        = string
  default     = "DEFAULT"
}

variable "key_algorithm" {
  type    = string
  default = "AES"
}

variable "key_length" {
  type    = number
  default = 32
}
