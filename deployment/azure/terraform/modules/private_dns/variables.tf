variable "enabled" {
  type    = bool
  default = false
}

variable "resource_group_name" { type = string }
variable "vnet_id" { type = string }

variable "project_tags" {
  type    = map(string)
  default = {}
}
