output "gateway_url" {
  value = length(azurerm_api_management.this) > 0 ? azurerm_api_management.this[0].gateway_url : ""
}

output "created" {
  value = length(azurerm_api_management.this) > 0
}
