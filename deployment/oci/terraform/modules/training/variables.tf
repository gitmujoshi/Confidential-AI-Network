variable "enabled" {
  description = "Create OKE training namespace, SA, and Job template ConfigMap"
  type        = bool
  default     = false
}

variable "environment" {
  description = "Environment name (dev|test|staging|prod)"
  type        = string
}

variable "training_namespace" {
  description = "Kubernetes namespace for training jobs"
  type        = string
  default     = "cms-training"
}

variable "trainer_image" {
  description = "Default OCIR trainer image (placeholders {region}/{namespace} if unset)"
  type        = string
  default     = ""
}

variable "job_template_path" {
  description = "Path to Job YAML template (default helm/training/manifests/training-job-template.yaml)"
  type        = string
  default     = ""
}

variable "object_storage_namespace" {
  description = "From module.object_storage.namespace"
  type        = string
  default     = ""
}

variable "bucket_datasets" {
  description = "Datasets bucket name"
  type        = string
  default     = ""
}

variable "bucket_training_outputs" {
  description = "Training outputs bucket name"
  type        = string
  default     = ""
}

variable "bucket_artifacts" {
  description = "Artifacts bucket name"
  type        = string
  default     = ""
}

variable "write_object_storage_config" {
  description = "Write training-object-storage ConfigMap with bucket env keys"
  type        = bool
  default     = true
}

variable "apply_job_manifest" {
  description = "Apply smoke Job manifest (dev only; uses placeholder contract id)"
  type        = bool
  default     = false
}

variable "smoke_contract_id" {
  description = "Contract id for smoke Job when apply_job_manifest=true"
  type        = string
  default     = "smoke-contract"
}

variable "smoke_dataset_object_key" {
  description = "Dataset object key for smoke Job"
  type        = string
  default     = "smoke/dataset.bin"
}

variable "smoke_output_object_prefix" {
  description = "Output prefix for smoke Job"
  type        = string
  default     = "smoke/outputs/"
}
