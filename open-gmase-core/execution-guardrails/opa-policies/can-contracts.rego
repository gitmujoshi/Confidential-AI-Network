# CAN contract-aware tool guardrails (demo pack)
#
# Package: open_gmase.can_contracts
# Denies raw dataset export unless the contract metadata allows it.
# Also gates TDC inference deploy/predict (CAN ↔ Open-GMASE demo slice).
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

deny[msg] {
  input.tool_name == "run_inference"
  input.metadata.inference_status != "DEPLOYED"
  msg := sprintf("Inference denied: model inference status is %v (need DEPLOYED)", [input.metadata.inference_status])
}

deny[msg] {
  input.tool_name == "run_inference"
  not input.metadata.contract_status == "SIGNED"
  not input.metadata.contract_status == "EXECUTING"
  not input.metadata.contract_status == "COMPLETED"
  msg := sprintf("Inference denied: contract status is %v (need SIGNED/EXECUTING/COMPLETED)", [input.metadata.contract_status])
}

deny[msg] {
  input.tool_name == "deploy_inference"
  not input.metadata.contract_status == "SIGNED"
  not input.metadata.contract_status == "EXECUTING"
  not input.metadata.contract_status == "COMPLETED"
  msg := sprintf("Deploy denied: contract status is %v (need SIGNED/EXECUTING/COMPLETED)", [input.metadata.contract_status])
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
  input.tool_name == "run_inference"
  input.metadata.inference_status == "DEPLOYED"
}

allow {
  count(deny) == 0
  input.tool_name == "deploy_inference"
}

allow {
  count(deny) == 0
  input.metadata.dry_run == true
}
