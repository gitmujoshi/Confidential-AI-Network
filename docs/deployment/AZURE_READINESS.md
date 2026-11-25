# Azure deployment readiness

Assessment of whether the Confidential AI Network is ready to deploy to **Microsoft Azure** as of the current codebase.

---

## Summary

| Layer | Ready? | Notes |
|-------|--------|--------|
| **Architecture & security design** | Yes (doc) | [AZURE_SECURITY_ARCHITECTURE.md](../production/AZURE_SECURITY_ARCHITECTURE.md) |
| **Terraform / AKS scaffold** | **Yes (pilot)** | VNet, AKS (+ OIDC/WI), Postgres, ACR, LB, Entra apps, **Key Vault**, **Blob**, **Workload Identity** |
| **Core app on Azure (UI + API + Entra + DB)** | Partial | K8s manifests + Entra ConfigMap; validate images, DNS, role mapping |
| **Key Vault + Blob** | **Yes (IaC)** | `enable_key_vault` / `enable_storage` (default on) |
| **SPIFFE/SPIRE + Entra WIF** | Design + scaffold | [AZURE_SPIFFE_SPIRE_WIF.md](AZURE_SPIFFE_SPIRE_WIF.md); TF `enable_spire` + Helm values; Path N WI in TF |
| **SCITT ledger on AKS** | Partial | `deployment/azure/scripts/install-scitt.sh`. This repo's service, not a Microsoft CCF network |
| **Physical training on Azure** | Partial | Job submit plus a guest-report collector. A missing TSM interface fails the Job |
| **Edge (Front Door / APIM)** | Partial IaC | `enable_edge` Front Door+WAF. `enable_apim` creates Consumption APIM and the Entra JWT policy when the publisher email and backend URL are set |
| **Confidential compute pool** | **Opt-in IaC** | `enable_confidential_compute` adds a DCasv5 user pool. The Job reads the guest report from that node |
| **External Secrets** | Partial | Workload identity, service account, Helm values, and SecretStore manifest. The install script does not run during terraform apply |
| **One-click production** | No | Public DNS and a live subscription apply are still operator steps |

**Identity:** Azure environments use **Microsoft Entra ID** only. **Keycloak** stays on local docker-compose for demos/E2E — not part of Azure deploy.

**Verdict:** Ready for an **Azure platform pilot** (`terraform apply` → ACR images → Entra smoke). Key Vault sign, key lookup, and secure key release are in the API and fail closed. APIM, External Secrets, the guest-report collector, and the SCITT ledger manifest are in the repo and stay off until their settings and a cluster are present. Blob, Workload Identity, private DNS, and an opt-in DCasv5 node pool are in Terraform. A live subscription apply, SPIRE Helm, and public DNS remain operator steps.

---

## What exists today

### Documentation

- [Azure Security Architecture](../production/AZURE_SECURITY_ARCHITECTURE.md)
- [Azure Features & Configuration](AZURE_FEATURES_AND_CONFIGURATION.md)
- [Azure IAM & Edge Config](AZURE_IAM_AND_EDGE_CONFIG.md)
- [Azure SPIFFE/SPIRE + Entra WIF](AZURE_SPIFFE_SPIRE_WIF.md)
- [config/examples/config.azure.env.example](../../config/examples/config.azure.env.example)
- [deployment/azure/terraform/README.md](../../deployment/azure/terraform/README.md)
- [backend/AZURE_INTEGRATION_GUIDE.md](../../backend/AZURE_INTEGRATION_GUIDE.md)

### Infrastructure code (`deployment/azure/terraform/`)

| Module | Purpose |
|--------|---------|
| `networking` | VNet, subnets (incl. private endpoints), NAT, NSGs |
| `aks` | AKS + OIDC issuer + Workload Identity |
| `database` | PostgreSQL Flexible Server |
| `load_balancer` | Public IP for ingress |
| `container_registry` | ACR |
| `identity` | Entra SPA + API app registrations |
| `key_vault` | Platform Key Vault + seeded secrets |
| `storage` | Blob account + datasets/outputs/artifacts |
| `workload_identity` | UAMI + federated credentials + RBAC |
| `kubernetes_resources` | App namespace, ConfigMaps, backend WI SA, Deployments |
| `edge` | Optional Front Door + WAF |
| `spire` | Optional SPIRE namespace + trust-domain ConfigMaps |

### Deployment scripts

| Script | Purpose |
|--------|---------|
| [deployment/azure/terraform/deploy.sh](../../deployment/azure/terraform/deploy.sh) | Full Terraform apply wrapper |
| [deployment/azure/terraform/destroy.sh](../../deployment/azure/terraform/destroy.sh) | Tear down |
| [deploy/azure/deploy-azure.sh](../../deploy/azure/deploy-azure.sh) | Single-VM docker-compose path |
| [docs/contracts/azure-confidential-computing-setup.sh](../contracts/azure-confidential-computing-setup.sh) | DCsv3 + Key Vault CCRP helper |

---

## Gaps remaining for production

The operator checklist is [Deploy steps](../../deployment/azure/terraform/README.md#deploy-steps). What that checklist cannot finish from this repo:

1. **SPIRE Helm** install + Entra Path F federated credentials for SPIFFE subjects
2. **CI** `terraform apply` against a live subscription
3. **Public DNS** and a running confidential pool so the guest-report collector can read a real SEV-SNP report

---

## Recommended rollout

### Phase 1 — Platform pilot (now unblocked by IaC)

- [ ] `terraform apply` with defaults (KV + storage + WI on)  
- [ ] Build/push images to ACR  
- [ ] Entra app roles → party mapping smoke test  
- [ ] Confirm backend SA has `azure.workload.identity/client-id`  

### Phase 2 — Edge + SPIRE

- [ ] `enable_edge=true`  
- [ ] `enable_spire=true` + Helm install  
- [x] APIM JWT policy in Terraform (`enable_apim`, default off until email and backend URL are set)

### Phase 3 — CAN clean room

- [x] Confidential SKU pool in Terraform (`enable_confidential_compute`, default off)
- [x] Guest report collector in the training Job. It fails when the node has no SEV-SNP interface
- [x] Key Vault key release after a verified Azure Attestation JWT (`CAN_PRINCIPAL_KEY_MODE=azure-skr`)

---

← [Deployment](README.md) · [Azure Terraform README](../../deployment/azure/terraform/README.md)
