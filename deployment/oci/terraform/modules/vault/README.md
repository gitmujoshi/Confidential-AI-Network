# Vault module — OCI KMS Vault + master key

Scaffolds an OCI **Vault** and **master CMK** for platform secrets, contract
signing keys, and SSE-KMS on Object Storage buckets.

| Resource | Purpose |
|----------|---------|
| `oci_kms_vault` | Secrets vault in `cms-{env}-data` compartment |
| `oci_kms_key` | Master / CMK for encryption & signing key material |

Design: [OCI_FEATURES_AND_CONFIGURATION.md](../../../../docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md) §3.3  
Security: [OCI_SECURITY_ARCHITECTURE.md](../../../../docs/production/OCI_SECURITY_ARCHITECTURE.md) §8.3 (Vault & keys)

## Intended use

- **Platform secrets** — DB passwords, OIDC client secrets, TSP credentials (`SECRET_BACKEND=oci-vault`)
- **Signing keys** — Vault-backed asymmetric keys with crypto verify on sign (`SIGNING_KEY_BACKEND=oci-vault`)
- **Contract kmsConfigs** — JSON references to Vault key OCIDs for DEK/MEK workflows
- **Object Storage SSE-KMS** — bucket encryption with the master CMK

## Usage

```hcl
module "vault" {
  source = "./modules/vault"

  enabled        = true
  environment    = var.environment
  compartment_id = module.networking.data_compartment_id

  # Optional overrides
  vault_display_name = "cms-${var.environment}-vault"
  key_display_name   = "cms-${var.environment}-master-key"
  vault_type         = var.environment == "prod" ? "VIRTUAL_PRIVATE" : "DEFAULT"
}
```

Root stack: `enable_vault = false` (opt-in).

## Outputs → runtime env

| Output | Env var |
|--------|---------|
| `vault_id` | `OCI_VAULT_OCID` |
| `key_id` | `OCI_VAULT_KEY_OCID` |
| `vault_management_endpoint` | Ops / key rotation scripts |

## IAM (follow-on)

Grant dynamic groups / service users read access via policies in
[OCI_IAM_AND_EDGE_CONFIG.md](../../../../docs/deployment/OCI_IAM_AND_EDGE_CONFIG.md):

```text
Allow dynamic-group cms-{env}-oke-workloads to use keys in compartment cms-{env}-data
Allow dynamic-group cms-{env}-oke-workloads to read secret-family in compartment cms-{env}-data
```

## Notes

- Dev: `vault_type = DEFAULT` is sufficient for pilot.
- Prod: plan **HSM-backed** `VIRTUAL_PRIVATE` vault per security architecture §8.3.
- External Secrets Operator should sync Vault secrets into K8s — not managed by this module.
