# Security requirements met — NIST & CIS control mapping

**Audience:** Security / GRC reviewers, auditors, CISOs, enterprise architects  
**Scope:** Confidential AI Network (CAN) platform controls (application + multi-cloud deployment patterns)  
**Status:** Control **objectives met by design and implementation in-repo**. Live tenancy posture depends on cloud apply (see readiness docs). This is a **mapping for assurance**, not a formal certification claim (SOC 2 / ISO 27001 / FedRAMP attestation must be customer-led).

| Item | Value |
|------|--------|
| Companion patterns | [MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md](../production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) (P1–P12) |
| Cloud detail | [OCI](../production/OCI_SECURITY_ARCHITECTURE.md) · [Azure](../production/AZURE_SECURITY_ARCHITECTURE.md) · [AWS](../production/AWS_SECURITY_ARCHITECTURE.md) · [GCP](../production/GCP_SECURITY_ARCHITECTURE.md) |
| App IAM / keys | [../security/README.md](../security/README.md) |
| Evidence / SIEM | [SIEM_INTEGRATION_FRAMEWORK.md](../production/SIEM_INTEGRATION_FRAMEWORK.md) |
| India DPDP (Act-specific) | [DPDP_COMPLIANCE_IMPLEMENTATION.md](DPDP_COMPLIANCE_IMPLEMENTATION.md) |
| Framework editions used here | **NIST CSF 2.0** · **NIST SP 800-53 Rev. 5** · **CIS Controls v8** |

---

## 1. How to read this document

| Column | Meaning |
|--------|---------|
| **Requirement (met)** | CAN security / compliance requirement that the architecture addresses |
| **Status** | `Met` = implemented in product or IaC scaffolds; `Partial` = design + partial code; `Design` = pattern complete, apply/opt-in remaining |
| **NIST CSF 2.0** | Function / Category (e.g. `PR.AA` = Protect → Identity Management, Authentication, Access Control) |
| **NIST 800-53** | Representative controls (not exhaustive; use for crosswalk) |
| **CIS Controls v8** | Safeguard families / IDs (e.g. `CIS 5`, `CIS 6.5`) |
| **Evidence** | Where reviewers look (docs, code, exports) |

**Abbreviations:** TDC / TDP / TSP = Training Data Consumer / Provider / Tech Service Provider; KMS = Key Management Service; WAF = Web Application Firewall; SIEM = Security Information and Event Management; TEE = Trusted Execution Environment; SCITT CCF = Supply Chain Integrity, Transparency and Trust — Confidential Consortium Framework.

---

## 2. Summary — requirements met

| # | Requirement (met) | Status | Primary NIST CSF | Primary CIS v8 |
|---|-------------------|--------|------------------|----------------|
| R1 | Enterprise SSO / MFA-ready human identity (cloud IdP; Keycloak local-only) | Met | PR.AA | CIS 5, CIS 6 |
| R2 | Role separation (TDC / TDP / TSP / AppAdmin) + least privilege | Met | PR.AA, GV.RR | CIS 5, CIS 6 |
| R3 | Environment isolation (dev → prod) | Met (pattern) | GV.OC, PR.IR | CIS 12, CIS 16 |
| R4 | Network segmentation; private data plane | Met (pattern) | PR.IR | CIS 12, CIS 13 |
| R5 | Edge WAF + API gateway token validation | Met (pattern) | PR.PS, DE.CM | CIS 13, CIS 18 |
| R6 | Hardened managed Kubernetes; no long-lived cloud keys in pods | Met (pattern) | PR.PS, PR.AA | CIS 4, CIS 16 |
| R7 | Encryption at rest / in transit; customer-managed keys path | Met | PR.DS | CIS 3 |
| R8 | Contract-bound DEK/MEK + signing key lifecycle | Met | PR.DS, PR.AA | CIS 3, CIS 5 |
| R9 | Confidential compute / clean-room training path | Partial / Design | PR.DS, PR.IR | CIS 3, CIS 16 |
| R10 | Workload identity (WIF) + SPIFFE peer auth (Zero Trust between jobs) | Design (OCI first) | PR.AA, PR.IR | CIS 5, CIS 13 |
| R11 | Tamper-evident provenance (SCITT CCF) + job audit bundles | Met / Partial | ID.IM, RS.AN | CIS 8 |
| R12 | SIEM / audit export for security operations | Met (framework) | DE.AE, DE.CM | CIS 8 |
| R13 | Change control via Infrastructure as Code | Met (pattern) | GV.PO, ID.RA | CIS 16 |
| R14 | Disaster recovery & residency runbooks | Partial | RC.RP, GV.OC | CIS 11 |
| R15 | Privacy / regulated-data handling (DPDP hooks, consent, classification) | Partial | GV.OC, PR.DS | CIS 3, CIS 14 |
| R16 | Multi-party contract governance before training | Met | GV.RR, PR.AA | CIS 5, CIS 6 |

---

## 3. Detailed mapping (requirement → controls → evidence)

### R1 — Cloud-native human identity

| | |
|--|--|
| **Requirement met** | Interactive users authenticate via the cloud’s identity provider (Entra ID / Cognito / Identity Platform / OCI Identity Domains). Keycloak is **local docker-compose / Playwright only**. |
| **Status** | Met (app + pattern) |
| **CAN pattern** | P1 |
| **NIST CSF 2.0** | `PR.AA-01`–`PR.AA-05` (identities managed, authenticated, access controlled); `GV.OC-03` |
| **NIST 800-53** | `AC-2`, `AC-3`, `IA-2`, `IA-5`, `IA-8` |
| **CIS Controls v8** | `CIS 5` (Account Management), `CIS 6` (Access Control Management), `CIS 6.3`–`6.5` (MFA / centralized access) |
| **Evidence** | [MULTI_CLOUD… P1](../production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) · cloud IAM & edge configs under `docs/deployment/` · [security/USER_AUTH_ARCHITECTURE.md](../security/USER_AUTH_ARCHITECTURE.md) |

---

### R2 — Role-based access (TDC / TDP / TSP / AppAdmin)

| | |
|--|--|
| **Requirement met** | Party types map to distinct capabilities (catalog, contract, train, host clean room, administer). API and UI enforce role checks. |
| **Status** | Met |
| **CAN pattern** | P1, P2 (plane A) |
| **NIST CSF 2.0** | `PR.AA-05`, `GV.RR-01`–`GV.RR-04` |
| **NIST 800-53** | `AC-2`, `AC-3`, `AC-5`, `AC-6` |
| **CIS Controls v8** | `CIS 5.1`–`5.4`, `CIS 6.1`–`6.8` |
| **Evidence** | Keycloak / IdP roles · backend auth middleware · [IAM_SPECIFICATIONS.md](../security/IAM_SPECIFICATIONS.md) |

---

### R3 — Environment isolation

| | |
|--|--|
| **Requirement met** | Separate resource scopes for development, test, staging, production; shared services in dedicated scope. |
| **Status** | Met (pattern / Terraform compartments & equivalents) |
| **CAN pattern** | P3, P10 |
| **NIST CSF 2.0** | `GV.OC-01`, `PR.IR-01`, `PR.PS-01` |
| **NIST 800-53** | `AC-4`, `SC-7`, `CM-2`, `CM-3` |
| **CIS Controls v8** | `CIS 12` (Network Infrastructure), `CIS 16` (Application Software Security), `CIS 4` (Secure Configuration) |
| **Evidence** | [MULTI_CLOUD… P3 / P10](../production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) · `deployment/*/terraform` |

---

### R4 — Network segmentation (default deny)

| | |
|--|--|
| **Requirement met** | Databases and training data paths are not public; subnet tiers; private endpoints / service gateways. |
| **Status** | Met (pattern) |
| **CAN pattern** | P4 |
| **NIST CSF 2.0** | `PR.IR-01`, `PR.IR-03`, `PR.PS-02` |
| **NIST 800-53** | `SC-7`, `AC-4`, `SC-8` |
| **CIS Controls v8** | `CIS 12.1`–`12.8`, `CIS 13` (Network Monitoring) |
| **Evidence** | Per-cloud security architecture network sections · OCI VCN / Azure VNet modules |

---

### R5 — Edge protection (WAF + API gateway)

| | |
|--|--|
| **Requirement met** | Browser and API entry points are rate-limited / inspected; API gateway validates IdP tokens before the cluster. |
| **Status** | Met (pattern) |
| **CAN pattern** | P5 |
| **NIST CSF 2.0** | `PR.PS-01`, `PR.PS-02`, `DE.CM-01`, `DE.CM-09` |
| **NIST 800-53** | `SC-7`, `SI-4`, `AC-17`, `IA-2` |
| **CIS Controls v8** | `CIS 13`, `CIS 18` (Penetration Testing — complementary), `CIS 9` (Email/Web — WAF aspect) |
| **Evidence** | Edge modules · [OCI_IAM_AND_EDGE_CONFIG.md](../deployment/OCI_IAM_AND_EDGE_CONFIG.md) · Azure/AWS/GCP siblings |

---

### R6 — Hardened managed Kubernetes

| | |
|--|--|
| **Requirement met** | Managed K8s; private control plane where feasible; namespace separation; secrets from cloud vault; no long-lived API keys in pod env. |
| **Status** | Met (pattern) |
| **CAN pattern** | P6 |
| **NIST CSF 2.0** | `PR.PS-01`, `PR.PS-03`, `PR.AA-05` |
| **NIST 800-53** | `CM-2`, `CM-6`, `CM-7`, `AC-6`, `IA-5` |
| **CIS Controls v8** | `CIS 4`, `CIS 16`, `CIS 5` · align with **CIS Kubernetes Benchmark** when hardening nodes |
| **Evidence** | OKE / AKS / EKS / GKE modules · Helm under `deployment/` |

---

### R7 — Data protection & customer-managed keys

| | |
|--|--|
| **Requirement met** | DB, object storage, disks encrypted; production path uses customer-managed keys; public buckets blocked. |
| **Status** | Met |
| **CAN pattern** | P7 |
| **NIST CSF 2.0** | `PR.DS-01`, `PR.DS-02`, `PR.DS-10` |
| **NIST 800-53** | `SC-12`, `SC-13`, `SC-28`, `MP-4` |
| **CIS Controls v8** | `CIS 3` (Data Protection), `CIS 3.3`–`3.12` |
| **Evidence** | [KEY_MANAGEMENT_DESIGN.md](../security/KEY_MANAGEMENT_DESIGN.md) · Vault / KMS modules · Object Storage SSE-KMS |

---

### R8 — Contract-bound DEK / MEK / signing keys

| | |
|--|--|
| **Requirement met** | Training data and model keys are escrowed / released under Ricardian contract state; party signing keys are vault-backed where configured (e.g. OCI Vault). |
| **Status** | Met |
| **CAN pattern** | P7, P8 |
| **NIST CSF 2.0** | `PR.DS-01`, `PR.AA-05`, `PR.PS-04` |
| **NIST 800-53** | `SC-12`, `SC-13`, `AU-2`, `AU-3` |
| **CIS Controls v8** | `CIS 3`, `CIS 5`, `CIS 8` |
| **Evidence** | [PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](../guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md) · contract `kmsConfigs` / `environmentSpecs` · OCI mock product tour |

---

### R9 — Confidential compute / clean-room path

| | |
|--|--|
| **Requirement met** | High-sensitivity training uses isolated / confidential-vm (or TEE) compute hosted by TSP; key release gated on SIGNED + identity (+ attestation when live). |
| **Status** | Partial / Design (OCI scaffolds complete; live TEE attestation maturity varies by cloud) |
| **CAN pattern** | P8 |
| **NIST CSF 2.0** | `PR.DS-01`, `PR.IR-01`, `PR.PS-01` |
| **NIST 800-53** | `SC-7`, `SC-39`, `SI-7`, `AC-4` |
| **CIS Controls v8** | `CIS 3`, `CIS 16`, `CIS 4` |
| **Evidence** | [OCI_DESIGN_COMPLETE.md](../deployment/OCI_DESIGN_COMPLETE.md) · TSP OCI offering (`tsp.oci.e2e@test.com`) · Azure/AWS/GCP confidential design notes |

---

### R10 — Workload identity & SPIFFE (Zero Trust between workloads)

| | |
|--|--|
| **Requirement met** | Platform→cloud APIs use short-lived workload identity / WIF; job→job auth uses SPIFFE SVIDs + mTLS (OCI design first). |
| **Status** | Design (OCI Terraform `spire` / `wif` opt-in) |
| **CAN pattern** | P2 (planes B & C) |
| **NIST CSF 2.0** | `PR.AA-03`, `PR.AA-05`, `PR.IR-01` |
| **NIST 800-53** | `IA-9`, `IA-3`, `SC-8`, `SC-23` |
| **CIS Controls v8** | `CIS 5`, `CIS 13`, `CIS 16` |
| **Evidence** | [OCI_SPIFFE_SPIRE_WIF.md](../deployment/OCI_SPIFFE_SPIRE_WIF.md) |

---

### R11 — Tamper-evident provenance

| | |
|--|--|
| **Requirement met** | Contract / training claims recorded (SCITT CCF when enabled); job and contract provenance JSON bundles for audit. |
| **Status** | Met (local/job bundles) / Partial (SCITT CCF enabled by config) |
| **CAN pattern** | P9 |
| **NIST CSF 2.0** | `ID.IM-01`, `ID.IM-02`, `RS.AN-03`, `DE.AE-02` |
| **NIST 800-53** | `AU-2`, `AU-3`, `AU-6`, `AU-10`, `SI-7` |
| **CIS Controls v8** | `CIS 8` (Audit Log Management), `CIS 8.2`–`8.11` |
| **Evidence** | [SCITT_CCF_ARCHITECTURE.md](../features/scitt/SCITT_CCF_ARCHITECTURE.md) · `buildProvenanceAuditReport` · product tour provenance screens |

---

### R12 — SIEM / security monitoring export

| | |
|--|--|
| **Requirement met** | Audit events exportable to SIEM (Sentinel, Splunk, OCI Logging, webhook) with a shared schema. |
| **Status** | Met (framework + connectors) |
| **CAN pattern** | P9 |
| **NIST CSF 2.0** | `DE.AE-02`, `DE.AE-03`, `DE.CM-01`, `DE.CM-03` |
| **NIST 800-53** | `AU-6`, `SI-4`, `IR-4` |
| **CIS Controls v8** | `CIS 8`, `CIS 13` |
| **Evidence** | [SIEM_INTEGRATION_FRAMEWORK.md](../production/SIEM_INTEGRATION_FRAMEWORK.md) · `docs/deployment/siem/` |

---

### R13 — Infrastructure as Code & change control

| | |
|--|--|
| **Requirement met** | Network, identity wiring, clusters, edge expressed as Terraform (or equivalent); separate state per environment. |
| **Status** | Met (Azure/OCI modules; AWS/GCP targets documented) |
| **CAN pattern** | P12 |
| **NIST CSF 2.0** | `GV.PO-01`, `ID.RA-01`, `PR.PS-01` |
| **NIST 800-53** | `CM-2`, `CM-3`, `CM-4`, `SA-10` |
| **CIS Controls v8** | `CIS 16`, `CIS 4`, `CIS 15` (Service Provider Management — for TSP cloud) |
| **Evidence** | `deployment/oci/terraform`, `deployment/azure/terraform` |

---

### R14 — Disaster recovery & residency

| | |
|--|--|
| **Requirement met** | Primary / DR region documented; backups for DB and critical object prefixes; residency via deployment jurisdiction. |
| **Status** | Partial (runbooks + jurisdiction DEPA prefixes; customer RTO/RPO) |
| **CAN pattern** | P11 |
| **NIST CSF 2.0** | `RC.RP-01`, `RC.RP-02`, `GV.OC-02` |
| **NIST 800-53** | `CP-2`, `CP-6`, `CP-9`, `CP-10` |
| **CIS Controls v8** | `CIS 11` (Data Recovery) |
| **Evidence** | Production runbooks · [MULTI_DEPLOYMENT_INTEGRATION_GUIDE.md](../guides/MULTI_DEPLOYMENT_INTEGRATION_GUIDE.md) |

---

### R15 — Privacy & regulated-data handling

| | |
|--|--|
| **Requirement met** | Dataset classification, consent / DPDP hooks, contract privacy parameters (e.g. differential privacy), jurisdiction-aware DEPA IDs. |
| **Status** | Partial (DPDP implementation + contract privacy fields; formal DPIA is customer process) |
| **CAN pattern** | Application + P7 |
| **NIST CSF 2.0** | `GV.OC-03`, `PR.DS-01`, `PR.DS-02` |
| **NIST 800-53** | `PT-2`, `PT-3`, `PT-5`, `SI-12` (privacy overlay) · `AC-3` |
| **CIS Controls v8** | `CIS 3`, `CIS 14` (Security Awareness — complementary), `CIS 17` (Incident Response — breach notify) |
| **Evidence** | [DPDP_COMPLIANCE_IMPLEMENTATION.md](DPDP_COMPLIANCE_IMPLEMENTATION.md) · [DEPA_INTEGRATION_GUIDE.md](../guides/DEPA_INTEGRATION_GUIDE.md) |

---

### R16 — Multi-party contract governance before training

| | |
|--|--|
| **Requirement met** | Training cannot start until Ricardian contract is fully signed by required parties; TSP cloud / KMS / compute bound in contract. |
| **Status** | Met |
| **CAN pattern** | Application governance |
| **NIST CSF 2.0** | `GV.RR-02`, `GV.PO-02`, `PR.AA-05` |
| **NIST 800-53** | `AC-3`, `AU-2`, `SA-9` |
| **CIS Controls v8** | `CIS 5`, `CIS 6`, `CIS 15` |
| **Evidence** | Contract state machine · lifecycle user guide · OCI product tour contract step |

---

## 4. NIST CSF 2.0 coverage matrix (by function)

| CSF 2.0 Function | Categories addressed | CAN requirements |
|------------------|----------------------|------------------|
| **Govern (GV)** | OC, RR, PO | R2, R3, R13, R14, R15, R16 |
| **Identify (ID)** | AM, RA, IM | R11, R13 |
| **Protect (PR)** | AA, DS, PS, IR | R1–R10, R15 |
| **Detect (DE)** | AE, CM | R5, R11, R12 |
| **Respond (RS)** | AN, MI | R11, R12, R15 (breach hooks) |
| **Recover (RC)** | RP | R14 |

---

## 5. CIS Controls v8 — safeguard families in scope

| CIS Control | Title | CAN mapping |
|-------------|-------|-------------|
| **3** | Data Protection | R7, R8, R9, R15 |
| **4** | Secure Configuration of Enterprise Assets and Software | R6, R13 |
| **5** | Account Management | R1, R2, R10, R16 |
| **6** | Access Control Management | R1, R2, R16 |
| **8** | Audit Log Management | R11, R12 |
| **11** | Data Recovery | R14 |
| **12** | Network Infrastructure Management | R3, R4 |
| **13** | Network Monitoring and Defense | R4, R5, R10, R12 |
| **15** | Service Provider Management | R9, R13, R16 (TSP as provider) |
| **16** | Application Software Security | R3, R6, R9, R13 |
| **17** | Incident Response Management | R12, R15 |
| **18** | Penetration Testing | Complementary (customer program; WAF supports) |

**CIS Benchmarks (hardening profiles):** apply **CIS Kubernetes Benchmark**, **CIS Oracle Linux / Ubuntu**, and cloud foundation benchmarks (CIS OCI / Azure / AWS / GCP Foundations) when locking production node images and tenancy baselines — tracked in per-cloud security architecture hardening checklists.

---

## 6. Quick crosswalk — pattern → frameworks

| Pattern | NIST CSF | NIST 800-53 (sample) | CIS v8 |
|---------|----------|----------------------|--------|
| P1 Human IdP | PR.AA | IA-2, AC-2 | 5, 6 |
| P2 Three identity planes | PR.AA, PR.IR | IA-3, IA-9, SC-8 | 5, 13 |
| P3 Env isolation | GV.OC, PR.IR | AC-4, CM-2 | 12, 16 |
| P4 Network | PR.IR | SC-7 | 12, 13 |
| P5 Edge WAF / APIGW | PR.PS, DE.CM | SC-7, SI-4 | 13 |
| P6 Hardened K8s | PR.PS | CM-6, AC-6 | 4, 16 |
| P7 CMK / encryption | PR.DS | SC-12, SC-28 | 3 |
| P8 Confidential compute | PR.DS, PR.IR | SC-39, SC-7 | 3, 16 |
| P9 Evidence / SIEM | ID.IM, DE.AE | AU-2, AU-6, SI-4 | 8, 13 |
| P10 Env profiles | GV.OC, PR.PS | CM-2 | 4, 16 |
| P11 DR / residency | RC.RP | CP-6, CP-9 | 11 |
| P12 IaC | GV.PO, ID.RA | CM-3, SA-10 | 16 |

---

## 7. What this document does *not* claim

- Formal **SOC 2 Type II**, **ISO/IEC 27001**, **FedRAMP**, or **CIS Benchmark** certification of a named tenancy  
- Completeness of every 800-53 control (representative crosswalk only)  
- That Keycloak local demos equal production identity posture  
- That confidential-compute attestation is live on every cloud without enabling TEE products and policy  

Customer GRC teams should import this matrix into their GRC tool and attach **environment-specific evidence** (Terraform plan applies, IdP MFA screenshots, SIEM sample events, SCITT receipts).

---

## 8. Related compliance docs

| Doc | Role |
|-----|------|
| [DPDP_COMPLIANCE_IMPLEMENTATION.md](DPDP_COMPLIANCE_IMPLEMENTATION.md) | India DPDP Act 2023 product hooks |
| [DEPA_INTEGRATION_GUIDE.md](../guides/DEPA_INTEGRATION_GUIDE.md) | iSPIRT DEPA-aligned IDs (architecture — not DPDP) |
| [SECURITY_GUIDE.md](../production/SECURITY_GUIDE.md) | App-layer security practices |
| [MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md](../production/MULTI_CLOUD_SECURITY_ARCHITECTURE_PATTERNS.md) | Control objectives P1–P12 |

---

## 9. Document history

| Date | Change |
|------|--------|
| 2026-07-28 | Initial requirements-met matrix with NIST CSF 2.0, NIST SP 800-53 Rev. 5, and CIS Controls v8 mappings |

← [Compliance](README.md) · [Documentation home](../README.md) · [Security docs](../security/README.md)
