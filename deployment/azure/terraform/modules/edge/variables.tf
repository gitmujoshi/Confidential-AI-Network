variable "enabled" {
  type    = bool
  default = false
}

variable "resource_group_name" { type = string }
variable "environment" { type = string }

variable "sku_name" {
  type    = string
  default = "Standard_AzureFrontDoor"
}

variable "enable_waf" {
  type    = bool
  default = true
}

variable "waf_mode" {
  type    = string
  default = "Prevention"
}

variable "origin_host_name" {
  description = "Public IP or hostname of App Gateway / LB"
  type        = string
  default     = ""
}

variable "origin_host_header" {
  type    = string
  default = ""
}

variable "origin_http_port" {
  type    = number
  default = 3000
}

variable "project_tags" {
  type    = map(string)
  default = {}
}
