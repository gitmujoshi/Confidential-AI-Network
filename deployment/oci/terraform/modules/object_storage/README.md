# Object Storage module — datasets / outputs / artifacts

Creates three **NoPublicAccess** buckets per environment to replace local disk
uploads with OCI Object Storage.

| Bucket | Purpose |
|--------|---------|
| `cms-{env}-datasets` | Encrypted dataset ciphertext (TDP upload) |
| `cms-{env}-training-outputs` | OKE Job / trainer output objects |
| `cms-{env}-artifacts` | Registered model artifacts (SSE-KMS) |

Design: [OCI_FEATURES_AND_CONFIGURATION.md](../../../../docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md) §3.8  
IAM buckets: [OCI_IAM_AND_EDGE_CONFIG.md](../../../../docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md) §12

## Usage

```hcl
module "object_storage" {
  source = "./modules/object_storage"

  enabled        = true
  environment    = var.environment
  compartment_id = module.networking.data_compartment_id
  # namespace = ""  # auto-detect from tenancy
}
```

Root stack: `enable_object_storage = false` (opt-in).

## Outputs → runtime env

| Output key | Env var |
|------------|---------|
| `namespace` | `OCI_OBJECT_STORAGE_NAMESPACE` |
| `bucket_names.datasets` | `OCI_OBJECT_STORAGE_BUCKET_DATASETS` |
| `bucket_names.training_outputs` | `OCI_OBJECT_STORAGE_BUCKET_OUTPUTS` |
| `bucket_names.artifacts` | `OCI_OBJECT_STORAGE_BUCKET_ARTIFACTS` |

Also set `DATASET_STORAGE_BACKEND=oci-object` on the backend.

## Follow-on (not in this module)

- **SSE-KMS** — attach Vault CMK from `modules/vault` to each bucket
- **Pre-signed uploads** — API Gateway or backend-initiated PAR URLs
- **Lifecycle rules** — transition old training outputs to Archive tier
- **Replication** — cross-region for prod DR

## Notes

- Buckets are minimal scaffolding; encryption and IAM policies are applied separately.
- Training module reads bucket names from ConfigMap keys wired by the root stack.
