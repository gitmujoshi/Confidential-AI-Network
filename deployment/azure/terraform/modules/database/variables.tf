variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "db_name" { type = string }
variable "db_user" { type = string }
variable "db_password" { type = string, sensitive = true }
variable "subnet_id" { type = string }
variable "vnet_id" { type = string }
variable "sku_name" { type = string }
variable "storage_mb" { type = number }
variable "project_tags" { type = map(string) }
