# IAM Integration Design Document
## Contract Management System - Keycloak Integration

### 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Keycloak Configuration](#***REMOVED-KEYCLOAK_DB_PASSWORD***-configuration)
4. [Client Configuration](#client-configuration)
5. [Service Accounts](#service-accounts)
6. [User Management](#user-management)
7. [Role-Based Access Control](#role-based-access-control)
8. [Authentication Flows](#authentication-flows)
9. [Contract Signing Integration](#contract-signing-integration)
10. [Key Management Integration](#key-management-integration)
11. [Security Settings](#security-settings)
12. [Integration Points](#integration-points)
13. [Deployment Configuration](#deployment-configuration)
14. [Troubleshooting](#troubleshooting)
15. [Monitoring & Auditing](#monitoring--auditing)

---

## 🎯 Overview

The Contract Management System uses **Keycloak** as its Identity and Access Management (IAM) solution, providing centralized authentication, authorization, and user management. This document outlines the complete IAM integration design, including all required configurations, clients, and service accounts.

### Key Requirements
- **HTTPS Required**: All Keycloak operations require HTTPS for security
- **Persistent Configuration**: All settings persist across restarts
- **Multi-Client Support**: Separate clients for frontend, backend, and admin operations
- **Service Account Authentication**: Backend services authenticate using service accounts
- **Role-Based Access Control**: Granular permissions based on user roles and party types
- **Contract Signing Integration**: Seamless integration with digital contract signing workflows
- **Key Management**: Secure generation, storage, and management of signing keys
- **SCITT CCF Integration**: Integration with SCITT CCF ledger for immutable signature storage

---

## 🏗️ Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend     │    │    Backend      │    │   Keycloak      │
│   (React)      │◄──►│   (Node.js)     │◄──►│   (IAM)        │
│                │    │                │    │                │
│ - User Login   │    │ - API Auth     │    │ - User Mgmt    │
│ - Registration │    │ - Token Val.   │    │ - Client Mgmt   │
│ - Dashboard    │    │ - Role Check   │    │ - Role Mgmt     │
│ - Contract UI  │    │ - Key Mgmt     │    │ - Auth Flows    │
│ - Signing UI   │    │ - Signing API  │    │ - Permissions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   SCITT CCF     │
                    │   (Ledger)      │
                    │                │
                    │ - Immutable    │
                    │   Storage      │
                    │ - Provenance   │
                    │   Tracking     │
                    │ - Receipts     │
                    └─────────────────┘
```

### Authentication Flow
1. **User Login**: Frontend redirects to Keycloak login page
2. **Token Exchange**: Keycloak returns JWT access token
3. **API Calls**: Backend validates JWT tokens
4. **Service Auth**: Backend uses service account for Keycloak operations

---

## 🔐 Keycloak Configuration

### Server Configuration
```yaml
# Keycloak Server Settings
Server: Keycloak 22.0.5
Mode: Development (with HTTPS)
Port: 8443 (HTTPS)
Admin Console: https://localhost:8443/admin
Health Check: https://localhost:8443/health

# Database
Database: PostgreSQL 15
Database Name: ***REMOVED-KEYCLOAK_DB_PASSWORD***
Database User: ***REMOVED-KEYCLOAK_DB_PASSWORD***
Database Port: 5433

# SSL/TLS
SSL: Enabled (Self-signed certificates for development)
Certificate: /opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/conf/cert.pem
Private Key: /opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/conf/key.pem
```

### Environment Variables
```bash
# Keycloak Server Environment
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=***REMOVED-KEYCLOAK_ADMIN_PASSWORD***
KC_DB=***REMOVED-DB_PASSWORD***
KC_DB_URL=jdbc:***REMOVED-DB_PASSWORD***ql://***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***:5432/***REMOVED-KEYCLOAK_DB_PASSWORD***
KC_DB_USERNAME=***REMOVED-KEYCLOAK_DB_PASSWORD***
KC_DB_PASSWORD=IWC3fqFn75ANvfbiujlKyR54qPXOaG2EoPxbFXWAkjI

# Application Environment
KEYCLOAK_ENABLED=true
KEYCLOAK_URL=https://localhost:8443
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-client
KEYCLOAK_CLIENT_SECRET=***REMOVED-KEYCLOAK_CLIENT_SECRET***
```

---

## 🎭 Client Configuration

### 1. Frontend Client (`contract-management-frontend`)
```json
{
  "clientId": "contract-management-frontend",
  "name": "Contract Management Frontend",
  "enabled": true,
  "publicClient": true,
  "protocol": "openid-connect",
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": false,
  "serviceAccountsEnabled": false,
  "redirectUris": [
    "http://localhost:3000/*",
    "http://localhost:3000",
    "https://localhost:3000/*",
    "https://localhost:3000"
  ],
  "webOrigins": [
    "http://localhost:3000",
    "https://localhost:3000"
  ],
  "attributes": {
    "frontend.client": "true"
  }
}
```

### 2. Backend Client (`contract-management-client`)
```json
{
  "clientId": "contract-management-client",
  "name": "Contract Management Backend",
  "enabled": true,
  "publicClient": false,
  "protocol": "openid-connect",
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": true,
  "serviceAccountsEnabled": true,
  "clientAuthenticatorType": "client-secret",
  "redirectUris": [
    "http://localhost:5001/*",
    "http://localhost:5001"
  ],
  "webOrigins": [
    "http://localhost:5001",
    "http://localhost:3000"
  ],
  "attributes": {
    "backend.client": "true",
    "service.account": "true"
  }
}
```

### 3. Admin CLI Client (`admin-cli`)
```json
{
  "clientId": "admin-cli",
  "name": "Admin CLI",
  "enabled": true,
  "publicClient": true,
  "protocol": "openid-connect",
  "standardFlowEnabled": false,
  "implicitFlowEnabled": false,
  "directAccessGrantsEnabled": true,
  "serviceAccountsEnabled": false,
  "redirectUris": [],
  "webOrigins": [],
  "attributes": {
    "admin.tool": "true"
  }
}
```

---

## 🔑 Service Accounts

### Backend Service Account
The backend uses a service account to authenticate with Keycloak for user management operations.

#### Service Account Configuration
```json
{
  "serviceAccount": {
    "enabled": true,
    "clientId": "contract-management-client",
    "clientSecret": "***REMOVED-KEYCLOAK_CLIENT_SECRET***",
    "roles": [
      "view-users",
      "manage-users",
      "view-clients",
      "manage-clients"
    ]
  }
}
```

#### Service Account Token Request
```bash
# Backend obtains service account token
curl -X POST https://localhost:8443/realms/contract-management/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=contract-management-client&client_secret=ELYMS5QENXOEBIJYXGKPYDQFE6BEW8N"
```

---

## 👥 User Management

### User Structure
```json
{
  "user": {
    "id": "user-uuid",
    "username": "user@example.com",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "enabled": true,
    "emailVerified": true,
    "attributes": {
      "partyType": "TDP|TDC|CCRP|AppAdmin",
      "organization": "Company Name",
      "depaId": "TDP-uuid",
      "phoneNumber": "+1-555-0123",
      "website": "https://example.com",
      "location": "San Francisco, CA"
    }
  }
}
```

### User Registration Flow
1. **Frontend Registration**: User fills registration form
2. **Backend Validation**: Backend validates user data
3. **Keycloak User Creation**: Backend creates user in Keycloak via service account
4. **Database Sync**: User data stored in application database
5. **Role Assignment**: Default roles assigned based on party type
6. **Email Verification**: Verification email sent (if enabled)

---

## 🎭 Role-Based Access Control

### Realm Roles
```json
{
  "roles": {
    "TDP": {
      "name": "TDP",
      "description": "Training Data Provider",
      "composite": false,
      "clientRole": false,
      "attributes": {
        "partyType": "TDP",
        "permissions": ["manage-datasets", "view-contracts", "create-contracts"]
      }
    },
    "TDC": {
      "name": "TDC",
      "description": "Training Data Consumer",
      "composite": false,
      "clientRole": false,
      "attributes": {
        "partyType": "TDC",
        "permissions": ["manage-models", "view-datasets", "create-contracts"]
      }
    },
    "CCRP": {
      "name": "CCRP",
      "description": "Confidential Clean Room Provider",
      "composite": false,
      "clientRole": false,
      "attributes": {
        "partyType": "CCRP",
        "permissions": ["manage-environments", "view-contracts", "provision-resources"]
      }
    },
    "AppAdmin": {
      "name": "AppAdmin",
      "description": "Application Administrator",
      "composite": false,
      "clientRole": false,
      "attributes": {
        "partyType": "AppAdmin",
        "permissions": ["*"]
      }
    }
  }
}
```

### Client Roles
```json
{
  "clientRoles": {
    "contract-management-client": {
      "view-users": "View user information",
      "manage-users": "Create, update, delete users",
      "view-clients": "View client information",
      "manage-clients": "Manage client configurations"
    }
  }
}
```

---

## 🔄 Authentication Flows

### 1. Standard Authorization Code Flow (Frontend)
```
1. User visits frontend
2. Frontend redirects to Keycloak login
3. User enters credentials
4. Keycloak validates and redirects back with code
5. Frontend exchanges code for tokens
6. Frontend stores tokens and makes API calls
```

### 2. Direct Access Grant Flow (Backend)
```
1. Backend authenticates with client credentials
2. Keycloak returns service account token
3. Backend uses token for Keycloak admin operations
4. Token refreshed as needed
```

### 3. Resource Owner Password Flow (API Login)
```
1. User sends credentials to backend API
2. Backend forwards to Keycloak
3. Keycloak validates and returns tokens
4. Backend returns tokens to user
```

---

## 🔐 Contract Signing Integration

### Overview
The IAM system integrates seamlessly with the contract signing workflow, providing secure authentication and authorization for digital signature operations. Users must be authenticated through Keycloak before they can access signing functionality.

### Signing Workflow Integration
```
1. User Authentication (Keycloak)
   ↓
2. Contract Access Authorization
   ↓
3. Key Management Access
   ↓
4. Signature Generation
   ↓
5. SCITT CCF Submission
   ↓
6. Audit Logging
```

### User Registration with Signing Capabilities
When users register through the system, they are automatically provisioned with:
- **DEPA ID**: Unique identifier for signing operations
- **Party Type**: Determines signing permissions (TDP, TDC, CCRP, AppAdmin)
- **Default Roles**: Based on party type for access control
- **Key Management Access**: Ability to generate and manage signing keys

### Role-Based Signing Permissions
```json
{
  "signingPermissions": {
    "TDP": {
      "canSign": ["data_sharing_contracts", "privacy_agreements"],
      "canView": ["own_contracts", "signed_contracts"],
      "keyManagement": "full"
    },
    "TDC": {
      "canSign": ["data_usage_contracts", "model_training_agreements"],
      "canView": ["own_contracts", "signed_contracts"],
      "keyManagement": "full"
    },
    "CCRP": {
      "canSign": ["environment_setup_contracts", "infrastructure_agreements"],
      "canView": ["all_contracts", "environment_contracts"],
      "keyManagement": "full"
    },
    "AppAdmin": {
      "canSign": ["all_contracts"],
      "canView": ["all_contracts", "all_signatures"],
      "keyManagement": "admin"
    }
  }
}
```

### Authentication Requirements for Signing
- **Valid JWT Token**: Must be authenticated through Keycloak
- **Active Session**: Session must not be expired
- **Role Verification**: User must have appropriate party type
- **Key Access**: Must have access to valid signing keys

### Integration Points
```javascript
// Signing API Authentication Middleware
const authenticateSigning = async (req, res, next) => {
  try {
    // Validate JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from Keycloak
    const user = await ***REMOVED-KEYCLOAK_DB_PASSWORD***Service.getUserInfo(token);
    
    // Check signing permissions
    const canSign = await checkSigningPermissions(user.partyType, req.body.contractType);
    if (!canSign) {
      return res.status(403).json({ error: 'Insufficient permissions for signing' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication required for signing' });
  }
};
```

---

## 🔑 Key Management Integration

### Overview
The IAM system provides secure key management capabilities integrated with Keycloak authentication. Users can generate, store, and manage their signing keys through authenticated API endpoints.

### Key Management Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   Key UI        │◄──►│   Key Service   │◄──►│   User Keys     │
│                │    │                │    │                │
│ - Key Gen      │    │ - Key Gen      │    │ - Key Storage   │
│ - Key Import   │    │ - Key Import   │    │ - Key Metadata  │
│ - Key Export   │    │ - Key Export   │    │ - Key Status    │
│ - Key List     │    │ - Key List     │    │ - Key History   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   Keycloak      │
                    │   (Auth)        │
                    │                │
                    │ - User Auth    │
                    │ - Role Check   │
                    │ - Permission   │
                    │   Validation   │
                    └─────────────────┘
```

### Key Management Configuration
The system supports configurable key algorithms and settings through environment variables:

```bash
# Key Management Configuration
KEY_ALGORITHMS=ECDSA-P256,RSA-2048,RSA-4096
DEFAULT_KEY_ALGORITHM=ECDSA-P256
KEY_ID_PREFIX=KEY
KEY_EXPIRY_DAYS=365
KEY_ENCRYPTION_ALGORITHM=aes-256-gcm
KEY_ENCRYPTION_SALT=salt
```

### Supported Key Algorithms
- **ECDSA-P256**: Elliptic Curve Digital Signature Algorithm with P-256 curve (Recommended)
- **RSA-2048**: RSA algorithm with 2048-bit key length (Good balance)
- **RSA-4096**: RSA algorithm with 4096-bit key length (Maximum security)

### Key Lifecycle Management
1. **Key Generation**: Users can generate new signing keys through authenticated API
2. **Key Storage**: Keys are encrypted and stored in the database
3. **Key Access**: Keys are accessed only by authenticated users
4. **Key Rotation**: Users can generate new keys and retire old ones
5. **Key Revocation**: Keys can be revoked for security purposes

### Key Management API Endpoints
```javascript
// Key Management API Routes
GET    /api/signing/config          // Get key management configuration
GET    /api/signing/keys            // List user's keys
POST   /api/signing/keys/generate   // Generate new key
POST   /api/signing/keys/import     // Import existing key
DELETE /api/signing/keys/:keyId     // Delete/revoke key
GET    /api/signing/keys/:keyId/export // Export key data
```

### Security Considerations
- **Encryption at Rest**: Private keys are encrypted using AES-256-GCM
- **Access Control**: Only key owners can access their keys
- **Audit Logging**: All key operations are logged for security
- **Key Rotation**: Support for regular key rotation
- **Secure Storage**: Keys are stored securely in the database

### Integration with SCITT CCF
Keys are used to create digital signatures that are submitted to the SCITT CCF ledger:
1. **Key Access**: User authenticates and accesses their signing key
2. **Signature Generation**: Key is used to generate digital signature
3. **SCITT Submission**: Signature is submitted to SCITT CCF ledger
4. **Receipt Storage**: SCITT receipt is stored for verification

---

## 🛡️ Security Settings

### Password Policy
```json
{
  "passwordPolicy": [
    "length(8)",
    "upperCase(1)",
    "lowerCase(1)",
    "digits(1)",
    "specialChars(1)",
    "notUsername",
    "notEmail"
  ]
}
```

### Session Configuration
```json
{
  "session": {
    "SSOSessionIdle": 1800,
    "SSOSessionMax": 28800,
    "SSOSessionIdleRememberMe": 0,
    "SSOSessionMaxRememberMe": 0,
    "OfflineSessionIdle": 2592000,
    "OfflineSessionMax": 5184000,
    "OfflineSessionIdleRememberMe": 2592000,
    "OfflineSessionMaxRememberMe": 5184000,
    "RememberMe": true,
    "LoginTimeout": 600,
    "LoginActionTimeout": 180,
    "LoginTimeoutRememberMe": 43200,
    "LoginActionTimeoutRememberMe": 300
  }
}
```

### Brute Force Protection
```json
{
  "bruteForceDetection": {
    "enabled": true,
    "permanentLockout": false,
    "maxLoginFailures": 5,
    "minimumQuickLoginWait": 60,
    "waitIncrement": 60,
    "quickLoginCheckMilliSeconds": 1000,
    "maxFailureWait": 900,
    "failureResetTime": 43200,
    "quickLoginUserCheck": true
  }
}
```

---

## 🔗 Integration Points

### Backend Integration
```javascript
// KeycloakService.js
class KeycloakService {
  constructor() {
    this.baseUrl = process.env.KEYCLOAK_URL;
    this.realm = process.env.KEYCLOAK_REALM;
    this.clientId = process.env.KEYCLOAK_CLIENT_ID;
    this.clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
  }

  // Authenticate user with password
  async authenticateUserWithPassword(username, password) {
    const tokenResponse = await axios.post(
      `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`,
      `username=${username}&password=${password}&grant_type=password&client_id=${this.clientId}&client_secret=${this.clientSecret}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    return tokenResponse.data;
  }

  // Get user information
  async getUserInfo(accessToken) {
    const userResponse = await axios.get(
      `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    return userResponse.data;
  }
}
```

### Frontend Integration
```javascript
// Keycloak.js
import Keycloak from '***REMOVED-KEYCLOAK_DB_PASSWORD***-js';

const ***REMOVED-KEYCLOAK_DB_PASSWORD*** = new Keycloak({
  url: 'https://localhost:8443',
  realm: 'contract-management',
  clientId: 'contract-management-frontend'
});

// Initialize Keycloak
***REMOVED-KEYCLOAK_DB_PASSWORD***.init({
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256'
}).then((authenticated) => {
  if (authenticated) {
    // User is authenticated
    console.log('User authenticated');
  }
});
```

---

## 🚀 Deployment Configuration

### Docker Compose Configuration
```yaml
# docker-compose.***REMOVED-KEYCLOAK_DB_PASSWORD***-https.yml
version: '3.8'
services:
  ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms:
    image: quay.io/***REMOVED-KEYCLOAK_DB_PASSWORD***/***REMOVED-KEYCLOAK_DB_PASSWORD***:22.0.5
    container_name: ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ***REMOVED-KEYCLOAK_ADMIN_PASSWORD***
      KC_DB: ***REMOVED-DB_PASSWORD***
      KC_DB_URL: jdbc:***REMOVED-DB_PASSWORD***ql://***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***:5432/***REMOVED-KEYCLOAK_DB_PASSWORD***
      KC_DB_USERNAME: ***REMOVED-KEYCLOAK_DB_PASSWORD***
      KC_DB_PASSWORD: IWC3fqFn75ANvfbiujlKyR54qPXOaG2EoPxbFXWAkjI
      KC_HOSTNAME_STRICT: false
      KC_HOSTNAME_STRICT_HTTPS: false
      KC_HTTPS_CERTIFICATE_FILE: /opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/conf/cert.pem
      KC_HTTPS_CERTIFICATE_KEY_FILE: /opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/conf/key.pem
      KC_HTTPS_PORT: 8443
      KC_HEALTH_ENABLED: true
    command: start-dev --https-port=8443 --https-certificate-file=/opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/conf/cert.pem --https-certificate-key-file=/opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/conf/key.pem --health-enabled=true
    ports:
      - "8443:8443"
    volumes:
      - ./deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs:/opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/conf:ro
      - ***REMOVED-KEYCLOAK_DB_PASSWORD***_data:/opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/data
    depends_on:
      ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***:
        condition: service_healthy
    networks:
      - ***REMOVED-KEYCLOAK_DB_PASSWORD***-network

  ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***:
    image: ***REMOVED-DB_PASSWORD***:15
    container_name: ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD***
    environment:
      POSTGRES_DB: ***REMOVED-KEYCLOAK_DB_PASSWORD***
      POSTGRES_USER: ***REMOVED-KEYCLOAK_DB_PASSWORD***
      POSTGRES_PASSWORD: IWC3fqFn75ANvfbiujlKyR54qPXOaG2EoPxbFXWAkjI
    ports:
      - "5433:5432"
    volumes:
      - ***REMOVED-DB_PASSWORD***_***REMOVED-KEYCLOAK_DB_PASSWORD***_data:/var/lib/***REMOVED-DB_PASSWORD***ql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ***REMOVED-KEYCLOAK_DB_PASSWORD***"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ***REMOVED-KEYCLOAK_DB_PASSWORD***-network

volumes:
  ***REMOVED-KEYCLOAK_DB_PASSWORD***_data:
  ***REMOVED-DB_PASSWORD***_***REMOVED-KEYCLOAK_DB_PASSWORD***_data:

networks:
  ***REMOVED-KEYCLOAK_DB_PASSWORD***-network:
    driver: bridge
```

### SSL Certificate Generation
```bash
#!/bin/bash
# generate-***REMOVED-KEYCLOAK_DB_PASSWORD***-certs.sh

# Create certificates directory
mkdir -p deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs

# Generate private key
openssl genrsa -out deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/key.pem 2048

# Generate certificate signing request
openssl req -new -key deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/key.pem -out deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/cert.csr -subj "/C=US/ST=CA/L=San Francisco/O=Contract Management/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -in deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/cert.csr -signkey deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/key.pem -out deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/cert.pem -days 365

# Set permissions
chmod 600 deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/key.pem
chmod 644 deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/cert.pem

echo "SSL certificates generated successfully!"
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. HTTPS Required Error
```bash
Error: HTTPS required
Solution: Ensure Keycloak is configured with HTTPS and certificates are properly mounted
```

#### 2. Invalid Client Credentials
```bash
Error: Invalid client or Invalid client credentials
Solution: Check client secret configuration and ensure service account is enabled
```

#### 3. Certificate Issues
```bash
Error: self-signed certificate
Solution: Use --insecure flag for curl or configure proper CA certificates
```

#### 4. Database Connection Issues
```bash
Error: Database connection failed
Solution: Check PostgreSQL container health and connection parameters
```

### Debug Commands
```bash
# Check Keycloak health
curl -k https://localhost:8443/health

# Check admin access
curl -k -X POST https://localhost:8443/realms/master/protocol/openid-connect/token \
  -d 'username=admin&password=***REMOVED-KEYCLOAK_ADMIN_PASSWORD***&grant_type=password&client_id=admin-cli'

# List clients
curl -k -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://localhost:8443/admin/realms/contract-management/clients

# Check user sessions
curl -k -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://localhost:8443/admin/realms/contract-management/users
```

---

## 📊 Monitoring & Auditing

### Keycloak Events
```json
{
  "events": {
    "LOGIN": "User login",
    "LOGOUT": "User logout",
    "REGISTER": "User registration",
    "UPDATE_PROFILE": "Profile update",
    "UPDATE_PASSWORD": "Password change",
    "DELETE_ACCOUNT": "Account deletion",
    "CLIENT_LOGIN": "Client authentication",
    "CLIENT_LOGOUT": "Client logout"
  }
}
```

### Audit Logging
```json
{
  "audit": {
    "enabled": true,
    "events": {
      "admin": true,
      "user": true,
      "login": true,
      "logout": true
    },
    "handlers": {
      "file": {
        "enabled": true,
        "path": "/opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/standalone/log/audit.log"
      }
    }
  }
}
```

### Health Checks
```bash
# Keycloak health endpoint
GET https://localhost:8443/health

# Database health
docker exec ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD*** pg_isready -U ***REMOVED-KEYCLOAK_DB_PASSWORD***

# Application health
curl http://localhost:5001/health
```

---

## 📝 Configuration Checklist

### Pre-Deployment
- [ ] SSL certificates generated and mounted
- [ ] PostgreSQL database configured and healthy
- [ ] Keycloak environment variables set
- [ ] Docker volumes configured

### Post-Deployment
- [ ] Keycloak accessible via HTTPS
- [ ] Admin console accessible
- [ ] Realm created and configured
- [ ] Clients configured with proper settings
- [ ] Roles created and assigned
- [ ] Service accounts configured
- [ ] User registration working
- [ ] Authentication flows tested
- [ ] API integration verified

### Security Verification
- [ ] HTTPS enforced for all operations
- [ ] Client secrets properly configured
- [ ] Password policies enforced
- [ ] Brute force protection enabled
- [ ] Session timeouts configured
- [ ] Audit logging enabled

---

## 🔄 Maintenance

### Regular Tasks
1. **Certificate Renewal**: SSL certificates should be renewed before expiration
2. **Database Backups**: Regular PostgreSQL backups
3. **Log Rotation**: Keycloak and application log management
4. **Security Updates**: Keep Keycloak version updated
5. **User Cleanup**: Remove inactive users and sessions

### Backup and Recovery
```bash
# Database backup
docker exec ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD*** pg_dump -U ***REMOVED-KEYCLOAK_DB_PASSWORD*** ***REMOVED-KEYCLOAK_DB_PASSWORD*** > ***REMOVED-KEYCLOAK_DB_PASSWORD***_backup.sql

# Keycloak data backup
docker cp ***REMOVED-KEYCLOAK_DB_PASSWORD***-cms:/opt/***REMOVED-KEYCLOAK_DB_PASSWORD***/data ./***REMOVED-KEYCLOAK_DB_PASSWORD***_data_backup

# Configuration backup
cp config.env config.env.backup
cp -r deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs ./***REMOVED-KEYCLOAK_DB_PASSWORD***-certs-backup
```

---

## 📚 References

### Documentation
- [Keycloak Documentation](https://www.***REMOVED-KEYCLOAK_DB_PASSWORD***.org/documentation)
- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)

### Tools
- [Keycloak Admin CLI](https://www.***REMOVED-KEYCLOAK_DB_PASSWORD***.org/docs/latest/server_admin/#the-admin-cli)
- [Keycloak REST API](https://www.***REMOVED-KEYCLOAK_DB_PASSWORD***.org/docs-api/22.0.5/rest-api/index.html)
- [OpenSSL](https://www.openssl.org/docs/)

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-29  
**Maintained By**: Contract Management System Team
