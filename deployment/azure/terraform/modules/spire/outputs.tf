output "spire_namespace" {
  value = var.enabled ? kubernetes_namespace.spire[0].metadata[0].name : null
}

output "trust_domain" {
  value = var.enabled ? var.trust_domain : null
}
