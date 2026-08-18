# AKS Workload Identity — user-assigned MIs + federated credentials (Path N)
#
# Design: docs/deployment/AZURE_SPIFFE_SPIRE_WIF.md
# Microsoft: https://learn.microsoft.com/azure/aks/workload-identity-overview

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.90"
    }
  }
}

locals {
  identities = var.enabled ? toset(var.workload_names) : toset([])
}

resource "azurerm_user_assigned_identity" "workloads" {
  for_each = local.identities

  name                = "can-${var.environment}-${each.key}-wi"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.project_tags
}

# Federate K8s SA → Entra (requires AKS oidc_issuer_url)
resource "azurerm_federated_identity_credential" "workloads" {
  for_each = var.enabled && var.oidc_issuer_url != "" ? local.identities : toset([])

  name                = "can-${var.environment}-${each.key}-fic"
  resource_group_name = var.resource_group_name
  parent_id           = azurerm_user_assigned_identity.workloads[each.key].id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = var.oidc_issuer_url
  subject             = "system:serviceaccount:${var.kubernetes_namespace}:${each.key}"
}

# Key Vault Secrets User for identities that need secrets
resource "azurerm_role_assignment" "kv_secrets_user" {
  for_each = var.enabled && var.key_vault_id != null && var.key_vault_id != "" ? {
    for name in var.kv_access_workloads : name => name if contains(var.workload_names, name)
  } : {}

  scope                = var.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.workloads[each.key].principal_id
}

# Blob Data Contributor for trainer + backend
resource "azurerm_role_assignment" "blob_data" {
  for_each = var.enabled && var.storage_account_id != null && var.storage_account_id != "" ? {
    for name in var.blob_access_workloads : name => name if contains(var.workload_names, name)
  } : {}

  scope                = var.storage_account_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.workloads[each.key].principal_id
}
