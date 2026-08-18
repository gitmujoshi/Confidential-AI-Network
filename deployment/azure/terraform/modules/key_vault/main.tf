# Azure Key Vault — platform secrets (DB, Entra client secret) + optional CMK placeholder
#
# Design: docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md §3.3
# SPIFFE/WI: docs/deployment/AZURE_SPIFFE_SPIRE_WIF.md

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.90"
    }
  }
}

data "azurerm_client_config" "current" {}

locals {
  vault_name = substr(replace(lower("${var.name_prefix}kv${var.environment}"), "-", ""), 0, 24)
}

resource "azurerm_key_vault" "this" {
  count = var.enabled ? 1 : 0

  name                          = local.vault_name
  location                      = var.location
  resource_group_name           = var.resource_group_name
  tenant_id                     = var.tenant_id
  sku_name                      = var.sku_name
  soft_delete_retention_days    = var.soft_delete_retention_days
  purge_protection_enabled      = var.purge_protection_enabled
  enable_rbac_authorization     = true
  public_network_access_enabled = var.public_network_access_enabled
  tags                          = var.project_tags

  network_acls {
    default_action = var.public_network_access_enabled ? "Allow" : "Deny"
    bypass         = "AzureServices"
  }
}

# Terraform runner needs secrets officer to seed initial secrets
resource "azurerm_role_assignment" "tf_secrets_officer" {
  count = var.enabled ? 1 : 0

  scope                = azurerm_key_vault.this[0].id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_key_vault_secret" "db_password" {
  count = var.enabled && var.db_password != "" ? 1 : 0

  name         = "can-${var.environment}-db-password"
  value        = var.db_password
  key_vault_id = azurerm_key_vault.this[0].id

  depends_on = [azurerm_role_assignment.tf_secrets_officer]
}

resource "azurerm_key_vault_secret" "entra_client_secret" {
  count = var.enabled && var.entra_client_secret != "" ? 1 : 0

  name         = "can-${var.environment}-entra-api-client-secret"
  value        = var.entra_client_secret
  key_vault_id = azurerm_key_vault.this[0].id

  depends_on = [azurerm_role_assignment.tf_secrets_officer]
}

resource "azurerm_key_vault_secret" "db_connection" {
  count = var.enabled && var.db_host != "" && var.db_password != "" ? 1 : 0

  name = "can-${var.environment}-db-connection"
  value = join("", [
    "host=", var.db_host,
    " port=", var.db_port,
    " dbname=", var.db_name,
    " user=", var.db_user,
    " password=", var.db_password,
    " sslmode=require"
  ])
  key_vault_id = azurerm_key_vault.this[0].id

  depends_on = [azurerm_role_assignment.tf_secrets_officer]
}

# Optional private endpoint
resource "azurerm_private_endpoint" "kv" {
  count = var.enabled && var.enable_private_endpoint ? 1 : 0

  name                = "${var.name_prefix}-kv-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoints_subnet_id
  tags                = var.project_tags

  private_service_connection {
    name                           = "${var.name_prefix}-kv-psc"
    private_connection_resource_id = azurerm_key_vault.this[0].id
    is_manual_connection           = false
    subresource_names              = ["vault"]
  }

  dynamic "private_dns_zone_group" {
    for_each = var.private_dns_zone_id != "" ? [1] : []
    content {
      name                 = "kv-dns"
      private_dns_zone_ids = [var.private_dns_zone_id]
    }
  }
}
