# SPIRE Helm overlay — Phase 1 (OCI)

Values and manifests for deploying **SPIRE** on OKE using the
[SPIFFE helm-charts-hardened](https://github.com/spiffe/helm-charts) `spire` chart.

| Path | Purpose |
|------|---------|
| `values.yaml` | Trust domain, server/agent, OIDC discovery provider |
| `manifests/clusterspiffeids.yaml` | ClusterSPIFFEID for backend, trainer, smoke |
| `manifests/smoke-job.yaml` | Optional SVID fetch smoke Job |

## Install (manual)

```bash
helm repo add spiffe https://spiffe.github.io/helm-charts-hardened/
helm repo update

kubectl create namespace spire --dry-run=client -o yaml | kubectl apply -f -

helm upgrade --install spire spiffe/spire \
  --namespace spire \
  --values values.yaml \
  --set global.spire.trustDomain=can.dev.oci.example \
  --set global.spire.clusterName=can-dev-oke \
  --wait

kubectl apply -f manifests/clusterspiffeids.yaml
```

## Install (Terraform)

```hcl
module "spire" {
  source = "../terraform/modules/spire"

  enabled       = true
  environment   = "dev"
  trust_domain  = "can.dev.oci.example"
  cluster_name  = "can-dev-oke"
  values_file   = "${path.root}/../helm/spire/values.yaml"
}
```

Root stack: set `enable_spire = true` in `terraform.tfvars`.

## Verify

```bash
kubectl -n spire get pods
kubectl -n spire logs -l app.kubernetes.io/name=spire-server --tail=50

# Workload API smoke (after smoke Job SA exists)
kubectl apply -f manifests/smoke-job.yaml
kubectl -n spire logs job/spire-smoke-svid
```

## Design reference

[OCI_SPIFFE_SPIRE_WIF.md](../../../docs/deployment/OCI_SPIFFE_SPIRE_WIF.md) — Phase 1.
