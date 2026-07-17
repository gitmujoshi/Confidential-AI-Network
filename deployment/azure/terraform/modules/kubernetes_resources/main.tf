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
    NODE_ENV                = var.environment
    APP_DOMAIN              = var.app_domain
    APP_VERSION             = var.release_version
    IMAGE_TAG               = var.image_tag
    KEYCLOAK_ADMIN_USERNAME = var.keycloak_admin_username
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

resource "kubernetes_secret" "keycloak_secret" {
  metadata {
    name      = "keycloak-secret"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    KEYCLOAK_ADMIN_USERNAME = base64encode(var.keycloak_admin_username)
    KEYCLOAK_ADMIN_PASSWORD = base64encode(var.keycloak_admin_password)
  }

  type = "Opaque"
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
        labels = { app = "backend" }
      }

      spec {
        container {
          name  = "backend"
          image = "${var.registry_url}/backend:${var.image_tag}"
          port { container_port = 5001 }

          env_from {
            secret_ref { name = kubernetes_secret.db_secret.metadata[0].name }
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
