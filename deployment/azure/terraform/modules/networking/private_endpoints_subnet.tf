# Private endpoints subnet (Key Vault / Storage PE). Not delegated — separate from Postgres data subnet.
resource "azurerm_subnet" "private_endpoints" {
  name                 = "${var.cluster_name}-pe"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [cidrsubnet(var.vnet_cidr, 8, 12)]

  private_endpoint_network_policies = "Enabled"
}
