variable "compartment_id" {
  description = "OCID of the compartment"
  type        = string
}

variable "subnet_ids" {
  description = "IDs of the subnets for the load balancer"
  type        = list(string)
}

variable "lb_name" {
  description = "Name of the load balancer"
  type        = string
}


} 