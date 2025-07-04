# DID Management Guide
## Understanding and Managing Decentralized Identifiers

**Document Version:** 2.0  
**Date:** December 2024  
**Author:** Contract Management System Team

---

## Table of Contents

1. [What is a DID?](#what-is-a-did)
2. [Types of DIDs](#types-of-dids)
3. [DID Creation Process](#did-creation-process)
4. [DID Verification](#did-verification)
5. [Managing Your DID](#managing-your-did)
6. [DID Security](#did-security)
7. [Troubleshooting DIDs](#troubleshooting-dids)
8. [Best Practices](#best-practices)
9. [Choosing the Right DID Method](#choosing-the-right-did-method)

---

## 1. What is a DID?

### Understanding Decentralized Identifiers
A Decentralized Identifier (DID) is your digital identity on the blockchain or web. Think of it as a digital passport that proves who you are without revealing personal information. Unlike traditional usernames or email addresses, DIDs are:

- **Self-owned**: You control your DID completely
- **Portable**: You can use the same DID across different platforms
- **Verifiable**: Others can prove you are who you claim to be
- **Privacy-preserving**: You choose what information to share

### How DIDs Work
A DID consists of three main parts:
1. **DID Method**: The type of DID (like Ethereum, Web-based, etc.)
2. **Network/Domain**: The blockchain network or web domain where the DID is registered
3. **Identifier**: A unique string that identifies you

For example:
- Ethereum DID: `did:ethr:goerli:0x1234567890abcdef...`
- Web DID: `did:web:company.com:user:alice`

---

## 2. Types of DIDs

### Web DIDs (did:web) - Primary Recommendation for Enterprise
These are hosted on web domains and are the **primary choice** for enterprise environments:
- **Domain-based**: Tied to a specific website or organization
- **Enterprise control**: Organizations control their own DID space
- **Cost-effective**: No blockchain gas fees or complex infrastructure
- **Fast resolution**: Standard HTTP requests with caching
- **Integration friendly**: Works with existing web infrastructure
- **Security**: Leverages existing domain security and SSL certificates
- **Compliance**: Meets enterprise security and audit requirements
- **Scalability**: Easy to manage thousands of organizational DIDs

**Examples:**
- Organization main DID: `did:web:company.com`
- Department DID: `did:web:company.com:legal`
- Employee DID: `did:web:company.com:employees:john.doe`
- Role-based DID: `did:web:company.com:roles:compliance-officer`
- Partner organization: `did:web:partner.com:company:integration`

**Best for:**
- **Enterprise organizations** with web domains
- **Large-scale identity management**
- **Cost-conscious implementations**
- **Integration with existing enterprise systems**
- **Centralized identity control**
- **Compliance and audit requirements**
- **Multi-department organizations**

### Ethereum DIDs (did:ethr) - For Blockchain Operations
These are used for blockchain-specific operations and individual users:
- **Based on wallet address**: Your DID is derived from your Ethereum wallet
- **Blockchain-native**: Designed for blockchain applications
- **Self-sovereign**: Individual control over identity
- **Network-specific**: Different networks have different DIDs
- **Cryptographic proof**: Built-in cryptographic verification

**Examples:**
- Test network: `did:ethr:goerli:0x1234567890abcdef...`
- Main network: `did:ethr:mainnet:0x1234567890abcdef...`
- Polygon network: `did:ethr:polygon:0x1234567890abcdef...`

**Best for:**
- **Blockchain-specific operations**
- **Individual users** with Ethereum wallets
- **Cross-platform blockchain applications**
- **Users who want full decentralized control**
- **Smart contract interactions**

### Key-based DIDs (did:key)
These are self-contained DIDs that include the public key:
- **Self-contained**: All information is in the DID itself
- **No external dependencies**: Don't need a blockchain or web server
- **Portable**: Easy to move between systems
- **Simple**: Good for basic identity needs

**Example:** `did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK`

---

## 3. DID Creation Process

### Enterprise DID Creation (did:web) - Primary Method
For enterprise organizations, the system creates `did:web` DIDs based on your organization's domain:

1. **Domain Verification**: The system verifies your organization owns the domain
2. **DID Generation**: A new `did:web` is created using your domain
3. **Document Creation**: A DID document is created with your organization's information
4. **Web Hosting**: The DID document is hosted at `https://yourdomain.com/.well-known/did.json`
5. **SSL Verification**: The system ensures HTTPS is properly configured
6. **Database Storage**: The DID is stored securely in the database
7. **IAM Integration**: The DID is linked to your enterprise IAM system

**Benefits:**
- **Enterprise control** over identity infrastructure
- **No blockchain fees** or complex setup
- **Fast resolution** and verification
- **Integration** with existing web infrastructure
- **Compliance** with enterprise security policies
- **Scalability** for large organizations

### System-Generated DIDs (did:ethr) - For Blockchain Operations
When you register for blockchain operations without providing an existing DID:

1. **Wallet Connection**: You connect your MetaMask wallet
2. **Address Extraction**: The system uses your wallet address
3. **DID Generation**: A new `did:ethr` is created based on your address
4. **Storage**: The DID is stored securely in the database
5. **Linking**: Your DID is linked to your user account

**Benefits:**
- No setup required
- Automatically managed
- Secure and reliable
- Easy to use
- Fully decentralized

### User-Provided DIDs (did:ethr or did:web)
If you have an existing DID from another platform, you can use it:

1. **DID Entry**: You enter your existing DID
2. **Format Validation**: The system checks the DID format
3. **Ownership Verification**: You prove you control the DID
4. **Registration**: The DID is linked to your account
5. **Verification**: The system verifies the DID is active

**Benefits:**
- Maintains your digital identity
- Works across multiple platforms
- Builds reputation over time
- Supports self-sovereign identity

### Organization DID Setup (did:web)
For organizations wanting to use `did:web`:

1. **Domain Ownership**: Organization owns a web domain
2. **Web Server Setup**: Configure HTTPS web server
3. **DID Document Creation**: Create DID documents for users
4. **DNS Configuration**: Ensure proper domain resolution
5. **SSL Certificate**: Install valid SSL certificate
6. **User Registration**: Users register with organization DIDs

**Example Setup:**
```
https://company.com/.well-known/did.json
```

---

## 4. DID Verification

### Why Verification is Important
DID verification ensures that:
- You actually control the DID you're claiming
- The DID is valid and active
- No one else is using the same DID
- The DID follows proper standards

### The Verification Process
When you provide an existing DID, the system verifies it through several steps:

1. **Format Check**: Ensures the DID follows the correct format
2. **Uniqueness Check**: Confirms no one else has registered this DID
3. **Ownership Proof**: Requires you to sign a message with your wallet
4. **DID Resolution**: Verifies the DID exists and is active
5. **Document Validation**: Checks the DID's structure and content

### How Ownership Verification Works

#### For did:ethr:
The system creates a special message that includes:
- Your DID
- Your wallet address
- Current timestamp
- A unique verification request

You sign this message with your wallet, proving you control both the DID and the wallet.

#### For did:web:
The system verifies:
- The DID document exists at the expected URL
- The DID document is valid and properly formatted
- The organization controls the domain
- The SSL certificate is valid

---

## 5. Managing Your DID

### Viewing Your DID Information
You can view your DID details in your profile:
- **DID String**: Your complete DID
- **DID Method**: Whether it's `did:ethr` or `did:web`
- **DID Source**: Whether it was system-generated or user-provided
- **Verification Status**: Whether your DID has been verified
- **Verification Method**: How the verification was performed
- **Creation Date**: When the DID was created or linked

### DID Status Tracking
Your DID can have different statuses:
- **Active**: Your DID is working normally
- **Pending Verification**: Waiting for ownership verification
- **Verification Failed**: Ownership verification was unsuccessful
- **Suspended**: Temporarily disabled (rare)
- **Revoked**: Permanently disabled (rare)

### Updating Your DID
In most cases, your DID remains the same throughout your time on the platform. However, you may need to update it if:
- You change your wallet address (for `did:ethr`)
- Your organization changes domains (for `did:web`)
- Your DID becomes compromised
- You want to use a different DID method
- You're migrating from another platform

**Note**: DID updates require careful consideration and may affect your digital identity across multiple platforms.

---

## 6. DID Security

### Protecting Your DID
Your DID is a valuable digital asset. Here's how to protect it:

#### For did:ethr:
- **Never share your private keys** with anyone
- **Use hardware wallets** for high-value DIDs
- **Backup your keys** securely
- **Use multi-signature** setups when possible

#### For did:web:
- **Secure web server**: Ensure your web server is properly secured
- **HTTPS only**: Always use HTTPS for DID document hosting
- **Domain security**: Protect your domain registration
- **SSL certificates**: Keep SSL certificates up to date

#### General DID Management
- **Regular audits**: Periodically verify your DID is still valid
- **Key rotation**: Rotate keys according to security policies
- **Access control**: Limit who can use your DID
- **Monitoring**: Monitor for unauthorized DID usage

#### Platform Security
- **HTTPS only**: Ensure all connections use HTTPS
- **Token security**: Keep authentication tokens secure
- **Session management**: Log out when not using the platform
- **Device security**: Use secure devices for DID operations

### Security Best Practices

#### Before Using Your DID
1. **Verify your DID**: Ensure it's still active and valid
2. **Check permissions**: Verify you have full control
3. **Backup credentials**: Ensure you can recover access
4. **Test on testnet**: Test the integration on testnet first (for `did:ethr`)

#### During DID Operations
1. **Use secure networks**: Avoid public WiFi
2. **Verify URLs**: Ensure you're on the correct website
3. **Check certificates**: Verify SSL certificates
4. **Monitor transactions**: Watch for unexpected activity

#### After DID Operations
1. **Verify linkage**: Confirm your DID is properly linked
2. **Test functionality**: Ensure all features work
3. **Monitor activity**: Watch for unusual account activity
4. **Update security**: Implement any recommended security measures

---

## 7. Troubleshooting DIDs

### Common Issues and Solutions

#### "Invalid DID Format" Error
**Problem**: The system doesn't recognize your DID format
**Solutions**:
- Check that your DID starts with `did:`
- Ensure the method is supported (ethr, web, key, etc.)
- Verify the identifier part is correct
- Make sure there are no extra spaces or characters

#### "DID Already Registered" Error
**Problem**: Someone else has already registered this DID
**Solutions**:
- Check if you've already registered with this DID
- Contact support if you believe this is an error
- Consider using a different DID if available
- Verify you're using the correct DID

#### "DID Verification Failed" Error
**Problem**: The system can't verify you own the DID
**Solutions**:
- For `did:ethr`: Ensure your wallet address matches the DID controller
- For `did:web`: Verify the DID document is accessible and valid
- Try signing the verification message again
- Check if your DID is still active and resolvable
- Verify your private key is accessible
- Make sure you're on the correct network

#### "DID Not Resolvable" Error
**Problem**: The system can't find your DID
**Solutions**:
- Check if the DID method is supported
- For `did:ethr`: Verify the DID exists on the blockchain/registry
- For `did:web`: Verify the DID document is hosted at the correct URL
- Ensure you're connected to the correct network
- Try resolving the DID manually using a DID resolver

### Network-Specific Issues

#### Goerli Testnet Issues (did:ethr)
- Ensure your wallet is connected to Goerli network
- Verify you have Goerli test ETH for transactions
- Check if the DID was created on Goerli
- Make sure the DID registry is accessible

#### Mainnet Issues (did:ethr)
- Ensure your wallet is connected to Ethereum mainnet
- Verify you have sufficient ETH for transactions
- Be aware of mainnet gas costs
- Check network congestion

#### Web Server Issues (did:web)
- Ensure the web server is running and accessible
- Verify the DID document is at the correct path
- Check SSL certificate validity
- Ensure proper DNS resolution
- Verify the web server supports HTTPS

### Getting Help
If you encounter persistent issues:

1. **Check the FAQ**: Common solutions are documented
2. **Review logs**: Check browser console for error details
3. **Contact support**: Provide your DID and error details
4. **Community forum**: Ask questions in the community

---

## 8. Best Practices

### DID Selection
- **Choose the right method**: Select a DID method that fits your needs
- **Consider portability**: Think about using the same DID across platforms
- **Plan for the future**: Consider long-term DID management
- **Test thoroughly**: Test your DID before using it in production

### DID Management
- **Keep records**: Maintain a record of all your DIDs
- **Regular verification**: Periodically verify your DID is still valid
- **Backup strategies**: Have backup plans for DID recovery
- **Update procedures**: Plan for DID updates and migrations

### Security Practices
- **Use strong authentication**: Implement multi-factor authentication
- **Monitor activity**: Regularly check DID usage and activity
- **Report issues**: Report suspicious activity immediately
- **Stay informed**: Keep up with DID security best practices

### Compliance Considerations
- **Regulatory requirements**: Ensure your DID meets regulatory requirements
- **Audit trails**: Maintain proper audit trails for DID usage
- **Data protection**: Follow data protection regulations
- **Industry standards**: Adhere to industry standards and best practices

---

## 9. Choosing the Right DID Method

### For Enterprise Organizations: Choose did:web (Primary Recommendation)
**When to use did:web:**
- Your organization owns a web domain
- You need enterprise-grade identity management
- Cost and complexity are primary concerns
- You want to integrate with existing enterprise systems
- You need fast DID resolution and verification
- You require compliance with enterprise security policies
- You manage large numbers of users across departments
- You want centralized control over identity infrastructure

**Benefits:**
- **Enterprise control** over identity space
- **Cost-effective** - no blockchain fees
- **Fast resolution** via HTTP requests
- **Easy integration** with existing web infrastructure
- **Compliance** with enterprise security requirements
- **Scalability** for large organizations
- **SSL/TLS security** leveraging existing certificates
- **Audit trails** and enterprise logging

### For Individual Users and Blockchain Operations: Choose did:ethr
**When to use did:ethr:**
- You have an Ethereum wallet (MetaMask, etc.)
- You need to perform blockchain-specific operations
- You want full decentralized control over your identity
- You use blockchain applications regularly
- You want cross-platform portability
- You're comfortable with blockchain technology
- You need cryptographic proof for smart contracts

**Benefits:**
- Self-sovereign identity
- No central authority
- Works with existing wallets
- Widely supported in blockchain ecosystem
- Fully decentralized
- Built-in cryptographic verification

### Comparison Table

| Feature | did:web | did:ethr |
|---------|---------|----------|
| **Primary Use** | **Enterprise identity** | Blockchain operations |
| **Infrastructure** | Web servers (existing) | Ethereum blockchain |
| **Cost** | **Hosting costs only** | Gas fees + infrastructure |
| **Speed** | **Fast (HTTP + caching)** | Slower (blockchain) |
| **Control** | **Organization control** | Individual wallet control |
| **Decentralization** | Organization-controlled | Fully decentralized |
| **Setup Complexity** | **Simple (web hosting)** | Moderate (blockchain) |
| **Enterprise Integration** | **Native support** | Limited integration |
| **Compliance** | **Enterprise-ready** | Blockchain-focused |
| **Scalability** | **High (thousands of users)** | Individual-focused |
| **Security** | **SSL/TLS + enterprise** | Cryptographic only |
| **Audit Trails** | **Enterprise logging** | Blockchain transactions |

### Migration Considerations
If you need to switch between DID methods:

1. **Plan carefully**: Consider the impact on your digital identity
2. **Maintain continuity**: Ensure identity continuity during migration
3. **Update systems**: Update all systems that use your DID
4. **Communicate changes**: Inform relevant parties of the change
5. **Test thoroughly**: Test the new DID before full migration

---

## 10. Advanced Features

### Multi-DID Support
You can link multiple DIDs to your account:
- **Primary DID**: Your main identity for the platform
- **Secondary DIDs**: Additional identities for specific purposes
- **Legacy DIDs**: DIDs from other platforms for migration
- **Recovery DIDs**: Backup DIDs for account recovery

### DID Delegation
You can delegate DID operations to other keys:
- **Temporary access**: Grant temporary access to your DID
- **Limited permissions**: Restrict what delegated keys can do
- **Time limits**: Set expiration dates for delegations
- **Revocation**: Revoke delegations when needed

### DID Recovery
Set up recovery mechanisms for your DID:
- **Recovery DIDs**: Backup DIDs for account recovery
- **Time-locked recovery**: Recovery with time delays
- **Multi-party recovery**: Require multiple parties for recovery
- **Emergency procedures**: Plan for emergency situations

---

## 11. Future Considerations

### DID Evolution
DID technology is constantly evolving:
- **New methods**: New DID methods are being developed
- **Improved security**: Security features are being enhanced
- **Better usability**: User experience is being improved
- **Wider adoption**: DIDs are being adopted by more platforms

### Platform Migration
When migrating between platforms:
- **DID compatibility**: Ensure DIDs are compatible
- **Data migration**: Plan for data migration
- **Identity continuity**: Maintain identity continuity
- **User experience**: Minimize disruption to users

### Long-term Planning
Consider long-term DID management:
- **Key rotation**: Plan for regular key rotation
- **DID updates**: Plan for DID updates and migrations
- **Succession planning**: Plan for DID succession
- **Legacy support**: Plan for legacy DID support

---

**Note**: This guide provides comprehensive information about DID management. For specific technical details or advanced configurations, refer to the technical documentation or contact support.

**DID Management Guide End** 