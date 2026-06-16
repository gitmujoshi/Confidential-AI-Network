output "db_host" {
  value = azurerm_***REMOVED-DB_PASSWORD***ql_flexible_server.db.fqdn
}

output "db_port" {
  value = "5432"
}

output "db_name" {
  value = azurerm_***REMOVED-DB_PASSWORD***ql_flexible_server_database.app.name
}

output "db_user" {
  value = var.db_user
}
