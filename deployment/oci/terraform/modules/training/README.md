# Training module — OKE Job scaffold (Phase 3)

Scaffolds **physical training on OCI** via Kubernetes Job resources instead of
local-docker / backend pod Docker socket.

| Resource | Purpose |
|----------|---------|
| `kubernetes_namespace` | `cms-training` |
| `kubernetes_service_account` | `training-job-sa` (SPIFFE / WIF identity) |
| `kubernetes_config_map` | Embedded Job template YAML + trainer image |
| `kubernetes_manifest` (optional) | Smoke Job for dev validation |

Design: [OCI_READINESS.md](../../../../docs/deployment/OCI_READINESS.md) Phase 3  
Template: [helm/training](../../../helm/training/)  
Features: [OCI_FEATURES_AND_CONFIGURATION.md](../../../../docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md) §3.7

## Usage

```hcl
module "training" {
  source = "./modules/training"

  enabled     = true
  environment = var.environment

  trainer_image = "${var.region}.ocir.io/${var.ocir_namespace}/local-trainer:${var.image_tag}"

  object_storage_namespace  = module.object_storage.namespace
  bucket_datasets           = module.object_storage.bucket_names["datasets"]
  bucket_training_outputs   = module.object_storage.bucket_names["training_outputs"]
  bucket_artifacts          = module.object_storage.bucket_names["artifacts"]
}
```

Root stack: `enable_training = false` (opt-in).

## Phase 3 checklist (from OCI_READINESS)

- [ ] Trainer as K8s Job; OCIR image
- [ ] CAN executor triggers OKE job instead of `localDockerTrainingRunner`
- [ ] GPU node pool (optional)
- [ ] Object Storage inputs/outputs wired (`modules/object_storage`)
- [ ] SPIFFE SA + optional WIF (`modules/spire`, `modules/wif`)

## ConfigMaps

| Name | Keys |
|------|------|
| `training-job-template` | `JOB_TEMPLATE_YAML`, `TRAINER_IMAGE`, `TRAINING_EXECUTION_MODE` |
| `training-object-storage` | `OCI_OBJECT_STORAGE_*`, `DATASET_STORAGE_BACKEND` |

## Smoke test

```hcl
apply_job_manifest = true
smoke_contract_id  = "dev-smoke-001"
```

Patch remaining `{{PLACEHOLDER}}` tokens in the template before prod use.

## Notes

- Namespace may already exist if `modules/spire` created it — set `enabled=false` on one module or import.
- Job manifest uses `kubernetes_manifest` provider; requires CRD-free batch/v1 Job only.
- Backend CAN executor should render template and create Jobs dynamically in production.
