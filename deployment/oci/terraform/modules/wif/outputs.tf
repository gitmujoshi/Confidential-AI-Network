output "enabled" {
  value = var.enabled
}

output "idcs_endpoint" {
  value = var.enabled ? local.idcs_endpoint : null
}

output "trust_name" {
  value = var.enabled && var.create_propagation_trust ? local.trust_name : null
}

output "trust_id" {
  value = var.enabled && var.create_propagation_trust ? oci_identity_domains_identity_propagation_trust.spire[0].id : null
}

output "token_exchange_client_id" {
  value = (
    var.enabled && var.create_token_exchange_app
    ? oci_identity_domains_app.token_exchange[0].name
    : (var.enabled ? var.existing_token_exchange_client_id : null)
  )
}

output "token_exchange_client_secret" {
  value = (
    var.enabled && var.create_token_exchange_app
    ? oci_identity_domains_app.token_exchange[0].client_secret
    : null
  )
  sensitive = true
}

output "service_user_ids" {
  description = "SCIM ids of service users (use in impersonation rules / Audit)"
  value = var.enabled && var.create_service_users ? {
    for k, u in oci_identity_domains_user.service : k => u.id
  } : {}
}

output "service_user_names" {
  value = var.enabled && var.create_service_users ? {
    for k, u in oci_identity_domains_user.service : k => u.user_name
  } : {}
}

output "impersonation_rules" {
  description = "Rules applied on the Propagation Trust"
  value = var.enabled ? {
    for k, r in local.impersonation_rules : k => r.rule
  } : {}
}

output "spire_oidc_issuer" {
  value = var.enabled ? var.spire_oidc_issuer : null
}

output "kubernetes_secret_name" {
  value = var.enabled && var.write_kubernetes_config ? "oci-wif-secret" : null
}

output "kubernetes_config_map_name" {
  value = var.enabled && var.write_kubernetes_config ? "oci-wif-config" : null
}

output "suggested_iam_policy_comments" {
  description = "Hints for classic IAM policies binding service users to Vault/OSS"
  value       = local.suggested_iam_policies
}
