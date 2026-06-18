terraform {
  required_version = ">= 1.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
}

# Configure OCI Provider
provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Configure Kubernetes Provider
provider "kubernetes" {
  host                   = data.oci_container_engine_cluster.oke_cluster.endpoints[0].kubernetes
  cluster_ca_certificate = base64decode(data.oci_container_engine_cluster.oke_cluster.kube_config[0].cluster_ca_certificate)
  token                  = data.oci_container_engine_cluster.oke_cluster.kube_config[0].token
}

provider "helm" {
  kubernetes {
    host                   = data.oci_container_engine_cluster.oke_cluster.endpoints[0].kubernetes
    cluster_ca_certificate = base64decode(data.oci_container_engine_cluster.oke_cluster.kube_config[0].cluster_ca_certificate)
    token                  = data.oci_container_engine_cluster.oke_cluster.kube_config[0].token
  }
}

# Data sources
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

data "oci_container_engine_cluster" "oke_cluster" {
  cluster_id = module.oke.cluster_id
}

# VCN and Networking
module "networking" {
  source = "./modules/networking"

  compartment_id = var.compartment_id
  vcn_cidr       = var.vcn_cidr
  cluster_name   = var.cluster_name
  region         = var.region
  freeform_tags  = local.resource_freeform_tags
  defined_tags   = local.resource_defined_tags
}

# OKE Cluster
module "oke" {
  source = "./modules/oke"

  compartment_id     = var.compartment_id
  cluster_name       = var.cluster_name
  vcn_id             = module.networking.vcn_id
  subnet_ids         = module.networking.subnet_ids
  private_subnet_id  = module.networking.private_subnet_id
  node_pool_size     = var.node_pool_size
  node_shape         = var.node_shape
  node_ocpus         = var.node_ocpus
  node_memory_in_gbs = var.node_memory_in_gbs
  kubernetes_version = var.kubernetes_version
  freeform_tags      = local.resource_freeform_tags
  defined_tags         = local.resource_defined_tags
}

# Database
module "database" {
  source = "./modules/database"

  compartment_id = var.compartment_id
  subnet_id      = module.networking.private_subnet_id
  db_name        = var.db_name
  db_password    = var.db_password
  db_size        = var.db_size
  freeform_tags  = local.resource_freeform_tags
  defined_tags   = local.resource_defined_tags
}

# Load Balancer
module "load_balancer" {
  source = "./modules/load_balancer"

  compartment_id = var.compartment_id
  subnet_ids     = module.networking.public_subnet_ids
  lb_name        = var.lb_name
  freeform_tags  = local.resource_freeform_tags
  defined_tags   = local.resource_defined_tags
}

# Container Registry
module "container_registry" {
  source = "./modules/container_registry"

  compartment_id   = var.compartment_id
  repository_name  = var.repository_name
  environment      = var.environment
  freeform_tags    = local.resource_freeform_tags
  defined_tags     = local.resource_defined_tags
}

# Kubernetes Resources
module "kubernetes_resources" {
  source = "./modules/kubernetes_resources"

  depends_on = [module.oke]

  db_host     = module.database.db_host
  db_port     = module.database.db_port
  db_name     = module.database.db_name
  db_user     = module.database.db_user
  db_password = var.db_password

  lb_ip        = module.load_balancer.lb_ip
  registry_url = module.container_registry.registry_url
  image_tag    = local.effective_image_tag

  app_domain              = var.app_domain
  environment             = var.environment
  release_version         = var.release_version
  ethereum_network        = var.ethereum_network
  infura_project_id       = var.infura_project_id
  ***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_username = var.***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_username
  ***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_password = var.***REMOVED-KEYCLOAK_DB_PASSWORD***_admin_password
  ***REMOVED-KEYCLOAK_DB_PASSWORD***_db_password    = var.***REMOVED-KEYCLOAK_DB_PASSWORD***_db_password != "" ? var.***REMOVED-KEYCLOAK_DB_PASSWORD***_db_password : var.db_password
}
