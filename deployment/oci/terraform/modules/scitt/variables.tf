variable "enabled" {
  description = "Write SCITT CCF design ConfigMap (optional SCITT on OKE)"
  type        = bool
  default     = false
}

variable "environment" {
  description = "Environment name (dev|test|staging|prod)"
  type        = string
}

variable "app_namespace" {
  description = "Application namespace for SCITT runtime config"
  type        = string
  default     = "contract-management"
}

variable "scitt_ccf_url" {
  description = "Public or in-cluster SCITT CCF base URL placeholder"
  type        = string
  default     = ""
}

variable "scitt_namespace" {
  description = "Intended Kubernetes namespace for SCITT CCF workload"
  type        = string
  default     = ""
}

variable "deployment_mode" {
  description = "SCITT deployment target: oke | vm | none"
  type        = string
  default     = "oke"
}
