output "frontend_service_ip" {
  description = "Public IP of the frontend OKE LoadBalancer Service (when provisioned)"
  value = try(
    kubernetes_service.frontend_service.status[0].load_balancer[0].ingress[0].ip,
    null
  )
}

output "backend_public_ip" {
  description = "Public IP of optional backend LB Service"
  value = try(
    kubernetes_service.backend_public[0].status[0].load_balancer[0].ingress[0].ip,
    null
  )
}

output "namespace" {
  value = kubernetes_namespace.app_namespace.metadata[0].name
}
