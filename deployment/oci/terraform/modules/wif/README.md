# WIF module — Phase 3 (OCI IAM Workload Identity Federation)

Creates Identity Domain artifacts so SPIRE **JWT-SVIDs** can be exchanged for
short-lived OCI **UPST** tokens (no static API keys).

| Resource | Purpose |
|----------|---------|
| `oci_identity_domains_app` | Token-exchange confidential client (`client_credentials`) |
| `oci_identity_domains_user` | Service Users `svc-can-{env}-backend` / `trainer` |
| `oci_identity_domains_identity_propagation_trust` | Trust SPIRE issuer + JWKS; impersonation rules |
| K8s `oci-wif-secret` / `oci-wif-config` | Runtime `OCI_WIF_*` for backend / trainer |

Design: [OCI_SPIFFE_SPIRE_WIF.md](../../../../docs/deployment/OCI_SPIFFE_SPIRE_WIF.md) §4.2 / §7 Phase 3  
Depends on: [`modules/spire`](../spire/) (Phase 1) + Identity Domain URL from [`modules/identity`](../identity/)

## Usage

```hcl
module "wif" {
  source = "./modules/wif"

  enabled       = true
  environment   = var.environment
  idcs_endpoint = module.identity.domain_url

  spire_oidc_issuer   = module.spire.oidc_issuer
  spire_jwks_url      = module.spire.oidc_jwks_url   # must be reachable OR pin cert
  spiffe_id_inventory = module.spire.spiffe_id_inventory
}
```

Root stack: `enable_wif = true` (implies SPIRE issuer/JWKS available).

### Private JWKS

If Identity Domain cannot reach in-cluster OIDC:

```hcl
spire_jwks_url           = ""
spire_public_certificate = file("spire-oidc.pem")
```

## Impersonation rules

Default rules (exact match — **not** `sub eq *`):

```text
sub eq 'spiffe://can.dev.oci.example/ns/contract-management/sa/backend'
  → svc-can-dev-backend

sub eq 'spiffe://can.dev.oci.example/ns/cms-training/sa/training-job-sa'
  → svc-can-dev-trainer
```

`impersonation_service_users.value` uses the Service User **SCIM id** (not OCID).

## IAM policies (manual / follow-on)

This module does **not** create classic IAM compartment policies. After apply,
map Service Users into IAM-usable groups and grant Vault/Object Storage as needed.
See output `suggested_iam_policy_comments` and [OCI_IAM_AND_EDGE_CONFIG.md](../../../../docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md).

## Validation

```bash
# Trust present
# Console → Identity → Domain → Security → Identity Propagation

# K8s
kubectl -n contract-management get configmap oci-wif-config
kubectl -n contract-management get secret oci-wif-secret

# Token exchange smoke (from a pod with JWT-SVID + PoP key) — see design doc §4.2
```

## Notes

- Token-exchange app must **not** have Identity Domain Administrator.
- Set `attribute_sets = ["all"]` on the trust to avoid Terraform drift ([provider#2545](https://github.com/oracle/terraform-provider-oci/issues/2545)).
- Enable only after SPIRE OIDC Discovery is healthy (`enable_spire=true`).
