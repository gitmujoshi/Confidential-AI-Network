# Platform SIEM log forwarding

Guides for shipping **infrastructure and platform logs** (WAF, API Gateway, Kubernetes, Keycloak) to enterprise SIEM. Application audit events use the [SIEM Integration Framework](../../docs/production/SIEM_INTEGRATION_FRAMEWORK.md) in `backend/services/siem/`.

---

## Log sources matrix

| Source | OCI | Azure | Local / VM |
|--------|-----|-------|------------|
| WAF access | OCI WAF → Logging | Front Door / App GW → Log Analytics | Nginx access log → file |
| API gateway | OCI API Gateway → Logging | APIM → Log Analytics | — |
| K8s audit | OKE → OCI Logging | AKS → Container Insights | — |
| K8s app stdout | OKE pod logs | AKS pod logs | `docker-compose logs` |
| Keycloak audit | OKE → Logging | AKS → Log Analytics | Keycloak log dir |
| Cloud audit | OCI Audit service | Azure Activity Log | — |
| **App audit (DB)** | `SIEM_OCI_*` env | `SIEM_SENTINEL_*` env | `SIEM_WEBHOOK_URL` |

---

## OCI → SIEM (Service Connector Hub)

**Recommended path** for infra logs in production.

### Steps

1. Create **log group** per env: `can-{env}-audit`, `can-{env}-waf-access`, `can-{env}-oke-app`.
2. Enable **diagnostic settings** on WAF, API Gateway, Load Balancer, OKE cluster.
3. Create **Service Connector** in `cms-security-shared`:
   - Source: OCI Logging log groups
   - Target: Splunk HEC URL, Azure Event Hub, or Object Storage (batch → SIEM)
4. For **application audit** from backend pods, set:

```bash
SIEM_ENABLED=true
SIEM_PROVIDERS=oci,webhook
SIEM_OCI_LOGGING_ENDPOINT=https://<region>.functions.oci.oraclecloud.com/...
```

### Example connector targets

| Target SIEM | OCI connector target type |
|-------------|---------------------------|
| Splunk | Streaming → HTTPS (HEC URL) |
| Microsoft Sentinel | Streaming → Azure Event Hub |
| Archive + batch | Object Storage → offline ingest |

See [OCI Security Architecture §9.3](../../docs/production/OCI_SECURITY_ARCHITECTURE.md).

---

## Azure → SIEM (Log Analytics + Sentinel)

### Steps

1. Create **Log Analytics workspace** `can-{env}-logs` in `can-{env}-ops-rg`.
2. Enable **Microsoft Sentinel** on the workspace (prod/staging).
3. Configure **diagnostic settings** on:
   - Application Gateway / Front Door
   - API Management
   - AKS (control plane + kube-apiserver)
   - Key Vault (audit events)
4. For **application audit** from backend pods:

```bash
SIEM_ENABLED=true
SIEM_PROVIDERS=sentinel
SIEM_SENTINEL_WORKSPACE_ID=<workspace-id>
SIEM_SENTINEL_SHARED_KEY=<key>
SIEM_SENTINEL_LOG_TYPE=CANAudit
```

5. Install **Container Insights** DCR on AKS for pod logs.

See [Azure Security Architecture §9](../../docs/production/AZURE_SECURITY_ARCHITECTURE.md).

---

## Splunk (on-prem or cloud)

### Application logs

```bash
SIEM_ENABLED=true
SIEM_PROVIDERS=splunk
SIEM_SPLUNK_HEC_URL=https://splunk.example.com:8088
SIEM_SPLUNK_HEC_TOKEN=<token>
SIEM_SPLUNK_INDEX=can_security
```

### Platform logs

- **OCI / Azure:** forward via Service Connector or Event Hub → HEC
- **VM deploy:** install Universal Forwarder; monitor `/var/log/nginx/`, Docker json-file logs

---

## Local development

SIEM export is **disabled by default**. To test against a local collector:

```bash
# Mock webhook (e.g. webhook.site or local request bin)
SIEM_ENABLED=true
SIEM_PROVIDERS=webhook
SIEM_WEBHOOK_URL=https://webhook.site/<your-id>
SIEM_ENVIRONMENT=local
```

Trigger an audit event (login, contract action) and verify POST payload matches [canonical schema](../../docs/production/SIEM_INTEGRATION_FRAMEWORK.md#3-canonical-event-schema).

---

## Fluent Bit (optional sidecar)

For AKS/OKE deployments without native diagnostic export, run Fluent Bit as a DaemonSet:

```ini
# deployment/siem/fluent-bit/fluent-bit.conf (reference)
[INPUT]
    Name              tail
    Path              /var/log/containers/*contract-management*.log
    Parser            docker
    Tag               kube.*

[OUTPUT]
    Name              http
    Match             *
    Host              ${SIEM_WEBHOOK_HOST}
    Port              443
    URI               /ingest
    Format            json
    tls               On
```

Mount application log paths or use Kubernetes metadata filter. Prefer cloud-native diagnostic settings when available.

---

## Checklist (prod go-live)

- [ ] All WAF/APIM/App Gateway diagnostic settings → Log Analytics or OCI Logging
- [ ] Service Connector or Event Hub stream to enterprise SIEM
- [ ] `SIEM_ENABLED=true` on backend deployment with correct provider credentials in Key Vault
- [ ] Sentinel / Splunk detection rules for `CANAudit` auth failures and signing anomalies
- [ ] Retention policies aligned with compliance (see SIEM framework doc §7)
- [ ] On-call route for Defender for Cloud / Cloud Guard critical findings

---

## Related

- [SIEM Integration Framework](../../docs/production/SIEM_INTEGRATION_FRAMEWORK.md)
- [config/examples/siem.env.example](../../config/examples/siem.env.example)
- `GET /api/security/siem` — runtime provider status
