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
    NODE_ENV                    = var.environment
    APP_DOMAIN                  = var.app_domain
    ETHEREUM_NETWORK            = var.ethereum_network
    INFURA_PROJECT_ID           = var.infura_project_id
    KEYCLOAK_ADMIN_USERNAME     = var.keycloak_admin_username
    KEYCLOAK_ADMIN_PASSWORD     = var.keycloak_admin_password
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

# Secret for Keycloak configuration
resource "kubernetes_secret" "keycloak_secret" {
  metadata {
    name      = "keycloak-secret"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }
  
  data = {
    KEYCLOAK_ADMIN_USERNAME = base64encode(var.keycloak_admin_username)
    KEYCLOAK_ADMIN_PASSWORD = base64encode(var.keycloak_admin_password)
    KEYCLOAK_DB_PASSWORD    = base64encode(var.keycloak_db_password)
  }
  
  type = "Opaque"
}

# Persistent Volume Claim for Keycloak database
resource "kubernetes_persistent_volume_claim" "keycloak_db_pvc" {
  metadata {
    name      = "keycloak-db-pvc"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }
  
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "10Gi"
      }
    }
    storage_class_name = "oci-bv"
  }
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

# Deployment for Keycloak Database
resource "kubernetes_deployment" "keycloak_db" {
  metadata {
    name      = "keycloak-db"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }
  
  spec {
    replicas = 1
    
    selector {
      match_labels = {
        app = "keycloak-db"
      }
    }
    
    template {
      metadata {
        labels = {
          app = "keycloak-db"
        }
      }
      
      spec {
        container {
          image = "postgres:15"
          name  = "postgres"
          
          env {
            name  = "POSTGRES_DB"
            value = "keycloak"
          }
          
          env {
            name  = "POSTGRES_USER"
            value = "keycloak"
          }
          
          env {
            name = "POSTGRES_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.keycloak_secret.metadata[0].name
                key  = "KEYCLOAK_DB_PASSWORD"
              }
            }
          }
          
          port {
            container_port = 5432
          }
          
          volume_mount {
            name       = "postgres-storage"
            mount_path = "/var/lib/postgresql/data"
          }
        }
        
        volume {
          name = "postgres-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.keycloak_db_pvc.metadata[0].name
          }
        }
      }
    }
  }
}

# Service for Keycloak Database
resource "kubernetes_service" "keycloak_db_service" {
  metadata {
    name      = "keycloak-db-service"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }
  
  spec {
    selector = {
      app = "keycloak-db"
    }
    
    port {
      port        = 5432
      target_port = 5432
    }
    
    type = "ClusterIP"
  }
}

# Deployment for Keycloak
resource "kubernetes_deployment" "keycloak" {
  metadata {
    name      = "keycloak"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }
  
  spec {
    replicas = 1
    
    selector {
      match_labels = {
        app = "keycloak"
      }
    }
    
    template {
      metadata {
        labels = {
          app = "keycloak"
        }
      }
      
      spec {
        container {
          image = "quay.io/keycloak/keycloak:23.0"
          name  = "keycloak"
          
          env {
            name  = "KC_DB"
            value = "postgres"
          }
          
          env {
            name  = "KC_DB_URL"
            value = "jdbc:postgresql://keycloak-db-service:5432/keycloak"
          }
          
          env {
            name  = "KC_DB_USERNAME"
            value = "keycloak"
          }
          
          env {
            name = "KC_DB_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.keycloak_secret.metadata[0].name
                key  = "KEYCLOAK_DB_PASSWORD"
              }
            }
          }
          
          env {
            name = "KEYCLOAK_ADMIN"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.keycloak_secret.metadata[0].name
                key  = "KEYCLOAK_ADMIN_USERNAME"
              }
            }
          }
          
          env {
            name = "KEYCLOAK_ADMIN_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.keycloak_secret.metadata[0].name
                key  = "KEYCLOAK_ADMIN_PASSWORD"
              }
            }
          }
          
          env {
            name  = "KC_HOSTNAME_STRICT"
            value = "false"
          }
          
          env {
            name  = "KC_HOSTNAME_STRICT_HTTPS"
            value = "false"
          }
          
          env {
            name  = "KC_HTTP_ENABLED"
            value = "true"
          }
          
          env {
            name  = "KC_HEALTH_ENABLED"
            value = "true"
          }
          
          port {
            container_port = 8080
          }
          
          command = ["start-dev"]
        }
      }
    }
  }
  
  depends_on = [kubernetes_deployment.keycloak_db]
}

# Service for Keycloak
resource "kubernetes_service" "keycloak_service" {
  metadata {
    name      = "keycloak-service"
    namespace = kubernetes_namespace.app_namespace.metadata[0].name
  }
  
  spec {
    selector = {
      app = "keycloak"
    }
    
    port {
      port        = 8080
      target_port = 8080
    }
    
    type = "LoadBalancer"
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
          image = "${var.registry_url}/backend:latest"
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
          image = "${var.registry_url}/frontend:latest"
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
            name  = "REACT_APP_KEYCLOAK_URL"
            value = "http://keycloak-service:8080"
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