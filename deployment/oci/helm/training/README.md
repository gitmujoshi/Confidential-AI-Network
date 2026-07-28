# Training Helm overlay — OKE Job template

Kubernetes **Job** template for physical training on OCI (Phase 3). Placeholders
are substituted by the backend CAN executor or CI before `kubectl apply`.

Design: [OCI_READINESS.md](../../../../docs/deployment/OCI_READINESS.md) Phase 3  
Features: [OCI_FEATURES_AND_CONFIGURATION.md](../../../../docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md) §3.7

## Placeholders

| Token | Source |
|-------|--------|
| `{{CONTRACT_ID}}` | Contract UUID |
| `{{TRAINER_IMAGE}}` | OCIR image, e.g. `{region}.ocir.io/{ns}/local-trainer:tag` |
| `{{OCI_OBJECT_STORAGE_*}}` | From `modules/object_storage` outputs |
| `{{DATASET_OBJECT_KEY}}` | Object key in datasets bucket |
| `{{OUTPUT_OBJECT_PREFIX}}` | Prefix in training-outputs bucket |

## Files

| Path | Purpose |
|------|---------|
| `manifests/training-job-template.yaml` | batch/v1 Job skeleton |
| Terraform `modules/training` | Namespace, SA, ConfigMap with embedded template |

## Usage

1. Enable `modules/training` in the root Terraform stack.
2. Wire Object Storage bucket env vars from `module.object_storage`.
3. Backend / CAN executor renders placeholders and creates Job (or set `apply_job_manifest=true` for smoke tests).

## SPIFFE / WIF

Mount SPIRE agent socket (see template `volumeMounts`). Trainer SA should match
`training-job-sa` in `cms-training` and SPIFFE ID from `modules/spire`.

## GPU (optional)

Add `nodeSelector` / `tolerations` for GPU node pool when available.
