# OCI Database with PostgreSQL (compatible with Sequelize dialect: postgres).
# Replaces Autonomous Database (Oracle), which the app cannot use.

resource "oci_core_network_security_group" "postgres" {
  compartment_id = var.compartment_id
  vcn_id         = var.vcn_id
  display_name   = "${var.db_name}-postgres-nsg"

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags
}

resource "oci_core_network_security_group_security_rule" "postgres_ingress" {
  network_security_group_id = oci_core_network_security_group.postgres.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = var.vcn_cidr
  source_type               = "CIDR_BLOCK"
  description               = "PostgreSQL from VCN (OKE nodes)"

  tcp_options {
    destination_port_range {
      min = 5432
      max = 5432
    }
  }
}

resource "oci_core_network_security_group_security_rule" "postgres_egress" {
  network_security_group_id = oci_core_network_security_group.postgres.id
  direction                 = "EGRESS"
  protocol                  = "all"
  destination               = "0.0.0.0/0"
  destination_type          = "CIDR_BLOCK"
  description               = "Allow all egress"
}

resource "oci_psql_db_system" "postgres" {
  compartment_id              = var.compartment_id
  display_name                = "${var.db_name}-postgres"
  db_version                  = var.db_version
  shape                       = var.db_shape
  instance_count              = var.instance_count
  instance_ocpu_count         = var.instance_ocpu_count
  instance_memory_size_in_gbs = var.instance_memory_size_in_gbs

  network_details {
    subnet_id = var.subnet_id
    nsg_ids   = [oci_core_network_security_group.postgres.id]
  }

  storage_details {
    is_regionally_durable = var.storage_is_regionally_durable
    system_type           = var.storage_system_type
    availability_domain   = var.storage_is_regionally_durable ? null : var.availability_domain
    iops                  = var.storage_iops
  }

  credentials {
    username = var.db_user
    password_details {
      password_type = "PLAIN_TEXT"
      password      = var.db_password
    }
  }

  freeform_tags = var.freeform_tags
  defined_tags  = var.defined_tags

  # OCI may take 10–20+ minutes to create the system
  timeouts {
    create = "90m"
    update = "90m"
    delete = "60m"
  }
}
