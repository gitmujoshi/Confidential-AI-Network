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
  description = "Environment name (dev, test, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "test", "staging", "prod"], lower(var.environment))
    error_message = "environment must be one of: dev, test, staging, prod."
  }
}

variable "release_version" {
  description = "Application release version (semver), stored in cms-release tag"
  type        = string
  default     = "0.0.0-dev"
}

variable "image_tag" {
  description = "Container image tag (git SHA or semver). Overrides release_version for pulls."
  type        = string
  default     = ""
}

variable "tag_owner" {
  description = "Team or group responsible for resources (cms-owner)"
  type        = string
  default     = "platform-team"
}

variable "data_classification" {
  description = "Data sensitivity label (cms-data-classification)"
  type        = string
  default     = "internal"

  validation {
    condition     = contains(["public", "internal", "confidential", "restricted"], var.data_classification)
    error_message = "data_classification must be public, internal, confidential, or restricted."
  }
}

variable "cost_center" {
  description = "Cost allocation code (cms-cost-center)"
  type        = string
  default     = "TBD"
}

variable "keycloak_admin_username" {
  description = "Keycloak admin username"
  type        = string
  default     = "admin"
}

variable "keycloak_admin_password" {
  description = "Keycloak admin password"
  type        = string
  sensitive   = true
}

variable "project_tags" {
  description = "Optional extra tags merged onto cms-* standard tags"
  type        = map(string)
  default     = {}
}
