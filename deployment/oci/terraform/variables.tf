# OCI Authentication Variables
variable "tenancy_ocid" {
  description = "OCID of your tenancy"
  type        = string
}

variable "user_ocid" {
  description = "OCID of the user calling the API"
  type        = string
}

variable "fingerprint" {
  description = "Fingerprint for the key pair being used"
  type        = string
}

variable "private_key_path" {
  description = "Path to the private key file"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "OCI region"
  type        = string
  default     = "us-ashburn-1"
}

variable "compartment_id" {
  description = "OCID of the compartment"
  type        = string
}

# Network Configuration
variable "vcn_cidr" {
  description = "CIDR block for VCN"
  type        = string
  default     = "10.0.0.0/16"
}

# OKE Cluster Configuration
variable "cluster_name" {
  description = "Name of the OKE cluster"
  type        = string
  default     = "contract-management-cluster"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "v1.28.2"
}

variable "node_pool_size" {
  description = "Number of nodes in the node pool"
  type        = number
  default     = 3
}

variable "node_shape" {
  description = "Shape of the compute instances"
  type        = string
  default     = "VM.Standard.E4.Flex"
}

variable "node_ocpus" {
  description = "Number of OCPUs for each node"
  type        = number
  default     = 2
}

variable "node_memory_in_gbs" {
  description = "Amount of memory in GBs for each node"
  type        = number
  default     = 16
}

# Database Configuration
variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "contractmanagement"
}

variable "db_password" {
  description = "Password for the database"
  type        = string
  sensitive   = true
}

variable "db_size" {
  description = "Size of the database in GB"
  type        = number
  default     = 100
}

# Load Balancer Configuration
variable "lb_name" {
  description = "Name of the load balancer"
  type        = string
  default     = "contract-management-lb"
}

# Container Registry Configuration
variable "repository_name" {
  description = "Name of the container registry repository"
  type        = string
  default     = "contract-management"
}

# Application Configuration
variable "app_domain" {
  description = "Domain name for the application"
  type        = string
  default     = "contract-management.example.com"
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

variable "defined_tag_namespace" {
  description = "OCI defined-tag namespace for IAM tag-based policies (leave empty for freeform-only)"
  type        = string
  default     = ""
}

# OCI IAM Identity Domains (sole IdP — Keycloak is local-only)
variable "create_identity_domain" {
  description = "Create Identity Domain via modules/identity (recommended)"
  type        = bool
  default     = true
}

variable "create_identity_groups" {
  description = "Create cms-{env}-* role groups in the Identity Domain"
  type        = bool
  default     = true
}

variable "create_identity_apps" {
  description = "Create SPA + API OIDC apps in the Identity Domain"
  type        = bool
  default     = true
}

variable "existing_identity_domain_id" {
  description = "Existing Identity Domain OCID when create_identity_domain=false"
  type        = string
  default     = ""
}

variable "identity_domain_display_name" {
  description = "Display name for new domain (default cms-{env}-id)"
  type        = string
  default     = ""
}

variable "identity_domain_description" {
  type    = string
  default = ""
}

variable "identity_domain_license_type" {
  description = "Identity Domain license type"
  type        = string
  default     = "free"
}

variable "identity_domain_hidden_on_login" {
  type    = bool
  default = false
}

variable "identity_domain_admin_email" {
  description = "Optional bootstrap admin email for new domain"
  type        = string
  default     = ""
}

variable "identity_domain_admin_first_name" {
  type    = string
  default = ""
}

variable "identity_domain_admin_last_name" {
  type    = string
  default = ""
}

variable "identity_domain_admin_user_name" {
  type    = string
  default = ""
}

variable "identity_domain_admin_notification_bypassed" {
  type    = bool
  default = true
}

variable "identity_allow_all_url_schemes" {
  description = "Allow http redirect URIs on SPA app (LB IP pilots)"
  type        = bool
  default     = true
}

variable "oci_identity_domain_url" {
  description = "Manual / fallback Identity Domain URL (used when create_identity_domain=false without OCID)"
  type        = string
  default     = ""
}

variable "oci_identity_client_id" {
  description = "Manual / fallback SPA OIDC client id"
  type        = string
  default     = ""
}

variable "oci_identity_api_client_id" {
  description = "Manual / fallback API audience / client id"
  type        = string
  default     = ""
}

variable "oci_identity_client_secret" {
  description = "Manual / fallback confidential client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "oci_identity_issuer" {
  description = "JWT issuer override (default = domain URL)"
  type        = string
  default     = ""
}

variable "oci_identity_audience" {
  description = "JWT audience override (default api://cms-{env}-api)"
  type        = string
  default     = ""
}

variable "oci_identity_jwks_url" {
  description = "JWKS URL override"
  type        = string
  default     = ""
}

variable "oci_identity_role_claim" {
  description = "JWT claim for groups/roles"
  type        = string
  default     = "groups"
}

variable "oci_identity_redirect_uri" {
  description = "OIDC redirect URI (empty → https://{app_domain}/login)"
  type        = string
  default     = ""
}

variable "oci_identity_post_logout_redirect_uri" {
  description = "OIDC post-logout URI (empty → https://{app_domain}/)"
  type        = string
  default     = ""
}

variable "oci_cloud_gate_enabled" {
  description = "Front SPA with Cloud Gate"
  type        = bool
  default     = true
}

# --- SPIRE / SPIFFE (Phase 1; docs/deployment/OCI_SPIFFE_SPIRE_WIF.md) --------

variable "enable_spire" {
  description = "Deploy SPIRE Server/Agent via Helm (Phase 1 workload identity)"
  type        = bool
  default     = false
}

variable "spiffe_trust_domain" {
  description = "SPIFFE trust domain (empty → can.{env}.oci.{spiffe_trust_domain_suffix})"
  type        = string
  default     = ""
}

variable "spiffe_trust_domain_suffix" {
  description = "Suffix used when spiffe_trust_domain is empty"
  type        = string
  default     = "example"
}

variable "spire_namespace" {
  type    = string
  default = "spire"
}

variable "spire_install_helm_release" {
  description = "Install spiffe/spire Helm chart when enable_spire=true"
  type        = bool
  default     = true
}

variable "spire_create_cluster_spiffe_ids" {
  description = "Apply ClusterSPIFFEID CRDs for backend/trainer/smoke"
  type        = bool
  default     = true
}

variable "spire_enable_oidc_discovery" {
  description = "Enable SPIRE OIDC Discovery Provider (JWKS for Phase 3 WIF)"
  type        = bool
  default     = true
}

variable "spire_create_placeholder_service_accounts" {
  type    = bool
  default = true
}

variable "spire_create_training_namespace" {
  type    = bool
  default = true
}

variable "spire_storage_class" {
  description = "PVC StorageClass for SPIRE server"
  type        = string
  default     = "oci-bv"
}

variable "spire_helm_chart_version" {
  description = "Pin spiffe/spire chart version (empty = latest)"
  type        = string
  default     = ""
}

variable "spire_oidc_issuer" {
  description = "Override OIDC issuer URL"
  type        = string
  default     = ""
}

variable "spire_oidc_jwks_url" {
  description = "Override OIDC JWKS URL"
  type        = string
  default     = ""
}

variable "can_require_spiffe_mtls" {
  description = "Set CAN_REQUIRE_SPIFFE_MTLS in spiffe-config (false for Phase 1)"
  type        = bool
  default     = false
}

# --- OCI WIF Phase 3 (docs/deployment/OCI_SPIFFE_SPIRE_WIF.md) ----------------

variable "enable_wif" {
  description = "Deploy OCI Identity Propagation Trust + service users (SPIRE → UPST)"
  type        = bool
  default     = false
}

variable "wif_spire_oidc_issuer" {
  description = "Override SPIRE issuer for WIF (default: module.spire.oidc_issuer)"
  type        = string
  default     = ""
}

variable "wif_spire_jwks_url" {
  description = "Override SPIRE JWKS for WIF (must be reachable from Identity Domain)"
  type        = string
  default     = ""
}

variable "wif_spire_public_certificate" {
  description = "Pinned SPIRE OIDC signing cert when JWKS is not routable"
  type        = string
  default     = ""
  sensitive   = true
}

variable "wif_create_token_exchange_app" {
  type    = bool
  default = true
}

variable "wif_create_service_users" {
  type    = bool
  default = true
}

variable "wif_create_propagation_trust" {
  type    = bool
  default = true
}

variable "wif_write_kubernetes_config" {
  type    = bool
  default = true
}

variable "wif_client_claim_name" {
  description = "Optional extra JWT claim gate on Propagation Trust"
  type        = string
  default     = ""
}

variable "wif_client_claim_values" {
  type    = list(string)
  default = []
}

# --- Design scaffolds: Vault, Object Storage, edge, training, SCITT ------------

variable "enable_vault" {
  description = "Create OCI Vault + master CMK (design scaffold; default off)"
  type        = bool
  default     = false
}

variable "enable_object_storage" {
  description = "Create datasets/outputs/artifacts Object Storage buckets (default off)"
  type        = bool
  default     = false
}

variable "object_storage_namespace" {
  description = "Object Storage namespace (empty → discover via data source when enable_object_storage)"
  type        = string
  default     = ""
}

variable "enable_edge" {
  description = "Write edge design ConfigMap (WAF + API Gateway + Cloud Gate placeholders)"
  type        = bool
  default     = false
}

variable "enable_training" {
  description = "Create OKE training namespace, ServiceAccount, and Job template ConfigMap"
  type        = bool
  default     = false
}

variable "training_trainer_image" {
  description = "OCIR trainer image for OKE Job template"
  type        = string
  default     = ""
}

variable "enable_scitt" {
  description = "Write SCITT CCF ConfigMap scaffold on OKE (default off)"
  type        = bool
  default     = false
}

variable "scitt_ccf_url" {
  description = "SCITT CCF base URL placeholder for scitt module"
  type        = string
  default     = ""
}

# Blockchain Configuration
variable "ethereum_network" {
  description = "Ethereum network to use"
  type        = string
  default     = "goerli"
}

variable "infura_project_id" {
  description = "Infura project ID for Ethereum access"
  type        = string
  default     = ""
}

# Resource Tags — merged with cms-* standard tags in locals.tf; use for overrides only
variable "project_tags" {
  description = "Optional extra freeform tags merged onto cms-* standard tags"
  type        = map(string)
  default     = {}
} 