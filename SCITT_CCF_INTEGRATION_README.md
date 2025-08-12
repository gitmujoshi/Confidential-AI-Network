# 🚀 SCITT CCF Ledger Integration

This document provides comprehensive information about the SCITT CCF Ledger integration with the Contract Management System.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)
9. [API Reference](#api-reference)
10. [Contributing](#contributing)

## 🎯 Overview

The SCITT CCF Ledger integration provides a high-performance, confidential computing alternative to traditional blockchain implementations. This integration enables:

- **High Throughput**: 10-100x performance improvement over Ethereum
- **Confidential Computing**: Hardware-level TEE (Trusted Execution Environment) support
- **Standards Compliance**: IETF SCITT working group standards
- **Hybrid Operation**: Seamless migration from Ethereum to SCITT CCF
- **Zero Downtime**: Continuous service during migration

### Key Benefits

- **Performance**: Enterprise-grade throughput and latency
- **Security**: Hardware-level security through TEEs
- **Compliance**: Emerging supply chain integrity standards
- **Scalability**: Multi-node deployment support
- **Future-Proofing**: Microsoft-backed technology

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                Contract Management System                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Frontend      │  │   Backend       │  │   Keycloak      │  │
│  │   (React)       │◄─►│   (Node.js)     │◄─►│   (IAM)         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Contract Router Service                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Ethereum        │  │ SCITT CCF       │  │ Migration       │  │
│  │ Service         │  │ Service         │  │ Orchestrator    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ PostgreSQL      │  │ SCITT CCF       │  │ Ethereum        │  │
│  │ (Primary)       │  │ Ledger          │  │ Blockchain      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Service Layer

- **ContractRouterService**: Central orchestrator for contract operations
- **ScittCcfService**: SCITT CCF Ledger integration service
- **SystemHealthMonitor**: Real-time system health monitoring
- **MigrationOrchestrator**: Contract migration management

### Data Models

- **ScittClaim**: Local storage of SCITT CCF claims
- **SystemHealthLog**: System health monitoring logs
- **Contract**: Enhanced with SCITT CCF fields

## 🚀 Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Docker and Docker Compose
- SCITT CCF Ledger (Microsoft's implementation)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ContractManagement
   git checkout feature/scitt-ccf-migration
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp env.scitt-ccf.example .env.scitt-ccf
   # Edit .env.scitt-ccf with your configuration
   ```

4. **Run database migration**
   ```bash
   cd backend
   npm run migrate:scitt-ccf
   ```

5. **Start SCITT CCF services**
   ```bash
   docker-compose -f docker-compose.scitt-ccf-dev.yml up -d
   ```

6. **Test integration**
   ```bash
   cd backend
   node scripts/test-scitt-ccf-integration.js
   ```

### Manual Installation

#### 1. SCITT CCF Ledger Setup

```bash
# Clone SCITT CCF Ledger
git clone https://github.com/microsoft/scitt-ccf-ledger.git
cd scitt-ccf-ledger

# Build and run
export PLATFORM=virtual  # For development
./docker/build.sh
./docker/run-dev.sh
```

#### 2. Database Setup

```sql
-- Run the migration manually if needed
-- See backend/migrations/20250108-add-scitt-ccf-tables.js
```

#### 3. Service Configuration

```bash
# Copy environment configuration
cp env.scitt-ccf.example .env.scitt-ccf

# Edit configuration
nano .env.scitt-ccf
```

## ⚙️ Configuration

### Environment Variables

#### Core Configuration
```bash
# SCITT CCF Node
SCITT_CCF_ENABLED=true
SCITT_CCF_NODE_URL=https://127.0.0.1:8000
SCITT_CCF_PLATFORM=virtual  # virtual, snp

# Migration Mode
MIGRATION_MODE=HYBRID  # ETHEREUM_ONLY, SCITT_CCF_ONLY, HYBRID
```

#### Health Monitoring
```bash
HEALTH_CHECK_INTERVAL=30000  # 30 seconds
HEALTH_CHECK_TIMEOUT=5000    # 5 seconds
ALERT_RESPONSE_TIME_THRESHOLD=5000
```

#### Performance
```bash
PERFORMANCE_MONITORING_ENABLED=true
CACHE_ENABLED=true
CACHE_TTL=300000  # 5 minutes
```

### Configuration Files

#### Docker Compose
- `docker-compose.scitt-ccf-dev.yml`: Development environment
- `docker-compose.scitt-ccf-staging.yml`: Staging environment
- `docker-compose.scitt-ccf-prod.yml`: Production environment

#### Environment Files
- `env.scitt-ccf.example`: Example configuration
- `.env.scitt-ccf`: Your environment configuration

## 💻 Usage

### Basic Usage

#### 1. Initialize Services

```javascript
const ContractRouterService = require('./services/contractRouterService');

const router = new ContractRouterService();
await router.initialize();
```

#### 2. Create Contract

```javascript
const contractData = {
  contractId: 'CONTRACT-001',
  tdcAddress: '0x1234...',
  tdpAddress: '0x5678...',
  datasetId: 'DS-001',
  price: 1000,
  duration: 30,
  termsAndConditions: 'Contract terms...'
};

const result = await router.createContract(contractData);
console.log('Contract created:', result.source);
```

#### 3. Get Contract Status

```javascript
const status = await router.getContractStatus('CONTRACT-001');
console.log('Contract status:', status.status);
console.log('Source system:', status.source);
```

#### 4. Sign Contract

```javascript
const signResult = await router.signContract(
  'CONTRACT-001',
  '0x1234...',
  'TDP'
);
console.log('Contract signed:', signResult.message);
```

### Advanced Usage

#### 1. Switch Migration Mode

```javascript
// Switch to SCITT CCF only
await router.switchMigrationMode('SCITT_CCF_ONLY');

// Switch to hybrid mode
await router.switchMigrationMode('HYBRID');
```

#### 2. Monitor System Health

```javascript
const health = await router.getSystemHealth();
console.log('Overall health:', health.overall);
console.log('Ethereum health:', health.ethereum.isHealthy);
console.log('SCITT CCF health:', health.scittCcf.isHealthy);
```

#### 3. Get Performance Metrics

```javascript
const metrics = await router.getDetailedMetrics();
console.log('Ethereum metrics:', metrics.ethereum);
console.log('SCITT CCF metrics:', metrics.scittCcf);
```

#### 4. Test Routing Logic

```javascript
const routingTest = await router.testRoutingLogic();
console.log('Routing test results:', routingTest);
```

## 🧪 Testing

### Running Tests

#### 1. Integration Tests

```bash
cd backend
node scripts/test-scitt-ccf-integration.js
```

#### 2. Unit Tests

```bash
npm test -- --grep "SCITT CCF"
```

#### 3. Performance Tests

```bash
npm run test:performance
```

### Test Coverage

The integration tests cover:

- ✅ Service initialization
- ✅ Health monitoring
- ✅ Contract operations
- ✅ Performance metrics
- ✅ Error handling
- ✅ Migration modes
- ✅ Routing logic

### Test Data

Test data is automatically cleaned up after tests complete. You can configure test behavior in the environment file:

```bash
TEST_MODE=false
TEST_DATA_CLEANUP=true
TEST_DATA_CLEANUP_INTERVAL=3600000  # 1 hour
```

## 🚀 Deployment

### Development Environment

```bash
# Start development services
docker-compose -f docker-compose.scitt-ccf-dev.yml up -d

# View logs
docker-compose -f docker-compose.scitt-ccf-dev.yml logs -f
```

### Staging Environment

```bash
# Deploy to staging
docker-compose -f docker-compose.scitt-ccf-staging.yml up -d

# Run staging tests
NODE_ENV=staging npm test
```

### Production Environment

```bash
# Deploy to production
docker-compose -f docker-compose.scitt-ccf-prod.yml up -d

# Monitor production
docker-compose -f docker-compose.scitt-ccf-prod.yml logs -f
```

### Environment-Specific Configurations

#### Development
- Platform: `virtual` (no TEE required)
- Node count: 1
- Logging: `DEBUG`
- Health checks: 30 seconds

#### Staging
- Platform: `virtual` or `snp` (if TEE available)
- Node count: 2
- Logging: `INFO`
- Health checks: 30 seconds

#### Production
- Platform: `snp` (AMD SEV-SNP required)
- Node count: 3+
- Logging: `WARN`
- Health checks: 15 seconds

## 🔧 Troubleshooting

### Common Issues

#### 1. SCITT CCF Service Not Initializing

**Symptoms**: Service fails to initialize, connection errors

**Solutions**:
```bash
# Check SCITT CCF node status
curl -f http://localhost:8000/app/health

# Check Docker containers
docker-compose -f docker-compose.scitt-ccf-dev.yml ps

# Check logs
docker-compose -f docker-compose.scitt-ccf-dev.yml logs scitt-ccf-node
```

#### 2. Database Migration Failures

**Symptoms**: Migration errors, missing tables

**Solutions**:
```bash
# Check database connection
psql -h localhost -U username -d database

# Run migration manually
cd backend
npm run migrate:scitt-ccf

# Check migration status
npm run migrate:status
```

#### 3. Health Check Failures

**Symptoms**: System health showing as unhealthy

**Solutions**:
```bash
# Check service logs
docker-compose logs -f

# Verify environment variables
cat .env.scitt-ccf

# Test individual services
node -e "require('./services/scittCcfService').testConnection()"
```

#### 4. Performance Issues

**Symptoms**: Slow response times, high latency

**Solutions**:
```bash
# Check system resources
docker stats

# Monitor performance metrics
curl http://localhost:8000/app/metrics

# Check cache configuration
grep CACHE .env.scitt-ccf
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set debug level
export DEBUG_LEVEL=debug
export LOG_LEVEL=DEBUG

# Run with debug output
DEBUG=* node scripts/test-scitt-ccf-integration.js
```

### Log Files

Logs are stored in:
- Application logs: `./logs/scitt-ccf.log`
- Docker logs: `docker-compose logs`
- System logs: `./logs/system-health.log`

## 📚 API Reference

### ContractRouterService

#### Methods

- `initialize()`: Initialize all services
- `createContract(contractData)`: Create a new contract
- `signContract(contractId, signerAddress, partyType)`: Sign a contract
- `getContractStatus(contractId)`: Get contract status
- `getSystemHealth()`: Get overall system health
- `switchMigrationMode(mode)`: Switch migration mode
- `getConfiguration()`: Get current configuration

#### Migration Modes

- `ETHEREUM_ONLY`: Use only Ethereum blockchain
- `SCITT_CCF_ONLY`: Use only SCITT CCF Ledger
- `HYBRID`: Use both systems (recommended)

### ScittCcfService

#### Methods

- `initialize()`: Initialize SCITT CCF service
- `createContract(contractData)`: Create contract in SCITT CCF
- `signContract(contractId, signerAddress, partyType)`: Sign contract
- `getContractStatus(contractId)`: Get contract status
- `getHealthStatus()`: Get service health status
- `getPerformanceMetrics()`: Get performance metrics

### SystemHealthMonitor

#### Methods

- `startMonitoring()`: Start health monitoring
- `stopMonitoring()`: Stop health monitoring
- `getSystemHealth()`: Get system health status
- `getDetailedMetrics()`: Get detailed metrics
- `resetHealthCounters()`: Reset health counters

## 🤝 Contributing

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation

3. **Run tests**
   ```bash
   npm test
   node scripts/test-scitt-ccf-integration.js
   ```

4. **Submit pull request**
   - Include description of changes
   - Reference related issues
   - Ensure all tests pass

### Code Standards

- Use ES6+ features
- Follow JSDoc documentation
- Maintain test coverage >80%
- Use meaningful variable names
- Handle errors gracefully

### Testing Requirements

- Unit tests for all new functions
- Integration tests for new services
- Performance tests for critical paths
- Error handling tests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Microsoft for the SCITT CCF Ledger implementation
- IETF SCITT working group for standards development
- Open source community for tools and libraries

## 📞 Support

For support and questions:

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation**: [Project Wiki](https://github.com/your-repo/wiki)
- **Email**: support@contractflow.pro

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-01-08  
**Status**: Active Development  
**Next Review**: After initial deployment
