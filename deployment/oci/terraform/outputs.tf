# OKE Cluster Outputs
output "oke_cluster_id" {
  description = "OCID of the OKE cluster"
  value       = module.oke.cluster_id
}

output "oke_cluster_endpoint" {
  description = "Kubernetes API endpoint"
  value       = module.oke.cluster_endpoint
}

output "kubeconfig" {
  description = "Kubeconfig for the OKE cluster"
  value       = module.oke.kubeconfig
  sensitive   = true
}

# Database Outputs
output "database_id" {
  description = "OCID of the database"
  value       = module.database.db_id
}

output "database_host" {
  description = "Database host"
  value       = module.database.db_host
}

output "database_port" {
  description = "Database port"
  value       = module.database.db_port
}

output "database_name" {
  description = "Database name"
  value       = module.database.db_name
}

# Load Balancer Outputs
output "load_balancer_id" {
  description = "OCID of the load balancer"
  value       = module.load_balancer.lb_id
}

output "load_balancer_ip" {
  description = "Public IP of the load balancer"
  value       = module.load_balancer.lb_ip
}

output "load_balancer_url" {
  description = "URL of the load balancer"
  value       = "http://${module.load_balancer.lb_ip}"
}

# Container Registry Outputs
output "container_registry_url" {
  description = "URL of the container registry"
  value       = module.container_registry.registry_url
}

output "container_registry_repository" {
  description = "Container registry repository name"
  value       = module.container_registry.repository_name
}

# Application URLs
output "frontend_url" {
  description = "Frontend application URL"
  value       = "http://${module.load_balancer.lb_ip}:3000"
}

output "backend_url" {
  description = "Backend API URL"
  value       = "http://${module.load_balancer.lb_ip}:5000"
}

output "auth_provider" {
  description = "Application IdP on OCI"
  value       = "oci-iam"
}

output "oci_identity_domain_id" {
  description = "Identity Domain OCID"
  value       = try(module.identity.domain_id, null)
}

output "oci_identity_domain_url" {
  description = "Identity Domain URL used by the app"
  value       = local.effective_oci_identity_domain_url
}

output "oci_identity_frontend_client_id" {
  description = "SPA OIDC client id"
  value       = local.effective_oci_identity_client_id
}

output "oci_identity_api_client_id" {
  description = "API OIDC client id"
  value       = local.effective_oci_identity_api_client_id
}

output "oci_identity_group_names" {
  description = "Role group display names created in the domain"
  value       = try(module.identity.group_display_names, {})
}

# Network Outputs
output "vcn_id" {
  description = "OCID of the VCN"
  value       = module.networking.vcn_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = module.networking.private_subnet_id
}

# Deployment Status
output "deployment_status" {
  description = "Status of the deployment"
  value       = "Deployment completed successfully"
}

output "environment" {
  description = "Deployment environment"
  value       = var.environment
}

output "release_version" {
  description = "Application release version (cms-release)"
  value       = var.release_version
}

output "effective_image_tag" {
  description = "Pinned container image tag used by Kubernetes"
  value       = local.effective_image_tag
}

output "resource_tags" {
  description = "Merged cms-* freeform tags applied to OCI resources"
  value       = local.resource_freeform_tags
}

output "spire_enabled" {
  description = "Whether SPIRE Phase 1 module is enabled"
  value       = var.enable_spire
}

output "spiffe_trust_domain" {
  value = try(module.spire.trust_domain, null)
}

output "spire_oidc_issuer" {
  description = "SPIRE OIDC issuer for Phase 3 WIF trust"
  value       = try(module.spire.oidc_issuer, null)
}

output "spire_oidc_jwks_url" {
  value = try(module.spire.oidc_jwks_url, null)
}

output "spiffe_id_inventory" {
  description = "Canonical SPIFFE IDs (backend, trainer, smoke)"
  value       = try(module.spire.spiffe_id_inventory, {})
}

output "wif_enabled" {
  value = var.enable_wif
}

output "wif_trust_name" {
  value = try(module.wif.trust_name, null)
}

output "wif_token_exchange_client_id" {
  value = try(module.wif.token_exchange_client_id, null)
}

output "wif_service_user_names" {
  value = try(module.wif.service_user_names, {})
}

output "wif_impersonation_rules" {
  value = try(module.wif.impersonation_rules, {})
}

output "next_steps" {
  description = "Next steps after deployment"
  value = concat(
    [
      "1. Configure DNS to point ${var.app_domain} to ${module.load_balancer.lb_ip}",
      "2. Identity Domain URL: ${local.effective_oci_identity_domain_url}",
      "3. Assign users to groups ${join(", ", values(try(module.identity.group_display_names, {})))} (or seed via Console)",
      "4. Confirm AUTH_PROVIDER=oci-iam and KEYCLOAK_ENABLED=false on backend pods",
      "5. Deploy application containers to OKE cluster",
      "6. Access frontend at http://${module.load_balancer.lb_ip}:3000",
      "7. Access backend API at http://${module.load_balancer.lb_ip}:5000",
      "8. Sign in via Identity Domain SSO (SPA client ${local.effective_oci_identity_client_id})",
    ],
    var.enable_spire ? [
      "9. SPIRE: kubectl -n spire get pods; ConfigMap spiffe-config in contract-management",
      "10. Smoke SVID: kubectl apply -f deployment/oci/helm/spire/manifests/smoke-job.yaml",
      ] : [
      "9. Optional: set enable_spire=true for SPIFFE/SPIRE Phase 1 (OCI_SPIFFE_SPIRE_WIF.md)",
    ],
    var.enable_wif ? [
      "11. WIF: verify Identity Propagation Trust ${try(module.wif.trust_name, "")}",
      "12. Mount oci-wif-config + oci-wif-secret on backend/trainer; set OCI_AUTH_MODE=wif",
      "13. Grant IAM policies to service users (see module.wif.suggested_iam_policy_comments)",
      ] : [
      "11. Optional: set enable_wif=true after SPIRE OIDC JWKS is reachable (Phase 3)",
    ]
  )
}