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

module "kubernetes_resources" {
  source = "./modules/kubernetes_resources"

  depends_on = [module.aks, module.identity]

  db_host         = module.database.db_host
  db_port         = module.database.db_port
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
}
