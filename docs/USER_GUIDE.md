# Contract Management System — User Guide

Last updated: 2026-11-15

## 🎯 Getting Started

This guide helps you use the Contract Management System effectively. The system enables secure management of data sharing contracts between Training Data Providers (TDPs), Training Data Consumers (TDCs), and Confidential Clean Room Providers (CCRPs).

## 🔐 User Authentication

### **Logging In**
1. Navigate to the system URL
2. Enter your username and password
3. Change password if prompted (first login)
4. Access your role-specific dashboard

### **User Roles**
- **TDC**: Access and request training data
- **TDP**: Provide and manage training datasets
- **CCRP**: Provide computing environments
- **AppAdmin**: System administration and management

### **Where to go next**
- **Documentation home**: [README.md](README.md)
- **Per-role UI guides (with screenshots)**: [guides/role-user-guides/README.md](guides/role-user-guides/README.md)
- **Screenshot E2E lifecycle (onboard → sign → train → inference)**: [guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md](guides/lifecycle-user-guide/LIFECYCLE_USER_GUIDE.md)
- **Screenshot multi-model contracts (tabular / NLP+DP / vision)**: [guides/multi-model-user-guide/MULTI_MODEL_USER_GUIDE.md](guides/multi-model-user-guide/MULTI_MODEL_USER_GUIDE.md)
- **Full onboarding + E2E lifecycle (canonical text)**: [guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md](guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md)
- **Training workflows**: [training/USER_TRAINING_GUIDE.md](training/USER_TRAINING_GUIDE.md)
- **Contract signing**: [features/contract-signing/CONTRACT_SIGNING_USER_GUIDE.md](features/contract-signing/CONTRACT_SIGNING_USER_GUIDE.md)
- **Admin operations**: [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
- **CAN MVP APIs**: [features/can/CAN_QUICKSTART.md](features/can/CAN_QUICKSTART.md)

## 📊 Dashboard Overview

### **TDC Dashboard**
- Available Datasets
- My Contracts
- Data Requests
- Notifications

### **TDP Dashboard**
- My Datasets
- Contract Requests
- Data Usage
- Revenue Tracking

### **CCRP Dashboard**
- Environment Management
- Contract Monitoring
- Infrastructure Status
- Resource Usage

### **Admin Dashboard**
- User Management
- System Health
- Contract Overview
- Audit Logs

## ✅ Role-based “happy path” workflows

### **TDC (Training Data Consumer)**
- **Browse datasets**: Datasets → Catalog → filter/search → open dataset detail
- **Create a contract**: Contracts → Create → choose template → pick datasets → select the TSP → name the Azure or GCP cluster when that TSP is selected → submit
- **Sign contract** (if required): Contracts → Pending Signatures → Sign
- **Run training**: Training → **Start training** on a **SIGNED** contract. A Local TSP runs on this machine. An Azure or GCP TSP submits to that TSP’s existing cluster. See [Clean-room provider and training](#clean-room-provider-and-training).
- **Review outputs**: Training → Job Detail → download artifacts + reports (and provenance where enabled)

### **TDP (Training Data Provider)**
- **Publish datasets**: Datasets → Upload → metadata + classification + access controls → publish
- **Respond to contract requests**: Contracts → Incoming Requests → review terms → approve/reject
- **Issue access tokens / approvals** (where applicable): Datasets/Contracts → Access controls → grant access
- **Monitor usage**: Analytics/Reports → dataset access + revenue + audit trail

### **CCRP (Confidential Clean Room Provider)**
- **Name the cluster you already run**: Dashboard → **Cloud Provider** → edit → Local, Azure, or GCP. Azure and GCP include the cluster name and the kubeconfig path on this host.
- **Review contracts for compliance**: Contracts → Review Queue → verify requirements (TEE, residency, policies)
- **Sign** when you can host the job. Training uses the cluster recorded on the contract and on your Cloud Provider card. It does not create a new subscription or project.

### **AppAdmin**
- **Manage users/roles**: Admin → Users → create/update/disable → role assignment
- **Monitor health**: Admin → System Health → investigate alerts/logs
- **Audit & compliance**: Admin → Audit Logs → export/retain evidence
- **Operational scripts**: see `docs/ADMIN_GUIDE.md` (includes DEPA tooling and CAN operations)

## 📝 Contract Management

### **Creating Contracts**
1. Navigate to Contracts → Create New Contract
2. Select template and fill details
3. Add parties (TDC, TDP, CCRP)
4. Define terms and conditions
5. Submit for approval and signing

The environment step records which TSP hosts the job. Cluster fields appear only for the provider that TSP offers. Details are in [Clean-room provider and training](#clean-room-provider-and-training).

### **Clean-room provider and training**

The TSP selected on the contract decides where training runs.

| TSP provider | Where the job runs |
|---|---|
| Local | This machine. `TRAINING_EXECUTION_MODE` chooses `local-docker`, `local-native`, or `local-mlx`. |
| Azure | That TSP’s existing AKS cluster |
| GCP | That TSP’s existing GKE cluster |
| OCI | That TSP’s existing OKE cluster |
| AWS | Training is not started |

#### TSP: save the cluster on your dashboard

1. Sign in as the TSP and open the dashboard.
2. On the **Cloud Provider** card, click edit and choose one provider.
3. For **Azure**, enter Subscription ID, Resource group, AKS cluster name, Namespace, Region, Storage account, Key Vault URI, and Kubeconfig path.
4. For **GCP**, enter Project ID, Location, GKE cluster name, Namespace, GCS bucket, and Kubeconfig path.
5. Save. Local and OCI keep the provider selection. Those two do not ask for an AKS or GKE cluster on this card.

The kubeconfig path is a file on the TSP host. The contract stores the cluster name and account identifiers. Azure needs a subscription, resource group, and AKS name. GCP needs a project, location, and GKE name. A blank contract field is filled from this saved account.

#### TDC: what the contract asks for

1. Choose a template, then set price, duration, terms, and privacy (epsilon, minimum accuracy, and technique when you use differential privacy or federated learning).
2. Select **1–3 datasets**. An AI model is optional on the form. Starting training still requires a model on the contract.
3. On **Configure Environment & TSP**, filter **Cloud Provider** and select the TSP. That choice sets the provider for the job.
4. Enter environment size: Environment Type, Instance Type, CPU, Memory, Storage, GPU, and notes.
5. Enter KMS: provider, key id, algorithm, and rotation. An OCI TSP also asks for the vault OCID and region.
6. When the TSP is **Azure**, fill **Azure cluster**: Subscription ID, Resource group, AKS cluster name, Namespace, Region, Storage account, and Key Vault URI.
7. When the TSP is **GCP**, fill **GCP cluster**: Project ID, Location, GKE cluster name, Namespace, and GCS bucket.
8. A **Local** TSP hides both cluster sections.

#### Start training

1. The dataset owner (TDP) signs, then the TSP signs. The contract status becomes **SIGNED**.
2. Open **Training** and click **Start training** on that contract.
3. A Local TSP runs here. Azure and GCP submit a job to the named cluster. The job detail shows `azure-ccr` or `gcp-ccr`.
4. If the kubeconfig path is missing, the start fails and the job is **FAILED**. No cluster is created.
5. Cloud job attestation is marked **simulated** until a hardware quote is attached.
6. With the training policy gate enabled, the start is refused when the policy engine is unreachable. That refusal happens before any cluster submit.

### **Digital Signing**
1. Access contract to sign
2. Review details and terms
3. Click "Sign Contract"
4. Select signing key and enter password
5. Generate and submit digital signature
6. Receive confirmation

### **Contract Status**
- **Draft**: Being prepared
- **Pending Signatures**: Waiting for signatures
- **Fully Signed**: All signatures received
- **Active**: Legally binding
- **Completed**: Contract ended

## 📁 Dataset Management

### **TDP: Managing Datasets**
1. Navigate to Datasets → Upload Dataset
2. Select files and add metadata
3. Set permissions and access controls
4. Submit and publish dataset

### **TDC: Accessing Datasets**
1. Browse dataset catalog
2. Search and filter datasets
3. Request access to desired datasets
4. Wait for approval and access data

### **Dataset Categories**
- Healthcare
- Financial
- Education
- Technology
- Other

## 👥 User Management

### **Profile Management**
- Update personal details
- Change password
- Set preferences
- Manage security settings

### **Key Management (for Signing)**
- Generate new signing keys
- Import/export existing keys
- Manage key passwords
- Delete unused keys

## 🔒 Security Best Practices

### **Account Security**
- Use strong, unique passwords
- Change passwords regularly
- Access from trusted devices only
- Always logout when finished

### **Data Security**
- All data encrypted at rest and in transit
- Role-based access controls
- Complete audit logging
- Regular security updates

## 🚨 Troubleshooting

### **Common Issues**
- **Login Problems**: Use password reset or contact admin
- **Contract Issues**: Check permissions and key status
- **Dataset Issues**: Verify access rights and file formats

### **Getting Help**
- Check FAQ section
- Refer to this user guide
- Contact support team
- Use help desk system

## 📱 Mobile Access

- Responsive design for mobile devices
- Full functionality on smartphones/tablets
- Secure access with same security as desktop
- VPN recommended for remote work

## 📊 Reporting

- Contract status and progress reports
- Dataset usage analytics
- User activity logs
- Compliance and audit reports

## 🎯 Best Practices

### **General Usage**
- Keep profile updated
- Follow security practices
- Backup important data
- Stay informed of updates

### **Contract Management**
- Review contracts carefully before signing
- Verify all parties and terms
- Monitor contract progress
- Keep records of activities

### **Data Management**
- Provide accurate metadata
- Set appropriate access controls
- Monitor data usage
- Ensure compliance

## 📞 Support

### **Documentation**
- User Guide (this document)
- Quick Start Guide
- API Documentation
- Video Tutorials

### **Support Channels**
- Help Desk
- Technical Support
- User Support
- Emergency Support

---

### **Related documents**
- **System overview**: `docs/SYSTEM_OVERVIEW.md`
- **Technical reference**: `docs/TECHNICAL_REFERENCE.md`
- **API reference**: `docs/API_REFERENCE.md`