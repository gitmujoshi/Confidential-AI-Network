# Existing DID Integration Guide
## How to Use Your Existing DID with the Contract Management System

**Document Version:** 1.0  
**Date:** December 2024  
**Author:** Contract Management System Team

---

## Table of Contents

1. [Overview](#overview)
2. [Supported DID Methods](#supported-did-methods)
3. [Step-by-Step Integration](#step-by-step-integration)
4. [DID Verification Process](#did-verification-process)
5. [Benefits of Using Existing DIDs](#benefits-of-using-existing-dids)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)

---

## 1. Overview

The Contract Management System supports **Bring Your Own DID (BYODID)**, allowing users to integrate their existing Decentralized Identifiers instead of creating new ones. This maintains your digital identity continuity across different platforms and services.

### What is a DID?
A Decentralized Identifier (DID) is a globally unique identifier that enables verifiable, self-sovereign digital identity. Unlike traditional identifiers, DIDs are:
- **Self-owned**: You control your DID without relying on a central authority
- **Portable**: You can use the same DID across multiple platforms
- **Verifiable**: Cryptographic proofs can verify your identity
- **Privacy-preserving**: You choose what information to reveal

---

## 2. Supported DID Methods

The system currently supports the following DID methods:

### 2.1 Ethereum-based DIDs (did:ethr)
- **Format**: `did:ethr:goerli:0x1234567890abcdef...`
- **Network**: Goerli testnet (for development)
- **Mainnet**: `did:ethr:mainnet:0x1234567890abcdef...`
- **Polygon**: `did:ethr:polygon:0x1234567890abcdef...`

### 2.2 Key-based DIDs (did:key)
- **Format**: `did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK`
- **Use case**: Self-contained DIDs with embedded public keys

### 2.3 Web DIDs (did:web)
- **Format**: `did:web:example.com:user:alice`
- **Use case**: DIDs hosted on web domains

### 2.4 Universal Resolver Support
The system integrates with the Universal DID Resolver, supporting additional DID methods:
- `did:ion` (Microsoft ION)
- `did:sov` (Sovrin)
- `did:btcr` (Bitcoin)
- And many more...

---

## 3. Step-by-Step Integration

### 3.1 Registration with Existing DID

#### Step 1: Prepare Your DID
Ensure you have:
- Your DID string (e.g., `did:ethr:goerli:0x1234567890abcdef...`)
- Access to the private key or wallet that controls the DID
- The DID document (if needed for verification)

#### Step 2: Connect Your Wallet
1. Open the registration page
2. Click "Connect MetaMask" or your preferred wallet
3. Ensure the connected wallet address matches your DID's controller

#### Step 3: Enable Existing DID Option
1. In the registration form, toggle "I have an existing DID"
2. Enter your DID in the provided field
3. The system will validate the DID format

#### Step 4: Verify DID Ownership
1. Click "Verify DID Ownership"
2. Your wallet will prompt you to sign a verification message
3. The message format: `"I, the holder of DID {your-did}, hereby verify ownership with wallet address {wallet-address} on {timestamp}"`
4. Sign the message to prove ownership

#### Step 5: Complete Registration
1. Fill in your profile information
2. Submit the registration form
3. Your existing DID will be linked to your account

### 3.2 DID Verification Process

```javascript
// Example verification message
const message = `I, the holder of DID ${did}, hereby verify ownership with wallet address ${walletAddress} on ${new Date().toISOString()}`;

// User signs this message with their wallet
const signature = await wallet.signMessage(message);

// System verifies the signature
const isValid = await verifySignature(did, walletAddress, signature);
```

---

## 4. DID Verification Process

### 4.1 Automatic Verification
The system performs several verification steps:

1. **Format Validation**: Ensures the DID follows the correct format
2. **Uniqueness Check**: Verifies the DID isn't already registered
3. **Ownership Proof**: Validates the signature against the DID
4. **DID Resolution**: Resolves the DID to verify it exists
5. **Document Validation**: Checks the DID document structure

### 4.2 Manual Verification (if needed)
If automatic verification fails, you may need to:

1. **Provide DID Document**: Submit your DID document manually
2. **Additional Proof**: Provide additional cryptographic proofs
3. **Contact Support**: Reach out for manual verification

### 4.3 Verification Status
Your DID verification status will be one of:
- **PENDING**: Verification in progress
- **VERIFIED**: Successfully verified
- **FAILED**: Verification failed (with reason)
- **REQUIRES_MANUAL**: Manual verification needed

---

## 5. Benefits of Using Existing DIDs

### 5.1 Identity Continuity
- **Single Identity**: Use the same DID across multiple platforms
- **Reputation Building**: Maintain your digital reputation
- **Trust Network**: Leverage existing trust relationships

### 5.2 Enhanced Security
- **Proven Security**: Your DID has already been tested in other environments
- **Key Management**: You control your existing key management practices
- **Audit Trail**: Maintain a consistent audit trail across platforms

### 5.3 Operational Efficiency
- **No Duplication**: Avoid creating multiple identities
- **Faster Onboarding**: Skip the DID creation process
- **Reduced Complexity**: Use familiar identity management tools

### 5.4 Compliance Benefits
- **Regulatory Compliance**: Meet identity requirements across jurisdictions
- **Audit Requirements**: Maintain consistent identity records
- **Risk Management**: Leverage existing risk assessments

---

## 6. Troubleshooting

### 6.1 Common Issues

#### Issue: "Invalid DID Format"
**Solution**: Ensure your DID follows the correct format:
- `did:ethr:goerli:0x1234567890abcdef...` (Ethereum)
- `did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK` (Key-based)

#### Issue: "DID Already Registered"
**Solution**: 
- Check if you've already registered with this DID
- Contact support if you believe this is an error
- Consider using a different DID if available

#### Issue: "DID Verification Failed"
**Solutions**:
1. Ensure your wallet address matches the DID controller
2. Try signing the verification message again
3. Check if your DID is still active and resolvable
4. Verify your private key is accessible

#### Issue: "DID Not Resolvable"
**Solutions**:
1. Check if the DID method is supported
2. Verify the DID exists on the blockchain/registry
3. Ensure you're connected to the correct network
4. Try resolving the DID manually using a DID resolver

### 6.2 Network-Specific Issues

#### Goerli Testnet
- Ensure your wallet is connected to Goerli network
- Verify you have Goerli test ETH for transactions
- Check if the DID was created on Goerli

#### Mainnet
- Ensure your wallet is connected to Ethereum mainnet
- Verify you have sufficient ETH for transactions
- Be aware of mainnet gas costs

### 6.3 Getting Help

If you encounter issues:

1. **Check the FAQ**: Common solutions are documented
2. **Review Logs**: Check browser console for error details
3. **Contact Support**: Provide your DID and error details
4. **Community Forum**: Ask questions in the community

---

## 7. Security Considerations

### 7.1 Private Key Security
- **Never share your private key** with anyone
- **Use hardware wallets** for high-value DIDs
- **Backup your keys** securely
- **Use multi-signature** setups when possible

### 7.2 DID Management
- **Regular audits**: Periodically verify your DID is still valid
- **Key rotation**: Rotate keys according to security policies
- **Access control**: Limit who can use your DID
- **Monitoring**: Monitor for unauthorized DID usage

### 7.3 Platform Security
- **HTTPS only**: Ensure all connections use HTTPS
- **Token security**: Keep authentication tokens secure
- **Session management**: Log out when not using the platform
- **Device security**: Use secure devices for DID operations

### 7.4 Best Practices

#### Before Integration
1. **Verify your DID**: Ensure it's still active and valid
2. **Check permissions**: Verify you have full control
3. **Backup credentials**: Ensure you can recover access
4. **Test on testnet**: Test the integration on testnet first

#### During Integration
1. **Use secure networks**: Avoid public WiFi
2. **Verify URLs**: Ensure you're on the correct website
3. **Check certificates**: Verify SSL certificates
4. **Monitor transactions**: Watch for unexpected activity

#### After Integration
1. **Verify linkage**: Confirm your DID is properly linked
2. **Test functionality**: Ensure all features work
3. **Monitor activity**: Watch for unusual account activity
4. **Update security**: Implement any recommended security measures

---

## 8. Advanced Features

### 8.1 DID Delegation
You can delegate DID operations to other keys:
```json
{
  "delegation": {
    "delegate": "did:ethr:goerli:0xdelegate...",
    "permissions": ["sign", "verify"],
    "expires": "2024-12-31T23:59:59Z"
  }
}
```

### 8.2 Multi-DID Support
Link multiple DIDs to your account:
- **Primary DID**: Main identity for the platform
- **Secondary DIDs**: Additional identities for specific purposes
- **Legacy DIDs**: DIDs from other platforms for migration

### 8.3 DID Recovery
Set up recovery mechanisms:
- **Recovery DIDs**: Backup DIDs for account recovery
- **Time-locked recovery**: Recovery with time delays
- **Multi-party recovery**: Require multiple parties for recovery

---

## 9. API Integration

### 9.1 Programmatic DID Verification
```javascript
// Verify DID ownership via API
const response = await fetch('/api/auth/verify-did', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    did: 'did:ethr:goerli:0x1234567890abcdef...',
    signature: '0x...'
  })
});

const result = await response.json();
console.log('DID verification result:', result);
```

### 9.2 DID Information Retrieval
```javascript
// Get DID information
const response = await fetch('/api/auth/did-info', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const didInfo = await response.json();
console.log('DID information:', didInfo);
```

---

## 10. Migration from Other Platforms

### 10.1 From Traditional Systems
1. **Export your identity**: Get your DID from the old system
2. **Verify ownership**: Prove you control the DID
3. **Import to new system**: Register with your existing DID
4. **Update references**: Update any external references

### 10.2 From Other DID Platforms
1. **Check compatibility**: Ensure the DID method is supported
2. **Export DID document**: Get the complete DID document
3. **Verify on new platform**: Test DID resolution
4. **Migrate credentials**: Transfer any verifiable credentials

### 10.3 From Wallet-Only Systems
1. **Create DID**: Generate a DID from your wallet address
2. **Register DID**: Register the DID on a DID registry
3. **Verify ownership**: Prove you control the wallet
4. **Link to platform**: Connect the DID to the platform

---

**Note**: This guide is continuously updated. For the latest information, check the official documentation or contact support.

**Existing DID Integration Guide End** 