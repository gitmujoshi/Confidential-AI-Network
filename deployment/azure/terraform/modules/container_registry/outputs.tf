output "registry_url" {
  value = azurerm_container_registry.acr.login_server
}

output "acr_id" {
  value = azurerm_container_registry.acr.id
}

output "repository_name" {
  value = var.repository_name
}
