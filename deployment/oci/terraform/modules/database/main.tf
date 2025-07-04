# Database System
resource "oci_database_autonomous_database" "database" {
  compartment_id           = var.compartment_id
  db_name                  = var.db_name
  cpu_core_count          = var.db_cpu_core_count
  data_storage_size_in_tbs = var.db_size
  db_workload             = "OLTP"
  display_name            = "${var.db_name}-database"
  is_free_tier            = false
  license_model           = "LICENSE_INCLUDED"
  admin_password          = var.db_password
  
  freeform_tags = var.project_tags
}

# Database Wallet
resource "oci_database_autonomous_database_wallet" "database_wallet" {
  autonomous_database_id = oci_database_autonomous_database.database.id
  password              = var.db_password
  generate_type         = "SINGLE"
} 