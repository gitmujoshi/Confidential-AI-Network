output "registry_id" {
  description = "OCID of the container registry"
  value       = oci_artifacts_container_repository.container_repository.id
}

output "registry_url" {
  description = "URL of the container registry"
  value       = oci_artifacts_container_repository.container_repository.repository_uri
}

output "repository_name" {
  description = "Name of the repository"
  value       = oci_artifacts_container_repository.container_repository.display_name
} 