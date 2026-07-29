variable "compartment_id" {
  description = "OCID of the compartment"
  type        = string
}

variable "cluster_name" {
  description = "Name of the OKE cluster"
  type        = string
}

variable "vcn_id" {
  description = "OCID of the VCN"
  type        = string
}

variable "subnet_ids" {
  description = "IDs of the public subnets for load balancer"
  type        = list(string)
}

variable "private_subnet_id" {
  description = "ID of the private subnet for nodes"
  type        = string
}

variable "node_pool_size" {
  description = "Number of nodes in the node pool"
  type        = number
}

variable "node_shape" {
  description = "Shape of the compute instances"
  type        = string
}

variable "node_ocpus" {
  description = "Number of OCPUs for each node"
  type        = number
}

variable "node_memory_in_gbs" {
  description = "Amount of memory in GBs for each node"
  type        = number
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
}

variable "node_image_id" {
  description = "Optional OCID of OKE node image; empty = auto-select compatible Oracle Linux image"
  type        = string
  default     = ""
}

variable "node_boot_volume_size_in_gbs" {
  description = "Boot volume size for worker nodes"
  type        = number
  default     = 60
}

variable "freeform_tags" {
  type    = map(string)
  default = {}
}

variable "defined_tags" {
  type    = map(string)
  default = {}
} 