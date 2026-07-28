output "enabled" {
  value = var.enabled
}

output "scitt_ccf_url" {
  value = var.enabled ? local.scitt_ccf_url : null
}

output "scitt_namespace" {
  value = var.enabled ? local.scitt_namespace : null
}

output "kubernetes_config_map_name" {
  value = var.enabled ? kubernetes_config_map.scitt_design[0].metadata[0].name : null
}

output "deployment_mode" {
  value = var.enabled ? var.deployment_mode : null
}
