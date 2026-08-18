# Optional Azure Front Door + WAF (edge) — Phase 2 scaffold
#
# Default disabled. When enabled, creates a Front Door Standard profile with
# a public endpoint and origin group pointing at the platform public IP.
# APIM JWT policies remain manual / follow AZURE_IAM_AND_EDGE_CONFIG.md.
#
# Design: docs/production/AZURE_SECURITY_ARCHITECTURE.md § Phase 7

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.90"
    }
  }
}

resource "azurerm_cdn_frontdoor_profile" "this" {
  count = var.enabled ? 1 : 0

  name                = "can-${var.environment}-afd"
  resource_group_name = var.resource_group_name
  sku_name            = var.sku_name
  tags                = var.project_tags
}

resource "azurerm_cdn_frontdoor_firewall_policy" "waf" {
  count = var.enabled && var.enable_waf ? 1 : 0

  name                = "can${var.environment}waf"
  resource_group_name = var.resource_group_name
  sku_name            = var.sku_name
  enabled             = true
  mode                = var.waf_mode
  tags                = var.project_tags
}

resource "azurerm_cdn_frontdoor_endpoint" "this" {
  count = var.enabled ? 1 : 0

  name                     = "can-${var.environment}-app"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.this[0].id
  tags                     = var.project_tags
}

resource "azurerm_cdn_frontdoor_origin_group" "app" {
  count = var.enabled ? 1 : 0

  name                     = "app-origin-group"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.this[0].id

  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
  }

  health_probe {
    path                = "/"
    protocol            = "Http"
    interval_in_seconds = 30
  }
}

resource "azurerm_cdn_frontdoor_origin" "app" {
  count = var.enabled && var.origin_host_name != "" ? 1 : 0

  name                           = "app-origin"
  cdn_frontdoor_origin_group_id  = azurerm_cdn_frontdoor_origin_group.app[0].id
  enabled                        = true
  host_name                      = var.origin_host_name
  http_port                      = var.origin_http_port
  https_port                     = 443
  origin_host_header             = var.origin_host_header != "" ? var.origin_host_header : var.origin_host_name
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = false
}

resource "azurerm_cdn_frontdoor_route" "app" {
  count = var.enabled && var.origin_host_name != "" ? 1 : 0

  name                          = "app-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.this[0].id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.app[0].id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.app[0].id]
  supported_protocols           = ["Http", "Https"]
  patterns_to_match             = ["/*"]
  forwarding_protocol           = "HttpOnly"
  https_redirect_enabled        = true
}
