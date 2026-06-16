variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "tenant_id" {
  description = "Azure Entra ID tenant ID"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Resource group for all platform resources"
  type        = string
  default     = "can-dev-compute-rg"
}

variable "vnet_cidr" {
  description = "CIDR block for VNet"
  type        = string
  default     = "10.10.0.0/16"
}

variable "cluster_name" {
  description = "AKS cluster name"
  type        = string
  default     = "can-dev-aks"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_count" {
  description = "Number of AKS nodes"
  type        = number
  default     = 3
}

variable "vm_size" {
  description = "AKS node VM size"
  type        = string
  default     = "Standard_D4s_v5"
}

variable "service_cidr" {
  description = "Kubernetes service CIDR"
  type        = string
  default     = "10.96.0.0/16"
}

variable "dns_service_ip" {
  description = "Kubernetes DNS service IP"
  type        = string
  default     = "10.96.0.10"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "contractmanagement"
}

variable "db_user" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "canadmin"
}

variable "db_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "db_sku_name" {
  description = "PostgreSQL SKU"
  type        = string
  default     = "GP_Standard_D2s_v3"
}

variable "db_storage_mb" {
  description = "PostgreSQL storage in MB"
  type        = number
  default     = 32768
}

variable "lb_name" {
  description = "Load balancer / public IP name prefix"
  type        = string
  default     = "can-dev-lb"
}

variable "repository_name" {
  description = "ACR repository name (alphanumeric only)"
  type        = string
  default     = "cancontractmgmt"
}

variable "app_domain" {
  description = "Application domain"
  type        = string
  default     = "app.dev.example.com"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_username" {
  description = "Keycloak admin username"
  type        = string
  default     = "admin"
}

variable "***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_password" {
  description = "Keycloak admin password"
  type        = string
  sensitive   = true
}

variable "project_tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default = {
    Project     = "ConfidentialAINetwork"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}
