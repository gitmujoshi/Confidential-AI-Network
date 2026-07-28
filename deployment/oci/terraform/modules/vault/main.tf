# OCI Vault module — platform secrets & master encryption keys
#
# When enabled, creates a KMS Vault and a master CMK for secrets signing,
# SSE-KMS on Object Storage, and contract kmsConfigs references.
#
# Design: docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md §3.3
# Security: docs/production/OCI_SECURITY_ARCHITECTURE.md §8.3

terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.40.0"
    }
  }
}

locals {
  vault_display_name = var.vault_display_name != "" ? var.vault_display_name : "cms-${var.environment}-vault"
  key_display_name   = var.key_display_name != "" ? var.key_display_name : "cms-${var.environment}-master-key"
}

resource "oci_kms_vault" "this" {
  count = var.enabled ? 1 : 0

  compartment_id = var.compartment_id
  display_name   = local.vault_display_name
  vault_type     = var.vault_type
}

resource "oci_kms_key" "master" {
  count = var.enabled ? 1 : 0

  compartment_id      = var.compartment_id
  display_name        = local.key_display_name
  management_endpoint = oci_kms_vault.this[0].management_endpoint

  key_shape {
    algorithm = var.key_algorithm
    length    = var.key_length
  }

  depends_on = [oci_kms_vault.this]
}
