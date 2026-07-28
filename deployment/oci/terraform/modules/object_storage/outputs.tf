output "enabled" {
  value = var.enabled
}

output "namespace" {
  description = "Object Storage namespace for this tenancy"
  value       = var.enabled ? local.namespace : null
}

output "bucket_names" {
  description = "Logical bucket names keyed by purpose"
  value = var.enabled ? {
    datasets         = local.bucket_names.datasets
    training_outputs = local.bucket_names.training_outputs
    artifacts        = local.bucket_names.artifacts
  } : {}
}

output "bucket_ids" {
  description = "Bucket resource ids keyed by purpose"
  value = var.enabled ? {
    datasets         = oci_objectstorage_bucket.datasets[0].id
    training_outputs = oci_objectstorage_bucket.training_outputs[0].id
    artifacts        = oci_objectstorage_bucket.artifacts[0].id
  } : {}
}
