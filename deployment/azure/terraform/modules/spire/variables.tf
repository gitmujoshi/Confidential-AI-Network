variable "enabled" {
  type    = bool
  default = false
}

variable "namespace" {
  type    = string
  default = "spire"
}

variable "app_namespace" {
  type    = string
  default = "contract-management"
}

variable "trust_domain" {
  type = string
}

variable "environment" {
  type = string
}

variable "oidc_discovery_hint" {
  type    = string
  default = ""
}
