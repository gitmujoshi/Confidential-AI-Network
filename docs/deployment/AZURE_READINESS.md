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
| **SCITT CCF on Azure** | No | Not in Azure Terraform |
| **Physical training on Azure** | Partial | CCRP `azureProvider.js`; WI for `training-job` ready |
| **Edge (Front Door / APIM)** | Partial IaC | `enable_edge` Front Door+WAF; APIM still manual |
| **Confidential compute pool** | No | Design only |
| **One-click production** | No | DNS, PE DNS, APIM, confidential SKU still operator steps |

**Identity:** Azure environments use **Microsoft Entra ID** only. **Keycloak** stays on local docker-compose for demos/E2E — not part of Azure deploy.

**Verdict:** Ready for an **Azure platform pilot** (`terraform apply` → ACR images → Entra smoke). Key Vault, Blob, and AKS Workload Identity are now in Terraform. **Not** a full production cutover (APIM JWT, private DNS for PE, SPIRE Helm, confidential VMs, SCITT).

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

1. **APIM** JWT validation policies as code  
2. **Private DNS** when `enable_private_endpoints=true`  
3. **SPIRE Helm** install + Entra Path F federated credentials for SPIFFE subjects  
4. **External Secrets Operator** Helm (WI principal exists)  
5. **Confidential compute** node pool / DCsv3  
6. **SCITT** on AKS  
7. **CI** `terraform apply` against a live subscription  

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
- [ ] APIM JWT  

### Phase 3 — CAN clean room

- [ ] Attestation + SKR  
- [ ] Confidential SKU pool  

---

← [Deployment](README.md) · [Azure Terraform README](../../deployment/azure/terraform/README.md)
