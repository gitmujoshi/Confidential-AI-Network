variable "compartment_id" {
  description = "OCID of the compartment"
  type        = string
}

variable "db_name" {
  description = "Name of the database"
  type        = string
}

variable "db_password" {
  description = "Password for the database"
  type        = string
  sensitive   = true
}

variable "db_size" {
  description = "Size of the database in TB"
  type        = number
  default     = 1
}

variable "db_cpu_core_count" {
  description = "Number of CPU cores for the database"
  type        = number
  default     = 1
} 