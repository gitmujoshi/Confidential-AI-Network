variable "compartment_id" {
  description = "OCID of the compartment"
  type        = string
}

variable "region" {
  description = "OCI region (used to derive OCIR hostname)"
  type        = string
}

variable "repository_name" {
  description = "OCIR repository name prefix (creates prefix/backend and prefix/frontend)"
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

variable "freeform_tags" {
  type    = map(string)
  default = {}
}

variable "defined_tags" {
  type    = map(string)
  default = {}
}
