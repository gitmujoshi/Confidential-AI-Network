# Container Registry
resource "oci_artifacts_container_repository" "container_repository" {
  compartment_id = var.compartment_id
  display_name   = var.repository_name
  is_immutable   = false
  is_public      = false
  
  freeform_tags = var.project_tags
} 