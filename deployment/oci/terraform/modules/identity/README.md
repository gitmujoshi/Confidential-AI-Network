# Identity module — OCI IAM Identity Domains

Creates (optional flags):

| Resource | Purpose |
|----------|---------|
| `oci_identity_domain` | Per-env Identity Domain (`cms-{env}-id`) |
| `oci_identity_domains_group` | App role groups (`cms-{env}-tdc-users`, …) |
| `oci_identity_domains_app` (SPA) | Public PKCE client for React login |
| `oci_identity_domains_app` (API) | Confidential/resource client for JWT audience |

Wired into root `main.tf` → Kubernetes ConfigMap / Secret (`AUTH_PROVIDER=oci-iam`).

## Usage

```hcl
module "identity" {
  source = "./modules/identity"

  compartment_id = var.compartment_id
  environment    = var.environment
  home_region    = var.region
  app_domain     = var.app_domain

  create_domain = true
  create_groups = true
  create_apps   = true
  license_type  = "free"
}
```

Reuse an existing domain:

```hcl
create_domain       = false
existing_domain_id  = "ocid1.domain.oc1.."
# or existing_domain_url = "https://idcs-….identity.oraclecloud.com"
```

## Outputs used by the app

- `domain_url` → `OCI_IDENTITY_DOMAIN_URL` / issuer base  
- `frontend_client_id` → `OCI_IDENTITY_CLIENT_ID`  
- `api_client_id` → `OCI_IDENTITY_API_CLIENT_ID`  
- `api_audience` → `OCI_IDENTITY_AUDIENCE`  
- `api_client_secret` → `OCI_IDENTITY_CLIENT_SECRET`  
- `redirect_uri` → `OCI_IDENTITY_REDIRECT_URI`  

## Notes

- Domain create is async (up to ~40m). Wait until ACTIVE before apps/groups if applying in stages.
- Assign users to groups in the Console or via `oci_identity_domains_user` / membership (not seeded here).
- Provider `oracle/oci` ≥ 5.40 recommended for `oci_identity_domains_*`.
