# SPIRE module — Phase 1 platform on OKE
#
# Deploys SPIRE Server + Agent (+ optional OIDC Discovery) via Helm,
# creates namespaces / placeholder SAs, ClusterSPIFFEID CRDs, and an
# app ConfigMap with SPIFFE_* settings.
#
# Design: docs/deployment/OCI_SPIFFE_SPIRE_WIF.md §7 Phase 1
# Helm:   deployment/oci/helm/spire/

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.0"
    }
  }
}

locals {
  trust_domain = var.trust_domain != "" ? var.trust_domain : "can.${var.environment}.oci.${var.trust_domain_suffix}"
  oidc_issuer = (
    var.oidc_issuer != ""
    ? var.oidc_issuer
    : "http://spiffe-oidc-discovery-provider.spire.svc.cluster.local"
  )
  oidc_jwks_url = (
    var.oidc_jwks_url != ""
    ? var.oidc_jwks_url
    : "${local.oidc_issuer}/keys"
  )
  helm_values_path = var.values_file != "" ? var.values_file : "${path.module}/../../../helm/spire/values.yaml"
  manifests_dir    = var.manifests_dir != "" ? var.manifests_dir : "${path.module}/../../../helm/spire/manifests"

  spiffe_inventory = {
    backend = "spiffe://${local.trust_domain}/ns/contract-management/sa/backend"
    trainer = "spiffe://${local.trust_domain}/ns/cms-training/sa/training-job-sa"
    smoke   = "spiffe://${local.trust_domain}/ns/spire/sa/spire-smoke"
  }
}

# -----------------------------------------------------------------------------
# Namespaces
# -----------------------------------------------------------------------------

resource "kubernetes_namespace" "spire" {
  count = var.enabled ? 1 : 0

  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/part-of"   = "confidential-ai-network"
      "cms-component"               = "spire"
      "kubernetes.io/metadata.name" = var.namespace
    }
  }
}

resource "kubernetes_namespace" "cms_training" {
  count = var.enabled && var.create_training_namespace ? 1 : 0

  metadata {
    name = "cms-training"
    labels = {
      "app.kubernetes.io/part-of"   = "confidential-ai-network"
      "cms-component"               = "training"
      "kubernetes.io/metadata.name" = "cms-training"
    }
  }
}

# -----------------------------------------------------------------------------
# Placeholder ServiceAccounts (identity anchors for ClusterSPIFFEID selectors)
# -----------------------------------------------------------------------------

resource "kubernetes_service_account" "backend" {
  count = var.enabled && var.create_placeholder_service_accounts ? 1 : 0

  metadata {
    name      = "backend"
    namespace = var.app_namespace
    labels = {
      "cms-role" = "backend"
    }
  }
}

resource "kubernetes_service_account" "training_job" {
  count = var.enabled && var.create_placeholder_service_accounts && var.create_training_namespace ? 1 : 0

  metadata {
    name      = "training-job-sa"
    namespace = "cms-training"
    labels = {
      "cms-role" = "trainer"
    }
  }

  depends_on = [kubernetes_namespace.cms_training]
}

resource "kubernetes_service_account" "spire_smoke" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "spire-smoke"
    namespace = var.namespace
    labels = {
      "cms-role" = "smoke"
    }
  }

  depends_on = [kubernetes_namespace.spire]
}

# -----------------------------------------------------------------------------
# Helm release — SPIRE hardened chart
# -----------------------------------------------------------------------------

resource "helm_release" "spire" {
  count = var.enabled && var.install_helm_release ? 1 : 0

  name       = var.helm_release_name
  repository = var.helm_repository
  chart      = var.helm_chart
  version    = var.helm_chart_version != "" ? var.helm_chart_version : null
  namespace  = var.namespace

  create_namespace = false
  wait             = var.helm_wait
  timeout          = var.helm_timeout_seconds
  atomic           = var.helm_atomic

  values = [
    file(local.helm_values_path)
  ]

  set {
    name  = "global.spire.trustDomain"
    value = local.trust_domain
  }

  set {
    name  = "global.spire.clusterName"
    value = var.cluster_name
  }

  set {
    name  = "spiffe-oidc-discovery-provider.enabled"
    value = tostring(var.enable_oidc_discovery)
  }

  set {
    name  = "spire-server.persistence.storageClass"
    value = var.storage_class
  }

  depends_on = [kubernetes_namespace.spire]
}

# -----------------------------------------------------------------------------
# ClusterSPIFFEID CRDs (after chart installs CRDs + controller-manager)
# -----------------------------------------------------------------------------

resource "kubernetes_manifest" "clusterspiffeid_backend" {
  count = var.enabled && var.create_cluster_spiffe_ids && var.install_helm_release ? 1 : 0

  manifest = yamldecode(file("${local.manifests_dir}/clusterspiffeid-backend.yaml"))

  depends_on = [helm_release.spire]
}

resource "kubernetes_manifest" "clusterspiffeid_training" {
  count = var.enabled && var.create_cluster_spiffe_ids && var.install_helm_release ? 1 : 0

  manifest = yamldecode(file("${local.manifests_dir}/clusterspiffeid-training.yaml"))

  depends_on = [helm_release.spire]
}

resource "kubernetes_manifest" "clusterspiffeid_smoke" {
  count = var.enabled && var.create_cluster_spiffe_ids && var.install_helm_release ? 1 : 0

  manifest = yamldecode(file("${local.manifests_dir}/clusterspiffeid-smoke.yaml"))

  depends_on = [helm_release.spire]
}

# -----------------------------------------------------------------------------
# App ConfigMap — SPIFFE_* for backend / trainer (merge into app-config later)
# -----------------------------------------------------------------------------

resource "kubernetes_config_map" "spiffe_config" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "spiffe-config"
    namespace = var.app_namespace
    labels = {
      "app.kubernetes.io/part-of" = "confidential-ai-network"
      "cms-component"             = "spire"
    }
  }

  data = {
    SPIFFE_ENABLED            = "true"
    SPIFFE_TRUST_DOMAIN       = local.trust_domain
    SPIFFE_SOCKET_PATH        = var.socket_path
    SPIFFE_SERVER_ADDRESS     = "${var.helm_release_name}-server.${var.namespace}.svc:8081"
    SPIRE_OIDC_ISSUER         = local.oidc_issuer
    SPIRE_OIDC_JWKS_URL       = local.oidc_jwks_url
    OCI_WIF_ENABLED           = "false"
    OCI_OKE_WORKLOAD_IDENTITY = "true"
    CAN_REQUIRE_SPIFFE_MTLS   = tostring(var.can_require_spiffe_mtls)
    CAN_SPIFFE_PEER_ALLOWLIST = join(",", [
      local.spiffe_inventory.backend,
      local.spiffe_inventory.trainer,
    ])
    SPIFFE_ID_BACKEND = local.spiffe_inventory.backend
    SPIFFE_ID_TRAINER = local.spiffe_inventory.trainer
  }
}

# Inventory ConfigMap in spire namespace (ops reference)
resource "kubernetes_config_map" "spiffe_inventory" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "spiffe-id-inventory"
    namespace = var.namespace
    labels = {
      "cms-component" = "spire"
    }
  }

  data = {
    trust_domain = local.trust_domain
    backend      = local.spiffe_inventory.backend
    trainer      = local.spiffe_inventory.trainer
    smoke        = local.spiffe_inventory.smoke
    oidc_issuer  = local.oidc_issuer
    oidc_jwks    = local.oidc_jwks_url
    phase        = "1"
    design_doc   = "docs/deployment/OCI_SPIFFE_SPIRE_WIF.md"
  }

  depends_on = [kubernetes_namespace.spire]
}
