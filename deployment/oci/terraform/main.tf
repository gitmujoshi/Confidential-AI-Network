terraform {
  required_version = ">= 1.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.40.0"
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
  defined_tags       = local.resource_defined_tags
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

  compartment_id  = var.compartment_id
  repository_name = var.repository_name
  environment     = var.environment
  freeform_tags   = local.resource_freeform_tags
  defined_tags    = local.resource_defined_tags
}

# OCI IAM Identity Domains (sole IdP on OCI — no Keycloak)
module "identity" {
  source = "./modules/identity"

  compartment_id = var.compartment_id
  environment    = var.environment
  home_region    = var.region
  app_domain     = var.app_domain

  create_domain = var.create_identity_domain
  create_groups = var.create_identity_groups
  create_apps   = var.create_identity_apps

  existing_domain_id  = var.existing_identity_domain_id
  existing_domain_url = var.oci_identity_domain_url

  domain_display_name = var.identity_domain_display_name
  domain_description  = var.identity_domain_description
  license_type        = var.identity_domain_license_type
  is_hidden_on_login  = var.identity_domain_hidden_on_login

  admin_email              = var.identity_domain_admin_email
  admin_first_name         = var.identity_domain_admin_first_name
  admin_last_name          = var.identity_domain_admin_last_name
  admin_user_name          = var.identity_domain_admin_user_name
  is_notification_bypassed = var.identity_domain_admin_notification_bypassed

  redirect_uri             = var.oci_identity_redirect_uri
  post_logout_redirect_uri = var.oci_identity_post_logout_redirect_uri
  api_audience             = var.oci_identity_audience
  allow_all_url_schemes    = var.identity_allow_all_url_schemes

  freeform_tags = local.resource_freeform_tags
  defined_tags  = local.resource_defined_tags
}

# Kubernetes Resources
module "kubernetes_resources" {
  source = "./modules/kubernetes_resources"

  depends_on = [module.oke, module.identity]

  db_host     = module.database.db_host
  db_port     = module.database.db_port
  db_name     = module.database.db_name
  db_user     = module.database.db_user
  db_password = var.db_password

  lb_ip        = module.load_balancer.lb_ip
  registry_url = module.container_registry.registry_url
  image_tag    = local.effective_image_tag

  app_domain        = var.app_domain
  environment       = var.environment
  release_version   = var.release_version
  ethereum_network  = var.ethereum_network
  infura_project_id = var.infura_project_id

  oci_identity_domain_url    = local.effective_oci_identity_domain_url
  oci_identity_client_id     = local.effective_oci_identity_client_id
  oci_identity_api_client_id = local.effective_oci_identity_api_client_id
  oci_identity_client_secret = local.effective_oci_identity_client_secret
  oci_identity_issuer        = local.effective_oci_identity_issuer
  oci_identity_audience      = local.effective_oci_identity_audience
  oci_identity_jwks_url      = var.oci_identity_jwks_url
  oci_identity_role_claim    = var.oci_identity_role_claim
  oci_identity_redirect_uri  = local.effective_oci_identity_redirect_uri
  oci_cloud_gate_enabled     = var.oci_cloud_gate_enabled
}

# SPIRE / SPIFFE — Phase 1 platform (opt-in; see docs/deployment/OCI_SPIFFE_SPIRE_WIF.md)
module "spire" {
  source = "./modules/spire"

  depends_on = [module.oke, module.kubernetes_resources]

  enabled      = var.enable_spire
  environment  = var.environment
  cluster_name = var.cluster_name

  trust_domain        = var.spiffe_trust_domain
  trust_domain_suffix = var.spiffe_trust_domain_suffix
  namespace           = var.spire_namespace
  app_namespace       = "contract-management"

  install_helm_release                = var.spire_install_helm_release
  create_cluster_spiffe_ids           = var.spire_create_cluster_spiffe_ids
  enable_oidc_discovery               = var.spire_enable_oidc_discovery
  create_placeholder_service_accounts = var.spire_create_placeholder_service_accounts
  create_training_namespace           = var.spire_create_training_namespace
  storage_class                       = var.spire_storage_class
  helm_chart_version                  = var.spire_helm_chart_version
  oidc_issuer                         = var.spire_oidc_issuer
  oidc_jwks_url                       = var.spire_oidc_jwks_url
  can_require_spiffe_mtls             = var.can_require_spiffe_mtls
}

# OCI WIF — Phase 3 (SPIRE JWT-SVID → UPST; opt-in)
module "wif" {
  source = "./modules/wif"

  depends_on = [module.identity, module.spire, module.kubernetes_resources]

  enabled     = var.enable_wif
  environment = var.environment

  idcs_endpoint = coalesce(
    try(module.identity.domain_url, null),
    var.oci_identity_domain_url != "" ? var.oci_identity_domain_url : null,
    ""
  )

  spire_oidc_issuer = coalesce(
    var.wif_spire_oidc_issuer != "" ? var.wif_spire_oidc_issuer : null,
    try(module.spire.oidc_issuer, null),
    ""
  )
  spire_jwks_url = coalesce(
    var.wif_spire_jwks_url != "" ? var.wif_spire_jwks_url : null,
    try(module.spire.oidc_jwks_url, null),
    ""
  )
  spire_public_certificate = var.wif_spire_public_certificate
  spiffe_id_inventory      = try(module.spire.spiffe_id_inventory, {})

  create_token_exchange_app = var.wif_create_token_exchange_app
  create_service_users      = var.wif_create_service_users
  create_propagation_trust  = var.wif_create_propagation_trust
  write_kubernetes_config   = var.wif_write_kubernetes_config
  app_namespace             = "contract-management"

  client_claim_name   = var.wif_client_claim_name
  client_claim_values = var.wif_client_claim_values
}
