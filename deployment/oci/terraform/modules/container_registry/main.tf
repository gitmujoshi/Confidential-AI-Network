data "oci_objectstorage_namespace" "tenancy" {
  compartment_id = var.compartment_id
}

locals {
  # Region key for OCIR host (e.g. us-ashburn-1 → iad)
  region_key = lookup({
    "us-ashburn-1"   = "iad"
    "us-phoenix-1"   = "phx"
    "eu-frankfurt-1" = "fra"
    "uk-london-1"    = "lhr"
    "ap-tokyo-1"     = "nrt"
    "ap-singapore-1" = "sin"
    "ap-sydney-1"    = "syd"
    "ca-toronto-1"   = "yyz"
    "me-jeddah-1"    = "jed"
  }, var.region, replace(var.region, "-", ""))

  ocir_host     = "${local.region_key}.ocir.io"
  namespace     = data.oci_objectstorage_namespace.tenancy.namespace
  registry_base = "${local.ocir_host}/${local.namespace}/${var.repository_name}"
  is_immutable  = coalesce(var.repository_immutable, lower(var.environment) == "prod")
}

resource "oci_artifacts_container_repository" "backend" {
  compartment_id = var.compartment_id
  display_name   = "${var.repository_name}/backend"
  is_immutable   = local.is_immutable
  is_public      = false

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

resource "oci_artifacts_container_repository" "frontend" {
  compartment_id = var.compartment_id
  display_name   = "${var.repository_name}/frontend"
  is_immutable   = local.is_immutable
  is_public      = false

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}
