# User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Authentication](#authentication)
5. [Contract Management](#contract-management)
6. [DID Management](#did-management)
7. [Profile Management](#profile-management)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

## Introduction

The Contract Management System is a secure platform for managing data sharing contracts between Training Data Providers (TDP), Training Data Consumers (TDC), and Confidential Clean Room Providers (CCRP). This guide will help you navigate the system and understand its features.

### Key Features
- **Secure Authentication**: Enterprise-grade IAM integration
- **Contract Management**: Create and manage Ricardian contracts
- **DID Integration**: Decentralized identifier support
- **Role-based Access**: Different permissions for different user types
- **Real-time Notifications**: Stay updated on contract status

## Getting Started

### System Requirements
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Internet Connection**: Stable internet connection required
- **JavaScript**: Must be enabled in your browser

### Accessing the System
1. **Open your browser** and navigate to the system URL
2. **Register an account** or log in with existing credentials
3. **Complete your profile** with required information
4. **Verify your email** address (if required)

### First-Time Setup
1. **Account Registration**
   - Click "Register" on the login page
   - Fill in your details (name, email, organization)
   - Choose your role (TDP, TDC, or CCRP)
   - Set a strong password

2. **Email Verification**
   - Check your email for verification link
   - Click the link to verify your account
   - Return to the system and log in

3. **Profile Completion**
   - Add your organization details
   - Upload any required documents
   - Set up your DID (if applicable)

## User Roles

### Training Data Provider (TDP)
**Purpose**: Organizations that provide training datasets for AI model development.

**Capabilities**:
- Upload and manage datasets
- Set access permissions for datasets
- Review contract requests from TDCs
- Monitor dataset usage and analytics
- Manage DID credentials

**Key Features**:
- Dataset management dashboard
- Contract approval workflow
- Usage analytics and reporting
- DID integration for identity verification

### Training Data Consumer (TDC)
**Purpose**: Organizations that need training data for AI model development.

**Capabilities**:
- Browse available datasets
- Create contract requests
- Manage active contracts
- Track contract status and progress
- Access approved datasets

**Key Features**:
- Dataset discovery and search
- Contract creation wizard
- Contract status tracking
- DID-based identity management

### Confidential Clean Room Provider (CCRP)
**Purpose**: Organizations that provide secure environments for data processing.

**Capabilities**:
- Approve contract requests
- Provide secure processing environments
- Monitor contract execution
- Ensure compliance and security
- Manage access controls

**Key Features**:
- Contract approval dashboard
- Security monitoring tools
- Compliance reporting
- Access control management

## Authentication

### Login Process
1. **Navigate to Login Page**
   - Enter your email address
   - Enter your password
   - Click "Login"

2. **Two-Factor Authentication** (if enabled)
   - Enter the code from your authenticator app
   - Or use SMS verification

3. **Session Management**
   - Sessions automatically expire after inactivity
   - You can manually log out anytime
   - Tokens are automatically refreshed

### Password Management
1. **Strong Password Requirements**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Cannot be common passwords

2. **Password Reset**
   - Click "Forgot Password" on login page
   - Enter your email address
   - Check email for reset link
   - Create new password

3. **Password Security**
   - Never share your password
   - Use unique passwords for different accounts
   - Enable two-factor authentication if available

### Account Security
- **Session Timeout**: Automatic logout after inactivity
- **Failed Login Protection**: Account lockout after multiple failed attempts
- **Audit Logging**: All login attempts are logged
- **Device Management**: View and manage active sessions

## Contract Management

### Creating Contracts (TDC Users)

#### Step 1: Select Dataset
1. **Browse Available Datasets**
   - Use search and filter options
   - Review dataset descriptions and metadata
   - Check access requirements and restrictions

2. **Select Target Dataset**
   - Click on the dataset you want to access
   - Review detailed information
   - Check pricing and terms

#### Step 2: Choose AI Model
1. **Select Model Type**
   - Choose from available AI model types
   - Review model specifications
   - Check compatibility with selected dataset

2. **Model Configuration**
   - Configure model parameters
   - Set training requirements
   - Define performance expectations

#### Step 3: Create Contract
1. **Fill Contract Details**
   - Enter contract title and description
   - Set contract duration
   - Define usage terms and conditions

2. **Review and Submit**
   - Review all contract details
   - Accept terms and conditions
   - Submit contract for approval

### Managing Contracts

#### Contract Status Tracking
- **Pending CCRP Approval**: Waiting for CCRP to approve
- **Active**: Contract is active and data access is available
- **Completed**: Contract has been successfully completed
- **Terminated**: Contract has been terminated

#### Contract Actions
- **View Details**: Access full contract information
- **Download Documents**: Get contract documents
- **Update Status**: Update contract progress
- **Terminate**: End contract early (if permitted)

### Contract Approval (CCRP Users)

#### Review Process
1. **Review Contract Details**
   - Check TDC and TDP information
   - Review dataset and model specifications
   - Assess security requirements

2. **Security Assessment**
   - Evaluate data sensitivity
   - Check compliance requirements
   - Assess processing environment needs

3. **Approval Decision**
   - Approve with conditions
   - Request modifications
   - Reject with explanation

## DID Management

### Understanding DIDs
**DID (Decentralized Identifier)** is a new type of identifier that enables verifiable digital identity.

### Creating Your DID
1. **Access DID Management**
   - Go to your profile settings
   - Navigate to DID management section
   - Click "Create New DID"

2. **Choose DID Method**
   - **did:web**: Web-based DID
   - **did:key**: Key-based DID
   - **did:github**: GitHub-based DID

3. **Generate Keys**
   - System generates cryptographic keys
   - Store keys securely
   - Verify DID creation

### DID Verification
1. **Automatic Verification**
   - System verifies DID authenticity
   - Checks key ownership
   - Validates DID document

2. **Manual Verification**
   - Verify DID with external tools
   - Check DID resolution
   - Validate cryptographic proofs

### DID Usage
- **Identity Verification**: Use DID for secure authentication
- **Contract Signing**: Sign contracts with your DID
- **Access Control**: Use DID for fine-grained permissions
- **Audit Trail**: Track all DID-based activities

## Profile Management

### Updating Profile Information
1. **Personal Information**
   - Update name and contact details
   - Add organization information
   - Upload profile picture

2. **Professional Details**
   - Add job title and department
   - Include professional credentials
   - Specify areas of expertise

3. **Security Settings**
   - Change password
   - Enable two-factor authentication
   - Manage notification preferences

### Organization Management
1. **Organization Details**
   - Add organization name and type
   - Include industry classification
   - Specify compliance requirements

2. **Contact Information**
   - Add business address
   - Include phone numbers
   - Specify preferred contact methods

3. **Documentation**
   - Upload business licenses
   - Include compliance certificates
   - Add relevant documentation

### Notification Preferences
- **Email Notifications**: Contract updates, approvals, etc.
- **SMS Notifications**: Important alerts and reminders
- **In-App Notifications**: Real-time updates
- **Digest Reports**: Weekly/monthly summaries

## Troubleshooting

### Common Issues

#### Login Problems
1. **Forgot Password**
   - Use "Forgot Password" link
   - Check email for reset instructions
   - Create new password

2. **Account Locked**
   - Wait for lockout period to expire
   - Contact support if needed
   - Reset password if necessary

3. **Session Expired**
   - Log in again
   - Check "Remember Me" option
   - Clear browser cache if needed

#### Contract Issues
1. **Contract Not Appearing**
   - Check contract status
   - Verify user permissions
   - Contact support if needed

2. **Cannot Create Contract**
   - Verify user role (TDC only)
   - Check dataset availability
   - Ensure profile is complete

3. **Contract Approval Delays**
   - Check CCRP availability
   - Review contract details
   - Contact CCRP directly if needed

#### DID Problems
1. **DID Verification Failed**
   - Check DID format
   - Verify key ownership
   - Regenerate DID if needed

2. **DID Not Working**
   - Check DID resolution
   - Verify network connectivity
   - Contact support

### Getting Help
1. **System Documentation**
   - Check this user guide
   - Review FAQ section
   - Search help articles

2. **Contact Support**
   - Use in-app support chat
   - Send email to support team
   - Call support hotline

3. **Community Resources**
   - Join user forums
   - Check community documentation
   - Attend training sessions

## FAQ

### General Questions

**Q: What is the Contract Management System?**
A: It's a secure platform for managing data sharing contracts between TDPs, TDCs, and CCRPs with blockchain and DID integration.

**Q: How do I get started?**
A: Register an account, complete your profile, verify your email, and start using the system based on your role.

**Q: Is my data secure?**
A: Yes, the system uses enterprise-grade security with encryption, IAM integration, and audit logging.

### Authentication Questions

**Q: I forgot my password. What should I do?**
A: Use the "Forgot Password" link on the login page to reset your password via email.

**Q: Can I use two-factor authentication?**
A: Yes, you can enable 2FA in your profile settings for additional security.

**Q: How long do sessions last?**
A: Sessions typically last 8 hours but may vary based on security settings.

### Contract Questions

**Q: Who can create contracts?**
A: Only TDC (Training Data Consumer) users can create contracts.

**Q: How long does contract approval take?**
A: Approval time varies but typically takes 1-3 business days.

**Q: Can I modify a contract after creation?**
A: Contracts can only be modified before approval. Contact support for assistance.

### DID Questions

**Q: What is a DID?**
A: A Decentralized Identifier is a new type of identifier that enables verifiable digital identity.

**Q: Do I need a DID to use the system?**
A: DIDs are optional but recommended for enhanced security and identity verification.

**Q: How do I create a DID?**
A: Go to your profile settings, navigate to DID management, and follow the creation wizard.

### Technical Questions

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions) are supported.

**Q: Can I access the system from mobile devices?**
A: Yes, the system is responsive and works on mobile devices.

**Q: What if I encounter technical issues?**
A: Contact support through the in-app chat, email, or phone for assistance.

---

*This user guide provides comprehensive information for all users of the Contract Management System.* 