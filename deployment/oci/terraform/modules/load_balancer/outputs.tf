output "lb_id" {
  description = "OCID of the load balancer"
  value       = oci_load_balancer.load_balancer.id
}

output "lb_ip" {
  description = "Public IP of the load balancer"
  value       = oci_load_balancer.load_balancer.ip_addresses[0]
}

output "lb_hostname" {
  description = "Hostname of the load balancer"
  value       = oci_load_balancer.load_balancer.hostname
} 