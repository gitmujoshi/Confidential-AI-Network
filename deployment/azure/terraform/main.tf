terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }

  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id
}

provider "azuread" {
  tenant_id = var.tenant_id
}

provider "kubernetes" {
  host                   = module.aks.cluster_endpoint
  client_certificate     = base64decode(module.aks.client_certificate)
  client_key             = base64decode(module.aks.client_key)
  cluster_ca_certificate = base64decode(module.aks.cluster_ca_certificate)
}

module "networking" {
  source = "./modules/networking"

  resource_group_name = var.resource_group_name
  location            = var.location
  vnet_cidr           = var.vnet_cidr
  cluster_name        = var.cluster_name
  project_tags        = local.resource_tags
}

module "container_registry" {
  source = "./modules/container_registry"

  resource_group_name = module.networking.resource_group_name
  location            = var.location
  repository_name     = var.repository_name
  environment         = var.environment
  project_tags        = local.resource_tags
}

module "aks" {
  source = "./modules/aks"

  resource_group_name = module.networking.resource_group_name
  location            = var.location
  cluster_name        = var.cluster_name
  subnet_id           = module.networking.app_subnet_id
  node_count          = var.node_count
  vm_size             = var.vm_size
  kubernetes_version  = var.kubernetes_version
  service_cidr        = var.service_cidr
  dns_service_ip      = var.dns_service_ip
  acr_id              = module.container_registry.acr_id
  project_tags        = local.resource_tags

  oidc_issuer_enabled       = var.enable_workload_identity
  workload_identity_enabled = var.enable_workload_identity
}

module "database" {
  source = "./modules/database"

  resource_group_name = module.networking.resource_group_name
  location            = var.location
  db_name             = var.db_name
  db_user             = var.db_user
  db_password         = var.db_password
  subnet_id           = module.networking.data_subnet_id
  vnet_id             = module.networking.vnet_id
  sku_name            = var.db_sku_name
  storage_mb          = var.db_storage_mb
  project_tags        = local.resource_tags
}

module "storage" {
  source = "./modules/storage"

  enabled                       = var.enable_storage
  resource_group_name           = module.networking.resource_group_name
  location                      = var.location
  environment                   = var.environment
  replication_type              = var.storage_replication_type
  public_network_access_enabled = var.storage_public_network_access
  enable_private_endpoint       = var.enable_private_endpoints
  private_endpoints_subnet_id   = module.networking.private_endpoints_subnet_id
  project_tags                  = local.resource_tags
}

module "load_balancer" {
  source = "./modules/load_balancer"

  resource_group_name = module.networking.resource_group_name
  location            = var.location
  lb_name             = var.lb_name
  subnet_id           = module.networking.public_subnet_id
  project_tags        = local.resource_tags
}

# Microsoft Entra ID (sole IdP on Azure — no Keycloak)
module "identity" {
  source = "./modules/identity"

  tenant_id   = var.tenant_id
  environment = var.environment
  app_domain  = var.app_domain

  create_apps              = var.create_entra_apps
  create_api_client_secret = var.create_entra_api_client_secret
  grant_admin_consent      = var.entra_grant_admin_consent

  redirect_uri             = var.entra_redirect_uri
  post_logout_redirect_uri = var.entra_post_logout_redirect_uri
  api_audience             = var.entra_api_audience
  owners                   = var.entra_app_owners

  existing_client_id     = var.entra_client_id
  existing_api_client_id = var.entra_api_client_id
  existing_api_audience  = var.entra_api_audience
  existing_client_secret = var.entra_client_secret
}

module "key_vault" {
  source = "./modules/key_vault"

  enabled                       = var.enable_key_vault
  resource_group_name           = module.networking.resource_group_name
  location                      = var.location
  tenant_id                     = var.tenant_id
  environment                   = var.environment
  purge_protection_enabled      = local.is_production
  public_network_access_enabled = var.key_vault_public_network_access
  enable_private_endpoint       = var.enable_private_endpoints
  private_endpoints_subnet_id   = module.networking.private_endpoints_subnet_id

  db_host             = module.database.db_host
  db_port             = tostring(module.database.db_port)
  db_name             = module.database.db_name
  db_user             = module.database.db_user
  db_password         = var.db_password
  entra_client_secret = local.effective_entra_client_secret

  project_tags = local.resource_tags

  depends_on = [module.identity, module.database]
}

module "workload_identity" {
  source = "./modules/workload_identity"

  enabled              = var.enable_workload_identity
  resource_group_name  = module.networking.resource_group_name
  location             = var.location
  environment          = var.environment
  oidc_issuer_url      = coalesce(module.aks.oidc_issuer_url, "")
  kubernetes_namespace = "contract-management"
  key_vault_id         = coalesce(module.key_vault.key_vault_id, "")
  storage_account_id   = coalesce(module.storage.storage_account_id, "")
  project_tags         = local.resource_tags

  depends_on = [module.aks, module.key_vault, module.storage]
}

module "edge" {
  source = "./modules/edge"

  enabled             = var.enable_edge
  resource_group_name = module.networking.resource_group_name
  environment         = var.environment
  enable_waf          = var.enable_edge_waf
  waf_mode            = var.edge_waf_mode
  origin_host_name    = module.load_balancer.public_ip_address
  origin_http_port    = 3000
  project_tags        = local.resource_tags
}

module "kubernetes_resources" {
  source = "./modules/kubernetes_resources"

  depends_on = [module.aks, module.identity, module.workload_identity]

  db_host         = module.database.db_host
  db_port         = tostring(module.database.db_port)
  db_name         = module.database.db_name
  db_user         = module.database.db_user
  db_password     = var.db_password
  lb_ip           = module.load_balancer.public_ip_address
  registry_url    = module.container_registry.registry_url
  image_tag       = local.effective_image_tag
  release_version = var.release_version
  app_domain      = var.app_domain
  environment     = var.environment

  entra_tenant_id     = var.tenant_id
  entra_client_id     = local.effective_entra_client_id
  entra_api_client_id = local.effective_entra_api_client_id
  entra_client_secret = local.effective_entra_client_secret
  entra_authority     = local.effective_entra_authority
  entra_issuer        = local.effective_entra_issuer
  entra_api_audience  = local.effective_entra_api_audience
  entra_api_scope     = local.effective_entra_api_scope
  entra_jwks_url      = var.entra_jwks_url
  entra_role_claim    = var.entra_role_claim
  entra_redirect_uri  = local.effective_entra_redirect_uri

  workload_identity_enabled  = var.enable_workload_identity
  backend_workload_client_id = coalesce(module.workload_identity.backend_client_id, "")
  storage_account_name       = coalesce(module.storage.storage_account_name, "")
  key_vault_uri              = coalesce(module.key_vault.key_vault_uri, "")
  blob_datasets_container    = try(module.storage.container_names["datasets"], "")
  blob_outputs_container     = try(module.storage.container_names["training_outputs"], "")
  blob_artifacts_container   = try(module.storage.container_names["artifacts"], "")
}

module "spire" {
  source = "./modules/spire"

  enabled             = var.enable_spire
  environment         = var.environment
  trust_domain        = var.spiffe_trust_domain != "" ? var.spiffe_trust_domain : "can.${var.environment}.azure.example"
  oidc_discovery_hint = var.spire_oidc_discovery_hint
  app_namespace       = "contract-management"

  depends_on = [module.aks, module.kubernetes_resources]
}
