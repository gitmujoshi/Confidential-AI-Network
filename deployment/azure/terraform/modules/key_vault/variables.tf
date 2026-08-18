variable "enabled" {
  type    = bool
  default = true
}

variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "tenant_id" { type = string }
variable "environment" { type = string }
variable "name_prefix" {
  type    = string
  default = "can"
}

variable "sku_name" {
  type    = string
  default = "standard"
}

variable "soft_delete_retention_days" {
  type    = number
  default = 90
}

variable "purge_protection_enabled" {
  type    = bool
  default = false
}

variable "public_network_access_enabled" {
  type    = bool
  default = true
}

variable "db_host" {
  type    = string
  default = ""
}

variable "db_port" {
  type    = string
  default = "5432"
}

variable "db_name" {
  type    = string
  default = ""
}

variable "db_user" {
  type    = string
  default = ""
}

variable "db_password" {
  type      = string
  default   = ""
  sensitive = true
}

variable "entra_client_secret" {
  type      = string
  default   = ""
  sensitive = true
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
