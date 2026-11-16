variable "enabled" {
  type    = bool
  default = false
}

variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "kubernetes_cluster_id" { type = string }
variable "subnet_id" { type = string }

variable "node_pool_name" {
  type    = string
  default = "ccnpool"
}

variable "vm_size" {
  description = "Confidential VM size. Standard_DC4as_v5 is AMD SEV-SNP. Confirm the SKU in the region before apply."
  type        = string
  default     = "Standard_DC4as_v5"
}

variable "node_count" {
  type    = number
  default = 1
}

variable "os_disk_size_gb" {
  type    = number
  default = 128
}

variable "kubernetes_namespace" {
  type    = string
  default = "contract-management"
}

variable "training_workload_client_id" {
  type    = string
  default = ""
}

variable "project_tags" {
  type    = map(string)
  default = {}
}
