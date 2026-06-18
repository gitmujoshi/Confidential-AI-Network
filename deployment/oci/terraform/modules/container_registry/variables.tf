variable "compartment_id" {
  description = "OCID of the compartment"
  type        = string
}

variable "repository_name" {
  description = "OCIR repository display name"
  type        = string
}

variable "environment" {
  description = "Environment name (immutable tags enabled for prod)"
  type        = string
}

variable "repository_immutable" {
  description = "Override OCIR immutable tag policy (defaults to true for prod)"
  type        = bool
  default     = null
}
