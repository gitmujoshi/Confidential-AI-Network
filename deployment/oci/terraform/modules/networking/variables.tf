variable "compartment_id" {
  description = "OCID of the compartment"
  type        = string
}

variable "vcn_cidr" {
  description = "CIDR block for VCN"
  type        = string
}

variable "cluster_name" {
  description = "Name of the OKE cluster"
  type        = string
}

variable "region" {
  description = "OCI region"
  type        = string
} 