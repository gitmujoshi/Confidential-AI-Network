# Edge module — WAF + API Gateway + Cloud Gate (design scaffold)

**Design-only scaffold** for internet-facing edge on OCI. This module writes a
Kubernetes **ConfigMap** with WAF, API Gateway, and Cloud Gate design keys —
it does **not** create OCI WAF or API Gateway resources yet (too many required
fields for a safe default plan).

Full design: [OCI_IAM_AND_EDGE_CONFIG.md](../../../../docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md)  
Feature catalog: [OCI_FEATURES_AND_CONFIGURATION.md](../../../../docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md) §2

## Architecture (target state)

```text
Internet
  → WAF Policy (cms-waf-{env}) on public LB
      ├── api.{env}.example.com → API Gateway → private LB → backend:5001
      └── app.{env}.example.com → Cloud Gate → private LB → frontend:3000
```

- **JWT validation** at API Gateway against **Identity Domain** JWKS (not Keycloak).
- **Cloud Gate** for browser SSO at `app.*` only — not `api.*`.
- TLS termination at WAF (recommended).

## Usage

```hcl
module "edge" {
  source = "./modules/edge"

  enabled        = true
  environment    = var.environment
  compartment_id = module.networking.edge_compartment_id
  app_domain     = "dev.example.com"

  jwt_issuer   = module.identity.domain_url
  jwt_jwks_url = "${module.identity.domain_url}/.well-known/jwks.json"
}
```

Root stack: `enable_edge = false` (opt-in).

## ConfigMap keys (`oci-edge-design`)

| Key | Purpose |
|-----|---------|
| `WAF_POLICY_NAME` | Intended WAF policy name |
| `API_GATEWAY_DEPLOYMENT_PATH` | Base API path prefix |
| `JWT_ISSUER` / `JWT_JWKS_URL` | Identity Domain OIDC placeholders |
| `API_HOSTNAME` / `APP_HOSTNAME` | Public DNS hostnames |
| `CLOUD_GATE_APP_*` | Cloud Gate application names |

## Operator checklist — intended OCI resources

Apply manually or extend this module after the first live edge deployment:

- [ ] `oci_waf_web_app_firewall_policy` — OWASP CRS (log-only in dev)
- [ ] `oci_waf_web_app_firewall` — attach policy to public LB
- [ ] `oci_apigateway_gateway` — DMZ / edge private subnet
- [ ] `oci_apigateway_deployment` — OpenAPI spec per §10.5 routes
- [ ] `oci_load_balancer_load_balancer` — public LB fronting edge
- [ ] Cloud Gate apps — `cms-frontend-{env}`, `cms-ops-{env}` (§9)
- [ ] DNS A/CNAME — `api.*`, `app.*` → WAF/LB
- [ ] WAF logging → `cms-{env}-waf-access` log group

Output `intended_oci_resource_types` mirrors this list for automation hooks.

## Validation

```bash
kubectl -n contract-management get configmap oci-edge-design -o yaml
```

## Notes

- Precondition: `compartment_id` and `app_domain` must be non-empty when `enabled=true`.
- Resources are **design-documented**; the ConfigMap is the Terraform scaffold until operators complete first live apply.
- Coordinate with `modules/identity` for JWT issuer/JWKS and `modules/load_balancer` for public LB OCID.
