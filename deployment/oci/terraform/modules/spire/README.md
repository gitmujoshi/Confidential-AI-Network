# SPIRE module — Phase 1 (OCI / OKE)

Deploys SPIRE Server + Agent (Helm hardened chart), OIDC Discovery Provider,
ClusterSPIFFEID entries for CAN workloads, and ConfigMaps with `SPIFFE_*` settings.

Design: [OCI_SPIFFE_SPIRE_WIF.md](../../../../docs/deployment/OCI_SPIFFE_SPIRE_WIF.md)  
Helm overlay: [helm/spire](../../../helm/spire/)

## Usage

```hcl
module "spire" {
  source = "./modules/spire"

  enabled      = true
  environment  = var.environment
  cluster_name = var.cluster_name
  trust_domain = "can.${var.environment}.oci.example"

  enable_oidc_discovery = true
  create_cluster_spiffe_ids = true
}
```

Default in root stack: `enable_spire = false` (opt-in).

## Outputs → app / Phase 3 WIF

| Output | Use |
|--------|-----|
| `trust_domain` | `SPIFFE_TRUST_DOMAIN` |
| `oidc_issuer` / `oidc_jwks_url` | IdentityPropagationTrust (Phase 3 `modules/wif`) |
| `spiffe_id_inventory` | Peer allowlists, docs |
| `spiffe_config_map_name` | Mount / envFrom on backend & trainer |

## Notes

- Requires OKE cluster reachable by the Helm/Kubernetes providers.
- ClusterSPIFFEID CRDs need `spire-server.controllerManager.enabled=true` (set in values.yaml).
- Phase 1 does **not** create OCI WIF trusts — see `modules/wif` (Phase 3 stub).
- Placeholder SAs (`backend`, `training-job-sa`) may already exist; set `create_placeholder_service_accounts=false` if so.
