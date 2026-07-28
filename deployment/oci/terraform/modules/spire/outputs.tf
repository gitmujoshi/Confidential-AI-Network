output "enabled" {
  value = var.enabled
}

output "trust_domain" {
  value = var.enabled ? local.trust_domain : null
}

output "namespace" {
  value = var.enabled ? var.namespace : null
}

output "oidc_issuer" {
  description = "SPIRE OIDC issuer (Phase 3 WIF trust input)"
  value       = var.enabled ? local.oidc_issuer : null
}

output "oidc_jwks_url" {
  value = var.enabled ? local.oidc_jwks_url : null
}

output "spiffe_socket_path" {
  value = var.enabled ? var.socket_path : null
}

output "spiffe_id_inventory" {
  description = "Canonical SPIFFE IDs for this env"
  value       = var.enabled ? local.spiffe_inventory : {}
}

output "spiffe_config_map_name" {
  description = "ConfigMap in app namespace with SPIFFE_* keys"
  value       = var.enabled ? kubernetes_config_map.spiffe_config[0].metadata[0].name : null
}

output "helm_release_name" {
  value = var.enabled && var.install_helm_release ? var.helm_release_name : null
}
