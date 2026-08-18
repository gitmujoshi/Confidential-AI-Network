output "storage_account_id" {
  value = var.enabled ? azurerm_storage_account.this[0].id : null
}

output "storage_account_name" {
  value = var.enabled ? azurerm_storage_account.this[0].name : null
}

output "primary_blob_endpoint" {
  value = var.enabled ? azurerm_storage_account.this[0].primary_blob_endpoint : null
}

output "container_names" {
  value = var.enabled ? {
    for k, c in azurerm_storage_container.containers : k => c.name
  } : {}
}
