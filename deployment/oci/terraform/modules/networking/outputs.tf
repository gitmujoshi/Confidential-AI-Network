output "vcn_id" {
  description = "OCID of the VCN"
  value       = oci_core_vcn.vcn.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = [oci_core_subnet.public_subnet_1.id, oci_core_subnet.public_subnet_2.id]
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = oci_core_subnet.private_subnet.id
}

output "internet_gateway_id" {
  description = "OCID of the internet gateway"
  value       = oci_core_internet_gateway.internet_gateway.id
}

output "nat_gateway_id" {
  description = "OCID of the NAT gateway"
  value       = oci_core_nat_gateway.nat_gateway.id
}

output "service_gateway_id" {
  description = "OCID of the service gateway"
  value       = oci_core_service_gateway.service_gateway.id
} 