variable "compartment_id" {
  description = "OCID of the compartment"
  type        = string
}

variable "repository_name" {
  description = "Name of the container registry repository"
  type        = string
}

variable "project_tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ContractManagement"
    Environment = "Production"
    Owner       = "DevOps"
  }
} 