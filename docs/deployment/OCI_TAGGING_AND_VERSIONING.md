# OCI tagging and versioning

Production conventions for **OCI resource tags**, **container image tags**, and **release versioning** in Confidential AI Network deployments.

---

## OCI resource tags (`cms-*`)

All Terraform-managed OCI resources receive these **freeform tags** (merged with any `project_tags` overrides in `terraform.tfvars`):

| Tag key | Example | Purpose |
|---------|---------|---------|
| `cms-project` | `confidential-ai-network` | System identity |
| `cms-environment` | `dev` / `test` / `staging` / `prod` | Environment isolation |
| `cms-owner` | `platform-team` | Ownership |
| `cms-data-classification` | `internal` | Sensitivity (`public` … `restricted`) |
| `cms-cost-center` | `CC-1234` | FinOps chargeback |
| `cms-release` | `1.2.0` | Application release version |
| `cms-managed-by` | `terraform` | Provisioning tool |

### Defined tags (optional)

For IAM policies using `tag.cms-environment.value`, create an OCI **tag namespace** in your tenancy and set:

```hcl
defined_tag_namespace = "cms-tags"
```

Terraform will mirror the same keys into **defined tags** for tag-based authorization.

---

## Container image versioning (OCIR)

| Tag type | Format | Example | Mutable? |
|----------|--------|---------|----------|
| **Build identity** | Git SHA or semver | `240fd11`, `1.2.0` | Immutable in **prod** OCIR |
| **Environment alias** | Environment name | `staging`, `prod` | Yes (pointer to current release) |
| **Test builds** | `test-*` prefix | `test-20260617` | CI only |

### Resolution order (`effective_image_tag`)

1. `image_tag` in `terraform.tfvars`
2. `release_version` if not `0.0.0-dev`
3. `latest` (non-prod only)

**Production guard:** Terraform fails apply if `environment = "prod"` and neither `image_tag` nor `release_version` is set.

Deploy scripts refuse to push `:latest` when `DEPLOY_ENV_TAG=prod`.

### Push workflow

```bash
cd deployment/oci/terraform
cp terraform.tfvars.example terraform.tfvars
# Set environment, release_version, image_tag (or let deploy use git SHA)

./deploy.sh -y --images
```

With `--images`, the script:
1. Resolves tag from `IMAGE_TAG` → git SHA → `effective_image_tag`
2. Builds and pushes `backend` and `frontend`
3. Also pushes environment alias (`staging`, `prod`, etc.) when different from build tag

---

## Kubernetes

Deployments pin images explicitly:

```
<registry>/backend:<effective_image_tag>
<registry>/frontend:<effective_image_tag>
```

ConfigMap exposes `APP_VERSION` and `IMAGE_TAG` to pods.

---

## Variables reference

| Variable | Default | Description |
|----------|---------|-------------|
| `environment` | `dev` | `dev` \| `test` \| `staging` \| `prod` |
| `release_version` | `0.0.0-dev` | Semver for `cms-release` tag |
| `image_tag` | `""` | Override for container pulls |
| `tag_owner` | `platform-team` | `cms-owner` |
| `data_classification` | `internal` | `cms-data-classification` |
| `cost_center` | `TBD` | `cms-cost-center` |
| `defined_tag_namespace` | `""` | OCI defined-tag namespace name |
| `project_tags` | `{}` | Extra freeform tags merged on top |

---

## Related

- [OCI Security Architecture §13](../production/OCI_SECURITY_ARCHITECTURE.md)
- [OCI IAM & Edge Config §7.6](OCI_IAM_AND_EDGE_CONFIG.md)
- [deployment/oci/terraform/README.md](../../deployment/oci/terraform/README.md)
