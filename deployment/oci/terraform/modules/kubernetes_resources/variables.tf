variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_user" {
  description = "Database user"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "registry_url" {
  description = "Container registry URL"
  type        = string
}

variable "app_domain" {
  description = "Application domain"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "ethereum_network" {
  description = "Ethereum network"
  type        = string
}

variable "infura_project_id" {
  description = "Infura project ID"
  type        = string
}

variable "***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_username" {
  description = "Keycloak admin username"
  type        = string
}

variable "***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_password" {
  description = "Keycloak admin password"
  type        = string
  sensitive   = true
}

variable "***REMOVED-KEYCLOAK_DB_PASSWORD***_db_password" {
  description = "Keycloak database password"
  type        = string
  sensitive   = true
} 