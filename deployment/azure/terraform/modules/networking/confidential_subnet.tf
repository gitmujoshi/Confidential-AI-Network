# User node pool for confidential VMs. Separate from the system pool subnet.
# /24 at index 13: public=1, app=10, data=11, private endpoints=12.
resource "azurerm_subnet" "confidential" {
  name                 = "${var.cluster_name}-ccr"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = [cidrsubnet(var.vnet_cidr, 8, 13)]
}

resource "azurerm_subnet_nat_gateway_association" "confidential" {
  subnet_id      = azurerm_subnet.confidential.id
  nat_gateway_id = azurerm_nat_gateway.nat.id
}

resource "azurerm_network_security_group" "confidential" {
  name                = "${var.cluster_name}-ccr-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = var.project_tags
}

resource "azurerm_subnet_network_security_group_association" "confidential" {
  subnet_id                 = azurerm_subnet.confidential.id
  network_security_group_id = azurerm_network_security_group.confidential.id
}
