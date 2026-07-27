# Confidential AI Network - GCP Terraform (scaffold)

Identity-first scaffold for **Google Cloud**. Full VPC/GKE/Cloud SQL stack is
planned; this directory ships the **Identity Platform** module used by
`AUTH_PROVIDER=gcp-identity`.

**Identity rule:** GCP cloud = Identity Platform / Cloud Identity. **Keycloak** =
local docker-compose / Playwright only.

| Doc | Purpose |
|-----|---------|
| [GCP_FEATURES_AND_CONFIGURATION.md](../../../docs/deployment/GCP_FEATURES_AND_CONFIGURATION.md) | Feature + env catalog |
| [config.gcp.env.example](../../../config/examples/config.gcp.env.example) | Env template |
| [modules/identity](modules/identity/README.md) | Identity Platform module |

## Quick start (identity only)

```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID

cd deployment/gcp/terraform
cp terraform.tfvars.example terraform.tfvars
# Set project_id, app_domain, oauth_client_id / secret

terraform init
terraform plan
terraform apply
```

Create an OAuth 2.0 **Web** client in Console → APIs & Services → Credentials with
redirect URI `https://{app_domain}/login`, then put the client ID/secret in tfvars.

## App configuration

Wire outputs into the backend ConfigMap / Secret (or Secret Manager):

```text
AUTH_PROVIDER=gcp-identity
KEYCLOAK_ENABLED=false
GCP_PROJECT_ID=<project>
GCP_OIDC_ISSUER=https://securetoken.google.com/<project>
GCP_OIDC_AUDIENCE=<project>
GCP_OIDC_CLIENT_ID=<oauth client id>
GCP_OIDC_CLIENT_SECRET=<oauth client secret>
GCP_IDENTITY_REDIRECT_URI=https://<app_domain>/login
GCP_USE_IDENTITY_PLATFORM_TOKENS=true
```

## Planned modules (not yet in this scaffold)

- `networking` — VPC, subnets, Cloud NAT  
- `gke` — Autopilot or standard cluster  
- `database` — Cloud SQL PostgreSQL  
- `artifact_registry` — container images  
- `load_balancer` — HTTPS LB + Cloud Armor  
- `kubernetes_resources` — Deployments with IdP ConfigMap  

See the implementation backlog in `GCP_FEATURES_AND_CONFIGURATION.md`.
