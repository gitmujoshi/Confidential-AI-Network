variable "freeform_tags" {
  description = "Freeform tags (cms-* standard applied at root)"
  type        = map(string)
  default     = {}
}

variable "defined_tags" {
  description = "OCI defined tags when namespace is configured"
  type        = map(map(string))
  default     = {}
}
