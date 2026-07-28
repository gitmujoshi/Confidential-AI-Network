# VCN
resource "oci_core_vcn" "vcn" {
  compartment_id = var.compartment_id
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${var.cluster_name}-vcn"
  dns_label      = "contractmgmt"

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Internet Gateway
resource "oci_core_internet_gateway" "internet_gateway" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.cluster_name}-internet-gateway"

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# NAT Gateway
resource "oci_core_nat_gateway" "nat_gateway" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.cluster_name}-nat-gateway"

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Service Gateway
resource "oci_core_service_gateway" "service_gateway" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.cluster_name}-service-gateway"

  services {
    service_id = data.oci_core_services.all_services.services[0].id
  }

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Data source for OCI services
data "oci_core_services" "all_services" {
  filter {
    name   = "name"
    values = ["All .* Services In Oracle Services Network"]
    regex  = true
  }
}

# Public Subnet 1 (for load balancer)
resource "oci_core_subnet" "public_subnet_1" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  cidr_block     = cidrsubnet(var.vcn_cidr, 8, 1)
  display_name   = "${var.cluster_name}-public-subnet-1"
  dns_label      = "public1"

  security_list_ids = [oci_core_security_list.public_security_list.id]
  route_table_id    = oci_core_route_table.public_route_table.id

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Public Subnet 2 (for load balancer)
resource "oci_core_subnet" "public_subnet_2" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  cidr_block     = cidrsubnet(var.vcn_cidr, 8, 2)
  display_name   = "${var.cluster_name}-public-subnet-2"
  dns_label      = "public2"

  security_list_ids = [oci_core_security_list.public_security_list.id]
  route_table_id    = oci_core_route_table.public_route_table.id

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Private Subnet (for OKE nodes and database)
resource "oci_core_subnet" "private_subnet" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  cidr_block     = cidrsubnet(var.vcn_cidr, 8, 10)
  display_name   = "${var.cluster_name}-private-subnet"
  dns_label      = "private"

  security_list_ids = [oci_core_security_list.private_security_list.id]
  route_table_id    = oci_core_route_table.private_route_table.id

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Public Route Table
resource "oci_core_route_table" "public_route_table" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.cluster_name}-public-route-table"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.internet_gateway.id
  }

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Private Route Table
resource "oci_core_route_table" "private_route_table" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.cluster_name}-private-route-table"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_nat_gateway.nat_gateway.id
  }

  route_rules {
    destination       = data.oci_core_services.all_services.services[0].cidr_block
    destination_type  = "SERVICE_CIDR_BLOCK"
    network_entity_id = oci_core_service_gateway.service_gateway.id
  }

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Public Security List
resource "oci_core_security_list" "public_security_list" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.cluster_name}-public-security-list"

  # Ingress rules
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      min = 3000
      max = 3000
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      min = 5000
      max = 5000
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"

    tcp_options {
      min = 8080
      max = 8080
    }
  }

  # Egress rules
  egress_security_rules {
    protocol         = "all"
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Private Security List
resource "oci_core_security_list" "private_security_list" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.cluster_name}-private-security-list"

  # Ingress rules for OKE
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.vcn_cidr
    source_type = "CIDR_BLOCK"

    tcp_options {
      min = 6443
      max = 6443
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.vcn_cidr
    source_type = "CIDR_BLOCK"

    tcp_options {
      min = 10250
      max = 10250
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.vcn_cidr
    source_type = "CIDR_BLOCK"

    tcp_options {
      min = 10256
      max = 10256
    }
  }

  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.vcn_cidr
    source_type = "CIDR_BLOCK"

    tcp_options {
      min = 10255
      max = 10255
    }
  }

  # Database access
  ingress_security_rules {
    protocol    = "6" # TCP
    source      = var.vcn_cidr
    source_type = "CIDR_BLOCK"

    tcp_options {
      min = 5432
      max = 5432
    }
  }

  # Egress rules
  egress_security_rules {
    protocol         = "all"
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
} 