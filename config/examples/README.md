# Configuration examples

Copy these to the repository root (or appropriate paths) for local development:

| Example file | Typical target |
|--------------|----------------|
| `config.env.example` | `config.env` |
| `config.local.env` | Reference for local overrides |
| `config.production.env` | Reference for production values |
| `env.example` | `.env` |
| `env.scitt-ccf.example` | `.env.scitt-ccf` |
| `deployment-examples.env` | Reference for deployment variables |
| `config.azure.env.example` | Azure target env (Entra, KV, Blob, train) — [AZURE_FEATURES_AND_CONFIGURATION.md](../../docs/deployment/AZURE_FEATURES_AND_CONFIGURATION.md) |
| `config.oci.env.example` | OCI target env (Id Domain, Vault, Object Storage) — [OCI_FEATURES_AND_CONFIGURATION.md](../../docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md) |
| `config.aws.env.example` | AWS target env (Cognito, KMS, S3) — [AWS_FEATURES_AND_CONFIGURATION.md](../../docs/deployment/AWS_FEATURES_AND_CONFIGURATION.md) |
| `config.gcp.env.example` | GCP target env (Identity Platform, KMS, GCS) — [GCP_FEATURES_AND_CONFIGURATION.md](../../docs/deployment/GCP_FEATURES_AND_CONFIGURATION.md) |
| `huggingface.env.example` | Hugging Face Hub dev integration (copy lines into `config.env`) |
| `siem.env.example` | SIEM provider configuration |

Runtime secrets belong in `secrets.env` at the repo root (never commit real secrets).
