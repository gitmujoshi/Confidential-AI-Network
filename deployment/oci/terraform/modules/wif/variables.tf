variable "enabled" {
  description = "Create OCI WIF trust + service users + token-exchange app"
  type        = bool
  default     = false
}

variable "environment" {
  description = "Environment name (dev|test|staging|prod)"
  type        = string
}

variable "idcs_endpoint" {
  description = "Identity Domain URL (idcs endpoint)"
  type        = string
}

variable "spire_oidc_issuer" {
  description = "SPIRE OIDC Discovery issuer (must match JWT iss)"
  type        = string
}

variable "spire_jwks_url" {
  description = "SPIRE JWKS URL (must be reachable from Identity Domain, or leave empty and pin cert)"
  type        = string
  default     = ""
}

variable "spire_public_certificate" {
  description = "Optional PEM public cert pinned in trust when JWKS is not routable"
  type        = string
  default     = ""
  sensitive   = true
}

variable "spiffe_id_inventory" {
  description = "Map of role → SPIFFE ID (from module.spire.spiffe_id_inventory)"
  type        = map(string)
  default     = {}
}

variable "service_users" {
  description = <<-EOT
    Optional override map of service users. Keys are logical roles (backend, trainer, …).
    Each value: user_name, display_name, spiffe_id, optional email, description.
    Empty → defaults svc-can-{env}-backend / trainer from spiffe_id_inventory.
  EOT
  type = map(object({
    user_name    = string
    display_name = string
    spiffe_id    = string
    email        = optional(string)
    description  = optional(string)
  }))
  default = {}
}

variable "create_token_exchange_app" {
  type    = bool
  default = true
}

variable "token_exchange_app_name" {
  description = "Display/name for token-exchange app (default cms-{env}-wif-token-exchange)"
  type        = string
  default     = ""
}

variable "existing_token_exchange_client_id" {
  description = "Existing OAuth client id when create_token_exchange_app=false"
  type        = string
  default     = ""
}

variable "existing_token_exchange_client_secret" {
  type      = string
  default   = ""
  sensitive = true
}

variable "create_service_users" {
  type    = bool
  default = true
}

variable "create_propagation_trust" {
  type    = bool
  default = true
}

variable "trust_name" {
  description = "IdentityPropagationTrust name"
  type        = string
  default     = ""
}

variable "subject_claim_name" {
  type    = string
  default = "sub"
}

variable "subject_mapping_attribute" {
  type    = string
  default = "userName"
}

variable "client_claim_name" {
  description = "Optional extra claim gate on incoming JWT-SVID (e.g. aud)"
  type        = string
  default     = ""
}

variable "client_claim_values" {
  type    = list(string)
  default = []
}

variable "external_impersonation_rules" {
  description = "When create_service_users=false: map of key → { rule, service_user_id }"
  type = map(object({
    rule            = string
    service_user_id = string
  }))
  default = {}
}

variable "write_kubernetes_config" {
  description = "Write oci-wif-secret + oci-wif-config into app_namespace"
  type        = bool
  default     = true
}

variable "app_namespace" {
  type    = string
  default = "contract-management"
}
