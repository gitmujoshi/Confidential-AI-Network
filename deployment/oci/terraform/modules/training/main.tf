# Training module — OKE Job training scaffold (Phase 3)
#
# Creates cms-training namespace, training-job-sa, ConfigMap with Job template,
# and optional kubernetes_manifest for smoke testing.
#
# Design: docs/deployment/OCI_READINESS.md Phase 3
# Template: deployment/oci/helm/training/manifests/training-job-template.yaml

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
  }
}

locals {
  job_template_path = var.job_template_path != "" ? var.job_template_path : "${path.module}/../../../helm/training/manifests/training-job-template.yaml"
  job_template_yaml = file(local.job_template_path)

  trainer_image = var.trainer_image != "" ? var.trainer_image : "{region}.ocir.io/{namespace}/local-trainer:latest"

  object_storage_env = {
    OCI_OBJECT_STORAGE_NAMESPACE        = var.object_storage_namespace
    OCI_OBJECT_STORAGE_BUCKET_DATASETS  = var.bucket_datasets
    OCI_OBJECT_STORAGE_BUCKET_OUTPUTS   = var.bucket_training_outputs
    OCI_OBJECT_STORAGE_BUCKET_ARTIFACTS = var.bucket_artifacts
  }

  smoke_job_yaml = replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(local.job_template_yaml, "{{TRAINER_IMAGE}}", local.trainer_image),
                "{{CONTRACT_ID}}", var.smoke_contract_id
              ),
              "{{OCI_OBJECT_STORAGE_NAMESPACE}}", var.object_storage_namespace
            ),
            "{{OCI_OBJECT_STORAGE_BUCKET_DATASETS}}", var.bucket_datasets
          ),
          "{{OCI_OBJECT_STORAGE_BUCKET_OUTPUTS}}", var.bucket_training_outputs
        ),
        "{{OCI_OBJECT_STORAGE_BUCKET_ARTIFACTS}}", var.bucket_artifacts
      ),
      "{{DATASET_OBJECT_KEY}}", var.smoke_dataset_object_key
    ),
    "{{OUTPUT_OBJECT_PREFIX}}", var.smoke_output_object_prefix
  )
}

resource "kubernetes_namespace" "cms_training" {
  count = var.enabled ? 1 : 0

  metadata {
    name = var.training_namespace
    labels = {
      "app.kubernetes.io/part-of"   = "confidential-ai-network"
      "cms-component"               = "training"
      "kubernetes.io/metadata.name" = var.training_namespace
    }
  }
}

resource "kubernetes_service_account" "training_job" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "training-job-sa"
    namespace = var.training_namespace
    labels = {
      "cms-role" = "trainer"
    }
  }

  depends_on = [kubernetes_namespace.cms_training]
}

resource "kubernetes_config_map" "training_job_template" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "training-job-template"
    namespace = var.training_namespace
    labels = {
      "app.kubernetes.io/part-of" = "confidential-ai-network"
      "cms-component"             = "training"
    }
  }

  data = {
    TRAINING_EXECUTION_MODE = "oci"
    OCI_TRAINING_COMPUTE    = "oke-job"
    TRAINER_IMAGE           = local.trainer_image
    JOB_TEMPLATE_YAML       = local.job_template_yaml
    design_doc              = "docs/deployment/OCI_READINESS.md"
    phase                   = "3"
  }

  depends_on = [kubernetes_namespace.cms_training]
}

resource "kubernetes_config_map" "training_object_storage" {
  count = var.enabled && var.write_object_storage_config ? 1 : 0

  metadata {
    name      = "training-object-storage"
    namespace = var.training_namespace
    labels = {
      "cms-component" = "training"
    }
  }

  data = merge(
    local.object_storage_env,
    {
      DATASET_STORAGE_BACKEND = "oci-object"
    }
  )

  depends_on = [kubernetes_namespace.cms_training]
}

# Optional smoke-test manifest — dev validation only
resource "kubernetes_manifest" "training_job_smoke" {
  count = var.enabled && var.apply_job_manifest ? 1 : 0

  manifest = yamldecode(local.smoke_job_yaml)

  depends_on = [
    kubernetes_namespace.cms_training,
    kubernetes_service_account.training_job,
  ]
}
