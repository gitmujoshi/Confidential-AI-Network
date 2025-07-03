# User Guide
## Contract Management System

**Version:** 2.0  
**Date:** December 2024

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Account Registration](#account-registration)
3. [DID Management](#did-management)
4. [Contract Management](#contract-management)
5. [Dataset Management](#dataset-management)
6. [User Profile](#user-profile)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Overview
The Contract Management System is a blockchain-based platform that enables secure, transparent contract management between Training Data Providers (TDP), Training Data Consumers (TDC), and Confidential Clean Room Providers (CCRP).

### Key Features
- **Decentralized Identity**: Use DIDs for self-sovereign identity
- **Smart Contracts**: Automated contract execution on Ethereum
- **Multi-Party Support**: TDP, TDC, and CCRP roles
- **Enterprise IAM**: Keycloak integration for enterprise security
- **Real-time Tracking**: Live contract status monitoring

### Prerequisites
- **Web Browser**: Chrome, Firefox, Safari, or Edge
- **MetaMask**: Ethereum wallet extension
- **Ethereum Network**: Goerli testnet (for development)
- **Organization Domain**: For web-based DIDs (optional)

---

## Account Registration

### Step 1: Connect Your Wallet
1. Open the application in your browser
2. Click "Connect MetaMask" button
3. Approve the connection in MetaMask
4. Ensure you're connected to the correct network (Goerli testnet for development)

### Step 2: Choose Your DID Method

#### Option A: System-Generated DID (did:ethr)
- **Best for**: Individual users with Ethereum wallets
- **Process**: System automatically creates a DID from your wallet address
- **Format**: `did:ethr:goerli:0x[your-wallet-address]`
- **Benefits**: No setup required, fully decentralized

#### Option B: User-Provided DID (did:ethr)
- **Best for**: Users with existing Ethereum-based DIDs
- **Process**: Enter your existing DID and verify ownership
- **Example**: `did:ethr:mainnet:0x1234567890abcdef...`
- **Benefits**: Maintains identity continuity across platforms

#### Option C: User-Provided DID (did:web)
- **Best for**: Organizations with web domains
- **Process**: Enter your organization's web-based DID
- **Example**: `did:web:company.com:user:alice`
- **Benefits**: Cost-effective, organization-controlled

### Step 3: Complete Registration
1. Fill in your profile information:
   - Full name
   - Email address
   - Organization (optional)
   - Phone number (optional)
   - Website (optional)
   - Location (optional)

2. Select your role:
   - **TDP (Training Data Provider)**: Dataset owners who create and manage datasets
   - **TDC (Training Data Consumer)**: Contract initiators who create contracts
   - **CCRP (Confidential Clean Room Provider)**: Compliance reviewers who sign contracts

3. If using a user-provided DID:
   - Enter your existing DID
   - Verify DID ownership through wallet signature
   - Wait for DID verification to complete

4. Submit registration and wait for confirmation

---

## DID Management

### Understanding DIDs
Decentralized Identifiers (DIDs) are your digital identity on the blockchain or web. They provide:
- **Self-ownership**: You control your identity completely
- **Portability**: Use the same DID across multiple platforms
- **Verifiability**: Others can prove you are who you claim to be
- **Privacy**: You choose what information to share

### DID Method Comparison

| Feature | did:ethr | did:web |
|---------|----------|---------|
| **Best For** | Individual users | Organizations |
| **Infrastructure** | Ethereum blockchain | Web servers |
| **Cost** | Gas fees | Hosting costs |
| **Speed** | Slower (blockchain) | Fast (HTTP) |
| **Control** | Wallet owner | Domain owner |
| **Decentralization** | Fully decentralized | Centralized hosting |
| **Setup** | Simple (wallet) | Moderate (web server) |

### Managing Your DID

#### Viewing DID Information
1. Go to your profile page
2. View your DID details:
   - DID string
   - DID method (ethr or web)
   - Verification status
   - Creation date
   - Last verification date

#### DID Verification Status
- **Active**: Your DID is working normally
- **Pending Verification**: Waiting for ownership verification
- **Verification Failed**: Ownership verification was unsuccessful
- **Suspended**: Temporarily disabled (rare)

#### Updating Your DID
In most cases, your DID remains the same. You may need to update it if:
- You change your wallet address (for did:ethr)
- Your organization changes domains (for did:web)
- Your DID becomes compromised
- You want to use a different DID method

### DID Security Best Practices

#### For did:ethr Users:
- Never share your private keys
- Use hardware wallets for high-value DIDs
- Backup your keys securely
- Use multi-signature setups when possible

#### For did:web Users:
- Ensure your web server is properly secured
- Always use HTTPS for DID document hosting
- Protect your domain registration
- Keep SSL certificates up to date

---

## Contract Management

### Understanding Contract Roles

#### TDP (Training Data Provider)
- **Responsibilities**: Create and manage datasets, set pricing, approve contracts
- **Permissions**: Dataset creation, contract approval, usage analytics
- **Workflow**: Create dataset → Set pricing → Review contract requests → Sign contracts

#### TDC (Training Data Consumer)
- **Responsibilities**: Browse datasets, initiate contracts, manage negotiations
- **Permissions**: Dataset browsing, contract creation, payment management
- **Workflow**: Browse datasets → Initiate contract → Negotiate terms → Sign contract

#### CCRP (Confidential Clean Room Provider)
- **Responsibilities**: Review compliance, verify privacy requirements, sign contracts
- **Permissions**: Compliance review, contract signing, audit access
- **Workflow**: Review contract → Verify compliance → Sign contract → Monitor execution

### Creating a Contract

#### Step 1: Contract Initiation (TDC)
1. Navigate to "Contracts" → "Create Contract"
2. Select the datasets you want to access
3. Choose the TDP (dataset owner)
4. Select a CCRP for compliance review
5. Set contract terms and duration
6. Specify compensation amount
7. Submit contract for review

#### Step 2: TDP Review
1. Receive notification of new contract request
2. Review contract terms and compensation
3. Approve or reject the contract
4. If approved, contract moves to CCRP review

#### Step 3: CCRP Review
1. Receive notification of contract for review
2. Review compliance requirements
3. Verify data privacy measures
4. Approve or reject the contract
5. If approved, contract is ready for signing

#### Step 4: Contract Signing
1. All parties receive signing notification
2. Review final contract terms
3. Sign contract using your DID
4. Contract becomes active upon all signatures

### Managing Contracts

#### Viewing Contracts
- **All Contracts**: See all contracts you're involved in
- **My Contracts**: Filter by your role (TDP, TDC, CCRP)
- **Contract Status**: Track contract lifecycle stages
- **Contract Details**: View full contract information

#### Contract Status Tracking
- **Draft**: Contract being created
- **Pending TDP**: Waiting for TDP approval
- **Pending CCRP**: Waiting for CCRP review
- **Ready to Sign**: All approvals received
- **Active**: Contract is signed and active
- **Completed**: Contract execution finished
- **Cancelled**: Contract was cancelled

#### Contract Actions
- **View Details**: See complete contract information
- **Download**: Export contract as PDF
- **Update Status**: Change contract status (if authorized)
- **Add Comments**: Add notes to contract
- **Request Changes**: Propose contract modifications

---

## Dataset Management

### Creating Datasets (TDP Only)

#### Step 1: Dataset Information
1. Navigate to "Datasets" → "Create Dataset"
2. Enter dataset name and description
3. Select dataset type and format
4. Specify dataset size and characteristics
5. Add metadata and tags

#### Step 2: Access Control
1. Set access permissions
2. Define pricing structure
3. Specify usage terms
4. Set data privacy requirements

#### Step 3: Publication
1. Review dataset information
2. Publish dataset to marketplace
3. Monitor dataset usage and analytics

### Managing Datasets

#### Dataset Dashboard
- **Overview**: Dataset statistics and usage
- **Access Requests**: Review access requests
- **Analytics**: Usage patterns and metrics
- **Revenue**: Earnings from dataset access

#### Dataset Actions
- **Edit**: Update dataset information
- **Pause**: Temporarily disable access
- **Archive**: Remove from marketplace
- **Delete**: Permanently remove dataset

### Browsing Datasets (TDC)

#### Search and Filter
- **Search**: Find datasets by name or description
- **Filter**: Filter by type, format, price, or provider
- **Sort**: Sort by relevance, price, or date

#### Dataset Details
- **Information**: Complete dataset description
- **Pricing**: Cost and payment terms
- **Terms**: Usage and access conditions
- **Provider**: TDP information and rating

---

## User Profile

### Profile Management

#### Personal Information
- **Basic Info**: Name, email, phone number
- **Organization**: Company and role information
- **Location**: Geographic location and timezone
- **Website**: Personal or company website

#### Professional Information
- **Role**: TDP, TDC, or CCRP designation
- **Specializations**: Areas of expertise
- **Experience**: Years of experience and background
- **Certifications**: Professional certifications

#### Security Settings
- **Password**: Change account password
- **Two-Factor Authentication**: Enable MFA
- **Session Management**: Manage active sessions
- **Privacy Settings**: Control data sharing

### Account Settings

#### Notifications
- **Email Notifications**: Contract updates and alerts
- **Push Notifications**: Real-time updates
- **Frequency**: Daily, weekly, or immediate
- **Types**: Contract, dataset, or system notifications

#### Preferences
- **Language**: Interface language
- **Timezone**: Local timezone
- **Currency**: Preferred currency for pricing
- **Theme**: Light or dark mode

---

## Security Best Practices

### Account Security
- **Strong Passwords**: Use complex, unique passwords
- **Two-Factor Authentication**: Enable MFA for all accounts
- **Regular Updates**: Keep software and browsers updated
- **Secure Networks**: Avoid public WiFi for sensitive operations

### DID Security
- **Private Key Protection**: Never share private keys
- **Hardware Wallets**: Use hardware wallets for high-value DIDs
- **Key Backup**: Securely backup your keys
- **Regular Audits**: Periodically verify your DID status

### Contract Security
- **Review Terms**: Carefully review all contract terms
- **Verify Parties**: Confirm the identity of all parties
- **Secure Signing**: Use secure devices for contract signing
- **Audit Trail**: Keep records of all contract activities

### Data Security
- **Access Control**: Only grant necessary permissions
- **Data Encryption**: Ensure data is encrypted in transit
- **Regular Backups**: Backup important data regularly
- **Incident Response**: Know how to report security incidents

---

## Troubleshooting

### Common Issues

#### Wallet Connection Problems
**Problem**: MetaMask won't connect
**Solutions**:
- Ensure MetaMask is installed and unlocked
- Check that you're on the correct network
- Try refreshing the page
- Clear browser cache and cookies

#### DID Verification Issues
**Problem**: DID verification fails
**Solutions**:
- Check DID format is correct
- Ensure wallet address matches DID controller
- Try signing the verification message again
- Verify your DID is still active

#### Contract Creation Problems
**Problem**: Can't create contract
**Solutions**:
- Verify all required fields are filled
- Check that selected parties are valid
- Ensure you have sufficient permissions
- Try refreshing the page

#### Dataset Access Issues
**Problem**: Can't access datasets
**Solutions**:
- Check if you have active contracts
- Verify payment has been made
- Contact the dataset provider
- Check your account status

### Getting Help

#### Self-Service Resources
- **Documentation**: Check the documentation guides
- **FAQ**: Review frequently asked questions
- **Video Tutorials**: Watch step-by-step guides
- **Community Forum**: Ask questions in the community

#### Contact Support
- **Email**: support@contractmanagement.com
- **Live Chat**: Available during business hours
- **Phone**: +1-800-CONTRACT
- **Ticket System**: Submit support tickets

#### Escalation Process
1. **Self-Service**: Try documentation and FAQ first
2. **Community Support**: Ask in community forum
3. **Email Support**: Contact support team
4. **Phone Support**: Call for urgent issues
5. **Escalation**: Request manager review if needed

---

## Advanced Features

### DID Delegation
- **Temporary Access**: Grant temporary access to your DID
- **Limited Permissions**: Restrict what delegated keys can do
- **Time Limits**: Set expiration dates for delegations
- **Revocation**: Revoke delegations when needed

### Multi-Signature Contracts
- **Multiple Signers**: Require multiple parties to sign
- **Threshold Signing**: Set minimum number of required signatures
- **Role-Based Signing**: Different roles have different signing requirements
- **Audit Trail**: Complete record of all signing activities

### Contract Templates
- **Pre-built Templates**: Use standard contract templates
- **Custom Templates**: Create your own templates
- **Template Library**: Access shared template library
- **Version Control**: Track template changes and updates

### Analytics and Reporting
- **Contract Analytics**: Track contract performance
- **Usage Reports**: Monitor dataset usage
- **Revenue Reports**: Track earnings and payments
- **Compliance Reports**: Generate compliance documentation

---

**User Guide End** 