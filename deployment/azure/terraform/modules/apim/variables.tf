variable "enabled" {
  type    = bool
  default = false
}

variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "environment" { type = string }
variable "tenant_id" { type = string }
variable "audience" { type = string }

variable "publisher_name" {
  type    = string
  default = "Confidential AI Network"
}

variable "publisher_email" {
  type    = string
  default = ""
}

variable "backend_url" {
  type    = string
  default = ""
}

variable "policy_template" { type = string }

variable "project_tags" {
  type    = map(string)
  default = {}
}
