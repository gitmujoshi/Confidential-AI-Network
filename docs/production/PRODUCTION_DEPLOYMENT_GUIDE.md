# Production deployment

Last updated: 2026-11-24

This is the operator guide for a real environment. The commands and the env files are in [deployment/README.md](../deployment/README.md). Cloud variable lists stay in the feature catalogs linked below. This page says what to turn on, what fails closed, and what is still operator work.

Do not run `scripts/deploy/deploy-production.sh` or `deploy/production/deploy-training-environment.sh`. Those scripts belong to an older sketch. They exit before they apply anything.

## What a production deploy is

| Piece | What runs |
|-------|-----------|
| API and UI | The Express API and the React app. Azure can place them on the AKS cluster from `deployment/azure/terraform/` |
| Identity | Microsoft Entra ID on the Azure cluster, unless `identity_mode=keycloak`. Google Cloud Identity on GCP, Amazon Cognito on AWS, OCI IAM on OCI. Keycloak is the local stack, including `./deployment/deploy-azure.sh vm -y` |
| Training | The cluster already named on the contract and on the tech service provider Cloud Provider card. A missing kubeconfig fails the job. No subscription, project, or cluster is created for a job |
| Keys | [Key Orchestrator](../USER_GUIDE.md#key-orchestrator). `CAN_KEY_RELEASE_PROFILE=production` refuses the mock broker at startup |
| Evidence | Auditor Merkle tree in this database. A SCITT receipt is written only when `SCITT_CCF_ENABLED=true` |

The local guest (`CAN_GUEST_DECRYPT=true`) decrypts inside the training container on this machine. That container is not a hardware guest. The attestation report stays simulated until a verified SEV-SNP quote is accepted. Set `SEV_SNP_ARK_PEM` on the API host before that quote can succeed. The screen walk for reviewers is the [Auditor user guide](../guides/role-user-guides/AUDITOR_USER_GUIDE.md).

Labels such as SOX, FedRAMP, and CCPA on a deployment card are configuration. They are not a certification. The auditor check does not file evidence outside this database.

## Before you apply

1. Copy `config/examples/config.env.example` to `config.env` and `secrets.env.example` to `secrets.env`, then merge the cloud overlay named in [deployment/README.md](../deployment/README.md).
2. Leave secrets in the cloud store on a cluster. `secrets.env` stays on the laptop. External Secrets on Azure is `deployment/azure/scripts/install-external-secrets.sh`, and that script exits when the vault or the cluster is missing.
3. Use an AKS, GKE, or OKE cluster you already run. Save the cluster name and the kubeconfig path on the tech service provider Cloud Provider card.
4. Set `CAN_KEY_RELEASE_PROFILE=production` when this environment must refuse the mock broker. Pick one release mode and configure its endpoint. A missing endpoint or quote returns no key.
5. Create Auditor users with `POST /api/auth/register` and `partyType` `Auditor`. The public form lists TDP, TDC, and TSP only.

## Azure

Merge `config/examples/config.azure.env.example`. The default apply sets `AUTH_PROVIDER=entra` and `KEYCLOAK_ENABLED=false`. Set `identity_mode = "keycloak"` in `terraform.tfvars` when Keycloak and its database should run on this Azure subscription.

```bash
./deployment/deploy-azure.sh terraform -y --images
```

A single VM is a separate option. `./deployment/deploy-azure.sh vm -y` copies this checkout onto one Ubuntu machine and runs the local stack there: Keycloak and both Postgres databases in Docker, then the API and the UI. It does not create the AKS cluster or Azure Database for PostgreSQL.

Terraform inputs are `deployment/azure/terraform/terraform.tfvars`, not env vars. Copy `terraform.tfvars.example` and set `subscription_id`, `tenant_id`, and `db_password`.

A training job uses the AKS cluster named on the contract and on the Cloud Provider card, or `AZURE_CCR_KUBECONFIG` on the API host. A missing path marks the job failed and returns HTTP 502.

`CAN_PRINCIPAL_KEY_MODE=azure-skr` verifies an Azure Attestation token and returns an encrypted Key Vault blob. The API does not decrypt that blob. The default mode is `signals`, and production profile refuses it. Signing stays in the database until `SIGNING_KEY_BACKEND=azure-keyvault` or `azure-mhsm`.

Every manual step after the apply is [Deploy steps](../deployment/azure/terraform/README.md#deploy-steps): DNS, Entra role assignment, database user rows, the kubeconfig path, key-release settings, and the optional SPIRE, External Secrets, confidential pool, and SCITT installs.

Feature list: [AZURE_FEATURES_AND_CONFIGURATION.md](../deployment/AZURE_FEATURES_AND_CONFIGURATION.md). Topology: [AZURE_SECURITY_ARCHITECTURE.md](AZURE_SECURITY_ARCHITECTURE.md).

## Google Cloud

Merge `config/examples/config.gcp.env.example`. Set `AUTH_PROVIDER=gcp-identity` and `KEYCLOAK_ENABLED=false`.

There is no GCP Terraform apply script in this repository. Name the existing GKE cluster and the kubeconfig path (`GCP_CCR_KUBECONFIG` or the Cloud Provider card). A missing path fails the job. Attestation on this path stays simulated. Confidential Space release stays off until `CAN_PRINCIPAL_KEY_MODE=confidential-space` and the quote check succeeds.

Feature list: [GCP_FEATURES_AND_CONFIGURATION.md](../deployment/GCP_FEATURES_AND_CONFIGURATION.md).

## AWS

Merge `config/examples/config.aws.env.example` when Cognito is the identity provider. Set `AUTH_PROVIDER=cognito` and `KEYCLOAK_ENABLED=false`.

AWS training returns HTTP 501 and does not create a training job. There is no platform Terraform under `deployment/aws/`. Nitro key release stays off until selected, and a missing root certificate or quote returns no key. A TDC can still deploy inference to an existing EKS cluster from the Inference page.

Feature list: [AWS_FEATURES_AND_CONFIGURATION.md](../deployment/AWS_FEATURES_AND_CONFIGURATION.md).

## OCI

Merge `config/examples/config.oci.env.example`. Set `AUTH_PROVIDER=oci-iam` and `KEYCLOAK_ENABLED=false`.

```bash
./deployment/deploy-oci.sh terraform
```

Training uses the existing OKE runner. A missing kubeconfig fails the job. The local mock broker is the key path until a production release mode is selected.

Feature list: [OCI_FEATURES_AND_CONFIGURATION.md](../deployment/OCI_FEATURES_AND_CONFIGURATION.md). Readiness: [OCI_READINESS.md](../deployment/OCI_READINESS.md).

## After the API is up

1. Open the API `/health` route on the host you published.
2. Sign in as TDC, TDP, TSP, AppAdmin, and Auditor.
3. Confirm a training job against the existing cluster fails closed when the kubeconfig path is empty.
4. With `CAN_KEY_RELEASE_PROFILE=production`, confirm the API refuses to start on `CAN_PRINCIPAL_KEY_MODE=signals` or `mock`.
5. Open `/auditor/dashboard`, then **Audit tree** and **Verify** on a contract whose training job is completed. The root is sealed once. The check stays in this database.
6. Turn on `SCITT_CCF_ENABLED` only after `install-scitt.sh` has a ledger image and a database URL.

## Still open for a hardware clean room

- A verified SEV-SNP report, with `SEV_SNP_ARK_PEM` on the API host. Until that report verifies, the job stays simulated.
- The clean-room private key inside a hardware guest. The local training container is a separate path and stays simulated.
- Public DNS, SPIRE, and a live confidential-pool apply.
- An end-to-end run on the staging URL with Entra users.

Product behavior for datasets, models, and the clean room is [Datasets, models, and the clean room](../USER_GUIDE.md#datasets-models-and-the-clean-room).
