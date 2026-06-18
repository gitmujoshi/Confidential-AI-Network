# OKE Cluster Outputs
output "oke_cluster_id" {
  description = "OCID of the OKE cluster"
  value       = module.oke.cluster_id
}

output "oke_cluster_endpoint" {
  description = "Kubernetes API endpoint"
  value       = module.oke.cluster_endpoint
}

output "kubeconfig" {
  description = "Kubeconfig for the OKE cluster"
  value       = module.oke.kubeconfig
  sensitive   = true
}

# Database Outputs
output "database_id" {
  description = "OCID of the database"
  value       = module.database.db_id
}

output "database_host" {
  description = "Database host"
  value       = module.database.db_host
}

output "database_port" {
  description = "Database port"
  value       = module.database.db_port
}

output "database_name" {
  description = "Database name"
  value       = module.database.db_name
}

# Load Balancer Outputs
output "load_balancer_id" {
  description = "OCID of the load balancer"
  value       = module.load_balancer.lb_id
}

output "load_balancer_ip" {
  description = "Public IP of the load balancer"
  value       = module.load_balancer.lb_ip
}

output "load_balancer_url" {
  description = "URL of the load balancer"
  value       = "http://${module.load_balancer.lb_ip}"
}

# Container Registry Outputs
output "container_registry_url" {
  description = "URL of the container registry"
  value       = module.container_registry.registry_url
}

output "container_registry_repository" {
  description = "Container registry repository name"
  value       = module.container_registry.repository_name
}

# Application URLs
output "frontend_url" {
  description = "Frontend application URL"
  value       = "http://${module.load_balancer.lb_ip}:3000"
}

output "backend_url" {
  description = "Backend API URL"
  value       = "http://${module.load_balancer.lb_ip}:5000"
}

output "keycloak_url" {
  description = "Keycloak admin console URL"
  value       = "http://${module.load_balancer.lb_ip}:8080"
}

# Network Outputs
output "vcn_id" {
  description = "OCID of the VCN"
  value       = module.networking.vcn_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = module.networking.private_subnet_id
}

# Deployment Status
output "deployment_status" {
  description = "Status of the deployment"
  value       = "Deployment completed successfully"
}

output "environment" {
  description = "Deployment environment"
  value       = var.environment
}

output "release_version" {
  description = "Application release version (cms-release)"
  value       = var.release_version
}

output "effective_image_tag" {
  description = "Pinned container image tag used by Kubernetes"
  value       = local.effective_image_tag
}

output "resource_tags" {
  description = "Merged cms-* freeform tags applied to OCI resources"
  value       = local.resource_freeform_tags
}

output "next_steps" {
  description = "Next steps after deployment"
  value = [
    "1. Configure DNS to point ${var.app_domain} to ${module.load_balancer.lb_ip}",
    "2. Access Keycloak admin console at http://${module.load_balancer.lb_ip}:8080",
    "3. Set up Keycloak realm and users",
    "4. Configure environment variables in Kubernetes secrets",
    "5. Deploy application containers to OKE cluster",
    "6. Access frontend at http://${module.load_balancer.lb_ip}:3000",
    "7. Access backend API at http://${module.load_balancer.lb_ip}:5000"
  ]
} 