output "key_vault_id" {
  value = var.enabled ? azurerm_key_vault.this[0].id : null
}

output "key_vault_uri" {
  value = var.enabled ? azurerm_key_vault.this[0].vault_uri : null
}

output "key_vault_name" {
  value = var.enabled ? azurerm_key_vault.this[0].name : null
}

output "db_password_secret_name" {
  value = var.enabled && var.db_password != "" ? azurerm_key_vault_secret.db_password[0].name : null
}

output "entra_secret_name" {
  value = var.enabled && var.entra_client_secret != "" ? azurerm_key_vault_secret.entra_client_secret[0].name : null
}
