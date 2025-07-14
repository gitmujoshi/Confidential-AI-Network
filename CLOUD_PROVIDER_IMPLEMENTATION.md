# Cloud Provider Implementation for CCRP Users

## Overview

This implementation adds cloud provider support for CCRP (Confidential Clean Room Provider) users, allowing them to specify which cloud service provider they use for confidential computing environments.

## Cloud Providers Supported

### 1. AWS (Amazon Web Services)
- **Technology**: Nitro Enclaves
- **CCRP Users**: 
  - Secure Compute Hub (`secure-compute@example.com`)
  - Cloud Security Solutions (`cloud-security@example.com`)
- **Features**: Hardware-based isolation, secure enclaves for confidential computing

### 2. Azure (Microsoft Azure)
- **Technology**: SGX Enclaves
- **CCRP Users**: 
  - Privacy First Computing (`privacy-first@example.com`)
- **Features**: Intel SGX technology, trusted execution environments

### 3. GCP (Google Cloud Platform)
- **Technology**: Confidential VMs
- **CCRP Users**: 
  - Confidential Computing Lab (`confidential-lab@example.com`)
- **Features**: AMD SEV technology, memory encryption

### 4. OCI (Oracle Cloud Infrastructure)
- **Technology**: Confidential Computing
- **CCRP Users**: 
  - Enterprise Security Hub (`enterprise-security@example.com`)
- **Features**: Oracle's confidential computing platform

## Database Changes

### User Model Updates
- Added `cloudProvider` field to User model
- ENUM type with values: 'AWS', 'Azure', 'GCP', 'OCI'
- Optional field for CCRP users

```javascript
cloudProvider: {
  type: Sequelize.DataTypes.ENUM('AWS', 'Azure', 'GCP', 'OCI'),
  allowNull: true,
  comment: 'Cloud service provider for CCRP users (AWS, Azure, GCP, OCI)'
}
```

## Frontend Updates

### 1. CCRP Dashboard
- Added cloud provider information card
- Displays cloud provider name and description
- Shows cloud provider chip/badge

### 2. Contract Creation
- CCRP selection dropdown shows cloud provider
- Contract review displays selected CCRP's cloud provider
- Enhanced user experience with cloud provider context

## Backend Updates

### 1. CCRP Dashboard API
- Updated `/api/ccrp/dashboard/:userId` to include user info
- Returns cloud provider and description for CCRP users

### 2. User Management
- CCRP users now have cloud provider assignments
- Enhanced user profiles with cloud provider information

## Implementation Files

### Database Migration
- `backend/scripts/add-cloud-provider-support.js` - Main migration script
- `backend/models/User.js` - Updated User model

### Frontend Components
- `frontend/src/pages/dashboards/CCRPDashboard.js` - Updated dashboard
- `frontend/src/pages/CreateContract.js` - Enhanced contract creation

### Backend Routes
- `backend/routes/ccrp.js` - Updated CCRP dashboard route

## Current CCRP Users

| Name | Email | Cloud Provider | Description |
|------|-------|----------------|-------------|
| Secure Compute Hub | secure-compute@example.com | AWS | Leading AWS-based confidential computing provider with Nitro Enclaves |
| Privacy First Computing | privacy-first@example.com | Azure | Microsoft Azure Confidential Computing specialist with SGX enclaves |
| Confidential Computing Lab | confidential-lab@example.com | GCP | Google Cloud Platform confidential computing with Confidential VMs |
| Enterprise Security Hub | enterprise-security@example.com | OCI | Oracle Cloud Infrastructure confidential computing provider |
| Cloud Security Solutions | cloud-security@example.com | AWS | Multi-cloud security provider with AWS Nitro Enclaves expertise |

## Benefits

### 1. User Choice
- TDC users can select CCRP based on preferred cloud provider
- Different cloud providers offer different security features
- Compliance requirements can be met with specific cloud providers

### 2. Enhanced Security
- Each cloud provider has unique confidential computing technology
- AWS Nitro Enclaves vs Azure SGX vs GCP Confidential VMs vs OCI
- Users can choose based on security requirements

### 3. Realistic Implementation
- Mirrors real-world cloud provider diversity
- Enables cloud-specific feature utilization
- Supports multi-cloud strategies

## Future Enhancements

### 1. Cloud-Specific Features
- AWS: Nitro Enclave attestation
- Azure: SGX attestation reports
- GCP: Confidential VM configurations
- OCI: Oracle-specific security features

### 2. Pricing Integration
- Cloud provider-specific pricing models
- Resource utilization tracking per cloud
- Cost optimization recommendations

### 3. Compliance Features
- Cloud provider-specific compliance certifications
- Regional data residency requirements
- Industry-specific compliance (HIPAA, GDPR, etc.)

## Usage

### For TDC Users
1. When creating a contract, select a CCRP
2. View cloud provider information in the dropdown
3. Review cloud provider in contract summary
4. Choose based on security and compliance needs

### For CCRP Users
1. Cloud provider is displayed on dashboard
2. Users can see their cloud provider specialization
3. Enhanced profile with cloud provider context

### For Administrators
1. Manage CCRP users with cloud provider assignments
2. Monitor cloud provider distribution
3. Ensure cloud provider diversity for user choice

## Technical Notes

- Cloud provider is optional for CCRP users
- Backward compatible with existing CCRP users
- Frontend gracefully handles missing cloud provider data
- Database migration is idempotent and safe to run multiple times 