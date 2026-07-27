# Kubernetes Namespace
resource "kubernetes_namespace" "app_namespace" {
  metadata {
    name = "contract-management"

    labels = {
      app = "contract-management"
    }
  }
}

# ConfigMap for application configuration
resource "kubernetes_config_map" "app_config" {
  metadata {
    name      = "app-config"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }

  data = {
    NODE_ENV                   = var.environment
    APP_DOMAIN                 = var.app_domain
    APP_VERSION                = var.release_version
    IMAGE_TAG                  = var.image_tag
    ETHEREUM_NETWORK           = var.ethereum_network
    INFURA_PROJECT_ID          = var.infura_project_id
    AUTH_PROVIDER              = "oci-iam"
    KEYCLOAK_ENABLED           = "false"
    OCI_IDENTITY_DOMAIN_URL    = var.oci_identity_domain_url
    OCI_IDENTITY_CLIENT_ID     = var.oci_identity_client_id
    OCI_IDENTITY_API_CLIENT_ID = var.oci_identity_api_client_id
    OCI_IDENTITY_ISSUER        = var.oci_identity_issuer
    OCI_IDENTITY_AUDIENCE      = var.oci_identity_audience
    OCI_IDENTITY_JWKS_URL      = var.oci_identity_jwks_url
    OCI_IDENTITY_ROLE_CLAIM    = var.oci_identity_role_claim
    OCI_IDENTITY_REDIRECT_URI  = var.oci_identity_redirect_uri != "" ? var.oci_identity_redirect_uri : "https://${var.app_domain}/login"
    OCI_CLOUD_GATE_ENABLED     = tostring(var.oci_cloud_gate_enabled)
  }
}

# Secret for database credentials
resource "kubernetes_secret" "db_secret" {
  metadata {
    name      = "db-secret"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
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

# Secret for OCI IAM confidential client (optional)
resource "kubernetes_secret" "oci_identity_secret" {
  metadata {
    name      = "oci-identity-secret"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }

  data = {
    OCI_IDENTITY_CLIENT_SECRET = base64encode(var.oci_identity_client_secret)
  }

  type = "Opaque"
}

# Persistent Volume Claim for Redis
resource "kubernetes_persistent_volume_claim" "redis_pvc" {
  metadata {
    name      = "redis-pvc"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }

  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "5Gi"
      }
    }
    storage_class_name = "oci-bv"
  }
}

# Deployment for Redis
resource "kubernetes_deployment" "redis" {
  metadata {
    name      = "redis"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "redis"
      }
    }

    template {
      metadata {
        labels = {
          app = "redis"
        }
      }

      spec {
        container {
          image = "redis:7-alpine"
          name  = "redis"

          port {
            container_port = 6379
          }

          volume_mount {
            name       = "redis-storage"
            mount_path = "/data"
          }
        }

        volume {
          name = "redis-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.redis_pvc.metadata[0].name
          }
        }
      }
    }
  }
}

# Service for Redis
resource "kubernetes_service" "redis_service" {
  metadata {
    name      = "redis-service"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }

  spec {
    selector = {
      app = "redis"
    }

    port {
      port        = 6379
      target_port = 6379
    }

    type = "ClusterIP"
  }
}

# Deployment for Backend API
resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "backend"
      }
    }

    template {
      metadata {
        labels = {
          app = "backend"
        }
      }

      spec {
        container {
          image = "${var.registry_url}/backend:${var.image_tag}"
          name  = "backend"

          env_from {
            config_map_ref {
              name = kubernetes_config_map.app_config.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.db_secret.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.oci_identity_secret.metadata[0].name
            }
          }

          env {
            name  = "REDIS_HOST"
            value = "redis-service"
          }

          env {
            name  = "REDIS_PORT"
            value = "6379"
          }

          port {
            container_port = 5000
          }

          resources {
            requests = {
              memory = "512Mi"
              cpu    = "250m"
            }
            limits = {
              memory = "1Gi"
              cpu    = "500m"
            }
          }
        }
      }
    }
  }
}

# Service for Backend API
resource "kubernetes_service" "backend_service" {
  metadata {
    name      = "backend-service"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }

  spec {
    selector = {
      app = "backend"
    }

    port {
      port        = 5000
      target_port = 5000
    }

    type = "LoadBalancer"
  }
}

# Deployment for Frontend
resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "frontend"
      }
    }

    template {
      metadata {
        labels = {
          app = "frontend"
        }
      }

      spec {
        container {
          image = "${var.registry_url}/frontend:${var.image_tag}"
          name  = "frontend"

          env_from {
            config_map_ref {
              name = kubernetes_config_map.app_config.metadata[0].name
            }
          }

          env {
            name  = "REACT_APP_API_URL"
            value = "http://backend-service:5000"
          }

          env {
            name  = "REACT_APP_AUTH_PROVIDER"
            value = "oci-iam"
          }

          port {
            container_port = 3000
          }

          resources {
            requests = {
              memory = "256Mi"
              cpu    = "100m"
            }
            limits = {
              memory = "512Mi"
              cpu    = "250m"
            }
          }
        }
      }
    }
  }
}

# Service for Frontend
resource "kubernetes_service" "frontend_service" {
  metadata {
    name      = "frontend-service"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }

  spec {
    selector = {
      app = "frontend"
    }

    port {
      port        = 3000
      target_port = 3000
    }

    type = "LoadBalancer"
  }
} 