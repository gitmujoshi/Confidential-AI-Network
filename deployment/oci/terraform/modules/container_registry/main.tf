# Container Registry
resource "oci_artifacts_container_repository" "container_repository" {
  compartment_id = var.compartment_id
  display_name   = var.repository_name
  is_immutable   = coalesce(var.repository_immutable, lower(var.environment) == "prod")
  is_public      = false

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}
