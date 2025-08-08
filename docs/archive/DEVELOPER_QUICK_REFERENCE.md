# Developer Quick Reference

## Multi-Cloud Secret Management

### Quick Start

#### 1. Setup Development Environment
```bash
# Start Vault
./setup-vault-dev.sh

# Run database migration
node scripts/migration/simple-migration.js

# Test integration
node test-multi-cloud-integration.js
```

#### 2. Add Cloud Credentials
```javascript
// Frontend: Add Azure credentials
const credentialData = {
  cloudProvider: 'AZURE',
  secretManager: 'VAULT',
  secretName: 'my-azure-credentials',
  defaultLocation: 'eastus',
  defaultVMSize: 'Standard_D2s_v3'
};

await apiService.post('/api/ccrp/cloud-credentials', credentialData);
```

#### 3. Validate Credentials
```javascript
// Backend: Validate credentials
const secretManager = new SecretManager();
const credentials = await secretManager.getCredentials('my-azure-credentials', 'VAULT');
const azureProvider = new AzureProvider();
const isValid = await azureProvider.validateCredentials(credentials);
```

### API Endpoints

#### Cloud Credentials
```http
GET    /api/ccrp/cloud-credentials          # List credentials
POST   /api/ccrp/cloud-credentials          # Add credential
PUT    /api/ccrp/cloud-credentials/:id      # Update credential
DELETE /api/ccrp/cloud-credentials/:id      # Delete credential
POST   /api/ccrp/cloud-credentials/:id/validate  # Validate credential
```

#### Secret Manager
```http
GET    /api/secret-manager/available        # List available secret managers
POST   /api/secret-manager/store            # Store secret
GET    /api/secret-manager/retrieve         # Retrieve secret
DELETE /api/secret-manager/delete           # Delete secret
```

#### Cloud Providers
```http
GET    /api/cloud-providers/:provider/regions      # List regions
GET    /api/cloud-providers/:provider/instance-types # List instance types
POST   /api/cloud-providers/:provider/validate     # Validate credentials
POST   /api/cloud-providers/:provider/estimate-costs # Estimate costs
```

### Database Schema

#### CCRP Cloud Credentials Table
```sql
SELECT * FROM ccrp_cloud_credentials;

-- Key fields:
-- cloudProvider: AZURE, AWS, GCP, OCI
-- secretManager: VAULT, AWS_SECRETS, AZURE_KEYVAULT, GCP_SECRETS, OCI_VAULT
-- secretName: Reference to secret in secret manager
-- validationStatus: PENDING, VALID, INVALID, EXPIRED
```

### Secret Manager Commands

#### Vault Commands
```bash
# Check Vault status
./vault status

# List secrets
./vault kv list secret/

# Get secret
./vault kv get secret/data/my-azure-credentials

# Store secret
./vault kv put secret/data/my-azure-credentials clientId=test clientSecret=test
```

### Cloud Provider Services

#### Azure Provider
```javascript
const azureProvider = new AzureProvider();

// Validate credentials
const isValid = await azureProvider.validateCredentials(credentials);

// Get regions
const regions = await azureProvider.getRegions();

// Get VM sizes
const vmSizes = await azureProvider.getVMSizes();

// Estimate costs
const costEstimate = await azureProvider.estimateCosts(requirements);
```

#### AWS Provider
```javascript
const awsProvider = new AWSProvider();

// Validate credentials
const isValid = await awsProvider.validateCredentials(credentials);

// Get regions
const regions = await awsProvider.getRegions();

// Get instance types
const instanceTypes = await awsProvider.getInstanceTypes();

// Estimate costs
const costEstimate = await awsProvider.estimateCosts(requirements);
```

### Frontend Components

#### CCRP Cloud Credentials Page
```javascript
// Route: /ccrp/cloud-credentials
// Access: CCRP and AppAdmin roles only

// Features:
// - Add/Edit/Delete cloud credentials
// - Validate credentials
// - View credential status
// - Support for multiple cloud providers
// - Secret manager selection
```

#### Navigation
```javascript
// Old Azure credentials page redirects to new multi-cloud page
// Route: /ccrp/azure-credentials → /ccrp/cloud-credentials
```

### Environment Variables

#### Development
```bash
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=dev-token-12345
DATABASE_URL=***REMOVED-DB_PASSWORD***ql://username:password@localhost:5432/contract_management
JWT_SECRET=your-jwt-secret
```

#### Production
```bash
VAULT_ADDR=https://vault.company.com
VAULT_TOKEN=<production-token>
AWS_SECRETS_ACCESS_KEY=<aws-access-key>
AWS_SECRETS_SECRET_KEY=<aws-secret-key>
AZURE_KEY_VAULT_NAME=<azure-key-vault-name>
GCP_SECRETS_PROJECT_ID=<gcp-project-id>
```

### Testing

#### Backend Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- secretManager.test.js

# Run integration tests
node test-multi-cloud-integration.js
```

#### Frontend Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- CCRPCloudCredentials.test.js

# Run E2E tests
npm run test:e2e
```

### Debugging

#### Common Issues
```bash
# Vault connection issues
./vault status
echo $VAULT_ADDR
echo $VAULT_TOKEN

# Database connection issues
psql -d contract_management -c "SELECT 1;"

# Authentication issues
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/auth/profile
```

#### Debug Commands
```bash
# Check Vault secrets
./vault kv list secret/

# Check database tables
psql -d contract_management -c "SELECT COUNT(*) FROM ccrp_cloud_credentials;"

# Test API endpoints
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/ccrp/cloud-credentials
```

### Security Best Practices

#### Credential Management
- Never store sensitive data in database
- Use secret manager for all credentials
- Implement credential rotation
- Monitor credential access

#### Access Control
- Use role-based access control
- Implement audit logging
- Monitor access patterns
- Regular security reviews

#### Data Protection
- Encrypt data at rest and in transit
- Implement data classification
- Follow DPDP compliance guidelines
- Regular security assessments

### Performance Optimization

#### Database Optimization
```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_ccrp_cloud_credentials_user ON ccrp_cloud_credentials("ccrpUserId");
CREATE INDEX idx_ccrp_cloud_credentials_provider ON ccrp_cloud_credentials("cloudProvider");
```

#### API Optimization
```javascript
// Implement caching for frequently accessed data
const cache = new Map();

const cachedRequest = async (key, requestFn) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await requestFn();
  cache.set(key, result);
  return result;
};
```

### Deployment

#### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs backend
```

#### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods

# View logs
kubectl logs deployment/contract-management-backend
```

### Monitoring

#### Health Checks
```bash
# Backend health check
curl http://localhost:3001/api/health

# Vault health check
./vault status

# Database health check
psql -d contract_management -c "SELECT 1;"
```

#### Metrics
```javascript
// Application metrics
const metrics = {
  activeCredentials: await CCRPCloudCredentials.count({ where: { isActive: true } }),
  validCredentials: await CCRPCloudCredentials.count({ where: { validationStatus: 'VALID' } }),
  totalUsers: await User.count()
};
```

### Troubleshooting

#### Quick Fixes
```bash
# Restart Vault
./setup-vault-dev.sh

# Restart database
brew services restart ***REMOVED-DB_PASSWORD***ql

# Clear application cache
rm -rf node_modules/.cache

# Reset database
npm run migrate:reset
```

#### Log Analysis
```bash
# Backend logs
tail -f backend/logs/app.log

# Database logs
tail -f /usr/local/var/log/***REMOVED-DB_PASSWORD***ql.log

# Vault logs
tail -f vault.log
```

## Conclusion

This quick reference provides essential information for developers working with the multi-cloud secret management system. For detailed documentation, refer to the comprehensive architecture and integration guides. 