variable "enabled" {
  description = "Deploy SPIRE Phase 1 scaffolding"
  type        = bool
  default     = false
}

variable "environment" {
  description = "Environment name (dev|test|staging|prod)"
  type        = string
}

variable "cluster_name" {
  description = "OKE / SPIRE clusterName (attestation)"
  type        = string
}

variable "trust_domain" {
  description = "SPIFFE trust domain (default can.{env}.oci.{trust_domain_suffix})"
  type        = string
  default     = ""
}

variable "trust_domain_suffix" {
  description = "DNS-style suffix when trust_domain is empty"
  type        = string
  default     = "example"
}

variable "namespace" {
  description = "Kubernetes namespace for SPIRE"
  type        = string
  default     = "spire"
}

variable "app_namespace" {
  description = "Application namespace (backend SA / spiffe-config)"
  type        = string
  default     = "contract-management"
}

variable "create_training_namespace" {
  description = "Create cms-training namespace for trainer SA"
  type        = bool
  default     = true
}

variable "create_placeholder_service_accounts" {
  description = "Create backend / training-job-sa ServiceAccounts if missing"
  type        = bool
  default     = true
}

variable "install_helm_release" {
  description = "Install spiffe/spire Helm chart (false = manifests/ConfigMaps only)"
  type        = bool
  default     = true
}

variable "create_cluster_spiffe_ids" {
  description = "Apply ClusterSPIFFEID CRDs after Helm install"
  type        = bool
  default     = true
}

variable "enable_oidc_discovery" {
  description = "Enable SPIRE OIDC Discovery Provider (JWKS for Phase 3 WIF)"
  type        = bool
  default     = true
}

variable "oidc_issuer" {
  description = "OIDC issuer URL override"
  type        = string
  default     = ""
}

variable "oidc_jwks_url" {
  description = "OIDC JWKS URL override"
  type        = string
  default     = ""
}

variable "socket_path" {
  description = "Workload API socket path mounted into pods"
  type        = string
  default     = "/spire-agent-socket/agent.sock"
}

variable "storage_class" {
  description = "StorageClass for SPIRE server PVC"
  type        = string
  default     = "oci-bv"
}

variable "helm_repository" {
  type    = string
  default = "https://spiffe.github.io/helm-charts-hardened/"
}

variable "helm_chart" {
  type    = string
  default = "spire"
}

variable "helm_chart_version" {
  description = "Pin chart version (empty = latest)"
  type        = string
  default     = ""
}

variable "helm_release_name" {
  type    = string
  default = "spire"
}

variable "helm_wait" {
  type    = bool
  default = true
}

variable "helm_timeout_seconds" {
  type    = number
  default = 900
}

variable "helm_atomic" {
  type    = bool
  default = false
}

variable "values_file" {
  description = "Path to Helm values.yaml (default: deployment/oci/helm/spire/values.yaml)"
  type        = string
  default     = ""
}

variable "manifests_dir" {
  description = "Directory with ClusterSPIFFEID YAML files"
  type        = string
  default     = ""
}

variable "can_require_spiffe_mtls" {
  description = "Write CAN_REQUIRE_SPIFFE_MTLS into ConfigMap (usually false in Phase 1)"
  type        = bool
  default     = false
}
