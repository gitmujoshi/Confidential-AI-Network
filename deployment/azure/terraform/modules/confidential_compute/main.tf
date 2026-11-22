# Confidential VM node pool for CCR training.
# Scheduling onto this pool is not a hardware attestation. The training Job
# reads /sys/kernel/config/tsm from the node and submits that report.

resource "azurerm_kubernetes_cluster_node_pool" "confidential" {
  count = var.enabled ? 1 : 0

  name                  = var.node_pool_name
  kubernetes_cluster_id = var.kubernetes_cluster_id
  vm_size               = var.vm_size
  node_count            = var.node_count
  vnet_subnet_id        = var.subnet_id
  mode                  = "User"
  os_disk_size_gb       = var.os_disk_size_gb
  tags                  = var.project_tags

  node_labels = {
    "can.azure/pool" = "confidential"
  }

  node_taints = [
    "can.azure/confidential=true:NoSchedule",
  ]
}

resource "kubernetes_service_account" "training_job" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "training-job"
    namespace = var.kubernetes_namespace
    annotations = var.training_workload_client_id != "" ? {
      "azure.workload.identity/client-id" = var.training_workload_client_id
    } : {}
    labels = {
      "azure.workload.identity/use" = "true"
      "cms-role"                    = "trainer"
    }
  }
}

resource "kubernetes_config_map" "ccr_pool" {
  count = var.enabled ? 1 : 0

  metadata {
    name      = "azure-ccr-pool"
    namespace = var.kubernetes_namespace
    labels = {
      "app.kubernetes.io/part-of" = "confidential-ai-network"
      "cms-component"             = "ccr"
    }
  }

  data = {
    AZURE_CCR_NODE_POOL   = var.node_pool_name
    AZURE_CCR_VM_SIZE     = var.vm_size
    AZURE_CCR_NODE_LABEL  = "can.azure/pool=confidential"
    AZURE_CCR_TOLERATION  = "can.azure/confidential=true:NoSchedule"
    AZURE_CCR_ATTESTATION = "confidential-vm-pool"
    note                  = "Nodes are confidential VMs. The training Job reads the SEV-SNP report from the node. A missing report interface fails the Job."
  }
}
