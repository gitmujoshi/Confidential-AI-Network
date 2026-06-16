# SCITT CCF Integration Architecture

## 🏗️ Design Principles

### **1. Complete Service Isolation**
- **No shared resources** between main app and SCITT CCF
- **Independent databases** with separate connection pools
- **Separate Redis instances** to prevent conflicts
- **Different ports** for all services

### **2. Graceful Degradation**
- Main app continues working even if SCITT CCF fails
- SCITT CCF integration is **optional** and **non-blocking**
- Fallback mechanisms for all SCITT operations

### **3. Loose Coupling**
- Main app doesn't depend on SCITT CCF for core functionality
- Communication through **well-defined APIs** only
- **No direct database access** between services

## 🏛️ Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway (Port 8000)                 │
│  ┌─────────────────┐                    ┌─────────────────┐   │
│  │   Main App      │                    │   SCITT CCF     │   │
│  │   (Port 5001)   │◄─────────────────►│   (Port 9000)   │   │
│  └─────────────────┘                    └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │   Load Balancer /      │
                    │   Health Monitoring     │
                    └─────────────────────────┘
```

## 🗄️ Database Strategy

### **Main App Database (Port 5432)**
```
Core Tables:
├── users
├── contracts  
├── datasets
├── notifications
└── scitt_references (NEW - only stores IDs)
```

### **SCITT CCF Database (Port 5433)**
```
SCITT Tables:
├── scitt_claims
├── merkle_trees
├── provenance_nodes
├── provenance_captures
├── provenance_verifications
└── system_health_log
```

## 🔐 Authentication & Security

### **Shared Authentication**
- **Single Keycloak instance** for both services
- **JWT tokens** validated by API Gateway
- **Role-based access control** maintained across services

### **Service-to-Service Communication**
- **Internal API keys** for service authentication
- **HTTPS/TLS** for all communications
- **Rate limiting** and **request validation**

## 📊 Data Flow

### **1. Contract Creation with Provenance**
```
User → Main App → Contract Created → SCITT CCF → Provenance Record → Reference Stored
```

### **2. Data Provenance Verification**
```
User → Main App → SCITT CCF → Merkle Tree Verification → Result Returned
```

### **3. Health Monitoring**
```
API Gateway → Health Checks → Both Services → Aggregated Status
```

## 🚀 Implementation Phases

### **Phase 1: Architecture & Design** ✅
- [x] Architecture documentation
- [ ] API specifications
- [ ] Database schema design
- [ ] Security requirements

### **Phase 2: Infrastructure Setup**
- [ ] Isolated Docker containers
- [ ] API Gateway implementation
- [ ] Database separation
- [ ] Network configuration

### **Phase 3: SCITT CCF Service**
- [ ] Core SCITT functionality
- [ ] Merkle tree generation
- [ ] Health monitoring
- [ ] API endpoints

### **Phase 4: Integration Layer**
- [ ] Main app integration
- [ ] Graceful degradation
- [ ] Error handling
- [ ] Testing

### **Phase 5: Testing & Validation**
- [ ] Unit tests
- [ ] Integration tests
- [ ] Failure scenario testing
- [ ] Performance testing

### **Phase 6: Deployment & Monitoring**
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Alerting configuration
- [ ] Documentation

## 🔧 Configuration Management

### **Environment Variables**
```bash
# Main App
MAIN_APP_PORT=5001
MAIN_DB_URL=***REMOVED-DB_PASSWORD***ql://user:pass@localhost:5432/main_app

# SCITT CCF
SCITT_CCF_PORT=9000
SCITT_DB_URL=***REMOVED-DB_PASSWORD***ql://user:pass@localhost:5433/scitt_ccf
SCITT_CCF_ENABLED=true

# API Gateway
GATEWAY_PORT=8000
```

### **Feature Flags**
```javascript
const config = {
  scittCcf: {
    enabled: process.env.SCITT_CCF_ENABLED === 'true',
    baseUrl: process.env.SCITT_CCF_URL || 'http://localhost:9000',
    timeout: parseInt(process.env.SCITT_CCF_TIMEOUT) || 5000
  }
};
```

## 📈 Monitoring & Observability

### **Health Checks**
- **Main App**: `/health`
- **SCITT CCF**: `/health`
- **API Gateway**: `/health`

### **Metrics**
- Request/response times
- Error rates
- Database connection status
- SCITT CCF availability

### **Alerting**
- Service down alerts
- High error rate alerts
- Database connection failures
- SCITT CCF integration failures

## 🚨 Failure Scenarios & Recovery

### **SCITT CCF Service Down**
1. **Detection**: Health check fails
2. **Response**: Return graceful degradation message
3. **Recovery**: Continue without SCITT functionality
4. **Notification**: Alert operations team

### **Database Connection Issues**
1. **Detection**: Connection timeout/error
2. **Response**: Use cached data if available
3. **Recovery**: Retry with exponential backoff
4. **Notification**: Alert database team

### **API Gateway Failures**
1. **Detection**: Gateway health check fails
2. **Response**: Direct service access (fallback)
3. **Recovery**: Restart gateway service
4. **Notification**: Alert infrastructure team

## 🔄 Rollback Strategy

### **Immediate Rollback**
- Disable SCITT CCF integration via feature flag
- Route all traffic to main app only
- Maintain data integrity

### **Gradual Rollback**
- Reduce SCITT CCF traffic gradually
- Monitor system stability
- Re-enable when issues resolved

## 📋 Success Criteria

### **Functional Requirements**
- [ ] SCITT CCF integration works without affecting main app
- [ ] Provenance records are created and verified
- [ ] Graceful degradation when SCITT CCF is unavailable
- [ ] All existing functionality remains intact

### **Performance Requirements**
- [ ] Main app response time < 200ms (95th percentile)
- [ ] SCITT CCF integration adds < 100ms overhead
- [ ] System handles 1000+ concurrent users
- [ ] Database queries complete in < 50ms

### **Reliability Requirements**
- [ ] 99.9% uptime for main app
- [ ] 99.5% uptime for SCITT CCF
- [ ] Zero data loss during failures
- [ ] Automatic recovery from common failures
