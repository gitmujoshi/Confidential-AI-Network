output "cluster_id" {
  description = "OCID of the OKE cluster"
  value       = oci_container_engine_cluster.oke_cluster.id
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint"
  value       = try(oci_container_engine_cluster.oke_cluster.endpoints[0].kubernetes, null)
}

output "kubeconfig" {
  description = "Kubeconfig YAML for the OKE cluster"
  value       = data.oci_containerengine_cluster_kube_config.kube_config.content
  sensitive   = true
}

output "node_pool_id" {
  description = "OCID of the node pool"
  value       = oci_container_engine_node_pool.oke_node_pool.id
}

output "node_image_id" {
  description = "OCID of the node image in use"
  value       = local.oke_node_image_id
}
