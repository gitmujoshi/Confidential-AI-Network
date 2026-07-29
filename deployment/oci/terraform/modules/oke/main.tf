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

# Compatible node images for this cluster / K8s version
data "oci_containerengine_node_pool_option" "node_pool_options" {
  node_pool_option_id = oci_container_engine_cluster.oke_cluster.id
  compartment_id      = var.compartment_id
}

locals {
  # Prefer Oracle Linux images that match the cluster Kubernetes version string
  k8s_ver_compact = replace(var.kubernetes_version, "v", "")
  oke_image_candidates = [
    for s in data.oci_containerengine_node_pool_option.node_pool_options.sources : s
    if can(regex("(?i)Oracle-Linux", s.source_name)) && can(regex(local.k8s_ver_compact, s.source_name))
  ]
  oke_node_image_id = var.node_image_id != "" ? var.node_image_id : (
    length(local.oke_image_candidates) > 0
    ? local.oke_image_candidates[0].image_id
    : data.oci_containerengine_node_pool_option.node_pool_options.sources[0].image_id
  )
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
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

  node_source_details {
    image_id                = local.oke_node_image_id
    source_type             = "IMAGE"
    boot_volume_size_in_gbs = var.node_boot_volume_size_in_gbs
  }

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

data "oci_containerengine_cluster_kube_config" "kube_config" {
  cluster_id = oci_container_engine_cluster.oke_cluster.id
}
