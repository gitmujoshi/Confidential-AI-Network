output "registry_id" {
  description = "OCID of the backend container repository"
  value       = oci_artifacts_container_repository.backend.id
}

output "frontend_registry_id" {
  value = oci_artifacts_container_repository.frontend.id
}

output "registry_url" {
  description = "OCIR base for docker push (…/namespace/repo) — append /backend or /frontend"
  value       = local.registry_base
}

output "ocir_host" {
  value = local.ocir_host
}

output "tenancy_namespace" {
  value = local.namespace
}

output "repository_name" {
  description = "Repository name prefix"
  value       = var.repository_name
}

output "backend_repository_uri" {
  value = oci_artifacts_container_repository.backend.repository_uri
}

output "frontend_repository_uri" {
  value = oci_artifacts_container_repository.frontend.repository_uri
}
