locals {
  cms_project = "confidential-ai-network"

  production_environments = ["prod"]
  is_production           = contains(local.production_environments, lower(var.environment))

  standard_tags = {
    "cms-project"             = local.cms_project
    "cms-environment"         = var.environment
    "cms-owner"               = var.tag_owner
    "cms-data-classification" = var.data_classification
    "cms-cost-center"         = var.cost_center
    "cms-release"             = var.release_version
    "cms-managed-by"          = "terraform"
  }

  resource_tags = merge(local.standard_tags, var.project_tags)

  effective_image_tag = (
    var.image_tag != "" ? var.image_tag :
    var.release_version != "0.0.0-dev" ? var.release_version :
    "latest"
  )

  # Prefer Entra identity module outputs; fall back to manual tfvars.
  effective_entra_client_id = coalesce(
    try(module.identity.frontend_client_id, null),
    var.entra_client_id != "" ? var.entra_client_id : null,
    ""
  )
  effective_entra_api_client_id = coalesce(
    try(module.identity.api_client_id, null),
    var.entra_api_client_id != "" ? var.entra_api_client_id : null,
    ""
  )
  effective_entra_client_secret = coalesce(
    try(module.identity.api_client_secret, null),
    var.entra_client_secret != "" ? var.entra_client_secret : null,
    ""
  )
  effective_entra_api_audience = coalesce(
    try(module.identity.api_audience, null),
    var.entra_api_audience != "" ? var.entra_api_audience : null,
    "api://cms-${var.environment}-api"
  )
  effective_entra_api_scope = coalesce(
    try(module.identity.api_scope, null),
    "${local.effective_entra_api_audience}/access_as_user"
  )
  effective_entra_authority = coalesce(
    try(module.identity.authority, null),
    "https://login.microsoftonline.com/${var.tenant_id}/v2.0"
  )
  effective_entra_issuer = local.effective_entra_authority
  effective_entra_redirect_uri = coalesce(
    try(module.identity.redirect_uri, null),
    var.entra_redirect_uri != "" ? var.entra_redirect_uri : null,
    "https://${var.app_domain}/login"
  )
}

resource "terraform_data" "production_image_tag_guard" {
  lifecycle {
    precondition {
      condition = (
        !local.is_production ||
        var.image_tag != "" ||
        var.release_version != "0.0.0-dev"
      )
      error_message = "Production requires image_tag or release_version (avoid unpinned :latest)."
    }
  }
}
