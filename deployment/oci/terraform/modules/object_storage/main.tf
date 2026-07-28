# Object Storage module — datasets, training outputs, artifacts buckets
#
# Replaces local disk uploads with OCI Object Storage for encrypted datasets,
# job outputs, and registered model artifacts.
#
# Design: docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md §3.8
# IAM:    docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md §12

terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.40.0"
    }
  }
}

data "oci_objectstorage_namespace" "this" {
  count = var.enabled && var.namespace == "" ? 1 : 0

  compartment_id = var.compartment_id
}

locals {
  namespace = var.namespace != "" ? var.namespace : try(data.oci_objectstorage_namespace.this[0].namespace, "")

  bucket_names = {
    datasets         = "cms-${var.environment}-datasets"
    training_outputs = "cms-${var.environment}-training-outputs"
    artifacts        = "cms-${var.environment}-artifacts"
  }
}

resource "oci_objectstorage_bucket" "datasets" {
  count = var.enabled ? 1 : 0

  compartment_id = var.compartment_id
  namespace      = local.namespace
  name           = local.bucket_names.datasets
  access_type    = var.access_type
  storage_tier   = var.storage_tier
}

resource "oci_objectstorage_bucket" "training_outputs" {
  count = var.enabled ? 1 : 0

  compartment_id = var.compartment_id
  namespace      = local.namespace
  name           = local.bucket_names.training_outputs
  access_type    = var.access_type
  storage_tier   = var.storage_tier
}

resource "oci_objectstorage_bucket" "artifacts" {
  count = var.enabled ? 1 : 0

  compartment_id = var.compartment_id
  namespace      = local.namespace
  name           = local.bucket_names.artifacts
  access_type    = var.access_type
  storage_tier   = var.storage_tier
}
