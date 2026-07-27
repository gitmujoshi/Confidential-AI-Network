output "domain_id" {
  description = "Identity Domain OCID"
  value = (
    var.create_domain
    ? oci_identity_domain.this[0].id
    : (var.existing_domain_id != "" ? var.existing_domain_id : null)
  )
}

output "domain_url" {
  description = "Identity Domain URL (idcs endpoint / issuer base)"
  value       = local.domain_url
}

output "idcs_endpoint" {
  description = "IDCS endpoint for identity_domains_* resources"
  value       = local.idcs_endpoint
}

output "frontend_client_id" {
  description = "SPA OIDC client id (app name)"
  value       = var.create_apps ? oci_identity_domains_app.frontend[0].name : null
}

output "frontend_app_id" {
  description = "SPA app SCIM id"
  value       = var.create_apps ? oci_identity_domains_app.frontend[0].id : null
}

output "api_client_id" {
  description = "API OIDC client id (app name)"
  value       = var.create_apps ? oci_identity_domains_app.api[0].name : null
}

output "api_app_id" {
  description = "API app SCIM id"
  value       = var.create_apps ? oci_identity_domains_app.api[0].id : null
}

output "api_client_secret" {
  description = "API confidential client secret"
  value       = var.create_apps ? oci_identity_domains_app.api[0].client_secret : null
  sensitive   = true
}

output "api_audience" {
  description = "API audience used for JWT validation"
  value = (
    var.create_apps
    ? (var.api_audience != "" ? var.api_audience : "api://cms-${var.environment}-api")
    : null
  )
}

output "redirect_uri" {
  description = "Configured SPA redirect URI"
  value       = local.redirect_uri
}

output "group_display_names" {
  description = "Role group display names"
  value       = { for k, g in oci_identity_domains_group.roles : k => g.display_name }
}

output "group_ids" {
  description = "Role group SCIM ids"
  value       = { for k, g in oci_identity_domains_group.roles : k => g.id }
}
