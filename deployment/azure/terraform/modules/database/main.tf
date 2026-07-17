resource "azurerm_private_dns_zone" "postgres" {
  name                = "${var.db_name}.postgres.database.azure.com"
  resource_group_name = var.resource_group_name
  tags                = var.project_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "${var.db_name}-dns-link"
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = var.vnet_id
  resource_group_name   = var.resource_group_name
  tags                  = var.project_tags
}

resource "azurerm_postgresql_flexible_server" "db" {
  name                   = var.db_name
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = "15"
  administrator_login    = var.db_user
  administrator_password = var.db_password
  storage_mb             = var.storage_mb
  sku_name               = var.sku_name
  delegated_subnet_id    = var.subnet_id
  private_dns_zone_id    = azurerm_private_dns_zone.postgres.id
  public_network_access_enabled = false
  tags                   = var.project_tags

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]
}

resource "azurerm_postgresql_flexible_server_database" "app" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.db.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}
