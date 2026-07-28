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