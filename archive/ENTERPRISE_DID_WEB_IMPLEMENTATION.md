# Enterprise DID:web Implementation Guide

## Overview

This guide provides comprehensive instructions for implementing `did:web` in enterprise environments for the Contract Management System. It covers setup, configuration, security, integration with IAM systems, and best practices for large-scale deployments.

## Table of Contents

1. [Enterprise Architecture](#enterprise-architecture)
2. [Prerequisites](#prerequisites)
3. [Domain Setup](#domain-setup)
4. [DID Document Creation](#did-document-creation)
5. [Web Server Configuration](#web-server-configuration)
6. [Security Configuration](#security-configuration)
7. [IAM Integration](#iam-integration)
8. [User Management](#user-management)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting](#troubleshooting)

## Enterprise Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Enterprise    │    │   Contract      │    │   Blockchain    │
│   IAM System    │    │   Management    │    │   Operations    │
│   (Keycloak)    │    │   System        │    │   (did:ethr)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LDAP/AD       │    │   DID:web       │    │   Smart         │
│   Integration   │    │   Resolution    │    │   Contracts     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Enterprise    │    │   Web Server    │    │   Blockchain    │
│   Users         │    │   (DID Docs)    │    │   Network       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### DID:web Flow for Enterprise
1. **User Authentication**: Users authenticate via enterprise IAM (Keycloak + LDAP/AD)
2. **DID Resolution**: System resolves user's `did:web` from their organization domain
3. **Document Verification**: DID document is verified for authenticity and compliance
4. **Access Control**: User is granted access based on enterprise roles and permissions
5. **Contract Operations**: For blockchain operations, users can optionally use `did:ethr`

## Prerequisites

### Domain Requirements
- **Domain Ownership**: Organization must own the domain
- **HTTPS Support**: Domain must support HTTPS with valid SSL certificate
- **Web Server Access**: Ability to host files at `/.well-known/did.json`
- **DNS Control**: Full control over DNS records

### Infrastructure Requirements
- **Web Server**: Apache, Nginx, or similar
- **SSL Certificate**: Valid SSL certificate for the domain
- **Load Balancer**: For high availability (optional)
- **CDN**: For performance optimization (optional)

### Software Requirements
- **Node.js**: Version 16 or higher
- **PostgreSQL**: Version 13 or higher
- **Keycloak**: Version 20 or higher
- **Docker**: For containerized deployment

## Domain Setup

### 1. Domain Verification
```bash
# Verify domain ownership
dig +short yourdomain.com
nslookup yourdomain.com

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### 2. DNS Configuration
```bash
# A record for main domain
yourdomain.com.    IN  A   203.0.113.1

# CNAME for www subdomain
www.yourdomain.com. IN CNAME yourdomain.com.

# TXT record for domain verification (if needed)
yourdomain.com.    IN  TXT "did-web-verification=abc123"
```

### 3. SSL Certificate Setup
```bash
# Using Let's Encrypt
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Using commercial certificate
# Upload certificate files to web server
```

## DID Document Creation

### 1. Organization DID Document
Create the main organization DID document at `https://yourdomain.com/.well-known/did.json`:

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
    }
  ],
  "authentication": [
    "did:web:yourdomain.com#key-1"
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
      "id": "did:web:yourdomain.com#organization",
      "type": "Organization",
      "serviceEndpoint": {
        "name": "Your Company Name",
        "url": "https://yourdomain.com",
        "description": "Your company description",
        "industry": "Technology",
        "founded": "2020",
        "employees": "1000+"
      }
    }
  ],
  "created": "2024-01-01T00:00:00Z",
  "updated": "2024-01-01T00:00:00Z"
}
```

### 2. Department DID Documents
Create department-specific DID documents:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:web:yourdomain.com:legal",
  "verificationMethod": [
    {
      "id": "did:web:yourdomain.com:legal#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:web:yourdomain.com:legal",
      "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
    }
  ],
  "authentication": [
    "did:web:yourdomain.com:legal#key-1"
  ],
  "service": [
    {
      "id": "did:web:yourdomain.com:legal#department",
      "type": "Department",
      "serviceEndpoint": {
        "name": "Legal Department",
        "parent": "did:web:yourdomain.com",
        "manager": "did:web:yourdomain.com:employees:legal.manager",
        "description": "Legal and compliance operations"
      }
    }
  ],
  "created": "2024-01-01T00:00:00Z",
  "updated": "2024-01-01T00:00:00Z"
}
```

### 3. User DID Documents
Create user-specific DID documents:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:web:yourdomain.com:employees:john.doe",
  "verificationMethod": [
    {
      "id": "did:web:yourdomain.com:employees:john.doe#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:web:yourdomain.com:employees:john.doe",
      "publicKeyMultibase": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
    }
  ],
  "authentication": [
    "did:web:yourdomain.com:employees:john.doe#key-1"
  ],
  "service": [
    {
      "id": "did:web:yourdomain.com:employees:john.doe#employee",
      "type": "Employee",
      "serviceEndpoint": {
        "name": "John Doe",
        "title": "Senior Legal Counsel",
        "department": "did:web:yourdomain.com:legal",
        "employeeId": "EMP001",
        "email": "john.doe@yourdomain.com",
        "hireDate": "2022-01-15"
      }
    }
  ],
  "created": "2024-01-01T00:00:00Z",
  "updated": "2024-01-01T00:00:00Z"
}
```

## Web Server Configuration

### 1. Apache Configuration
```apache
# .htaccess file in root directory
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Serve DID documents
    RewriteRule ^\.well-known/did\.json$ /did-documents/did.json [L]
    RewriteRule ^\.well-known/did/(.+)$ /did-documents/$1.json [L]
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # CORS for DID resolution
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, OPTIONS"
    Header always set Access-Control-Allow-Headers "Accept, Content-Type"
</IfModule>

# DID document specific configuration
<Files "did.json">
    Header set Content-Type "application/json"
    Header set Cache-Control "public, max-age=3600"
    Header set ETag "\"${file_mtime}\""
</Files>
```

### 2. Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # DID document serving
    location /.well-known/did.json {
        alias /path/to/did-documents/did.json;
        add_header Content-Type "application/json" always;
        add_header Cache-Control "public, max-age=3600" always;
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Accept, Content-Type" always;
    }
    
    location ~ ^/.well-known/did/(.+)$ {
        alias /path/to/did-documents/$1.json;
        add_header Content-Type "application/json" always;
        add_header Cache-Control "public, max-age=3600" always;
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Accept, Content-Type" always;
    }
    
    # Handle OPTIONS requests
    location ~ ^/.well-known/did {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Accept, Content-Type" always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
}
```

## Security Configuration

### 1. Environment Variables
```bash
# Enterprise DID:web Security Configuration
ALLOWED_DID_WEB_DOMAINS=yourdomain.com,subsidiary.com,partner.org
REQUIRE_HTTPS=true
MAX_DID_REDIRECTS=3
DID_RESOLUTION_TIMEOUT=10000
DID_CACHE_TTL=3600

# Enterprise IAM Configuration
KEYCLOAK_URL=https://***REMOVED-KEYCLOAK_DB_PASSWORD***.yourdomain.com
KEYCLOAK_ADMIN_PASSWORD=secure_password
KEYCLOAK_REALM=contract-management-enterprise

# LDAP/Active Directory Integration
LDAP_URL=ldaps://ldap.yourdomain.com:636
LDAP_BIND_DN=CN=ServiceAccount,OU=ServiceAccounts,DC=yourdomain,DC=com
LDAP_BIND_PASSWORD=secure_ldap_password
LDAP_SEARCH_BASE=DC=yourdomain,DC=com

# Enterprise Security
ENTERPRISE_MODE=true
REQUIRE_ENTERPRISE_DID=true
ENABLE_DID_VERIFICATION=true
AUDIT_LOG_ENABLED=true
```

### 2. Security Headers
```javascript
// Security middleware for DID resolution
const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  // HSTS for HTTPS enforcement
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
};
```

### 3. DID Validation
```javascript
// Enterprise DID validation
const validateEnterpriseDID = async (did) => {
  // Check DID format
  if (!did.startsWith('did:web:')) {
    throw new Error('Invalid DID method');
  }
  
  // Extract domain
  const domain = did.replace('did:web:', '').split(':')[0];
  
  // Check against allowed domains
  const allowedDomains = process.env.ALLOWED_DID_WEB_DOMAINS?.split(',') || [];
  const isDomainAllowed = allowedDomains.some(allowed => 
    domain === allowed || domain.endsWith(`.${allowed}`)
  );
  
  if (!isDomainAllowed) {
    throw new Error('Domain not allowed for DID:web');
  }
  
  // Resolve DID document
  const didDocument = await resolveWebDID(did);
  
  // Validate DID document
  if (!didDocument.id || didDocument.id !== did) {
    throw new Error('Invalid DID document');
  }
  
  // Check for required services
  const hasLinkedDomains = didDocument.service?.some(s => s.type === 'LinkedDomains');
  const hasOrganization = didDocument.service?.some(s => s.type === 'Organization');
  
  return {
    isValid: true,
    domain,
    isDomainAllowed,
    hasLinkedDomains,
    hasOrganization,
    didDocument
  };
};
```

## IAM Integration

### 1. Keycloak Configuration
```javascript
// Keycloak realm configuration for enterprise
const ***REMOVED-KEYCLOAK_DB_PASSWORD***Config = {
  realm: 'contract-management-enterprise',
  'auth-server-url': process.env.KEYCLOAK_URL,
  'ssl-required': 'external',
  resource: 'contract-management-enterprise',
  'public-client': false,
  'confidential-port': 0,
  'verify-token-audience': true,
  'use-resource-role-mappings': true,
  'bearer-only': false
};

// Custom attributes for DID support
const customAttributes = {
  'did': 'string',
  'didMethod': 'string',
  'organizationDomain': 'string',
  'organizationName': 'string',
  'department': 'string',
  'employeeId': 'string',
  'enterpriseRole': 'string'
};
```

### 2. LDAP Integration
```javascript
// LDAP user federation configuration
const ldapConfig = {
  providerId: 'ldap',
  config: {
    enabled: 'true',
    editMode: 'READ_ONLY',
    syncRegistrations: 'false',
    vendor: 'ad', // Active Directory
    usernameLDAPAttribute: 'sAMAccountName',
    rdnLDAPAttribute: 'cn',
    uuidLDAPAttribute: 'objectGUID',
    userObjectClasses: 'person, organizationalPerson, user',
    connectionUrl: process.env.LDAP_URL,
    bindDn: process.env.LDAP_BIND_DN,
    bindCredential: process.env.LDAP_BIND_PASSWORD,
    searchBase: process.env.LDAP_SEARCH_BASE,
    searchFilter: '(sAMAccountName={0})',
    readTimeout: '5000',
    pagination: 'true'
  },
  mappers: [
    {
      name: 'DID Mapper',
      config: {
        'ldap.attribute': 'employeeID',
        'user.attribute': 'did',
        'read.only': 'true'
      }
    },
    {
      name: 'Organization Domain Mapper',
      config: {
        'ldap.attribute': 'company',
        'user.attribute': 'organizationDomain',
        'read.only': 'true'
      }
    },
    {
      name: 'Department Mapper',
      config: {
        'ldap.attribute': 'department',
        'user.attribute': 'department',
        'read.only': 'true'
      }
    }
  ]
};
```

### 3. Authentication Flow
```javascript
// Enterprise authentication middleware
const authenticateEnterpriseUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify JWT token with Keycloak
    const decoded = jwt.verify(token, client.getSigningKey, {
      algorithms: ['RS256'],
      audience: 'contract-management-enterprise'
    });

    // Extract DID and organization info
    const did = decoded.did;
    const organizationDomain = decoded.organizationDomain;
    const didMethod = decoded.didMethod;

    // For did:web users, verify DID document
    if (didMethod === 'web' && did) {
      try {
        const validation = await validateEnterpriseDID(did);
        if (!validation.isValid || !validation.isDomainAllowed) {
          return res.status(403).json({ 
            error: 'Invalid or unauthorized enterprise DID',
            details: validation
          });
        }
      } catch (error) {
        return res.status(403).json({ 
          error: 'Failed to verify enterprise DID',
          details: error.message
        });
      }
    }

    // Map Keycloak user to local user
    const user = await mapKeycloakUserToLocalUser(decoded, did);
    req.user = user;
    req.did = did;
    req.organizationDomain = organizationDomain;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

## User Management

### 1. User Registration
```javascript
// Enterprise user registration with did:web
const registerEnterpriseUser = async (userData) => {
  const { email, organizationDomain, department, employeeId } = userData;
  
  // Create user DID
  const did = createWebDID(organizationDomain, `employees:${employeeId}`);
  
  // Create DID document
  const didDocument = createEnterpriseDIDDocument(did, {
    name: userData.name,
    publicKey: userData.publicKey,
    department: department,
    employeeId: employeeId
  });
  
  // Store DID document on web server
  await storeWebDIDDocument(did, didDocument, userData.webServerConfig);
  
  // Create IAM user
  const iamUser = await createIAMUser({
    username: email,
    email: email,
    attributes: {
      did: did,
      didMethod: 'web',
      organizationDomain: organizationDomain,
      department: department,
      employeeId: employeeId
    }
  });
  
  // Create local user record
  const user = await db.User.create({
    email: email,
    name: userData.name,
    did: did,
    didMethod: 'web',
    organizationDomain: organizationDomain,
    department: department,
    employeeId: employeeId,
    iamUserId: iamUser.id,
    isRegistered: true,
    didVerified: false
  });
  
  return { user, did, iamUser };
};
```

### 2. User Synchronization
```javascript
// Sync users from LDAP/AD
const syncUsersFromLDAP = async () => {
  const ldapUsers = await getLDAPUsers();
  
  for (const ldapUser of ldapUsers) {
    // Check if user exists
    const existingUser = await db.User.findOne({
      where: { email: ldapUser.email }
    });
    
    if (!existingUser) {
      // Create new user with did:web
      await registerEnterpriseUser({
        email: ldapUser.email,
        name: ldapUser.displayName,
        organizationDomain: process.env.ORGANIZATION_DOMAIN,
        department: ldapUser.department,
        employeeId: ldapUser.employeeID
      });
    } else {
      // Update existing user
      await existingUser.update({
        department: ldapUser.department,
        employeeId: ldapUser.employeeID
      });
    }
  }
};
```

## Monitoring and Maintenance

### 1. Health Checks
```javascript
// DID resolution health check
const checkDIDHealth = async () => {
  const domains = process.env.ALLOWED_DID_WEB_DOMAINS?.split(',') || [];
  
  for (const domain of domains) {
    try {
      const did = `did:web:${domain}`;
      const didDocument = await resolveWebDID(did);
      
      console.log(`✅ DID ${did} is healthy`);
      
      // Check SSL certificate
      const sslInfo = await checkSSLCertificate(domain);
      console.log(`✅ SSL certificate for ${domain} is valid until ${sslInfo.expiry}`);
      
    } catch (error) {
      console.error(`❌ DID ${did} health check failed:`, error.message);
      
      // Send alert
      await sendAlert({
        type: 'DID_HEALTH_CHECK_FAILED',
        domain: domain,
        error: error.message
      });
    }
  }
};
```

### 2. Performance Monitoring
```javascript
// DID resolution performance monitoring
const monitorDIDResolution = async (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log performance metrics
    console.log(`DID resolution: ${req.path} - ${duration}ms - ${res.statusCode}`);
    
    // Send to monitoring system
    await sendMetrics({
      metric: 'did_resolution_duration',
      value: duration,
      tags: {
        path: req.path,
        status_code: res.statusCode,
        domain: req.hostname
      }
    });
  });
  
  next();
};
```

### 3. Audit Logging
```javascript
// Enterprise audit logging
const auditLog = async (action, user, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: action,
    userId: user.id,
    userEmail: user.email,
    did: user.did,
    organizationDomain: user.organizationDomain,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    details: details
  };
  
  // Store in database
  await db.AuditLog.create(logEntry);
  
  // Send to external audit system
  await sendToAuditSystem(logEntry);
};
```

## Troubleshooting

### Common Issues

#### 1. DID Document Not Accessible
**Problem**: `https://yourdomain.com/.well-known/did.json` returns 404
**Solutions**:
- Check file exists at correct path
- Verify web server configuration
- Check file permissions
- Ensure URL rewriting is working

#### 2. SSL Certificate Issues
**Problem**: DID resolution fails due to SSL errors
**Solutions**:
- Verify SSL certificate is valid
- Check certificate chain
- Ensure HTTPS is properly configured
- Test with `curl -k` to bypass SSL verification temporarily

#### 3. CORS Issues
**Problem**: Browser blocks DID resolution due to CORS
**Solutions**:
- Add proper CORS headers to web server
- Ensure `Access-Control-Allow-Origin` is set
- Check preflight OPTIONS requests are handled

#### 4. LDAP Integration Issues
**Problem**: Users not syncing from LDAP/AD
**Solutions**:
- Verify LDAP connection settings
- Check bind credentials
- Ensure search base is correct
- Verify user attributes are mapped correctly

### Debug Commands
```bash
# Test DID resolution
curl -H "Accept: application/json" https://yourdomain.com/.well-known/did.json

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Test LDAP connection
ldapsearch -H ldaps://ldap.yourdomain.com:636 -D "CN=ServiceAccount,OU=ServiceAccounts,DC=yourdomain,DC=com" -w password -b "DC=yourdomain,DC=com" "(sAMAccountName=testuser)"

# Check web server logs
tail -f /var/log/nginx/access.log
tail -f /var/log/apache2/access.log
```

### Support Contacts
- **Technical Support**: tech-support@yourdomain.com
- **Security Team**: security@yourdomain.com
- **IAM Team**: iam-team@yourdomain.com
- **Emergency**: oncall@yourdomain.com

---

**This guide provides comprehensive instructions for implementing did:web in enterprise environments. For additional support or questions, contact the enterprise support team.** 