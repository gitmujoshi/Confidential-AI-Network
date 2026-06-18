terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
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

module "kubernetes_resources" {
  source = "./modules/kubernetes_resources"

  depends_on = [module.aks]

  db_host                 = module.database.db_host
  db_port                 = module.database.db_port
  db_name                 = module.database.db_name
  db_user                 = module.database.db_user
  db_password             = var.db_password
  lb_ip                   = module.load_balancer.public_ip_address
  registry_url            = module.container_registry.registry_url
  image_tag               = local.effective_image_tag
  release_version         = var.release_version
  app_domain              = var.app_domain
  environment             = var.environment
  ***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_username = var.***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_username
  ***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_password = var.***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_password
}
