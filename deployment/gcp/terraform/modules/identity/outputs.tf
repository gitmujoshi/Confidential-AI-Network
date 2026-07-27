output "project_id" {
  value = var.project_id
}

output "auth_domain" {
  description = "Typical Identity Platform auth domain"
  value       = "${var.project_id}.firebaseapp.com"
}

output "oidc_issuer" {
  value = local.issuer
}

output "oidc_audience" {
  value = local.audience
}

output "oauth_client_id" {
  value = var.oauth_client_id != "" ? var.oauth_client_id : null
}

output "oauth_client_secret" {
  value     = var.oauth_client_secret != "" ? var.oauth_client_secret : null
  sensitive = true
}

output "redirect_uri" {
  value = local.redirect_uri
}

output "identity_platform_enabled" {
  value = var.enable_identity_platform
}
