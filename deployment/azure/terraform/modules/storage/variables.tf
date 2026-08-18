variable "enabled" {
  type    = bool
  default = true
}

variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "environment" { type = string }

variable "name_prefix" {
  type    = string
  default = "can"
}

variable "replication_type" {
  type    = string
  default = "LRS"
}

variable "public_network_access_enabled" {
  type    = bool
  default = true
}

variable "enable_private_endpoint" {
  type    = bool
  default = false
}

variable "private_endpoints_subnet_id" {
  type    = string
  default = ""
}

variable "private_dns_zone_id" {
  type    = string
  default = ""
}

variable "project_tags" {
  type    = map(string)
  default = {}
}
