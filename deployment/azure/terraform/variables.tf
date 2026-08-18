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

# --- Microsoft Entra ID (AUTH_PROVIDER=entra; Keycloak is local-only) --------

variable "create_entra_apps" {
  description = "Create SPA + API Entra app registrations via Terraform"
  type        = bool
  default     = true
}

variable "create_entra_api_client_secret" {
  description = "Create a client secret on the API app registration"
  type        = bool
  default     = true
}

variable "entra_grant_admin_consent" {
  description = "Grant admin consent for SPA → API access_as_user"
  type        = bool
  default     = true
}

variable "entra_app_owners" {
  description = "Entra object IDs that own the app registrations"
  type        = list(string)
  default     = []
}

variable "entra_client_id" {
  description = "Manual / fallback SPA client ID (when create_entra_apps=false)"
  type        = string
  default     = ""
}

variable "entra_api_client_id" {
  description = "Manual / fallback API client ID"
  type        = string
  default     = ""
}

variable "entra_client_secret" {
  description = "Manual / fallback client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "entra_api_audience" {
  description = "API identifier URI / JWT audience (default api://cms-{env}-api)"
  type        = string
  default     = ""
}

variable "entra_redirect_uri" {
  description = "SPA OIDC redirect URI (default https://{app_domain}/login)"
  type        = string
  default     = ""
}

variable "entra_post_logout_redirect_uri" {
  description = "SPA post-logout URI"
  type        = string
  default     = ""
}

variable "entra_jwks_url" {
  description = "Optional JWKS override (default from authority discovery)"
  type        = string
  default     = ""
}

variable "entra_role_claim" {
  description = "JWT claim carrying app roles"
  type        = string
  default     = "roles"
}

variable "project_tags" {
  description = "Optional extra tags merged onto cms-* standard tags"
  type        = map(string)
  default     = {}
}

# --- Platform data plane (Key Vault, Blob, Workload Identity) ---------------

variable "enable_key_vault" {
  description = "Provision Azure Key Vault and seed DB/Entra secrets"
  type        = bool
  default     = true
}

variable "key_vault_public_network_access" {
  type    = bool
  default = true
}

variable "enable_storage" {
  description = "Provision Blob storage account + datasets/outputs/artifacts containers"
  type        = bool
  default     = true
}

variable "storage_replication_type" {
  type    = string
  default = "LRS"
}

variable "storage_public_network_access" {
  type    = bool
  default = true
}

variable "enable_private_endpoints" {
  description = "Create private endpoints for Key Vault and Storage (needs DNS setup)"
  type        = bool
  default     = false
}

variable "enable_workload_identity" {
  description = "Enable AKS OIDC + Workload Identity and create UAMIs for backend/trainer/ESO"
  type        = bool
  default     = true
}

variable "enable_edge" {
  description = "Provision Azure Front Door + optional WAF (Phase 2)"
  type        = bool
  default     = false
}

variable "enable_edge_waf" {
  type    = bool
  default = true
}

variable "edge_waf_mode" {
  type    = string
  default = "Prevention"
}

variable "enable_spire" {
  description = "Create SPIRE namespace + CAN trust-domain ConfigMaps (Helm install separate)"
  type        = bool
  default     = false
}

variable "spiffe_trust_domain" {
  description = "SPIFFE trust domain (default can.{env}.azure.example)"
  type        = string
  default     = ""
}

variable "spire_oidc_discovery_hint" {
  type    = string
  default = ""
}
