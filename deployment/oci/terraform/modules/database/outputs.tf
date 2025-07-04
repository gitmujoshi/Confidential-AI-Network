output "db_id" {
  description = "OCID of the database"
  value       = oci_database_autonomous_database.database.id
}

output "db_host" {
  description = "Database host"
  value       = oci_database_autonomous_database.database.connection_strings[0].hosts[0]
}

output "db_port" {
  description = "Database port"
  value       = oci_database_autonomous_database.database.connection_strings[0].ports[0]
}

output "db_name" {
  description = "Database name"
  value       = oci_database_autonomous_database.database.db_name
}

output "db_user" {
  description = "Database admin user"
  value       = "ADMIN"
}

output "db_connection_string" {
  description = "Database connection string"
  value       = oci_database_autonomous_database.database.connection_strings[0].high
  sensitive   = true
} 