output "cluster_id" {
  description = "OCID of the OKE cluster"
  value       = oci_container_engine_cluster.oke_cluster.id
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint"
  value       = oci_container_engine_cluster.oke_cluster.endpoints[0].kubernetes
}

output "kubeconfig" {
  description = "Kubeconfig for the OKE cluster"
  value       = oci_container_engine_cluster.oke_cluster.kube_config[0].config
  sensitive   = true
}

output "node_pool_id" {
  description = "OCID of the node pool"
  value       = oci_container_engine_node_pool.oke_node_pool.id
} 