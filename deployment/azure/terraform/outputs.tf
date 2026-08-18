output "resource_group_name" {
  value = module.networking.resource_group_name
}

output "aks_cluster_name" {
  value = module.aks.cluster_name
}

output "aks_cluster_endpoint" {
  value     = module.aks.cluster_endpoint
  sensitive = true
}

output "database_host" {
  value = module.database.db_host
}

output "database_port" {
  value = module.database.db_port
}

output "database_name" {
  value = module.database.db_name
}

output "load_balancer_ip" {
  value = module.load_balancer.public_ip_address
}

output "container_registry_url" {
  value = module.container_registry.registry_url
}

output "frontend_url" {
  value = "http://${module.load_balancer.public_ip_address}:3000"
}

output "backend_url" {
  value = "http://${module.load_balancer.public_ip_address}:5001"
}

output "auth_provider" {
  value = "entra"
}

output "entra_tenant_id" {
  value = var.tenant_id
}

output "entra_authority" {
  value = local.effective_entra_authority
}

output "entra_client_id" {
  value = local.effective_entra_client_id
}

output "entra_api_client_id" {
  value = local.effective_entra_api_client_id
}

output "entra_api_audience" {
  value = local.effective_entra_api_audience
}

output "entra_redirect_uri" {
  value = local.effective_entra_redirect_uri
}

output "environment" {
  value = var.environment
}

output "release_version" {
  value = var.release_version
}

output "effective_image_tag" {
  value = local.effective_image_tag
}

output "resource_tags" {
  value = local.resource_tags
}

output "key_vault_uri" {
  value = module.key_vault.key_vault_uri
}

output "key_vault_name" {
  value = module.key_vault.key_vault_name
}

output "storage_account_name" {
  value = module.storage.storage_account_name
}

output "blob_containers" {
  value = module.storage.container_names
}

output "aks_oidc_issuer_url" {
  value = module.aks.oidc_issuer_url
}

output "workload_identity_client_ids" {
  value = module.workload_identity.identity_client_ids
}

output "front_door_hostname" {
  value = module.edge.front_door_endpoint_hostname
}

output "spiffe_trust_domain" {
  value = module.spire.trust_domain
}

output "next_steps" {
  value = [
    "1. az aks get-credentials --resource-group ${module.networking.resource_group_name} --name ${module.aks.cluster_name}",
    "2. Build and push images: IMAGE_TAG=${local.effective_image_tag} ./deploy.sh --images",
    "3. Configure DNS for ${var.app_domain} → ${module.load_balancer.public_ip_address}",
    "4. Confirm AUTH_PROVIDER=entra and KEYCLOAK_ENABLED=false on backend pods",
    "5. Assign users to API app roles (TDC/TDP/CCRP/AppAdmin) in Entra",
    "6. Provision matching users in the app DB (email / iamUserId)",
    "7. Sign in via Entra SSO (SPA client ${local.effective_entra_client_id})",
    "8. Key Vault: ${coalesce(module.key_vault.key_vault_uri, "(disabled)")}",
    "9. Blob account: ${coalesce(module.storage.storage_account_name, "(disabled)")}",
    "10. Optional SPIRE: enable_spire=true then helm -f deployment/azure/helm/spire/values.yaml",
    "11. Optional Front Door: enable_edge=true",
    "12. See docs/production/AZURE_SECURITY_ARCHITECTURE.md and docs/deployment/AZURE_SPIFFE_SPIRE_WIF.md"
  ]
}
