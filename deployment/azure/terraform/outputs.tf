output "resource_group_name" {
  value = module.networking.resource_group_name
}

output "aks_cluster_name" {
  value = module.aks.cluster_name
}

output "aks_cluster_endpoint" {
  value     = module.aks.cluster_endpoint
  sensitive = true
}

output "database_host" {
  value = module.database.db_host
}

output "database_port" {
  value = module.database.db_port
}

output "database_name" {
  value = module.database.db_name
}

output "load_balancer_ip" {
  value = module.load_balancer.public_ip_address
}

output "container_registry_url" {
  value = module.container_registry.registry_url
}

output "frontend_url" {
  value = "http://${module.load_balancer.public_ip_address}:3000"
}

output "backend_url" {
  value = "http://${module.load_balancer.public_ip_address}:5001"
}

output "***REMOVED-KEYCLOAK_DB_PASSWORD***_url" {
  value = "http://${module.load_balancer.public_ip_address}:8080"
}

output "next_steps" {
  value = [
    "1. az aks get-credentials --resource-group ${module.networking.resource_group_name} --name ${module.aks.cluster_name}",
    "2. Build and push images to ${module.container_registry.registry_url}",
    "3. Configure DNS for ${var.app_domain} → ${module.load_balancer.public_ip_address}",
    "4. Set up Keycloak realm at ${module.load_balancer.public_ip_address}:8080",
    "5. See docs/production/AZURE_SECURITY_ARCHITECTURE.md for edge hardening"
  ]
}
