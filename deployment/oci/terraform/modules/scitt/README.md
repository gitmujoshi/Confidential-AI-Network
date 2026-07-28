# SCITT module — optional SCITT CCF on OKE (ConfigMap scaffold)

**ConfigMap-only** scaffold for [SCITT CCF](https://github.com/microsoft/scitt-ccf)
integration on OCI. Does **not** install the CCF chart — operators apply OKE
Deployment/Service separately after reviewing the architecture.

Design: [SCITT_CCF_ARCHITECTURE.md](../../../../docs/features/scitt/SCITT_CCF_ARCHITECTURE.md)  
Features: [OCI_FEATURES_AND_CONFIGURATION.md](../../../../docs/deployment/OCI_FEATURES_AND_CONFIGURATION.md) §3.9  
Readiness: [OCI_READINESS.md](../../../../docs/deployment/OCI_READINESS.md) Phase 5

## Usage

```hcl
module "scitt" {
  source = "./modules/scitt"

  enabled     = true
  environment = var.environment

  scitt_ccf_url   = "https://scitt.${var.environment}.example.com"
  deployment_mode = "oke"
}
```

Root stack: `enable_scitt = false` (opt-in).

## ConfigMap keys (`scitt-ccf-config`)

| Key | Env var |
|-----|---------|
| `SCITT_CCF_URL` | `SCITT_CCF_URL` |
| `SCITT_CCF_ENABLED` | `SCITT_CCF_ENABLED` |
| `SCITT_DEPLOYMENT` | `SCITT_DEPLOYMENT` |

## Intended OKE resources (manual / follow-on)

Apply after CCF image and ledger requirements are confirmed:

```yaml
# Deployment stub — NOT managed by Terraform yet
apiVersion: apps/v1
kind: Deployment
metadata:
  name: scitt-ccf
  namespace: cms-scitt
spec:
  replicas: 1
  selector:
    matchLabels:
      app: scitt-ccf
  template:
    metadata:
      labels:
        app: scitt-ccf
    spec:
      containers:
        - name: scitt-ccf
          image: <scitt-ccf-image>
          ports:
            - containerPort: 9000
---
apiVersion: v1
kind: Service
metadata:
  name: scitt-ccf
  namespace: cms-scitt
spec:
  selector:
    app: scitt-ccf
  ports:
    - port: 9000
      targetPort: 9000
```

## Architecture notes

- SCITT CCF runs on **port 9000** with an **independent database** (see architecture doc).
- Main app stores only `scitt_references` — graceful degradation if CCF is down.
- API Gateway routes `/api/scitt/*` to backend proxy or directly to CCF internal Service.
- Hybrid model: ledger in cloud OKE, training in CCRP (Phase 5 readiness).

## Validation

```bash
kubectl -n contract-management get configmap scitt-ccf-config -o yaml
```

## Notes

- Keep `SCITT_CCF_ENABLED=false` in app env until Deployment is healthy.
- Do not co-locate CCF DB with main ADB — separate connection pool required.
