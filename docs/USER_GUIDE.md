# Contract Management System — User Guide

Last updated: 2026-04-30

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
- **Full onboarding + E2E lifecycle (canonical)**: [`docs/guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md`](guides/PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE.md)
- **Training workflows**: `docs/training/USER_TRAINING_GUIDE.md`
- **Contract signing details**: `docs/CONTRACT_SIGNING_USER_GUIDE.md`
- **Admin operations**: `docs/ADMIN_GUIDE.md`
- **CAN (Confidential AI Network) MVP APIs** (for integration teams): `docs/CAN_QUICKSTART.md`

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
- **Create a contract**: Contracts → Create → choose template → pick datasets → select CCRP → submit
- **Sign contract** (if required): Contracts → Pending Signatures → Sign
- **Run training**: Training → New Job → choose contract + model + parameters → start → monitor progress
- **Review outputs**: Training → Job Detail → download artifacts + reports (and provenance where enabled)

### **TDP (Training Data Provider)**
- **Publish datasets**: Datasets → Upload → metadata + classification + access controls → publish
- **Respond to contract requests**: Contracts → Incoming Requests → review terms → approve/reject
- **Issue access tokens / approvals** (where applicable): Datasets/Contracts → Access controls → grant access
- **Monitor usage**: Analytics/Reports → dataset access + revenue + audit trail

### **CCRP (Confidential Clean Room Provider)**
- **Review contracts for compliance**: Contracts → Review Queue → verify requirements (TEE, residency, policies)
- **Provision environments**: CCRP/Infrastructure → Environments → provision + monitor
- **Training ops**: Training/CCRP views → monitor running jobs, resource utilization, and compliance status

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