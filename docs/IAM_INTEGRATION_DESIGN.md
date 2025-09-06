# IAM Integration Design Document
## Contract Management System - Keycloak Integration

### 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Keycloak Configuration](#keycloak-configuration)
4. [Client Configuration](#client-configuration)
5. [Service Accounts](#service-accounts)
6. [User Management](#user-management)
7. [Role-Based Access Control](#role-based-access-control)
8. [Authentication Flows](#authentication-flows)
9. [Security Settings](#security-settings)
10. [Integration Points](#integration-points)
11. [Deployment Configuration](#deployment-configuration)
12. [Troubleshooting](#troubleshooting)
13. [Monitoring & Auditing](#monitoring--auditing)

---

## 🎯 Overview

The Contract Management System uses **Keycloak** as its Identity and Access Management (IAM) solution, providing centralized authentication, authorization, and user management. This document outlines the complete IAM integration design, including all required configurations, clients, and service accounts.

### Key Requirements
- **HTTPS Required**: All Keycloak operations require HTTPS for security
- **Persistent Configuration**: All settings persist across restarts
- **Multi-Client Support**: Separate clients for frontend, backend, and admin operations
- **Service Account Authentication**: Backend services authenticate using service accounts
- **Role-Based Access Control**: Granular permissions based on user roles and party types

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
└─────────────────┘    └─────────────────┘    └─────────────────┘
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
Database Name: keycloak
Database User: keycloak
Database Port: 5433

# SSL/TLS
SSL: Enabled (Self-signed certificates for development)
Certificate: /opt/keycloak/conf/cert.pem
Private Key: /opt/keycloak/conf/key.pem
```

### Environment Variables
```bash
# Keycloak Server Environment
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin123
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://postgres-keycloak:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=IWC3fqFn75ANvfbiujlKyR54qPXOaG2EoPxbFXWAkjI

# Application Environment
KEYCLOAK_ENABLED=true
KEYCLOAK_URL=https://localhost:8443
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-client
KEYCLOAK_CLIENT_SECRET=elyMs5qenxOEbjIyXGKPYdqFea6beW8N
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
    "clientSecret": "elyMs5qenxOEbjIyXGKPYdqFea6beW8N",
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
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://localhost:8443',
  realm: 'contract-management',
  clientId: 'contract-management-frontend'
});

// Initialize Keycloak
keycloak.init({
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
# docker-compose.keycloak-https.yml
version: '3.8'
services:
  keycloak-cms:
    image: quay.io/keycloak/keycloak:22.0.5
    container_name: keycloak-cms
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin123
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres-keycloak:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: IWC3fqFn75ANvfbiujlKyR54qPXOaG2EoPxbFXWAkjI
      KC_HOSTNAME_STRICT: false
      KC_HOSTNAME_STRICT_HTTPS: false
      KC_HTTPS_CERTIFICATE_FILE: /opt/keycloak/conf/cert.pem
      KC_HTTPS_CERTIFICATE_KEY_FILE: /opt/keycloak/conf/key.pem
      KC_HTTPS_PORT: 8443
      KC_HEALTH_ENABLED: true
    command: start-dev --https-port=8443 --https-certificate-file=/opt/keycloak/conf/cert.pem --https-certificate-key-file=/opt/keycloak/conf/key.pem --health-enabled=true
    ports:
      - "8443:8443"
    volumes:
      - ./deployment/keycloak-certs:/opt/keycloak/conf:ro
      - keycloak_data:/opt/keycloak/data
    depends_on:
      postgres-keycloak:
        condition: service_healthy
    networks:
      - keycloak-network

  postgres-keycloak:
    image: postgres:15
    container_name: postgres-keycloak
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: IWC3fqFn75ANvfbiujlKyR54qPXOaG2EoPxbFXWAkjI
    ports:
      - "5433:5432"
    volumes:
      - postgres_keycloak_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keycloak"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - keycloak-network

volumes:
  keycloak_data:
  postgres_keycloak_data:

networks:
  keycloak-network:
    driver: bridge
```

### SSL Certificate Generation
```bash
#!/bin/bash
# generate-keycloak-certs.sh

# Create certificates directory
mkdir -p deployment/keycloak-certs

# Generate private key
openssl genrsa -out deployment/keycloak-certs/key.pem 2048

# Generate certificate signing request
openssl req -new -key deployment/keycloak-certs/key.pem -out deployment/keycloak-certs/cert.csr -subj "/C=US/ST=CA/L=San Francisco/O=Contract Management/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -in deployment/keycloak-certs/cert.csr -signkey deployment/keycloak-certs/key.pem -out deployment/keycloak-certs/cert.pem -days 365

# Set permissions
chmod 600 deployment/keycloak-certs/key.pem
chmod 644 deployment/keycloak-certs/cert.pem

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
  -d 'username=admin&password=admin123&grant_type=password&client_id=admin-cli'

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
        "path": "/opt/keycloak/standalone/log/audit.log"
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
docker exec postgres-keycloak pg_isready -U keycloak

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
docker exec postgres-keycloak pg_dump -U keycloak keycloak > keycloak_backup.sql

# Keycloak data backup
docker cp keycloak-cms:/opt/keycloak/data ./keycloak_data_backup

# Configuration backup
cp config.env config.env.backup
cp -r deployment/keycloak-certs ./keycloak-certs-backup
```

---

## 📚 References

### Documentation
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)

### Tools
- [Keycloak Admin CLI](https://www.keycloak.org/docs/latest/server_admin/#the-admin-cli)
- [Keycloak REST API](https://www.keycloak.org/docs-api/22.0.5/rest-api/index.html)
- [OpenSSL](https://www.openssl.org/docs/)

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-29  
**Maintained By**: Contract Management System Team
