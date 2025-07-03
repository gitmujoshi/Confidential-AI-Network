# User Guide
## How to Use the Contract Management System

**Document Version:** 2.0  
**Date:** December 2024  
**Author:** Contract Management System Team

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Registration](#user-registration)
3. [DID Management](#did-management)
4. [Profile Management](#profile-management)
5. [Contract Management](#contract-management)
6. [Dataset Management](#dataset-management)
7. [Notifications](#notifications)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## 1. Getting Started

### System Overview
The Contract Management System is a blockchain-based platform that enables secure, verifiable contract creation and management between Training Data Providers (TDPs), Training Data Consumers (TDCs), and Confidential Clean Room Providers (CCRPs).

### User Roles
- **TDP (Training Data Provider)**: Organizations that own and provide training datasets
- **TDC (Training Data Consumer)**: Organizations that purchase and use training data
- **CCRP (Confidential Clean Room Provider)**: Independent reviewers who validate contracts for compliance

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- MetaMask or compatible Web3 wallet extension
- Access to the platform URL
- Valid email address for account verification

---

## 2. User Registration

### Step 1: Access the Platform
1. Navigate to the platform URL in your web browser
2. Click "Create Account" or "Register" to begin the registration process

### Step 2: Connect Your Wallet
1. Click "Connect MetaMask" to link your wallet
2. Approve the connection request in MetaMask
3. Ensure your wallet is connected to the correct network (Goerli for testing, Mainnet for production)

### Step 3: DID Selection
You have two options for your digital identity:

#### Option A: Use System-Generated DID
- Leave the "I have an existing DID" option unchecked
- The system will automatically create a new DID for you
- This DID will be linked to your wallet address
- Suitable for new users or those without existing DIDs

#### Option B: Use Your Existing DID
- Check the "I have an existing DID" option
- Enter your existing DID in the provided field
- Click "Verify DID Ownership" to prove you control the DID
- Sign the verification message with your wallet
- This maintains your digital identity across platforms

### Step 4: Complete Registration
1. Fill in your personal information (name, email, organization)
2. Select your role (TDP, TDC, or CCRP)
3. Add additional profile information (phone, website, location)
4. Review and submit your registration

### Step 5: Email Verification
1. Check your email for a verification link
2. Click the link to verify your email address
3. Return to the platform to complete onboarding

---

## 3. DID Management

### Understanding DIDs
A Decentralized Identifier (DID) is your digital identity on the blockchain. It's like a digital passport that proves who you are without revealing personal information.

### DID Types
- **System-Generated DIDs**: Created automatically by the platform
- **User-Provided DIDs**: DIDs you bring from other platforms or create yourself

### DID Verification
When you provide an existing DID, the system verifies your ownership by:
1. Checking the DID format is correct
2. Ensuring the DID isn't already registered
3. Requiring you to sign a message with your wallet
4. Verifying the signature matches your DID

### DID Benefits
- **Identity Continuity**: Use the same identity across platforms
- **Self-Sovereign**: You control your own identity
- **Privacy-Preserving**: Choose what information to reveal
- **Verifiable**: Cryptographic proof of identity

### Managing Your DID
- View your DID information in your profile
- Check verification status
- Update DID if needed (contact support)
- Monitor DID activity and usage

---

## 4. Profile Management

### Accessing Your Profile
1. Log into the platform
2. Click on your name or avatar in the top navigation
3. Select "Profile" or "Account Settings"

### Profile Information
- **Personal Details**: Name, email, phone number
- **Organization**: Company name, job title, department
- **Contact Information**: Website, location, description
- **Identity Information**: DID, wallet address, verification status

### Updating Your Profile
1. Click "Edit Profile" or the edit icon
2. Modify the information you want to change
3. Save your changes
4. Some fields may require verification before updating

### Profile Completion
- Complete profiles have better visibility in the system
- Some features require a complete profile
- Profile completion status is shown in your dashboard

---

## 5. Contract Management

### Creating Contracts (TDC Role)

#### Step 1: Browse Datasets
1. Navigate to the "Datasets" section
2. Browse available datasets from TDPs
3. Review dataset descriptions, pricing, and terms
4. Select a dataset that meets your needs

#### Step 2: Select CCRP
1. Choose a Confidential Clean Room Provider for contract review
2. Review CCRP profiles and compliance history
3. Select a CCRP that meets your requirements

#### Step 3: Create Contract
1. Click "Create Contract" on your selected dataset
2. Fill in contract details and terms
3. Review all information carefully
4. Submit the contract for review

#### Step 4: Sign Contract
1. Review the contract terms
2. Sign the contract using your wallet
3. Wait for other parties to sign
4. Monitor contract status

### Managing Contracts (TDP Role)

#### Auto-Signing
- TDP contracts are automatically signed when created by TDCs
- You'll receive notifications when contracts are created
- Review contract history in your dashboard

#### Contract Monitoring
- Track all contracts involving your datasets
- Monitor contract status and execution
- View payment and usage analytics

### Reviewing Contracts (CCRP Role)

#### Contract Review Process
1. Receive notifications for new contract reviews
2. Review contract terms and conditions
3. Verify compliance with regulations
4. Sign contracts after approval
5. Maintain audit trail of decisions

#### Compliance Validation
- Check data privacy requirements
- Verify security measures
- Ensure regulatory compliance
- Document review decisions

---

## 6. Dataset Management

### Creating Datasets (TDP Role)

#### Step 1: Dataset Information
1. Navigate to "My Datasets" section
2. Click "Create New Dataset"
3. Enter dataset name and description
4. Specify data type and format

#### Step 2: Access Controls
1. Set access permissions and restrictions
2. Define usage terms and conditions
3. Specify pricing and payment terms
4. Set data retention policies

#### Step 3: Upload and Publish
1. Upload dataset files or provide access links
2. Review all information
3. Publish the dataset
4. Monitor access and usage

### Managing Existing Datasets
- Update dataset information
- Modify access controls
- Monitor usage and analytics
- Handle access requests

---

## 7. Notifications

### Notification Types
- **Contract Updates**: New contracts, signatures, status changes
- **Profile Updates**: Verification status, profile completion
- **System Alerts**: Security notices, maintenance updates
- **DID Updates**: Verification status, ownership changes

### Managing Notifications
- View notifications in the notification center
- Mark notifications as read
- Configure notification preferences
- Set up email notifications

### Email Notifications
- Contract status updates
- Profile verification confirmations
- Security alerts
- System maintenance notices

---

## 8. Security Best Practices

### Wallet Security
- **Never share your private keys** with anyone
- **Use hardware wallets** for high-value operations
- **Keep your wallet software updated**
- **Backup your wallet securely**

### Account Security
- **Use strong passwords** for your account
- **Enable two-factor authentication** if available
- **Log out when not using the platform**
- **Monitor account activity regularly**

### DID Security
- **Verify your DID ownership** regularly
- **Keep your DID credentials secure**
- **Monitor DID usage and activity**
- **Report suspicious activity immediately**

### General Security
- **Use secure networks** (avoid public WiFi)
- **Keep your browser updated**
- **Be cautious of phishing attempts**
- **Report security issues to support**

---

## 9. Troubleshooting

### Common Issues

#### Wallet Connection Problems
- **Issue**: MetaMask not connecting
- **Solution**: Check if MetaMask is installed and unlocked
- **Solution**: Ensure you're on the correct network
- **Solution**: Try refreshing the page and reconnecting

#### DID Verification Issues
- **Issue**: DID verification failing
- **Solution**: Ensure your wallet address matches your DID
- **Solution**: Try signing the verification message again
- **Solution**: Check if your DID is still active and resolvable

#### Contract Signing Problems
- **Issue**: Unable to sign contracts
- **Solution**: Ensure your wallet is connected and unlocked
- **Solution**: Check if you have sufficient funds for gas fees
- **Solution**: Verify you're on the correct network

#### Profile Update Issues
- **Issue**: Cannot update profile information
- **Solution**: Check if all required fields are filled
- **Solution**: Ensure your email is verified
- **Solution**: Contact support if issues persist

### Getting Help
1. **Check the FAQ**: Common solutions are documented
2. **Review error messages**: Look for specific error details
3. **Contact support**: Provide detailed information about the issue
4. **Community forum**: Ask questions in the user community

### Support Information
- **Email**: support@contractmanagement.com
- **Documentation**: Check the guides and FAQs
- **Community**: Join the user community forum
- **Emergency**: Contact support for urgent issues

---

## 10. Advanced Features

### Multi-DID Support
- Link multiple DIDs to your account
- Use different DIDs for different purposes
- Manage DID permissions and access

### Contract Templates
- Save frequently used contract terms
- Create standardized contract templates
- Speed up contract creation process

### Analytics and Reporting
- View contract analytics and metrics
- Generate compliance reports
- Monitor system usage and performance

### API Access
- Programmatic access to platform features
- Integration with external systems
- Automated contract management

---

**Note**: This guide is continuously updated. For the latest information, check the platform documentation or contact support.

**User Guide End** 