variable "compartment_id" {
  description = "OCID of the compartment"
  type        = string
}

variable "vcn_id" {
  description = "OCID of the VCN (for PostgreSQL NSG)"
  type        = string
}

variable "vcn_cidr" {
  description = "VCN CIDR allowed to reach PostgreSQL"
  type        = string
}

variable "subnet_id" {
  description = "Private subnet OCID for the PostgreSQL endpoint"
  type        = string
}

variable "availability_domain" {
  description = "AD for non-regional storage (required when is_regionally_durable=false)"
  type        = string
  default     = null
}

variable "db_name" {
  description = "Display name prefix and preferred application database name"
  type        = string
}

variable "db_user" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "canadmin"
}

variable "db_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "db_version" {
  description = "OCI Database with PostgreSQL major version"
  type        = string
  default     = "16"
}

variable "db_shape" {
  description = "Compute shape for PostgreSQL nodes"
  type        = string
  default     = "PostgreSQL.VM.Standard.E4.Flex.2.32GB"
}

variable "instance_count" {
  description = "Number of PostgreSQL nodes (1 = primary only)"
  type        = number
  default     = 1
}

variable "instance_ocpu_count" {
  type    = number
  default = 2
}

variable "instance_memory_size_in_gbs" {
  type    = number
  default = 32
}

variable "storage_is_regionally_durable" {
  type    = bool
  default = true
}

variable "storage_system_type" {
  type    = string
  default = "OCI_OPTIMIZED_STORAGE"
}

variable "storage_iops" {
  description = "Provisioned IOPS (optional; leave null for service default)"
  type        = number
  default     = null
}

variable "app_database_name" {
  description = "Database name the app connects to (create if missing: CREATE DATABASE …)"
  type        = string
  default     = "postgres"
}

variable "freeform_tags" {
  type    = map(string)
  default = {}
}

variable "defined_tags" {
  type    = map(string)
  default = {}
}
