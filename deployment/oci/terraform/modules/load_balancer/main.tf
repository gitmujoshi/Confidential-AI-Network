# Load Balancer
resource "oci_load_balancer" "load_balancer" {
  compartment_id = var.compartment_id
  display_name   = var.lb_name
  shape          = "flexible"
  subnet_ids     = var.subnet_ids
  
  shape_details {
    minimum_bandwidth_in_mbps = 10
    maximum_bandwidth_in_mbps = 100
  }
  
  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

# Backend Set for Frontend (Port 3000)
resource "oci_load_balancer_backend_set" "frontend_backend_set" {
  load_balancer_id = oci_load_balancer.load_balancer.id
  name             = "frontend-backend-set"
  policy           = "ROUND_ROBIN"
  
  health_checker {
    protocol            = "HTTP"
    port                = 3000
    url_path            = "/"
    interval_ms         = 10000
    timeout_in_millis   = 3000
    retries             = 3
    return_code         = 200
  }
}

# Backend Set for Backend API (Port 5000)
resource "oci_load_balancer_backend_set" "backend_api_backend_set" {
  load_balancer_id = oci_load_balancer.load_balancer.id
  name             = "backend-api-backend-set"
  policy           = "ROUND_ROBIN"
  
  health_checker {
    protocol            = "HTTP"
    port                = 5000
    url_path            = "/health"
    interval_ms         = 10000
    timeout_in_millis   = 3000
    retries             = 3
    return_code         = 200
  }
}

# Backend Set for Keycloak (Port 8080)
resource "oci_load_balancer_backend_set" "***REMOVED-KEYCLOAK_DB_PASSWORD***_backend_set" {
  load_balancer_id = oci_load_balancer.load_balancer.id
  name             = "***REMOVED-KEYCLOAK_DB_PASSWORD***-backend-set"
  policy           = "ROUND_ROBIN"
  
  health_checker {
    protocol            = "HTTP"
    port                = 8080
    url_path            = "/health"
    interval_ms         = 10000
    timeout_in_millis   = 3000
    retries             = 3
    return_code         = 200
  }
}

# Listener for Frontend (Port 3000)
resource "oci_load_balancer_listener" "frontend_listener" {
  load_balancer_id         = oci_load_balancer.load_balancer.id
  name                     = "frontend-listener"
  default_backend_set_name = oci_load_balancer_backend_set.frontend_backend_set.name
  port                     = 3000
  protocol                 = "HTTP"
}

# Listener for Backend API (Port 5000)
resource "oci_load_balancer_listener" "backend_api_listener" {
  load_balancer_id         = oci_load_balancer.load_balancer.id
  name                     = "backend-api-listener"
  default_backend_set_name = oci_load_balancer_backend_set.backend_api_backend_set.name
  port                     = 5000
  protocol                 = "HTTP"
}

# Listener for Keycloak (Port 8080)
resource "oci_load_balancer_listener" "***REMOVED-KEYCLOAK_DB_PASSWORD***_listener" {
  load_balancer_id         = oci_load_balancer.load_balancer.id
  name                     = "***REMOVED-KEYCLOAK_DB_PASSWORD***-listener"
  default_backend_set_name = oci_load_balancer_backend_set.***REMOVED-KEYCLOAK_DB_PASSWORD***_backend_set.name
  port                     = 8080
  protocol                 = "HTTP"
} 