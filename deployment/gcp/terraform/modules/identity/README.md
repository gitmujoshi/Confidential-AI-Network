# Identity module — Google Cloud Identity Platform

Enables Identity Toolkit / Identity Platform on a GCP project and wires OAuth
client IDs for the Confidential AI Network SPA (`AUTH_PROVIDER=gcp-identity`).

| Resource | Purpose |
|----------|---------|
| `google_project_service` | Enable `identitytoolkit.googleapis.com` |
| `google_identity_platform_config` | Identity Platform project config |
| Optional Google IdP | `google_identity_platform_default_supported_idp_config` |

## Usage

```hcl
module "identity" {
  source = "./modules/identity"

  project_id  = var.project_id
  environment = var.environment
  app_domain  = var.app_domain

  oauth_client_id     = var.gcp_oauth_client_id
  oauth_client_secret = var.gcp_oauth_client_secret
}
```

## Outputs → app env

| Output | Env var |
|--------|---------|
| `project_id` | `GCP_PROJECT_ID` |
| `auth_domain` | `GCP_IDENTITY_AUTH_DOMAIN` |
| `oidc_issuer` | `GCP_OIDC_ISSUER` |
| `oidc_audience` | `GCP_OIDC_AUDIENCE` |
| `oauth_client_id` | `GCP_OIDC_CLIENT_ID` |
| `oauth_client_secret` | `GCP_OIDC_CLIENT_SECRET` |
| `redirect_uri` | `GCP_IDENTITY_REDIRECT_URI` |

## Notes

- Create the **OAuth 2.0 Web client** in Cloud Console (Authorized redirect URIs must
  include `https://{app_domain}/login`) and pass IDs into this module — Google does
  not expose a first-class TF resource for generic OAuth clients in all orgs.
- Assign custom claims / roles (`TDC`, `TDP`, `CCRP`, `AppAdmin`) via Identity Platform
  blocking functions or Cloud Identity groups mapped in the backend (`GCP_ROLE_CLAIM`).
- Keycloak remains local-only; do not deploy Keycloak on GKE for production auth.
