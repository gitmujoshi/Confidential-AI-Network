output "identity_client_ids" {
  value = var.enabled ? {
    for k, id in azurerm_user_assigned_identity.workloads : k => id.client_id
  } : {}
}

output "identity_principal_ids" {
  value = var.enabled ? {
    for k, id in azurerm_user_assigned_identity.workloads : k => id.principal_id
  } : {}
}

output "identity_ids" {
  value = var.enabled ? {
    for k, id in azurerm_user_assigned_identity.workloads : k => id.id
  } : {}
}

output "backend_client_id" {
  value = var.enabled && contains(var.workload_names, "backend") ? azurerm_user_assigned_identity.workloads["backend"].client_id : null
}
