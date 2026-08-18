output "front_door_endpoint_hostname" {
  value = var.enabled ? azurerm_cdn_frontdoor_endpoint.this[0].host_name : null
}

output "front_door_profile_id" {
  value = var.enabled ? azurerm_cdn_frontdoor_profile.this[0].id : null
}

output "waf_policy_id" {
  value = var.enabled && var.enable_waf ? azurerm_cdn_frontdoor_firewall_policy.waf[0].id : null
}
