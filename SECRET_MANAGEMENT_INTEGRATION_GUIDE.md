# Secret Management Integration Guide

## Overview

This guide explains how the multi-cloud secret management system is integrated with the Contract Management System application, covering both backend and frontend integration points.

## Backend Integration

### 1. Service Layer Integration

#### 1.1 Secret Manager Service Integration
```javascript
// backend/services/secretManager.js
class SecretManager {
  constructor() {
    this.providers = {
      VAULT: this.createVaultProvider(),
      AWS_SECRETS: this.createAWSProvider(),
      AZURE_KEYVAULT: this.createAzureProvider(),
      GCP_SECRETS: this.createGCPProvider(),
      OCI_VAULT: this.createOCIProvider()
    };
  }

  async storeCredentials(secretName, secretManager, credentials, cloudProvider) {
    // Store encrypted credentials in secret manager
    const secretData = {
      ...credentials,
      cloudProvider,
      storedAt: new Date().toISOString()
    };
    
    await this.providers[secretManager].write(`secret/data/${secretName}`, secretData);
  }

  async getCredentials(secretName, secretManager) {
    // Retrieve encrypted credentials from secret manager
    const response = await this.providers[secretManager].read(`secret/data/${secretName}`);
    return response.data.data;
  }
}
```

#### 1.2 Cloud Provider Service Integration
```javascript
// backend/services/providers/azureProvider.js
class AzureProvider {
  async validateCredentials(credentials) {
    // Validate Azure credentials using Azure SDK
    try {
      const credential = new ClientSecretCredential(
        credentials.tenantId,
        credentials.clientId,
        credentials.clientSecret
      );
      
      const client = new SubscriptionClient(credential);
      await client.subscriptions.list();
      return { valid: true, message: 'Credentials are valid' };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  async createTrainingEnvironment(config) {
    // Create training environment using stored credentials
    const secretManager = new SecretManager();
    const credentials = await secretManager.getCredentials(config.secretName, config.secretManager);
    
    // Use credentials to provision Azure resources
    return await this.provisionEnvironment(credentials, config);
  }
}
```

### 2. Database Integration

#### 2.1 Model Integration
```javascript
// backend/models/CCRPCloudCredentials.js
class CCRPCloudCredentials extends Model {
  static init(sequelize, DataTypes) {
    return super.init({
      ccrpUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      cloudProvider: {
        type: DataTypes.ENUM('AZURE', 'AWS', 'GCP', 'OCI'),
        allowNull: false
      },
      secretName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      secretManager: {
        type: DataTypes.ENUM('VAULT', 'AWS_SECRETS', 'AZURE_KEYVAULT', 'GCP_SECRETS', 'OCI_VAULT'),
        allowNull: false,
        defaultValue: 'VAULT'
      },
      validationStatus: {
        type: DataTypes.ENUM('PENDING', 'VALID', 'INVALID', 'EXPIRED'),
        allowNull: false,
        defaultValue: 'PENDING'
      }
    }, {
      sequelize,
      modelName: 'CCRPCloudCredentials',
      tableName: 'ccrp_cloud_credentials'
    });
  }
}
```

#### 2.2 Database Operations
```javascript
// Example: Store credential metadata
const credential = await CCRPCloudCredentials.create({
  ccrpUserId: currentUser.id,
  cloudProvider: 'AZURE',
  secretName: 'my-azure-credentials',
  secretManager: 'VAULT',
  defaultLocation: 'eastus',
  defaultVMSize: 'Standard_D2s_v3'
});

// Example: Retrieve credential metadata
const credentials = await CCRPCloudCredentials.findAll({
  where: { ccrpUserId: currentUser.id, isActive: true }
});
```

### 3. API Route Integration

#### 3.1 Cloud Credentials API Routes
```javascript
// backend/routes/ccrp.js

// GET /api/ccrp/cloud-credentials
router.get('/cloud-credentials', authenticateToken, async (req, res) => {
  try {
    const credentials = await CCRPCloudCredentials.findAll({
      where: { ccrpUserId: req.user.id, isActive: true }
    });
    res.json(credentials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve credentials' });
  }
});

// POST /api/ccrp/cloud-credentials
router.post('/cloud-credentials', authenticateToken, async (req, res) => {
  try {
    const { cloudProvider, secretManager, secretName, ...config } = req.body;
    
    // Store sensitive data in secret manager
    const secretManagerService = new SecretManager();
    await secretManagerService.storeCredentials(
      secretName,
      secretManager,
      req.body.credentials,
      cloudProvider
    );
    
    // Store metadata in database
    const credential = await CCRPCloudCredentials.create({
      ccrpUserId: req.user.id,
      cloudProvider,
      secretManager,
      secretName,
      ...config
    });
    
    res.json(credential);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create credential' });
  }
});

// POST /api/ccrp/cloud-credentials/:id/validate
router.post('/cloud-credentials/:id/validate', authenticateToken, async (req, res) => {
  try {
    const credential = await CCRPCloudCredentials.findByPk(req.params.id);
    
    // Retrieve credentials from secret manager
    const secretManager = new SecretManager();
    const credentials = await secretManager.getCredentials(
      credential.secretName,
      credential.secretManager
    );
    
    // Validate with cloud provider
    const provider = getCloudProvider(credential.cloudProvider);
    const validation = await provider.validateCredentials(credentials);
    
    // Update validation status
    await credential.update({
      validationStatus: validation.valid ? 'VALID' : 'INVALID',
      lastValidated: new Date()
    });
    
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate credential' });
  }
});
```

### 4. Middleware Integration

#### 4.1 Authentication Middleware
```javascript
// backend/middleware/auth.js
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

#### 4.2 Role-Based Access Control
```javascript
// backend/middleware/roleAuth.js
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.partyType)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Usage in routes
router.get('/cloud-credentials', 
  authenticateToken, 
  requireRole(['CCRP', 'AppAdmin']), 
  async (req, res) => {
    // Route handler
  }
);
```

## Frontend Integration

### 1. Component Integration

#### 1.1 Multi-Cloud Credentials Component
```javascript
// frontend/src/pages/CCRPCloudCredentials.js
const CCRPCloudCredentials = () => {
  const { currentUser } = useUser();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/ccrp/cloud-credentials');
      setCredentials(response.data);
    } catch (error) {
      console.error('Error loading credentials:', error);
      setError('Failed to load cloud credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredential = async (credentialData) => {
    try {
      await apiService.post('/api/ccrp/cloud-credentials', credentialData);
      toast.success('Credential added successfully');
      loadCredentials();
    } catch (error) {
      toast.error('Failed to add credential');
    }
  };

  const handleValidateCredential = async (credentialId) => {
    try {
      await apiService.post(`/api/ccrp/cloud-credentials/${credentialId}/validate`);
      toast.success('Credential validated successfully');
      loadCredentials();
    } catch (error) {
      toast.error('Credential validation failed');
    }
  };
};
```

#### 1.2 API Service Integration
```javascript
// frontend/src/services/api.js
class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }

  async get(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  async post(endpoint, data) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
}
```

### 2. Context Integration

#### 2.1 User Context Integration
```javascript
// frontend/src/contexts/UserContext.js
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await apiService.get('/api/auth/profile');
          setCurrentUser(response.user);
        } catch (error) {
          localStorage.removeItem('authToken');
        }
      }
      setIsInitializing(false);
    };

    initializeUser();
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, isInitializing }}>
      {children}
    </UserContext.Provider>
  );
};
```

### 3. Routing Integration

#### 3.1 Route Configuration
```javascript
// frontend/src/App.js
function AppRoutes() {
  return (
    <Routes>
      {/* CCRP Routes */}
      <Route path="/ccrp/*" element={
        <RoleProtectedRoute allowedRoles={['CCRP', 'AppAdmin']}>
          <Layout>
            <Routes>
              <Route path="/cloud-credentials" element={<CCRPCloudCredentials />} />
              <Route path="/azure-credentials" element={<CCRPAzureCredentials />} />
            </Routes>
          </Layout>
        </RoleProtectedRoute>
      } />
    </Routes>
  );
}
```

#### 3.2 Role-Based Route Protection
```javascript
// frontend/src/components/RoleProtectedRoute.js
const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { currentUser } = useUser();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(currentUser.partyType)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};
```

## Integration Points

### 1. Data Flow Integration

#### 1.1 Credential Creation Flow
```
Frontend Form → API Request → Backend Validation → Secret Manager Storage → Database Metadata Storage → Response
```

#### 1.2 Credential Validation Flow
```
Frontend Request → API Call → Secret Manager Retrieval → Cloud Provider Validation → Database Status Update → Response
```

#### 1.3 Credential Usage Flow
```
Application Request → Secret Manager Retrieval → Cloud Provider API Call → Resource Provisioning → Response
```

### 2. Security Integration

#### 2.1 Authentication Integration
- **JWT Tokens**: All API requests require valid JWT tokens
- **Role-Based Access**: CCRP and AppAdmin roles only for cloud credentials
- **Token Refresh**: Automatic token refresh on expiration

#### 2.2 Authorization Integration
- **User-Scoped Access**: Users can only access their own credentials
- **Admin Override**: AppAdmin can access all credentials
- **Audit Logging**: All credential operations are logged

### 3. Error Handling Integration

#### 3.1 Backend Error Handling
```javascript
// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});
```

#### 3.2 Frontend Error Handling
```javascript
// API error interceptor
apiService.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Testing Integration

### 1. Backend Testing
```javascript
// backend/tests/secretManager.test.js
describe('Secret Manager Integration', () => {
  test('should store and retrieve credentials', async () => {
    const secretManager = new SecretManager();
    const credentials = { clientId: 'test', clientSecret: 'test' };
    
    await secretManager.storeCredentials('test-secret', 'VAULT', credentials, 'AZURE');
    const retrieved = await secretManager.getCredentials('test-secret', 'VAULT');
    
    expect(retrieved.clientId).toBe('test');
  });
});
```

### 2. Frontend Testing
```javascript
// frontend/tests/CCRPCloudCredentials.test.js
describe('CCRP Cloud Credentials', () => {
  test('should load credentials', async () => {
    render(<CCRPCloudCredentials />);
    
    await waitFor(() => {
      expect(screen.getByText('Cloud Credentials Management')).toBeInTheDocument();
    });
  });
});
```

## Deployment Integration

### 1. Environment Configuration
```bash
# Development
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=dev-token-12345

# Production
VAULT_ADDR=https://vault.company.com
VAULT_TOKEN=<production-token>
```

### 2. Docker Integration
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### 3. Kubernetes Integration
```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: contract-management-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        - name: VAULT_ADDR
          valueFrom:
            secretKeyRef:
              name: vault-config
              key: vault-addr
        - name: VAULT_TOKEN
          valueFrom:
            secretKeyRef:
              name: vault-config
              key: vault-token
```

## Monitoring Integration

### 1. Health Checks
```javascript
// backend/routes/health.js
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();
    
    // Check Vault connection
    const secretManager = new SecretManager();
    await secretManager.getAvailableSecretManagers();
    
    res.json({ status: 'healthy' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

### 2. Metrics Collection
```javascript
// backend/middleware/metrics.js
const collectMetrics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
};
```

## Conclusion

The secret management system is fully integrated with the Contract Management System through multiple layers:

1. **Service Layer**: Secret manager and cloud provider services
2. **Database Layer**: Metadata storage and retrieval
3. **API Layer**: RESTful endpoints for credential management
4. **Frontend Layer**: User interface for credential management
5. **Security Layer**: Authentication and authorization
6. **Monitoring Layer**: Health checks and metrics

This integration provides a secure, scalable, and user-friendly way to manage cloud provider credentials while maintaining separation of concerns and following security best practices. 