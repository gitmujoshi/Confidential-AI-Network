output "enabled" {
  value = var.enabled
}

output "waf_policy_name" {
  value = var.enabled ? local.waf_policy_name : null
}

output "api_gateway_name" {
  value = var.enabled ? local.api_gateway_name : null
}

output "api_gateway_deployment_path" {
  value = var.enabled ? local.api_gateway_deployment_path : null
}

output "jwt_issuer" {
  value = var.enabled ? local.jwt_issuer : null
}

output "jwt_jwks_url" {
  value = var.enabled ? local.jwt_jwks_url : null
}

output "api_hostname" {
  value = var.enabled ? local.api_hostname : null
}

output "app_hostname" {
  value = var.enabled ? local.app_hostname : null
}

output "kubernetes_config_map_name" {
  value = var.enabled ? kubernetes_config_map.edge_design[0].metadata[0].name : null
}

output "intended_oci_resource_types" {
  description = "Checklist of OCI resource types to create on first live edge apply"
  value = var.enabled ? [
    "oci_waf_web_app_firewall_policy",
    "oci_waf_web_app_firewall",
    "oci_apigateway_gateway",
    "oci_apigateway_deployment",
    "oci_load_balancer_load_balancer",
    "oci_identity_domains_app (Cloud Gate OIDC apps)",
  ] : []
}
