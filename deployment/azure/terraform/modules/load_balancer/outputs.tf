output "public_ip_address" {
  value = azurerm_public_ip.ingress.ip_address
}

output "lb_id" {
  value = azurerm_lb.ingress.id
}
