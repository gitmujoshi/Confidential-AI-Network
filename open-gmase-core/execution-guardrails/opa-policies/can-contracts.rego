# CAN contract-aware tool guardrails (demo pack)
#
# Package: open_gmase.can_contracts
# Denies raw dataset export unless the contract metadata allows it.
# License: Apache-2.0

package open_gmase.can_contracts

default allow = false

deny[msg] {
  input.tool_name == "export_raw_dataset"
  not input.metadata.contract_allows_raw_export
  msg := "Raw dataset export denied: contract does not allow bulk export"
}

deny[msg] {
  input.tool_name == "start_training"
  input.metadata.contract_status != "SIGNED"
  msg := sprintf("Training start denied: contract status is %v (need SIGNED)", [input.metadata.contract_status])
}

deny[msg] {
  input.tool_name == "start_training"
  input.metadata.dataset_classification == "restricted"
  input.metadata.training_region == "public-internet"
  msg := "Restricted datasets cannot train with public-internet egress"
}

allow {
  count(deny) == 0
  input.tool_name == "start_training"
  input.metadata.contract_status == "SIGNED"
}

allow {
  count(deny) == 0
  input.tool_name == "export_raw_dataset"
  input.metadata.contract_allows_raw_export == true
}

allow {
  count(deny) == 0
  input.metadata.dry_run == true
}
