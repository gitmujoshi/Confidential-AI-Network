# API Management with the Entra JWT policy.
# Created only when the publisher email and the backend URL are both set.

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.90"
    }
  }
}

locals {
  create = var.enabled && var.publisher_email != "" && var.backend_url != "" && var.tenant_id != "" && var.audience != ""
}

resource "azurerm_api_management" "this" {
  count = local.create ? 1 : 0

  name                = "can-${var.environment}-apim"
  location            = var.location
  resource_group_name = var.resource_group_name
  publisher_name      = var.publisher_name
  publisher_email     = var.publisher_email
  sku_name            = "Consumption_0"
  tags                = var.project_tags
}

resource "azurerm_api_management_backend" "api" {
  count = local.create ? 1 : 0

  name                = "can-backend"
  resource_group_name = var.resource_group_name
  api_management_name = azurerm_api_management.this[0].name
  protocol            = "http"
  url                 = var.backend_url
}

resource "azurerm_api_management_api" "can" {
  count = local.create ? 1 : 0

  name                  = "can-api"
  resource_group_name   = var.resource_group_name
  api_management_name   = azurerm_api_management.this[0].name
  revision              = "1"
  display_name          = "Confidential AI Network"
  path                  = ""
  protocols             = ["https"]
  subscription_required = false
}

resource "azurerm_api_management_api_operation" "proxy" {
  for_each = local.create ? toset(["GET", "POST", "PUT", "PATCH", "DELETE"]) : toset([])

  operation_id        = "proxy-${lower(each.key)}"
  api_name            = azurerm_api_management_api.can[0].name
  api_management_name = azurerm_api_management.this[0].name
  resource_group_name = var.resource_group_name
  display_name        = each.key
  method              = each.key
  url_template        = "/{*path}"

  template_parameter {
    name     = "path"
    required = true
    type     = "string"
  }
}

resource "azurerm_api_management_api_policy" "can" {
  count = local.create ? 1 : 0

  api_name            = azurerm_api_management_api.can[0].name
  api_management_name = azurerm_api_management.this[0].name
  resource_group_name = var.resource_group_name
  xml_content = templatefile(var.policy_template, {
    tenant_id = var.tenant_id
    audience  = var.audience
  })
}
