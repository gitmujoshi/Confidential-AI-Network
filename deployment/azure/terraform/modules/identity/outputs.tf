output "tenant_id" {
  value = var.tenant_id
}

output "authority" {
  description = "OIDC authority (v2.0)"
  value       = local.authority
}

output "issuer" {
  description = "JWT issuer (same as authority for v2 tokens)"
  value       = local.authority
}

output "frontend_client_id" {
  description = "SPA application (client) ID"
  value = (
    var.create_apps
    ? azuread_application.frontend[0].client_id
    : (var.existing_client_id != "" ? var.existing_client_id : null)
  )
}

output "api_client_id" {
  description = "API application (client) ID"
  value = (
    var.create_apps
    ? azuread_application.api[0].client_id
    : (var.existing_api_client_id != "" ? var.existing_api_client_id : null)
  )
}

output "api_audience" {
  description = "API identifier URI / JWT audience"
  value = (
    var.create_apps
    ? local.api_audience
    : (var.existing_api_audience != "" ? var.existing_api_audience : local.api_audience)
  )
}

output "api_scope" {
  description = "Delegated scope for SPA authorize (api://…/access_as_user)"
  value       = "${local.api_audience}/access_as_user"
}

output "api_client_secret" {
  description = "API application client secret (if created)"
  value = (
    var.create_apps && var.create_api_client_secret
    ? azuread_application_password.api[0].value
    : (var.existing_client_secret != "" ? var.existing_client_secret : null)
  )
  sensitive = true
}

output "redirect_uri" {
  value = local.redirect_uri
}

output "app_role_ids" {
  description = "App role UUIDs on the API registration"
  value = var.create_apps ? {
    TDC      = random_uuid.app_role_tdc.result
    TDP      = random_uuid.app_role_tdp.result
    CCRP     = random_uuid.app_role_ccrp.result
    AppAdmin = random_uuid.app_role_appadmin.result
  } : {}
}
