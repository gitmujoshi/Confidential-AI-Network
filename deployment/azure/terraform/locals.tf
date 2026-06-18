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
