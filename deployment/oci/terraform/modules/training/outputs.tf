output "enabled" {
  value = var.enabled
}

output "training_namespace" {
  value = var.enabled ? var.training_namespace : null
}

output "service_account_name" {
  value = var.enabled ? "training-job-sa" : null
}

output "job_template_config_map_name" {
  value = var.enabled ? kubernetes_config_map.training_job_template[0].metadata[0].name : null
}

output "object_storage_config_map_name" {
  value = var.enabled && var.write_object_storage_config ? kubernetes_config_map.training_object_storage[0].metadata[0].name : null
}

output "trainer_image" {
  value = var.enabled ? local.trainer_image : null
}

output "job_template_path" {
  value = local.job_template_path
}
