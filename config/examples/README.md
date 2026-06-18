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
| `huggingface.env.example` | Hugging Face Hub dev integration (copy lines into `config.env`) |
| `siem.env.example` | SIEM provider configuration |

Runtime secrets belong in `secrets.env` at the repo root (never commit real secrets).
