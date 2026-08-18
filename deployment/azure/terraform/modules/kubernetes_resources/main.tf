resource "kubernetes_namespace" "app" {
  metadata {
    name = "contract-management"
    labels = {
      app = "contract-management"
    }
  }
}

resource "kubernetes_config_map" "app_config" {
  metadata {
    name      = "app-config"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    NODE_ENV                          = var.environment
    APP_DOMAIN                        = var.app_domain
    APP_VERSION                       = var.release_version
    IMAGE_TAG                         = var.image_tag
    AUTH_PROVIDER                     = "entra"
    KEYCLOAK_ENABLED                  = "false"
    ENTRA_TENANT_ID                   = var.entra_tenant_id
    ENTRA_CLIENT_ID                   = var.entra_client_id
    ENTRA_API_CLIENT_ID               = var.entra_api_client_id
    ENTRA_AUTHORITY                   = var.entra_authority
    ENTRA_ISSUER                      = var.entra_issuer
    ENTRA_API_AUDIENCE                = var.entra_api_audience
    ENTRA_API_SCOPE                   = var.entra_api_scope
    ENTRA_JWKS_URL                    = var.entra_jwks_url
    ENTRA_ROLE_CLAIM                  = var.entra_role_claim
    ENTRA_REDIRECT_URI                = var.entra_redirect_uri != "" ? var.entra_redirect_uri : "https://${var.app_domain}/login"
    AZURE_KEY_VAULT_URI               = var.key_vault_uri
    AZURE_STORAGE_ACCOUNT             = var.storage_account_name
    AZURE_STORAGE_DATASETS_CONTAINER  = var.blob_datasets_container
    AZURE_STORAGE_OUTPUTS_CONTAINER   = var.blob_outputs_container
    AZURE_STORAGE_ARTIFACTS_CONTAINER = var.blob_artifacts_container
    AZURE_USE_WORKLOAD_IDENTITY       = var.workload_identity_enabled ? "true" : "false"
  }
}

resource "kubernetes_secret" "db_secret" {
  metadata {
    name      = "db-secret"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    DB_HOST     = base64encode(var.db_host)
    DB_PORT     = base64encode(var.db_port)
    DB_NAME     = base64encode(var.db_name)
    DB_USER     = base64encode(var.db_user)
    DB_PASSWORD = base64encode(var.db_password)
  }

  type = "Opaque"
}

resource "kubernetes_secret" "entra_identity_secret" {
  metadata {
    name      = "entra-identity-secret"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    ENTRA_CLIENT_SECRET = base64encode(var.entra_client_secret)
  }

  type = "Opaque"
}

resource "kubernetes_service_account" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.app.metadata[0].name
    annotations = var.workload_identity_enabled && var.backend_workload_client_id != "" ? {
      "azure.workload.identity/client-id" = var.backend_workload_client_id
    } : {}
    labels = var.workload_identity_enabled ? {
      "azure.workload.identity/use" = "true"
    } : {}
  }
}

resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.app.metadata[0].name
    labels    = { app = "backend" }
  }

  spec {
    replicas = 2

    selector {
      match_labels = { app = "backend" }
    }

    template {
      metadata {
        labels = merge(
          { app = "backend" },
          var.workload_identity_enabled ? { "azure.workload.identity/use" = "true" } : {}
        )
      }

      spec {
        service_account_name = kubernetes_service_account.backend.metadata[0].name

        container {
          name  = "backend"
          image = "${var.registry_url}/backend:${var.image_tag}"
          port { container_port = 5001 }

          env_from {
            config_map_ref { name = kubernetes_config_map.app_config.metadata[0].name }
          }

          env_from {
            secret_ref { name = kubernetes_secret.db_secret.metadata[0].name }
          }

          env_from {
            secret_ref { name = kubernetes_secret.entra_identity_secret.metadata[0].name }
          }

          liveness_probe {
            http_get {
              path = "/api/health"
              port = 5001
            }
            initial_delay_seconds = 30
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "backend" {
  metadata {
    name      = "backend-service"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  spec {
    selector = { app = "backend" }
    port {
      port        = 5001
      target_port = 5001
    }
    type = "ClusterIP"
  }
}

resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.app.metadata[0].name
    labels    = { app = "frontend" }
  }

  spec {
    replicas = 2

    selector {
      match_labels = { app = "frontend" }
    }

    template {
      metadata {
        labels = { app = "frontend" }
      }

      spec {
        container {
          name  = "frontend"
          image = "${var.registry_url}/frontend:${var.image_tag}"
          port { container_port = 3000 }

          env {
            name  = "REACT_APP_AUTH_PROVIDER"
            value = "entra"
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "frontend-service"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  spec {
    selector = { app = "frontend" }
    port {
      port        = 3000
      target_port = 3000
    }
    type = "LoadBalancer"
  }
}
