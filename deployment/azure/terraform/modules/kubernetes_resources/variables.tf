variable "db_host" { type = string }
variable "db_port" { type = string }
variable "db_name" { type = string }
variable "db_user" { type = string }
variable "db_password" { type = string, sensitive = true }
variable "lb_ip" { type = string }
variable "registry_url" { type = string }
variable "app_domain" { type = string }
variable "environment" { type = string }
variable "keycloak_admin_username" { type = string }
variable "keycloak_admin_password" { type = string, sensitive = true }
