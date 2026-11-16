# Private DNS so Key Vault and Blob private endpoints resolve inside the VNet.
# Zones are created only when enable_private_endpoints is true.

resource "azurerm_private_dns_zone" "vault" {
  count = var.enabled ? 1 : 0

  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = var.resource_group_name
  tags                = var.project_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "vault" {
  count = var.enabled ? 1 : 0

  name                  = "can-vault-dns"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.vault[0].name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false
  tags                  = var.project_tags
}

resource "azurerm_private_dns_zone" "blob" {
  count = var.enabled ? 1 : 0

  name                = "privatelink.blob.core.windows.net"
  resource_group_name = var.resource_group_name
  tags                = var.project_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "blob" {
  count = var.enabled ? 1 : 0

  name                  = "can-blob-dns"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.blob[0].name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false
  tags                  = var.project_tags
}
