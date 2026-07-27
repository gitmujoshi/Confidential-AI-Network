locals {
  cms_project = "confidential-ai-network"

  production_environments = ["prod"]
  is_production           = contains(local.production_environments, lower(var.environment))

  standard_freeform_tags = {
    "cms-project"             = local.cms_project
    "cms-environment"         = var.environment
    "cms-owner"               = var.tag_owner
    "cms-data-classification" = var.data_classification
    "cms-cost-center"         = var.cost_center
    "cms-release"             = var.release_version
    "cms-managed-by"          = "terraform"
  }

  resource_freeform_tags = merge(local.standard_freeform_tags, var.project_tags)

  resource_defined_tags = var.defined_tag_namespace != "" ? {
    (var.defined_tag_namespace) = {
      "cms-project"             = local.cms_project
      "cms-environment"         = var.environment
      "cms-owner"               = var.tag_owner
      "cms-data-classification" = var.data_classification
      "cms-cost-center"         = var.cost_center
      "cms-release"             = var.release_version
    }
  } : {}

  effective_image_tag = (
    var.image_tag != "" ? var.image_tag :
    var.release_version != "0.0.0-dev" ? var.release_version :
    "latest"
  )

  # Prefer Identity module outputs; fall back to manual tfvars overrides.
  effective_oci_identity_domain_url = coalesce(
    try(module.identity.domain_url, null),
    var.oci_identity_domain_url != "" ? var.oci_identity_domain_url : null,
    ""
  )
  effective_oci_identity_client_id = coalesce(
    try(module.identity.frontend_client_id, null),
    var.oci_identity_client_id != "" ? var.oci_identity_client_id : null,
    ""
  )
  effective_oci_identity_api_client_id = coalesce(
    try(module.identity.api_client_id, null),
    var.oci_identity_api_client_id != "" ? var.oci_identity_api_client_id : null,
    ""
  )
  effective_oci_identity_client_secret = coalesce(
    try(module.identity.api_client_secret, null),
    var.oci_identity_client_secret != "" ? var.oci_identity_client_secret : null,
    ""
  )
  effective_oci_identity_audience = coalesce(
    try(module.identity.api_audience, null),
    var.oci_identity_audience != "" ? var.oci_identity_audience : null,
    ""
  )
  effective_oci_identity_issuer = (
    var.oci_identity_issuer != ""
    ? var.oci_identity_issuer
    : local.effective_oci_identity_domain_url
  )
  effective_oci_identity_redirect_uri = coalesce(
    try(module.identity.redirect_uri, null),
    var.oci_identity_redirect_uri != "" ? var.oci_identity_redirect_uri : null,
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
