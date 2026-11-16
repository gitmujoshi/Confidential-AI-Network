output "node_pool_name" {
  value = var.enabled ? azurerm_kubernetes_cluster_node_pool.confidential[0].name : ""
}

output "vm_size" {
  value = var.enabled ? var.vm_size : ""
}

output "node_pool_id" {
  value = var.enabled ? azurerm_kubernetes_cluster_node_pool.confidential[0].id : ""
}
