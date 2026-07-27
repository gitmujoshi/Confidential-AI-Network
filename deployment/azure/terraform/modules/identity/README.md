# Identity module — Microsoft Entra ID

Creates (optional flags):

| Resource | Purpose |
|----------|---------|
| `azuread_application` (API) | Resource app + app roles `TDC`/`TDP`/`CCRP`/`AppAdmin` + `access_as_user` |
| `azuread_application` (SPA) | Public SPA client for React OIDC redirect |
| Service principals + admin consent | SPA → API delegated grant |
| Optional API client secret | Client credentials / ops |

Wired into root `main.tf` → Kubernetes ConfigMap / Secret (`AUTH_PROVIDER=entra`).

## Usage

```hcl
module "identity" {
  source = "./modules/identity"

  tenant_id   = var.tenant_id
  environment = var.environment
  app_domain  = var.app_domain

  create_apps = true
}
```

Reuse existing app registrations:

```hcl
create_apps            = false
existing_client_id     = "…"
existing_api_client_id = "…"
existing_api_audience  = "api://cms-dev-api"
```

## Outputs → app env

| Output | Env var |
|--------|---------|
| `tenant_id` | `ENTRA_TENANT_ID` |
| `authority` | `ENTRA_AUTHORITY` |
| `frontend_client_id` | `ENTRA_CLIENT_ID` |
| `api_client_id` | `ENTRA_API_CLIENT_ID` |
| `api_audience` | `ENTRA_API_AUDIENCE` |
| `api_scope` | `ENTRA_API_SCOPE` |
| `api_client_secret` | `ENTRA_CLIENT_SECRET` (optional) |
| `redirect_uri` | `ENTRA_REDIRECT_URI` |

## Notes

- Assign users to app roles in Entra admin center (Enterprise applications → API app → Users and groups).
- SPA authorize uses public client; backend code exchange uses the same SPA `client_id` (no secret required).
- Requires Azure AD permissions: Application.ReadWrite.All (or Application Administrator) for the Terraform principal.
