output "db_id" {
  description = "OCID of the OCI PostgreSQL db system"
  value       = oci_psql_db_system.postgres.id
}

output "db_host" {
  description = "Primary PostgreSQL private IP (from network_details or primary instance)"
  value = coalesce(
    try(oci_psql_db_system.postgres.network_details[0].primary_db_endpoint_private_ip, null),
    try([for i in oci_psql_db_system.postgres.instances : i.private_ip if try(i.is_primary, true)][0], null),
    try(oci_psql_db_system.postgres.instances[0].private_ip, null)
  )
}

output "db_port" {
  description = "PostgreSQL port"
  value       = "5432"
}

output "db_name" {
  description = "Application database name"
  value       = var.app_database_name
}

output "db_user" {
  description = "Database admin user"
  value       = var.db_user
}

output "db_system_display_name" {
  value = oci_psql_db_system.postgres.display_name
}

output "nsg_id" {
  value = oci_core_network_security_group.postgres.id
}
