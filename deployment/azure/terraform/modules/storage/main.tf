# Azure Blob Storage — datasets, training outputs, artifacts (ciphertext containers)
#
# Design: docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md §3.8

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.90"
    }
  }
}

locals {
  # Storage account names: 3–24 chars, lowercase alphanumeric only
  account_name = substr(replace(lower("${var.name_prefix}${var.environment}st"), "-", ""), 0, 24)

  containers = {
    datasets         = "can-${var.environment}-datasets"
    training_outputs = "can-${var.environment}-training-outputs"
    artifacts        = "can-${var.environment}-artifacts"
  }
}

resource "azurerm_storage_account" "this" {
  count = var.enabled ? 1 : 0

  name                            = local.account_name
  resource_group_name             = var.resource_group_name
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = var.replication_type
  account_kind                    = "StorageV2"
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  public_network_access_enabled   = var.public_network_access_enabled
  tags                            = var.project_tags

  blob_properties {
    versioning_enabled = true
    delete_retention_policy {
      days = 30
    }
  }
}

resource "azurerm_storage_container" "containers" {
  for_each = var.enabled ? local.containers : {}

  name                  = each.value
  storage_account_name  = azurerm_storage_account.this[0].name
  container_access_type = "private"
}

resource "azurerm_private_endpoint" "blob" {
  count = var.enabled && var.enable_private_endpoint ? 1 : 0

  name                = "${var.name_prefix}-blob-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoints_subnet_id
  tags                = var.project_tags

  private_service_connection {
    name                           = "${var.name_prefix}-blob-psc"
    private_connection_resource_id = azurerm_storage_account.this[0].id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }

  dynamic "private_dns_zone_group" {
    for_each = var.private_dns_zone_id != "" ? [1] : []
    content {
      name                 = "blob-dns"
      private_dns_zone_ids = [var.private_dns_zone_id]
    }
  }
}
