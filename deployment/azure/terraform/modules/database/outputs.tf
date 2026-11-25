output "db_host" {
  value = azurerm_postgresql_flexible_server.db.fqdn
}

output "db_port" {
  value = "5432"
}

output "db_name" {
  value = azurerm_postgresql_flexible_server_database.app.name
}

output "db_user" {
  value = var.db_user
}

output "keycloak_db_name" {
  value = var.create_keycloak_database ? azurerm_postgresql_flexible_server_database.keycloak[0].name : ""
}
