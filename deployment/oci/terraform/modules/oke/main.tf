# OKE Cluster
resource "oci_container_engine_cluster" "oke_cluster" {
  compartment_id     = var.compartment_id
  kubernetes_version = var.kubernetes_version
  name               = var.cluster_name
  vcn_id             = var.vcn_id

  options {
    service_lb_subnet_ids = var.subnet_ids
    kubernetes_network_config {
      pods_cidr     = "10.244.0.0/16"
      services_cidr = "10.96.0.0/16"
    }
  }

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Node Pool
resource "oci_container_engine_node_pool" "oke_node_pool" {
  cluster_id         = oci_container_engine_cluster.oke_cluster.id
  compartment_id     = var.compartment_id
  kubernetes_version = var.kubernetes_version
  name               = "${var.cluster_name}-node-pool"
  node_shape         = var.node_shape
  subnet_ids         = [var.private_subnet_id]

  node_config_details {
    placement_configs {
      availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
      subnet_id           = var.private_subnet_id
    }

    size = var.node_pool_size
  }

  node_shape_config {
    ocpus         = var.node_ocpus
    memory_in_gbs = var.node_memory_in_gbs
  }

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Data source for availability domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
} 