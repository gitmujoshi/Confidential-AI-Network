variable "enabled" {
  type    = bool
  default = false
}

variable "namespace" {
  type    = string
  default = "external-secrets"
}

variable "client_id" {
  type    = string
  default = ""
}
