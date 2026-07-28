variable "enabled" {
  description = "Create Object Storage buckets for datasets, outputs, and artifacts"
  type        = bool
  default     = false
}

variable "compartment_id" {
  description = "Compartment OCID for buckets (typically cms-{env}-data)"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name (dev|test|staging|prod)"
  type        = string
}

variable "namespace" {
  description = "Object Storage namespace (empty → data.oci_objectstorage_namespace)"
  type        = string
  default     = ""
}

variable "access_type" {
  description = "NoPublicAccess recommended for all CMS buckets"
  type        = string
  default     = "NoPublicAccess"
}

variable "storage_tier" {
  type    = string
  default = "Standard"
}
