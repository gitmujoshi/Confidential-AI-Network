output "service_account" {
  value = var.enabled ? "system:serviceaccount:${var.namespace}:external-secrets" : ""
}
