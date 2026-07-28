output "enabled" {
  value = var.enabled
}

output "vault_id" {
  description = "OCID of the KMS Vault"
  value       = try(oci_kms_vault.this[0].id, null)
}

output "key_id" {
  description = "OCID of the master CMK"
  value       = try(oci_kms_key.master[0].id, null)
}

output "vault_management_endpoint" {
  description = "Vault management endpoint (required for key operations)"
  value       = try(oci_kms_vault.this[0].management_endpoint, null)
}

output "vault_display_name" {
  value = var.enabled ? local.vault_display_name : null
}

output "key_display_name" {
  value = var.enabled ? local.key_display_name : null
}
