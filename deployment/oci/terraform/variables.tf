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

variable "***REMOVED-KEYCLOAK_DB_PASSWORD***_db_password" {
  description = "Keycloak database password (defaults to db_password when empty)"
  type        = string
  sensitive   = true
  default     = ""
}

# Keycloak Configuration
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