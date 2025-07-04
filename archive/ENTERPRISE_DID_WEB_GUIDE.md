# Enterprise DID:web Support Guide

## Overview

This guide explains how to use and configure `did:web` support for enterprise environments in the Contract Management System. The system now includes advanced features for corporate DID management, domain restrictions, and enterprise-grade verification.

## What is DID:web?

`did:web` is a DID method that allows organizations to host their DID documents on their own web domains. This provides:

- **Self-sovereignty**: Organizations control their own identity infrastructure
- **Domain-based trust**: Leverages existing domain ownership for identity verification
- **Enterprise integration**: Seamless integration with corporate web infrastructure
- **Cost-effective**: No blockchain fees or complex infrastructure required

## Enterprise Features

### 1. Domain Restrictions
Control which domains can be used for DID:web registration:

```bash
# Allow only specific domains
ALLOWED_DID_WEB_DOMAINS=company.com,subsidiary.com,partner.org

# Allow subdomains of specific domains
ALLOWED_DID_WEB_DOMAINS=company.com,*.company.com
```

### 2. Security Configuration
```bash
# Require HTTPS for all DID resolution
REQUIRE_HTTPS=true

# Limit redirects to prevent attacks
MAX_DID_REDIRECTS=3

# Set timeout for resolution
DID_RESOLUTION_TIMEOUT=10000
```

### 3. Enterprise Validation
The system automatically validates DID documents for enterprise use:

- **Service Detection**: Identifies enterprise services (LinkedDomains, LinkedIn, etc.)
- **Verification Methods**: Checks for multiple authentication methods
- **Domain Compliance**: Validates against allowed domain lists
- **Security Recommendations**: Provides improvement suggestions

## DID:web Format

### Basic Format
```
did:web:domain.com
```

### With Path
```
did:web:domain.com:user:alice
did:web:domain.com:org:department:user
```

### Examples
```
# Company main DID
did:web:acme.com

# Department-specific DID
did:web:acme.com:legal:contracts

# User-specific DID
did:web:acme.com:users:john.doe

# Partner organization
did:web:partner.com:acme:integration
```

## Setting Up DID:web for Your Organization

### Step 1: Create DID Document

Create a file at `https://yourdomain.com/.well-known/did.json`:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:web:yourdomain.com",
  "verificationMethod": [
    {
      "id": "did:web:yourdomain.com#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:web:yourdomain.com",
      "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
    },
    {
      "id": "did:web:yourdomain.com#key-2",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:web:yourdomain.com",
      "publicKeyHex": "0x1234567890abcdef..."
    }
  ],
  "authentication": [
    "did:web:yourdomain.com#key-1",
    "did:web:yourdomain.com#key-2"
  ],
  "assertionMethod": [
    "did:web:yourdomain.com#key-1"
  ],
  "service": [
    {
      "id": "did:web:yourdomain.com#linkeddomains",
      "type": "LinkedDomains",
      "serviceEndpoint": [
        "https://yourdomain.com",
        "https://www.yourdomain.com"
      ]
    },
    {
      "id": "did:web:yourdomain.com#linkedin",
      "type": "LinkedIn",
      "serviceEndpoint": "https://linkedin.com/company/yourcompany"
    },
    {
      "id": "did:web:yourdomain.com#organization",
      "type": "Organization",
      "serviceEndpoint": {
        "name": "Your Company Name",
        "url": "https://yourdomain.com",
        "description": "Your company description"
      }
    }
  ],
  "created": "2024-01-01T00:00:00Z",
  "updated": "2024-01-01T00:00:00Z"
}
```

### Step 2: Configure Web Server

#### Apache Configuration
```apache
# .htaccess file
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^\.well-known/did\.json$ /did.json [L]
</IfModule>

# Set proper headers
<Files "did.json">
    Header set Content-Type "application/json"
    Header set Access-Control-Allow-Origin "*"
</Files>
```

#### Nginx Configuration
```nginx
location /.well-known/did.json {
    alias /path/to/your/did.json;
    add_header Content-Type application/json;
    add_header Access-Control-Allow-Origin *;
}
```

### Step 3: Test DID Resolution

Test your DID document is accessible:

```bash
curl -H "Accept: application/json" https://yourdomain.com/.well-known/did.json
```

## API Endpoints

### DID Resolution
```http
GET /api/did/resolve/did:web:yourdomain.com
```

### Enterprise Validation
```http
GET /api/did/enterprise/validate/did:web:yourdomain.com
```

### Check Availability
```http
GET /api/did/check/did:web:yourdomain.com
```

### Get DID Information
```http
GET /api/did/info/did:web:yourdomain.com
```

## Enterprise Configuration

### Environment Variables

```bash
# Domain restrictions
ALLOWED_DID_WEB_DOMAINS=company.com,subsidiary.com

# Security settings
REQUIRE_HTTPS=true
MAX_DID_REDIRECTS=3
DID_RESOLUTION_TIMEOUT=10000
```

### Admin API Endpoints

#### Get Enterprise Configuration
```http
GET /api/did/enterprise/domains
Authorization: Bearer <admin-token>
```

#### Update Enterprise Configuration
```http
POST /api/did/enterprise/domains
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "allowedDomains": ["company.com", "subsidiary.com"],
  "requireHttps": true,
  "maxRedirects": 3,
  "timeout": 10000
}
```

## Best Practices

### 1. Security
- **Use HTTPS**: Always serve DID documents over HTTPS
- **Multiple Keys**: Include multiple verification methods for redundancy
- **Regular Updates**: Keep DID documents updated with current information
- **Key Rotation**: Implement key rotation procedures

### 2. Enterprise Services
Include these services in your DID document:

```json
{
  "service": [
    {
      "id": "did:web:company.com#linkeddomains",
      "type": "LinkedDomains",
      "serviceEndpoint": ["https://company.com", "https://www.company.com"]
    },
    {
      "id": "did:web:company.com#organization",
      "type": "Organization",
      "serviceEndpoint": {
        "name": "Company Name",
        "url": "https://company.com",
        "description": "Company description"
      }
    },
    {
      "id": "did:web:company.com#legalentity",
      "type": "LegalEntity",
      "serviceEndpoint": {
        "name": "Legal Company Name",
        "registrationNumber": "123456789",
        "jurisdiction": "US-CA"
      }
    }
  ]
}
```

### 3. Verification Methods
Support multiple key types:

```json
{
  "verificationMethod": [
    {
      "id": "did:web:company.com#ed25519",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:web:company.com",
      "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
    },
    {
      "id": "did:web:company.com#secp256k1",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:web:company.com",
      "publicKeyHex": "0x1234567890abcdef..."
    }
  ]
}
```

### 4. Monitoring
- **Health Checks**: Monitor DID document availability
- **Performance**: Track resolution times
- **Security**: Monitor for unauthorized changes
- **Compliance**: Ensure domain restrictions are enforced

## Troubleshooting

### Common Issues

#### 1. DID Document Not Found
```
Error: HTTP 404: Not Found
```
**Solution**: Ensure the DID document is accessible at `/.well-known/did.json`

#### 2. Invalid JSON
```
Error: Invalid JSON in DID document
```
**Solution**: Validate JSON syntax and structure

#### 3. Domain Not Allowed
```
Error: Domain not in allowed list
```
**Solution**: Add domain to `ALLOWED_DID_WEB_DOMAINS` or contact administrator

#### 4. HTTPS Required
```
Error: HTTPS required for did:web resolution
```
**Solution**: Serve DID document over HTTPS

#### 5. Timeout
```
Error: DID resolution timeout
```
**Solution**: Check server performance and increase `DID_RESOLUTION_TIMEOUT`

### Debug Commands

```bash
# Test DID resolution
curl -v https://yourdomain.com/.well-known/did.json

# Check CORS headers
curl -H "Origin: https://otherdomain.com" -H "Accept: application/json" \
  https://yourdomain.com/.well-known/did.json

# Test with system API
curl -X GET "http://localhost:5001/api/did/resolve/did:web:yourdomain.com"
```

## Integration Examples

### Frontend Integration

```javascript
// Check DID availability
const checkDID = async (did) => {
  const response = await fetch(`/api/did/check/${encodeURIComponent(did)}`);
  const data = await response.json();
  return data.available;
};

// Validate enterprise DID
const validateEnterpriseDID = async (did) => {
  const response = await fetch(`/api/did/enterprise/validate/${encodeURIComponent(did)}`);
  const data = await response.json();
  return data;
};

// Register with DID
const registerWithDID = async (userData, did, signature) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...userData,
      existingDID: did,
      didVerificationSignature: signature
    })
  });
  return response.json();
};
```

### Backend Integration

```javascript
// Verify DID ownership
const verifyDID = async (did, walletAddress, signature, message) => {
  const response = await fetch('/api/did/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      did,
      walletAddress,
      signature,
      message
    })
  });
  return response.json();
};

// Get DID information
const getDIDInfo = async (did) => {
  const response = await fetch(`/api/did/info/${encodeURIComponent(did)}`);
  return response.json();
};
```

## Security Considerations

### 1. Domain Control
- Ensure only authorized domains can register DIDs
- Implement domain verification procedures
- Monitor for unauthorized domain registrations

### 2. Key Management
- Use secure key generation procedures
- Implement key rotation policies
- Store private keys securely

### 3. Network Security
- Use HTTPS for all DID operations
- Implement rate limiting
- Monitor for abuse

### 4. Access Control
- Restrict admin endpoints to authorized users
- Implement audit logging
- Regular security reviews

## Compliance

### GDPR Considerations
- DID documents may contain personal data
- Implement data minimization
- Provide data portability

### Enterprise Requirements
- Audit trails for DID operations
- Role-based access control
- Integration with existing identity systems

## Support

For enterprise support and custom configurations:

1. **Documentation**: Check this guide and API documentation
2. **Configuration**: Review environment variables and settings
3. **Troubleshooting**: Use debug commands and logs
4. **Customization**: Contact development team for enterprise features

## Conclusion

Enterprise DID:web support provides organizations with a powerful, self-sovereign identity solution that integrates seamlessly with existing web infrastructure. By following this guide, organizations can implement secure, scalable DID management systems that meet enterprise requirements. 