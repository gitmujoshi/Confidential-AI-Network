resource "azurerm_container_registry" "acr" {
  name                = replace(var.repository_name, "-", "")
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Premium"
  admin_enabled       = false
  tags                = var.project_tags
}
