output "key_vault_zone_id" {
  value = var.enabled ? azurerm_private_dns_zone.vault[0].id : ""
}

output "blob_zone_id" {
  value = var.enabled ? azurerm_private_dns_zone.blob[0].id : ""
}
