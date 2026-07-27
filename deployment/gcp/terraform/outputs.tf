output "auth_provider" {
  value = "gcp-identity"
}

output "project_id" {
  value = var.project_id
}

output "gcp_identity_auth_domain" {
  value = module.identity.auth_domain
}

output "gcp_oidc_issuer" {
  value = module.identity.oidc_issuer
}

output "gcp_oidc_audience" {
  value = module.identity.oidc_audience
}

output "gcp_oidc_client_id" {
  value = module.identity.oauth_client_id
}

output "gcp_identity_redirect_uri" {
  value = module.identity.redirect_uri
}

output "next_steps" {
  value = [
    "1. Create OAuth Web client (if not set) with redirect ${module.identity.redirect_uri}",
    "2. Set AUTH_PROVIDER=gcp-identity KEYCLOAK_ENABLED=false on the backend",
    "3. Export GCP_OIDC_* / GCP_PROJECT_ID from terraform outputs into Secret Manager or K8s",
    "4. Provision app DB users matching Identity Platform emails / UIDs",
    "5. See docs/deployment/GCP_FEATURES_AND_CONFIGURATION.md"
  ]
}
