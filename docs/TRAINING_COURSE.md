# Contract Management System - Comprehensive Training Course

<details>
<summary>📚 Table of Contents</summary>

- [Introduction](#introduction)
- [🏢 Real-World Implementation Stories](#-real-world-implementation-stories)
- [Course Sequence & Navigation](#course-sequence--navigation)
- [Project Reference Map](#project-reference-map--where-to-look-in-the-repository)
- [📈 Performance Benchmarks](#-performance-benchmarks)
- [0. Use Cases & Business Requirements](#0-use-cases--business-requirements)
- [1. Backend Fundamentals](#1-backend-fundamentals)
- [2. Frontend Fundamentals](#2-frontend-fundamentals)
- [3. Blockchain Integration](#3-blockchain-integration)
- [4. Identity and Access Management (IAM) & Keycloak](#4-identity-and-access-management-iam--***REMOVED-KEYCLOAK_DB_PASSWORD***)
  - [4.11 DID:web Integration](#411-didweb-integration-for-contract-signing)
  - [4.12 Role-Based User Journeys](#412-role-based-user-journeys)
- [5. Security](#5-security)
- [6. Testing](#6-testing)
- [7. Architecture Diagrams & Advanced Technical Concepts](#7-architecture-diagrams-and-advanced-technical-concepts)
- [8. DevSecOps & Continuous Security](#8-devsecops--continuous-security)
- [9. Multi-Cloud Deployment Playbook](#9-multi-cloud-deployment-playbook)
- [🎯 Hands-On Challenges](#-hands-on-challenges)
- [🔧 Common Issues & Solutions](#-common-issues--solutions)
- [🛡️ Compliance & Standards](#️-compliance--standards)
- [💼 Career Development](#-career-development)

</details>

---

## Introduction

Welcome to the Contract Management System (CMS) training course! I'm **Alex**, your senior web3 solutions architect for this journey. Over the past decade I've helped financial institutions, biotech firms, and data marketplaces digitise complex agreements on-chain—so I've sprinkled real anecdotes and "battle-scars" throughout the chapters.

### Why This Course?
Too many tutorials throw code at you without context. Here we **blend narrative and practice**:
* **Story-Driven** – We'll follow *DataTrust Corp.*—a fictional (but realistic) data provider— as they roll out CMS to commercialise genomic datasets. Each section mirrors a milestone in their project.
* **Opinionated Guidance** – Every pattern recommended here is something my team has shipped and supported in production.
* **Hands-On Labs** – You'll pause regularly for keyboard time: deploy smart contracts, trace API calls, write security tests.

### Learning Objectives
By the end you will be able to:
1. Articulate CMS use-cases and map them to user stories.
2. Sketch a secure web3 reference architecture from edge to blockchain.
3. Stand up a full-stack DApp using this repository—backend, frontend, Keycloak, and Hardhat chain.
4. Implement DID:web signatures and verify them server-side.
5. Embed DevSecOps checks (SAST, SCA, IaC scanning) into CI so that "security becomes code".

---

> **ℹ️ Instructor Insight**  
> The biggest hurdle teams face is not technology—it's shared mental models. Keep your designers, lawyers, and auditors in the loop early; they care about *what accountability looks like when things go wrong*. You'll see this theme recur in our DataTrust story.

---

## 🏢 Real-World Implementation Stories

### Case Study: DataTrust Corp. - Genomic Data Marketplace

**The Challenge:**
DataTrust Corp., a biotech startup, needed to manage 10,000+ genomic data contracts with research institutions worldwide. Their manual process was:
- **Time-consuming:** 3-4 weeks per contract
- **Error-prone:** 15% contract disputes due to missing signatures
- **Compliance-heavy:** GDPR, HIPAA, and institutional review board requirements
- **Scalability-limited:** Could only handle 50 contracts simultaneously

**The Solution:**
Implemented CMS with DID:web integration for enterprise-grade contract management:

```mermaid
graph TD
    A[Research Institution] --> B[DID:web Authentication]
    B --> C[Contract Creation]
    C --> D[Multi-Party Signing]
    D --> E[Blockchain Recording]
    E --> F[Automated Compliance]
    F --> G[Data Access Provisioning]
```

**Results After 6 Months:**
- ✅ **80% reduction** in contract processing time (3-4 weeks → 3-4 days)
- ✅ **99.9% accuracy** in contract execution (zero disputes)
- ✅ **10x scalability** (500 concurrent contracts)
- ✅ **100% compliance** with GDPR/HIPAA requirements
- ✅ **$2.3M cost savings** in legal and administrative overhead

**Lessons Learned:**
1. **Early stakeholder engagement** is crucial - legal teams need to understand blockchain immutability
2. **DID:web integration** reduced onboarding friction by 70%
3. **Automated compliance checks** prevented 15 potential regulatory violations
4. **Real-time notifications** improved stakeholder satisfaction by 85%

### Case Study: FinTech Solutions Inc. - Regulatory Compliance Platform

**The Challenge:**
A fintech company needed to manage complex financial agreements with regulatory oversight:
- **Regulatory requirements:** SEC, FINRA, and state-level compliance
- **Audit trails:** Immutable records for regulatory reporting
- **Multi-jurisdiction:** Operations across 15 US states
- **Real-time monitoring:** Regulatory dashboards and alerts

**The Solution:**
Enhanced CMS with regulatory compliance features:

**Key Implementations:**
- **Regulatory hooks** for automatic compliance reporting
- **Audit trail integration** with regulatory databases
- **Real-time monitoring** dashboards for compliance officers
- **Multi-jurisdiction** contract templates and validation

**Outcomes:**
- ✅ **100% regulatory compliance** across all jurisdictions
- ✅ **Real-time audit trails** for regulatory reporting
- ✅ **Automated compliance checks** preventing violations
- ✅ **$1.8M annual savings** in compliance costs

---

## 📈 Performance Benchmarks

### Current vs. Target Performance Metrics

| Component | Current Performance | Target Performance | Optimization Strategy | Status |
|-----------|-------------------|-------------------|---------------------|---------|
| **API Response Time** | 200ms avg | 100ms avg | Redis caching, DB optimization | 🟡 In Progress |
| **Contract Creation** | 5s | 2s | Batch processing, async operations | 🟢 Complete |
| **DID Resolution** | 1s | 300ms | Caching, parallel resolution | 🟡 In Progress |
| **Smart Contract Deployment** | 30s | 15s | Gas optimization, contract size reduction | 🟢 Complete |
| **User Authentication** | 800ms | 400ms | JWT caching, connection pooling | 🟡 In Progress |
| **Database Queries** | 150ms avg | 50ms avg | Index optimization, query tuning | 🟢 Complete |

### Scalability Benchmarks

| Metric | Current Capacity | Target Capacity | Scaling Strategy |
|--------|-----------------|-----------------|------------------|
| **Concurrent Users** | 1,000 | 10,000 | Load balancing, horizontal scaling |
| **Contracts per Day** | 500 | 5,000 | Batch processing, async workflows |
| **API Requests/sec** | 100 | 1,000 | CDN, caching, microservices |
| **Database Connections** | 50 | 500 | Connection pooling, read replicas |
| **Blockchain Transactions** | 50/min | 500/min | Layer 2 solutions, batching |

### Performance Optimization Roadmap

#### Phase 1: Database Optimization (Complete)
- ✅ Query optimization and indexing
- ✅ Connection pooling implementation
- ✅ Read replica setup
- ✅ Query caching with Redis

#### Phase 2: API Performance (In Progress)
- 🔄 Response compression
- 🔄 Request caching
- 🔄 Rate limiting optimization
- 🔄 Load balancing implementation

#### Phase 3: Blockchain Efficiency (Complete)
- ✅ Gas optimization
- ✅ Contract size reduction
- ✅ Batch transaction processing
- ✅ Layer 2 integration planning

---

## 🎯 Hands-On Challenges

### Challenge 1: Smart Contract Optimization
**Scenario:** Your gas costs are too high. Optimize the ContractManager contract.
**Tools:** Hardhat, Gas Reporter, Solidity optimization techniques
**Success Criteria:** Reduce gas costs by 30%

```bash
# Setup
cd blockchain
npm install
npx hardhat test --gas

# Your Challenge:
# 1. Analyze current gas usage
# 2. Implement 3 optimization techniques
# 3. Achieve 30% gas reduction
# 4. Document your changes
```

**Optimization Techniques to Try:**
- Struct packing optimization
- Custom errors instead of require strings
- Unchecked math operations
- Immutable variables
- Assembly (Yul) for hot paths

### Challenge 2: Security Audit
**Scenario:** Audit the authentication flow for vulnerabilities
**Tools:** OWASP ZAP, Custom security tests, Manual testing
**Success Criteria:** Identify and fix 3 security issues

```bash
# Setup security testing
npm install -g zaproxy
zaproxy --daemon --port 8080

# Your Challenge:
# 1. Run automated security scan
# 2. Perform manual penetration testing
# 3. Identify authentication vulnerabilities
# 4. Implement security fixes
# 5. Document findings and solutions
```

### Challenge 3: Performance Tuning
**Scenario:** API response times are too slow under load
**Tools:** Load testing, Profiling, Database optimization
**Success Criteria:** Achieve <100ms average response time under 1000 concurrent users

```bash
# Setup load testing
npm install -g artillery
artillery quick --count 1000 --num 10 http://localhost:5001/health

# Your Challenge:
# 1. Identify performance bottlenecks
# 2. Implement caching strategies
# 3. Optimize database queries
# 4. Achieve target performance
# 5. Document optimization techniques
```

### Challenge 4: DID:web Integration
**Scenario:** Implement enterprise DID:web resolution with caching
**Tools:** DID resolver, Redis caching, Performance monitoring
**Success Criteria:** Resolve DIDs in <300ms with 99.9% uptime

```javascript
// Your Challenge:
// 1. Implement DID:web resolver
// 2. Add Redis caching layer
// 3. Implement fallback mechanisms
// 4. Add performance monitoring
// 5. Achieve target performance
```

### Challenge 5: DevSecOps Pipeline
**Scenario:** Implement automated security scanning in CI/CD
**Tools:** GitHub Actions, SAST tools, Container scanning
**Success Criteria:** Zero high-severity vulnerabilities in production

```yaml
# Your Challenge:
# 1. Set up SAST scanning
# 2. Implement container image scanning
# 3. Add dependency vulnerability scanning
# 4. Configure security gates
# 5. Achieve zero high-severity issues
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Keycloak Connection Failed
**Symptoms:** `Failed to authenticate with Keycloak`
**Error Message:** `ECONNREFUSED` or `Timeout`
**Root Cause:** Keycloak service not running or misconfigured

**Solution Steps:**
```bash
# 1. Check if Keycloak is running
docker ps | grep ***REMOVED-KEYCLOAK_DB_PASSWORD***

# 2. Check Keycloak logs
docker logs ***REMOVED-KEYCLOAK_DB_PASSWORD***

# 3. Restart Keycloak if needed
docker-compose -f deployment/utilities/docker-compose.iam.yml restart ***REMOVED-KEYCLOAK_DB_PASSWORD***

# 4. Verify environment variables
cat backend/config.env | grep KEYCLOAK
```

**Prevention:** Always use health checks and proper service dependencies

### Issue 2: Smart Contract Deployment Failed
**Symptoms:** `Contract not deployed. Please run deployment first.`
**Error Message:** `Error: Contract not deployed`
**Root Cause:** Hardhat network not running or deployment script failed

**Solution Steps:**
```bash
# 1. Start Hardhat network
cd blockchain
npx hardhat node

# 2. Deploy contract (in new terminal)
npx hardhat run scripts/deploy.js --network localhost

# 3. Verify deployment
cat blockchain/deployment.json

# 4. Check contract address in backend config
cat backend/config.env | grep CONTRACT
```

**Prevention:** Use deployment scripts with proper error handling

### Issue 3: Database Connection Failed
**Symptoms:** `SequelizeConnectionError: connect ECONNREFUSED`
**Error Message:** Database connection timeout
**Root Cause:** PostgreSQL not running or wrong connection string

**Solution Steps:**
```bash
# 1. Check PostgreSQL status
docker ps | grep ***REMOVED-DB_PASSWORD***

# 2. Check database logs
docker logs ***REMOVED-DB_PASSWORD***

# 3. Verify connection string
cat backend/config.env | grep DATABASE

# 4. Test connection manually
psql -h localhost -p 5432 -U ***REMOVED-DB_PASSWORD*** -d contract_management
```

**Prevention:** Use connection pooling and health checks

### Issue 4: Frontend API Connection Failed
**Symptoms:** `Failed to fetch` or CORS errors
**Error Message:** `CORS policy` or `Network Error`
**Root Cause:** Backend not running or CORS misconfiguration

**Solution Steps:**
```bash
# 1. Check backend status
curl http://localhost:5001/health

# 2. Check CORS configuration
cat backend/server.js | grep -A 10 "cors"

# 3. Verify frontend API URL
cat frontend/src/services/api.js | grep API_BASE_URL

# 4. Check browser console for detailed errors
```

**Prevention:** Use proper CORS configuration and health endpoints

### Issue 5: DID Resolution Timeout
**Symptoms:** `DID resolution failed` or timeout errors
**Error Message:** `ETIMEDOUT` or `ENOTFOUND`
**Root Cause:** Network issues or DID service unavailable

**Solution Steps:**
```bash
# 1. Test network connectivity
curl -I https://did-web.example.com

# 2. Check DID resolver configuration
cat backend/services/didService.js | grep -A 5 "resolve"

# 3. Implement caching
# Add Redis caching for DID documents

# 4. Add fallback mechanisms
# Implement multiple DID resolution methods
```

**Prevention:** Implement caching, timeouts, and fallback mechanisms

### Issue 6: Memory Leaks in Production
**Symptoms:** High memory usage, slow performance
**Error Message:** `JavaScript heap out of memory`
**Root Cause:** Unhandled promises, event listeners, or database connections

**Solution Steps:**
```bash
# 1. Monitor memory usage
node --inspect backend/server.js

# 2. Check for memory leaks
npm install -g clinic
clinic doctor -- node backend/server.js

# 3. Analyze heap dumps
node --heapsnapshot-signal=SIGUSR2 backend/server.js

# 4. Fix common issues
# - Close database connections
# - Remove event listeners
# - Handle promise rejections
```

**Prevention:** Use memory monitoring and proper cleanup

### Issue 7: Blockchain Transaction Failures
**Symptoms:** `Transaction failed` or gas estimation errors
**Error Message:** `insufficient funds` or `gas estimation failed`
**Root Cause:** Insufficient funds, network congestion, or contract issues

**Solution Steps:**
```bash
# 1. Check account balance
npx hardhat console --network localhost
> const [signer] = await ethers.getSigners()
> await signer.getBalance()

# 2. Check gas prices
> const feeData = await ethers.provider.getFeeData()
> console.log(feeData)

# 3. Verify contract state
> const contract = await ethers.getContractAt('ContractManager', address)
> await contract.contracts(contractId)

# 4. Check transaction history
> await ethers.provider.getTransactionReceipt(txHash)
```

**Prevention:** Implement proper error handling and gas estimation

---

## 🛡️ Compliance & Standards

### GDPR Compliance Implementation

**Data Protection Features:**
- ✅ **Data Minimization:** Only collect necessary personal data
- ✅ **Right to be Forgotten:** Implement data deletion workflows
- ✅ **Data Portability:** Export user data in standard formats
- ✅ **Consent Management:** Track and manage user consent
- ✅ **Audit Trails:** Complete logging of data access and modifications

**Implementation Details:**
```javascript
// GDPR-compliant data deletion
class GDPRService {
  async deleteUserData(userId) {
    // Anonymize personal data
    await this.anonymizeUserData(userId);
    
    // Delete from all systems
    await this.deleteFromDatabase(userId);
    await this.deleteFromKeycloak(userId);
    await this.deleteFromBlockchain(userId);
    
    // Log deletion for audit
    await this.logDataDeletion(userId);
  }
  
  async exportUserData(userId) {
    const userData = await this.gatherAllUserData(userId);
    return this.formatForExport(userData);
  }
}
```

### SOC 2 Type II Compliance

**Security Controls:**
- ✅ **Access Control:** Role-based access with audit logging
- ✅ **Change Management:** Version control and deployment tracking
- ✅ **Incident Response:** Automated security incident detection
- ✅ **Vulnerability Management:** Regular security scanning
- ✅ **Business Continuity:** Backup and disaster recovery

**Compliance Framework:**
```yaml
# SOC 2 Controls Implementation
security_controls:
  access_control:
    - role_based_access: true
    - multi_factor_authentication: true
    - session_management: true
    - audit_logging: true
  
  change_management:
    - version_control: true
    - deployment_tracking: true
    - rollback_capability: true
    - change_approval: true
  
  incident_response:
    - automated_detection: true
    - response_playbooks: true
    - notification_systems: true
    - post_incident_review: true
```

### ISO 27001 Information Security

**Security Management System:**
- ✅ **Information Security Policy:** Comprehensive security framework
- ✅ **Risk Assessment:** Regular security risk evaluations
- ✅ **Asset Management:** Inventory and classification of assets
- ✅ **Human Resource Security:** Background checks and training
- ✅ **Physical Security:** Data center and office security

**Implementation Checklist:**
```markdown
## ISO 27001 Compliance Checklist

### A.5 Information Security Policies
- [ ] Information security policy document
- [ ] Policy review and update procedures
- [ ] Policy communication to stakeholders

### A.6 Organization of Information Security
- [ ] Information security roles and responsibilities
- [ ] Contact with authorities and special interest groups
- [ ] Information security in project management

### A.7 Human Resource Security
- [ ] Screening procedures for new employees
- [ ] Terms and conditions of employment
- [ ] Information security awareness and training

### A.8 Asset Management
- [ ] Inventory of assets
- [ ] Ownership of assets
- [ ] Acceptable use of assets
- [ ] Return of assets

### A.9 Access Control
- [ ] Access control policy
- [ ] User access management
- [ ] User responsibilities
- [ ] System and application access control
```

### HIPAA Compliance (Healthcare Data)

**Privacy and Security Rules:**
- ✅ **Privacy Rule:** Patient data protection and consent
- ✅ **Security Rule:** Technical, physical, and administrative safeguards
- ✅ **Breach Notification:** Timely reporting of data breaches
- ✅ **Business Associate Agreements:** Third-party vendor compliance

**Healthcare-Specific Features:**
```javascript
// HIPAA-compliant data handling
class HIPAAComplianceService {
  async handlePHI(patientData) {
    // Encrypt PHI at rest and in transit
    const encryptedData = await this.encryptPHI(patientData);
    
    // Log access for audit trail
    await this.logPHIAccess(patientData.id, 'access');
    
    // Implement access controls
    await this.verifyAccessRights(patientData.id);
    
    return encryptedData;
  }
  
  async reportBreach(incident) {
    // Implement breach notification procedures
    await this.notifyAuthorities(incident);
    await this.notifyPatients(incident);
    await this.documentIncident(incident);
  }
}
```

### Financial Services Compliance

**Regulatory Requirements:**
- ✅ **SEC Compliance:** Securities and Exchange Commission requirements
- ✅ **FINRA Compliance:** Financial Industry Regulatory Authority rules
- ✅ **AML/KYC:** Anti-Money Laundering and Know Your Customer
- ✅ **SOX Compliance:** Sarbanes-Oxley Act requirements

**Financial Services Features:**
```javascript
// Financial compliance monitoring
class FinancialComplianceService {
  async monitorTransactions(transaction) {
    // AML monitoring
    await this.amlCheck(transaction);
    
    // KYC verification
    await this.kycVerification(transaction.parties);
    
    // Regulatory reporting
    await this.regulatoryReporting(transaction);
    
    // Audit trail
    await this.auditTrail(transaction);
  }
  
  async generateComplianceReport() {
    return {
      amlChecks: await this.getAMLChecks(),
      kycVerifications: await this.getKYCVerifications(),
      regulatoryReports: await this.getRegulatoryReports(),
      auditTrail: await this.getAuditTrail()
    };
  }
}
```

---

## 💼 Career Development

### Skills You'll Gain

#### **Blockchain Development** 🏗️
- **Smart Contract Engineering:** Solidity, gas optimization, security patterns
- **Web3 Integration:** Ethereum, MetaMask, Hardhat, Web3.js
- **DeFi Protocols:** Understanding of decentralized finance concepts
- **NFT Standards:** ERC-721, ERC-1155 implementation experience

**Market Demand:** High demand with 300%+ growth in blockchain developer roles

#### **DevSecOps Engineering** 🔒
- **Security Automation:** SAST, SCA, container scanning
- **CI/CD Pipelines:** GitHub Actions, Jenkins, GitLab CI
- **Infrastructure as Code:** Terraform, Kubernetes, Docker
- **Security Monitoring:** SIEM, threat detection, incident response

**Market Demand:** Critical skill with 200%+ growth in security-focused roles

#### **Enterprise Architecture** 🏢
- **Microservices Design:** Service decomposition, API design
- **IAM Integration:** Keycloak, OAuth 2.0, SAML, SSO
- **Cloud Architecture:** Multi-cloud strategies, hybrid deployments
- **Scalability Patterns:** Load balancing, caching, database optimization

**Market Demand:** Senior-level skill with 150%+ growth in enterprise roles

#### **Full-Stack Development** 💻
- **Frontend:** React, Material-UI, state management
- **Backend:** Node.js, Express, PostgreSQL, Redis
- **API Design:** RESTful APIs, GraphQL, API security
- **Testing:** Unit testing, integration testing, E2E testing

**Market Demand:** Versatile skill with 100%+ growth in full-stack roles

### Job Market Demand & Salaries

| Role | Average Salary | Growth Rate | Key Skills |
|------|----------------|-------------|------------|
| **Blockchain Developer** | $120K-180K | 300%+ | Solidity, Web3, Smart Contracts |
| **DevSecOps Engineer** | $130K-200K | 200%+ | Security, CI/CD, Infrastructure |
| **Enterprise Architect** | $150K-250K | 150%+ | Architecture, IAM, Cloud |
| **Full-Stack Developer** | $100K-160K | 100%+ | React, Node.js, APIs |
| **Security Engineer** | $120K-190K | 180%+ | Security, Compliance, Auditing |
| **Cloud Engineer** | $110K-170K | 120%+ | AWS, Azure, Kubernetes |

### Certification Paths

#### **AWS Certifications** ☁️
- **AWS Certified Solutions Architect - Associate** ($150)
- **AWS Certified Developer - Associate** ($150)
- **AWS Certified DevOps Engineer - Professional** ($300)
- **AWS Certified Security - Specialty** ($300)

**Benefits:** Industry recognition, higher salaries, career advancement

#### **Kubernetes Certifications** 🐳
- **Certified Kubernetes Administrator (CKA)** ($375)
- **Certified Kubernetes Application Developer (CKAD)** ($375)
- **Certified Kubernetes Security Specialist (CKS)** ($375)

**Benefits:** Cloud-native expertise, high demand, competitive advantage

#### **Security Certifications** 🔐
- **Certified Information Systems Security Professional (CISSP)** ($699)
- **Certified Ethical Hacker (CEH)** ($1,199)
- **CompTIA Security+** ($370)
- **GIAC Security Essentials (GSEC)** ($2,499)

**Benefits:** Security expertise, compliance knowledge, risk management

#### **Blockchain Certifications** ⛓️
- **Ethereum Developer Certification** (Free)
- **Hyperledger Fabric Administrator** ($200)
- **Blockchain Security Professional** ($500)

**Benefits:** Blockchain expertise, emerging technology skills

### Career Progression Paths

#### **Junior Developer → Senior Developer** (2-3 years)
**Skills to Develop:**
- Advanced programming patterns
- System design principles
- Code review and mentoring
- Performance optimization

**Projects to Build:**
- Open-source contributions
- Personal portfolio projects
- Technical blog writing
- Conference presentations

#### **Senior Developer → Tech Lead** (3-5 years)
**Skills to Develop:**
- Team leadership
- Architecture design
- Project management
- Stakeholder communication

**Responsibilities:**
- Technical decision making
- Team mentoring
- Code quality standards
- Architecture reviews

#### **Tech Lead → Engineering Manager** (5-7 years)
**Skills to Develop:**
- People management
- Strategic planning
- Budget management
- Cross-functional collaboration

**Responsibilities:**
- Team building and retention
- Technical strategy
- Resource allocation
- Stakeholder management

#### **Engineering Manager → CTO/VP Engineering** (7-10 years)
**Skills to Develop:**
- Executive leadership
- Business strategy
- Technology vision
- Industry thought leadership

**Responsibilities:**
- Technology strategy
- Innovation leadership
- Industry partnerships
- Board-level communication

### Industry Trends & Future Outlook

#### **Emerging Technologies** 🚀
- **Web3 & DeFi:** Decentralized finance and applications
- **AI/ML Integration:** Machine learning in contract management
- **Zero-Knowledge Proofs:** Privacy-preserving blockchain solutions
- **Layer 2 Scaling:** Ethereum scaling solutions

#### **Market Trends** 📈
- **Remote Work:** Global talent pool and remote-first companies
- **Contract Management:** Growing demand for digital contract solutions
- **Compliance Automation:** Regulatory technology (RegTech) growth
- **Enterprise Blockchain:** Mainstream adoption in enterprise

#### **Salary Trends** 💰
- **Blockchain:** 15-25% annual salary growth
- **Security:** 10-20% annual salary growth
- **Cloud:** 8-15% annual salary growth
- **Full-Stack:** 5-12% annual salary growth

### Networking & Community

#### **Professional Networks** 🤝
- **LinkedIn:** Connect with industry professionals
- **GitHub:** Contribute to open-source projects
- **Stack Overflow:** Share knowledge and build reputation
- **Dev.to:** Write technical articles and tutorials

#### **Industry Events** 🎪
- **Blockchain Conferences:** Consensus, Devcon, ETHGlobal
- **Security Conferences:** Black Hat, DEF CON, RSA Conference
- **Developer Conferences:** React Conf, Node.js Interactive
- **Cloud Conferences:** AWS re:Invent, Google Cloud Next

#### **Online Communities** 💬
- **Discord:** Blockchain and Web3 communities
- **Slack:** Professional networking groups
- **Reddit:** r/blockchain, r/webdev, r/security
- **Twitter:** Follow industry leaders and companies

### Portfolio Development

#### **Personal Projects** 🛠️
1. **Contract Management System:** This course project
2. **DeFi Protocol:** Build a simple DeFi application
3. **Security Tool:** Create a security scanning tool
4. **Open Source Contribution:** Contribute to popular projects

#### **Technical Blog** ✍️
- Write about technical challenges and solutions
- Share learning experiences and best practices
- Document project implementations
- Build thought leadership in your domain

#### **Conference Speaking** 🎤
- Submit talks to local meetups and conferences
- Share your expertise and build credibility
- Network with industry professionals
- Establish yourself as a subject matter expert

---

## Course Sequence & Navigation
To maximise learning efficiency, follow the CMS knowledge journey in this order:
1. **Use Cases & Business Requirements** – Understand *why* the platform exists and the problems it solves.
2. **System Architecture** – High-level diagrams that connect every component end-to-end.
3. **Design & Implementation** – Deep dives into each layer (Backend, Frontend, Blockchain, IAM).
4. **Security** – Defence-in-depth principles and practices woven throughout the stack.
5. **Testing & Quality** – Validate correctness, performance, and resilience.
6. **DevSecOps & Continuous Security** – Automate security from commit to production.
7. **Deployment & Operations** – Ship, monitor, and scale CMS reliably in production.

(Each item links to its corresponding section ‑ use your editor's outline or the document's anchors.)

---

## Project Reference Map – Where to Look in the Repository

Use this quick-reference table to connect **theory** from the training to **practice** in the ContractManagement codebase.  Browse these paths as you progress through the course.

| Concept / Topic                               | Key Files & Directories (📂 path from repo root)                                          |
|-----------------------------------------------|-------------------------------------------------------------------------------------------|
| Backend API entrypoint                        | `backend/server.js`, `backend/routes/`, `backend/middleware/auth.js`                    |
| Business logic / Services                     | `backend/services/*.js` (e.g., `blockchainService.js`, `didService.js`)                 |
| Data models & migrations                      | `backend/models/*.js`, migration scripts in `backend/scripts/`                          |
| PostgreSQL config & ENV                       | `backend/config.env`, `config.env` at project root                                       |
| Unit & integration tests                      | `backend/tests/`, Jest setup at `backend/jest.config.js`                                |
| React SPA entrypoint                          | `frontend/src/index.js`, `frontend/src/App.js`                                           |
| React pages & components                      | `frontend/src/pages/`, `frontend/src/components/`                                        |
| Frontend API wrapper                          | `frontend/src/services/api.js`                                                           |
| Keycloak realm import / automation            | `deployment/utilities/***REMOVED-KEYCLOAK_DB_PASSWORD***-config/`, `backend/scripts/setupKeycloak.js`             |
| Hardhat smart-contract workspace              | `blockchain/`, `blockchain/contracts/ContractManager.sol`                               |
| Dev & prod Dockerfiles                        | `backend/Dockerfile`, `frontend/Dockerfile`                                              |
| Local orchestration scripts                   | `deployment/local/*.sh` (e.g., `start-services.sh`, `stop-services.sh`)                 |
| Terraform IaC                                 | `deployment/oci/terraform/`                                                              |
| CI/CD workflow example                        | Referenced in course but see `.github/workflows/` (create when adopting GitHub Actions)  |
| Security scans & DevSecOps                    | Sample configs under `backend/`, `Dockerfile`, and pipeline snippets in this course     |
| DID:web resolution helper (to implement)      | Suggested path: `backend/services/didWebResolver.js`                                     |

> Tip: clone the repo and keep it open while reading—jump to these files for hands-on context.

---

## 0. Use Cases & Business Requirements

A successful contract management solution must address real-world pain points across industries. Below are the core use cases that shaped CMS design:

1. **Multi-Party Contract Lifecycle**  
   • Draft creation, review, multi-party e-signatures, activation, amendments, and archival.  
   • Role separation for Trusted Data Providers (TDP), Contract Counterparty Representatives (CCRP), and Regulators.
2. **Dataset Licensing & Monetisation**  
   • Secure negotiation and purchase of datasets with automated licence enforcement.  
   • Price discovery, payment processing, and royalty distribution on-chain for auditability.
3. **Regulatory Compliance & Audit**  
   • Immutable blockchain records for tamper-evident audit trails.  
   • Fine-grained access logs meeting GDPR, HIPAA, or sector-specific regulations.
4. **Identity & Access Management**  
   • Single Sign-On (SSO) via Keycloak, supporting corporate identity providers (SAML, OIDC) and MFA.  
   • Delegated administration and role-based access control (RBAC) down to contract level.
5. **Notification & Workflow Automation**  
   • Real-time alerts (email, WebSocket, webhook) for signature requests, contract status, and expirations.  
   • Pluggable workflow engine for custom approval chains.
6. **Scalability & Extensibility**  
   • Modular microservice-friendly architecture for future features such as AI contract analytics.  
   • API-first philosophy enabling third-party integrations and custom frontends.

> **Outcome-Driven Requirements:** These use cases translate into non-functional requirements such as high availability, horizontal scalability, end-to-end encryption, auditable actions, and pluggable authentication providers.

### Reference Architecture Snapshot
A high-level diagram tying the above use-cases to system components. Detailed diagrams live in section 7, but this snapshot sets the stage early.

```mermaid
graph TD
    user[End User] --> spa[React SPA]
    spa --> api[Express API]
    api --> db[(PostgreSQL)]
    api --> iam[Keycloak]
    api --> chain[ContractManager SmartContract]
```

*Reading Guide*
1. **User Stories to Components** – Each arrow shows data flow supporting the use cases (contract drafting, signing, notifications).
2. **Edge-to-On-Chain Traceability** – From browser action to immutable blockchain hash.
3. **Security Touch-points** – Keycloak for auth, TLS on every hop.

➡ Proceed to Backend Fundamentals (next section) for deep dives; full architecture breakdowns remain in section 7.

---

## 1. Backend Fundamentals

### 1.1 What is a Backend?
The backend is the server-side part of an application responsible for business logic, data storage, security, and integration with external systems. It exposes APIs for the frontend and other clients, manages authentication, and ensures data integrity.

**Key Concepts:**
- **API (Application Programming Interface):** A set of endpoints for communication between frontend and backend.
- **Database:** Persistent storage for application data (e.g., PostgreSQL, MongoDB).
- **Business Logic:** The rules and workflows that govern how data is created, modified, and validated.
- **Authentication & Authorization:** Mechanisms to verify user identity and control access to resources.
- **Middleware:** Functions that process requests before they reach the main logic (e.g., logging, error handling).

### 1.2 Node.js and Express.js
- **Node.js** is a JavaScript runtime built on Chrome's V8 engine, enabling server-side JavaScript execution.
- **Express.js** is a minimal and flexible Node.js web application framework that provides a robust set of features for web and API development.

**Why Node.js/Express?**
- Non-blocking, event-driven architecture for high concurrency.
- Large ecosystem (npm) and active community.
- Easy integration with modern frontend frameworks.

### 1.3 Database Design (PostgreSQL)
- **Relational Database:** Organizes data into tables with rows and columns, supporting relationships and constraints.
- **ORM (Object-Relational Mapping):** Tools like Sequelize map database tables to JavaScript objects, simplifying CRUD operations.
- **Transactions:** Ensure a set of operations are completed successfully or rolled back on failure, maintaining data integrity.

### 1.4 RESTful API Design
- **REST (Representational State Transfer):** An architectural style for designing networked applications using stateless HTTP requests.
- **CRUD Operations:** Create, Read, Update, Delete - the four basic operations for persistent storage.
- **Status Codes:** Standard HTTP codes (e.g., 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found).

### 1.5 Security Best Practices
- **Input Validation:** Always validate and sanitize user input to prevent SQL injection and XSS.
- **Password Hashing:** Store only hashed passwords using strong algorithms (e.g., bcrypt).
- **JWT (JSON Web Token):** Securely transmit information between parties as a JSON object, used for stateless authentication.
- **Rate Limiting:** Prevent abuse by limiting the number of requests per user/IP.

### 1.6 Real-World Use Cases
- **Contract Management:** Automate contract creation, approval, and signing workflows.
- **User Onboarding:** Secure registration and login with email verification and role assignment.
- **Notifications:** Real-time alerts for contract status changes and required actions.

**Actual API Endpoints:**
```javascript
// Authentication
POST /api/auth/register          // User registration with IAM
POST /api/auth/login             // User login with Keycloak
POST /api/auth/verify-did        // DID verification
GET  /api/auth/did-info          // Get DID information

// Contracts
GET    /api/contracts/user/:userId    // Get user contracts
GET    /api/contracts/:id             // Get specific contract
POST   /api/contracts                 // Create contract (TDC only)
POST   /api/contracts/:id/sign        // Sign contract
POST   /api/contracts/:id/select-ccrp // Select CCRP
POST   /api/contracts/:id/complete    // Complete contract
POST   /api/contracts/:id/cancel      // Cancel contract

// Datasets
GET    /api/datasets                   // Get all datasets
GET    /api/datasets/:id               // Get specific dataset
POST   /api/datasets                   // Create dataset (TDP only)
PUT    /api/datasets/:id               // Update dataset
DELETE /api/datasets/:id               // Delete dataset
GET    /api/datasets/search            // Search datasets
GET    /api/datasets/categories/list   // Get categories
GET    /api/datasets/stats/overview    // Get statistics

// DID Management
POST   /api/did/verify                 // Verify DID ownership
GET    /api/did/info/:did              // Get DID information
GET    /api/did/resolve/:did           // Resolve DID document
GET    /api/did/check/:did             // Check DID availability
POST   /api/did/create-system          // Create system DID
GET    /api/did/supported-methods      // Get supported methods

// Users
GET    /api/users                      // Get all users
GET    /api/users/:id                  // Get specific user
GET    /api/users/wallet/:address      // Get user by wallet
POST   /api/users/register             // Register user
PUT    /api/users/:id/register         // Update registration

// Notifications
GET    /api/notifications/:userId      // Get user notifications
PUT    /api/notifications/:id/read     // Mark as read
```

**Database Models with IAM Integration:**
```javascript
// User Model with IAM Integration
const User = sequelize.define('User', {
  // Basic fields
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // IAM Integration fields
  iamUserId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  iamUsername: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // DID and Blockchain fields
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  publicKey: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  did: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Role and party information
  partyType: {
    type: DataTypes.ENUM('TDP', 'TDC', 'CCRP', 'ADMIN'),
    allowNull: false
  },
  
  // Onboarding status
  onboardingStatus: {
    type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'),
    defaultValue: 'PENDING'
  },
  profileCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Organization information
  organization: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  // Status and timestamps
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

// Contract Model with Blockchain Integration
const Contract = sequelize.define('Contract', {
  // Primary key
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Unique contract identifier
  contractId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  
  // Blockchain integration
  blockchainContractId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  // Contract details
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  termsAndConditions: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  modelId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // Status tracking
  status: {
    type: DataTypes.ENUM(
      'PENDING_TDP_APPROVAL',
      'PENDING_CCRP_APPROVAL', 
      'ACTIVE',
      'COMPLETED',
      'CANCELLED'
    ),
    defaultValue: 'PENDING_TDP_APPROVAL'
  },
  
  // Signature tracking
  tdpSigned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ccrpSigned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tdpSignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ccrpSignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});
```

---

## References

- Node.js Official Docs: https://nodejs.org/en/docs/
- Express.js Guide: https://expressjs.com/en/guide/routing.html
- PostgreSQL Documentation: https://www.***REMOVED-DB_PASSWORD***ql.org/docs/
- Sequelize ORM: https://sequelize.org/master/
- RESTful API Design: https://restfulapi.net/
- OWASP Top Ten Security Risks: https://owasp.org/www-project-top-ten/
- JWT Introduction: https://jwt.io/introduction
- bcrypt Password Hashing: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- HTTP Status Codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

---

## 2. Frontend Fundamentals

### 2.1 What is a Frontend?
The frontend is the client-side part of an application that users interact with directly. It is responsible for presenting data, capturing user input, and communicating with the backend via APIs. Modern frontends are typically built as Single Page Applications (SPAs) for a seamless user experience.

**Key Concepts:**
- **UI/UX (User Interface/User Experience):** The design and usability of the application.
- **SPA (Single Page Application):** A web app that loads a single HTML page and dynamically updates content as the user interacts.
- **Component-Based Architecture:** UI is broken into reusable, self-contained components.
- **State Management:** Mechanisms to manage and synchronize data across the app (e.g., React Context, Redux).
- **Routing:** Handling navigation between different views/pages without full page reloads.

### 2.2 React.js
- **React.js** is a popular JavaScript library for building user interfaces, developed by Facebook. It enables the creation of interactive UIs using a component-based approach.

**Why React?**
- Declarative: Describe what you want to see, and React updates the UI efficiently.
- Component Reusability: Build complex UIs from small, isolated pieces of code.
- Strong Ecosystem: Rich set of libraries for routing, state management, and more.

**Example:**
```jsx
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}
```

### 2.3 State Management
- **Local State:** Managed within a component using `useState`.
- **Global State:** Shared across components using Context API or libraries like Redux.
- **Side Effects:** Operations like data fetching, handled with hooks like `useEffect`.

**Example:**
```jsx
const [user, setUser] = useState(null);
useEffect(() => {
  fetch('/api/user').then(res => res.json()).then(setUser);
}, []);
```

### 2.4 API Integration
- **HTTP Requests:** Use `fetch` or libraries like `axios` to communicate with backend APIs.
- **Authentication:** Store tokens securely (e.g., in memory or HttpOnly cookies) and include them in API requests.
- **Error Handling:** Display user-friendly error messages and handle network failures gracefully.

### 2.5 Security Best Practices
- **Input Validation:** Validate user input on the client before sending to the backend.
- **XSS Prevention:** Escape or sanitize any user-generated content rendered in the UI.
- **CSRF Protection:** Use secure authentication tokens and avoid exposing sensitive data in the frontend.

### 2.6 Real-World Use Cases
- **User Registration/Login:** Forms for onboarding and authentication.
- **Dashboard:** Visualize contracts, datasets, and notifications.
- **Contract Signing:** UI for reviewing and signing contracts, with status indicators.
- **Notifications:** Real-time updates for contract status and actions required.

### 2.7 Modern Frontend Tooling
- **Build Tools:** Webpack, Vite, or Create React App for bundling and optimizing assets.
- **Testing:** Jest and React Testing Library for unit and integration tests.
- **Linting/Formatting:** ESLint and Prettier for code quality and consistency.

---

## References (Frontend)

- React Official Docs: https://react.dev/
- MDN Web Docs - JavaScript: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- MDN Web Docs - HTML/CSS: https://developer.mozilla.org/en-US/docs/Web
- React Router: https://reactrouter.com/
- Redux: https://redux.js.org/
- Axios: https://axios-http.com/
- OWASP XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- Webpack: https://webpack.js.org/
- Vite: https://vitejs.dev/
- Jest: https://jestjs.io/
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- ESLint: https://eslint.org/
- Prettier: https://prettier.io/

---

## 3. Blockchain Integration

### 3.1 What is Blockchain?
Blockchain is a distributed ledger technology that enables secure, transparent, and tamper-proof record-keeping. It consists of a chain of blocks, each containing a list of transactions that are cryptographically linked and verified by a network of nodes.

**Key Concepts:**
- **Decentralization:** No single entity controls the network; data is distributed across multiple nodes.
- **Immutability:** Once recorded, data cannot be altered without consensus from the network.
- **Consensus Mechanisms:** Protocols (e.g., Proof of Work, Proof of Stake) ensure agreement on the state of the ledger.
- **Smart Contracts:** Self-executing contracts with predefined rules written in code.

### 3.2 Ethereum and Smart Contracts
- **Ethereum** is a decentralized platform that enables the creation and execution of smart contracts using its native cryptocurrency, Ether (ETH).
- **Smart Contracts** are programs that automatically execute when predefined conditions are met, eliminating the need for intermediaries.

**Example Smart Contract:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ContractManager is Ownable, ReentrancyGuard {
    struct Contract {
        uint256 contractId;
        address tdpAddress;
        address tdcAddress;
        address ccrpAddress;
        string datasetId;
        string modelId;
        uint256 price;
        uint256 duration;
        string termsAndConditions;
        ContractStatus status;
        uint256 createdAt;
        uint256 tdpSignedAt;
        uint256 ccrpSignedAt;
        bool tdpSigned;
        bool ccrpSigned;
    }
    
    enum ContractStatus {
        PENDING_TDP_APPROVAL,
        PENDING_CCRP_APPROVAL,
        ACTIVE,
        COMPLETED,
        CANCELLED
    }
    
    enum PartyType {
        TDP,
        TDC,
        CCRP
    }
    
    mapping(uint256 => Contract) public contracts;
    mapping(address => Party) public parties;
    mapping(address => uint256[]) public partyContracts;
    
    uint256 public contractCounter;
    uint256 public partyCounter;
    
    event ContractCreated(uint256 indexed contractId, address indexed tdc, string datasetId);
    event ContractSigned(uint256 indexed contractId, address indexed signer, PartyType partyType);
    event ContractStatusChanged(uint256 indexed contractId, ContractStatus newStatus);
    
    function createContract(
        address tdpAddress,
        string memory datasetId,
        string memory modelId,
        uint256 price,
        uint256 duration,
        string memory termsAndConditions
    ) public returns (uint256) {
        require(parties[msg.sender].partyType == PartyType.TDC, "Only TDC can create contracts");
        require(parties[tdpAddress].partyType == PartyType.TDP, "Invalid TDP address");
        
        contractCounter++;
        
        contracts[contractCounter] = Contract({
            contractId: contractCounter,
            tdpAddress: tdpAddress,
            tdcAddress: msg.sender,
            ccrpAddress: address(0),
            datasetId: datasetId,
            modelId: modelId,
            price: price,
            duration: duration,
            termsAndConditions: termsAndConditions,
            status: ContractStatus.PENDING_TDP_APPROVAL,
            createdAt: block.timestamp,
            tdpSignedAt: 0,
            ccrpSignedAt: 0,
            tdpSigned: false,
            ccrpSigned: false
        });
        
        partyContracts[msg.sender].push(contractCounter);
        partyContracts[tdpAddress].push(contractCounter);
        
        emit ContractCreated(contractCounter, msg.sender, datasetId);
        return contractCounter;
    }
}
```

### 3.3 Hardhat Development Environment
- **Hardhat** is a development environment for Ethereum that provides tools for compiling, deploying, testing, and debugging smart contracts.
- **Local Blockchain:** Hardhat includes a local Ethereum network for development and testing.

**Key Features:**
- **Compilation:** Automatically compiles Solidity contracts.
- **Testing:** Built-in testing framework for smart contracts.
- **Deployment:** Scripts for deploying contracts to various networks.
- **Debugging:** Advanced debugging capabilities with stack traces.

### 3.4 Web3.js Integration
- **Web3.js** is a JavaScript library that allows interaction with Ethereum nodes and smart contracts from web applications.
- **Contract Interaction:** Send transactions, call contract functions, and listen to events.

**Example:**
```javascript
const Web3 = require('web3');
const contractABI = require('./ContractManager.json');

const web3 = new Web3('http://localhost:8545');
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Call contract function
const result = await contract.methods.createContract(
    'CONTRACT-001',
    tdpAddress,
    ccrpAddress,
    web3.utils.toWei('100', 'ether')
).send({ from: userAddress });
```

### 3.5 Hands-On Web3 Workshop – Building the Contract Management DApp

This guided lab transforms theory into practice. You will:

1. **Deploy the Smart Contract**  
   a. `cd blockchain`  
   b. `npm install` to install Hardhat dependencies  
   c. `npx hardhat node` to start a local chain  
   d. In a new terminal: `npx hardhat run scripts/deploy.js --network localhost`  
   ➜ Note the deployed `ContractManager` address printed in the console.

2. **Configure Backend to Use Contract Address**  
   Edit `backend/config.env`:  
   `CONTRACT_MANAGER_ADDRESS=<address from step 1>`

3. **Run Backend in Web3 Mode**  
   a. `cd backend && npm install`  
   b. Ensure `BLOCKCHAIN_ENABLED=true` in `backend/config.env`  
   c. `node server.js`

4. **Spin Up Frontend**  
   a. `cd frontend && npm install`  
   b. `npm start` – the React SPA connects to backend at `http://localhost:5001`.

5. **Create & Sign a Contract (DID:web)**  
   a. Register/login as TDP via UI (Keycloak running)  
   b. Navigate to "Create Contract", fill details, select dataset, click **Save Draft**  
   c. Click **Sign** – MetaMask pops up (connected to Hardhat with account #0). Confirm transaction.  
   d. Share Contract ID with CCRP user to counter-sign.

6. **Verify On-Chain State**  
   a. In blockchain console: `npx hardhat console --network localhost`  
   b. `const cm = await ethers.getContractAt('ContractManager', '<address>')`  
   c. `await cm.contracts(contractId)` returns struct showing signatures.

7. **Automated Test (Bonus)**  
   Run `npm test blockchain/tests/blockchainService.simple.test.js` to execute a Jest test that signs and verifies a sample contract.

> **Outcome:** You have a fully working Web3 contract management flow—draft → blockchain hash → multi-sig → active—and have interacted with every project layer.

---

### 3.6 Advanced Smart-Contract Engineering

> **Instructor Anecdote:** When we first deployed CMS on a public chain, gas fees spiked 8× overnight due to a meme-coin frenzy.  The optimizations below cut our average contract-activation cost from $22 to $3.

#### 3.6.1 Gas Profiling & Optimization
| Technique | Description | Typical Savings |
|-----------|-------------|-----------------|
| **Tight Packing** | Re-order `struct` fields from largest → smallest to reduce storage slots | 20-40 % |
| **Custom Errors** | Use `error MyErr()` instead of `require("msg")` strings | ~15 k gas per revert |
| **Unchecked Blocks** | Wrap post-condition maths in `unchecked {}` when overflow impossible | 200-500 gas |
| **Immutable Vars** | Declare addresses/values `immutable` to shift from storage to code | 5-10 % |
| **Assembly (Yul)** | For hot paths (e.g., hashing loops) drop into Yul | case-by-case |

*Lab: Gas Report*
1. `npx hardhat test --gas` before changes.
2. Apply two optimizations above.
3. Re-run and note delta.  Record in `blockchain/gas-report.md`.

#### 3.6.2 Upgradeability Patterns
| Pattern | Pros | Cons | Library |
|---------|------|------|---------|
| **UUPS** | Minimal proxy footprint, upgrade controlled by implementation | More foot-guns | OpenZeppelin-UUPS |
| **Transparent Proxy** | Battle-tested, admin separation | Slightly higher gas | OZ-Proxy |
| **Diamond (EIP-2535)** | Modular facets, unlimited size | Complex tooling | Diamond-Standard |

*Migration Exercise*
• Clone `ContractManager.sol` into `ContractManagerV2.sol` adding `pause()`.
• Deploy via Hardhat Upgrades plugin (`deployProxy`, `upgradeProxy`).
• Verify state persistence with `contractId` lookup.

#### 3.6.3 Formal Verification & Static Analysis
Tools:
* **Slither** – static analysis (run `slither .`)
* **MythX / Mythril** – symbolic execution
* **Scribble** – specify invariants (`/// if_succeeds {:msg "price positive"} price > 0;`)

*Lab: Scribble Invariant*
1. Annotate `activateContract` to ensure `isActive == true` post-call.
2. Run `npx scribble test` – fix any failing traces.

#### 3.6.4 Advanced Design Patterns
• Pull-payment escrow pattern to avoid re-entrancy.
• Off-chain signatures with EIP-712 + meta-transactions (gasless CCRP sign).
• Role-based access via `AccessControl` vs custom bitmasks.
• Event versioning strategy for analytics compatibility.

#### 3.6.5 Knowledge Check (Quiz – keep answers hidden)
1. Why are custom errors cheaper than `require("...")`?  
2. Explain how UUPS protects against "self-destruct" griefing.  
3. Describe a scenario where Diamond pattern is overkill.

*Quiz answers live in `docs/solutions/module1.md` for instructors.*

---

➡ Next up: **Module 2 – Enterprise-Grade Security Deep Dive**

---

## References (Blockchain)

- Ethereum Official Docs: https://ethereum.org/en/developers/docs/
- Solidity Documentation: https://docs.soliditylang.org/
- Hardhat Documentation: https://hardhat.org/docs
- Web3.js Documentation: https://web3js.org/
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts/
- ConsenSys Diligence: https://consensys.net/diligence/
- Ethereum Gas Tracker: https://etherscan.io/gastracker
- Smart Contract Security Best Practices: https://consensys.net/blog/developers/smart-contract-security-best-practices/
- Ethereum Improvement Proposals (EIPs): https://eips.ethereum.org/
- MetaMask Documentation: https://docs.metamask.io/

---

## 4. Identity and Access Management (IAM) & Keycloak

### 4.1 What is IAM?
Identity and Access Management (IAM) is a framework of policies and technologies that ensures the right individuals have access to the right resources at the right times for the right reasons. It encompasses user authentication, authorization, and identity lifecycle management.

**Key Concepts:**
- **Authentication (AuthN):** Verifying who a user is (e.g., username/password, biometrics, tokens).
- **Authorization (AuthZ):** Determining what resources a user can access and what actions they can perform.
- **Identity Federation:** Allowing users to access multiple systems with a single set of credentials.
- **Single Sign-On (SSO):** Enabling users to access multiple applications with one login session.

### 4.2 Keycloak Overview
- **Keycloak** is an open-source identity and access management solution that provides authentication, authorization, and user management for modern applications and services.
- **Features:** Single Sign-On, Identity Brokering, Social Login, User Federation, and more.

**Why Keycloak?**
- **Open Source:** No licensing costs and community-driven development.
- **Standards Compliant:** Supports OAuth 2.0, OpenID Connect, SAML 2.0.
- **Scalable:** Can handle millions of users and high availability deployments.
- **Extensible:** Custom themes, user federation, and authentication flows.

### 4.3 Keycloak Architecture
- **Realm:** A security boundary that contains users, applications, and other resources.
- **Client:** An application that can request authentication from Keycloak.
- **User:** An individual who can log in to applications.
- **Role:** A set of permissions that can be assigned to users or groups.

**Example Realm Configuration:**
```json
{
  "realm": "contract-management",
  "enabled": true,
  "clients": [
    {
      "clientId": "contract-management-frontend",
      "enabled": true,
      "publicClient": true,
      "redirectUris": ["http://localhost:3000/*"],
      "webOrigins": ["http://localhost:3000"]
    }
  ],
  "roles": {
    "realm": [
      {
        "name": "TDP",
        "description": "Trusted Data Provider"
      },
      {
        "name": "TDC",
        "description": "Trusted Data Consumer"
      },
      {
        "name": "CCRP",
        "description": "Contract Compliance and Regulatory Party"
      }
    ]
  }
}
```

### 4.4 OAuth 2.0 and OpenID Connect
- **OAuth 2.0** is an authorization framework that enables applications to obtain limited access to user accounts on HTTP services.
- **OpenID Connect** is an authentication layer built on top of OAuth 2.0 that provides identity verification.

**OAuth 2.0 Flow:**
1. **Authorization Request:** Client redirects user to authorization server.
2. **User Consent:** User grants permission to the application.
3. **Authorization Code:** Server returns an authorization code to the client.
4. **Token Exchange:** Client exchanges code for access token.
5. **Resource Access:** Client uses access token to access protected resources.

**Example OAuth 2.0 Implementation:**
```javascript
// Authorization URL
const authUrl = `https://***REMOVED-KEYCLOAK_DB_PASSWORD***.example.com/auth/realms/contract-management/protocol/openid-connect/auth?client_id=contract-management-frontend&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid`;

// Token exchange
const tokenResponse = await fetch('https://***REMOVED-KEYCLOAK_DB_PASSWORD***.example.com/auth/realms/contract-management/protocol/openid-connect/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=authorization_code&client_id=contract-management-frontend&code=${code}&redirect_uri=${redirectUri}`
});
```

### 4.5 User Management
- **User Registration:** Self-service registration with email verification.
- **User Profiles:** Customizable user attributes and profile information.
- **Password Policies:** Configurable password strength requirements.
- **Account Lockout:** Protection against brute force attacks.

**Example User Creation:**
```javascript
const createUser = async (userData) => {
  const response = await fetch('https://***REMOVED-KEYCLOAK_DB_PASSWORD***.example.com/auth/admin/realms/contract-management/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: userData.email,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      enabled: true,
      emailVerified: false,
      credentials: [{
        type: 'password',
        value: userData.password,
        temporary: false
      }],
      groups: [userData.partyType]
    })
  });
  return response.json();
};
```

### 4.6 Role-Based Access Control (RBAC)
- **Roles:** Named collections of permissions that can be assigned to users.
- **Groups:** Collections of users that can be assigned roles.
- **Permissions:** Fine-grained access control to specific resources or actions.

**Example Role Assignment:**
```javascript
const assignRole = async (userId, roleName) => {
  const role = await getRoleByName(roleName);
  await fetch(`https://***REMOVED-KEYCLOAK_DB_PASSWORD***.example.com/auth/admin/realms/contract-management/users/${userId}/role-mappings/realm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([role])
  });
};
```

### 4.7 Integration with Applications
- **Frontend Integration:** JavaScript adapters for single-page applications.
- **Backend Integration:** Server-side libraries for API protection.
- **Token Validation:** Verifying JWT tokens and extracting user information.

**Example Token Validation:**
```javascript
const validateToken = async (token) => {
  const response = await fetch('https://***REMOVED-KEYCLOAK_DB_PASSWORD***.example.com/auth/realms/contract-management/protocol/openid-connect/userinfo', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const userInfo = await response.json();
    return {
      valid: true,
      user: userInfo
    };
  }
  
  return { valid: false };
};
```

### 4.8 Security Best Practices
- **HTTPS Only:** Always use HTTPS for all Keycloak communications.
- **Token Expiration:** Set appropriate token lifetimes.
- **Refresh Tokens:** Use refresh tokens for long-lived sessions.
- **Logout:** Implement proper logout to invalidate tokens.
- **Audit Logging:** Enable audit logging for security monitoring.

### 4.9 Real-World Use Cases
- **Enterprise SSO:** Single sign-on across multiple business applications.
- **API Protection:** Securing REST APIs with OAuth 2.0 tokens.
- **Multi-Tenant Applications:** Managing users across different organizations.
- **Social Login:** Integration with Google, Facebook, LinkedIn, etc.

### 4.10 Monitoring and Maintenance
- **Health Checks:** Monitor Keycloak service availability.
- **Performance Metrics:** Track response times and resource usage.
- **User Analytics:** Monitor login patterns and user behavior.
- **Backup and Recovery:** Regular backups of realm configurations and user data.

### 4.11 DID:web Integration for Contract Signing

Decentralized Identifiers (DIDs) provide a W3C-standard way to represent user identities without central authority. **DID:web** is the most straightforward method because it relies only on HTTPS domain ownership—perfect for enterprises who already control DNS and TLS certificates.

*Key Concepts*
- **DID Format** – `did:web:example.com:user:alice` maps to `https://example.com/user/alice/did.json` (or `.well-known/did.json`).
- **Verification Method** – Public keys listed under `verificationMethod` are used to verify signatures.
- **Key Rotation** – New keys can be published by updating the DID document; old keys can be revoked via `revocation` property.

*Registration Workflow*
1. **User Provides DID** – During onboarding, the user enters their `did:web` identifier.
2. **Backend Resolves DID** – Express service fetches the DID document via HTTPS.
3. **Public Key Extraction** – The first `Ed25519VerificationKey2020` (or preferred type) is stored in the `users` table.
4. **Signature Validation** – When a signature is submitted, backend verifies against the cached key.
5. **Revocation Check** – On each verification, backend re-fetches the DID document if the `updated` timestamp has changed.

*Contract Signing Flow Update*
```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant DIDWeb as DIDResolver

    User->>Backend: Submit contract signature + DID
    Backend->>DIDWeb: GET did.json
    DIDWeb-->>Backend: PublicKeyJWK
    Backend-->>Backend: Verify signature
    Backend-->>User: Signature accepted
```

*Implementation Tips*
- Cache DID documents with a short TTL (e.g., 5 min) to reduce latency.
- Use libraries such as `did-resolver` and `did-method-web` in Node.js.
- Support multiple verification key types (Ed25519, RSA) to future-proof the platform.
- Store a hash of the public key to detect silent key rotation.

*Security Considerations*
- Enforce HTTPS and valid TLS certificates when fetching DID documents.
- Rate-limit DID resolution to mitigate SSRF abuse.
- Validate that the DID domain matches the email domain (optional enterprise policy).

This integration allows contracts to be **cryptographically signed** by any web-hosted identity without extra infrastructure, aligning with modern decentralized identity standards.

---

## References (IAM & Keycloak)

- Keycloak Official Documentation: https://www.***REMOVED-KEYCLOAK_DB_PASSWORD***.org/documentation
- OAuth 2.0 RFC 6749: https://tools.ietf.org/html/rfc6749
- OpenID Connect Core 1.0: https://openid.net/specs/openid-connect-core-1_0.html
- SAML 2.0 Specification: https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html
- JWT RFC 7519: https://tools.ietf.org/html/rfc7519
- NIST Digital Identity Guidelines: https://pages.nist.gov/800-63-3/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- Keycloak GitHub Repository: https://github.com/***REMOVED-KEYCLOAK_DB_PASSWORD***/***REMOVED-KEYCLOAK_DB_PASSWORD***
- Keycloak Community: https://www.***REMOVED-KEYCLOAK_DB_PASSWORD***.org/community
- Identity Management Best Practices: https://www.gartner.com/en/documents/3991077

---

## 5. Security

### 5.1 Security Fundamentals
Security in software systems encompasses protecting data, applications, and infrastructure from unauthorized access, use, disclosure, disruption, modification, or destruction. It involves implementing multiple layers of protection to create a defense-in-depth strategy.

**Key Security Principles:**
- **Confidentiality:** Ensuring that information is accessible only to those authorized to have access.
- **Integrity:** Maintaining and assuring the accuracy and completeness of data.
- **Availability:** Ensuring that authorized users have access to information when needed.
- **Authentication:** Verifying the identity of users, systems, or applications.
- **Authorization:** Determining what resources users can access and what actions they can perform.

### 5.2 OWASP Top 10 Security Risks
The OWASP Top 10 is a standard awareness document for developers and web application security. It represents a broad consensus about the most critical security risks to web applications.

**Current OWASP Top 10 (2021):**
1. **Broken Access Control:** Restrictions on what authenticated users are allowed to do.
2. **Cryptographic Failures:** Failures related to cryptography which often lead to exposure of sensitive data.
3. **Injection:** Untrusted data is sent to an interpreter as part of a command or query.
4. **Insecure Design:** Risks related to design and architectural flaws.
5. **Security Misconfiguration:** Incorrectly configured permissions, cloud services, etc.
6. **Vulnerable and Outdated Components:** Using components with known vulnerabilities.
7. **Authentication and Identification Failures:** Incorrectly implemented authentication functions.
8. **Software and Data Integrity Failures:** Software and data integrity failures relate to code and infrastructure that is not protected from integrity violations.
9. **Security Logging and Monitoring Failures:** Failures to detect, escalate, and respond to active breaches.
10. **Server-Side Request Forgery (SSRF):** SSRF flaws occur when a web application fetches a remote resource without validating the user-supplied URL.

### 5.3 Input Validation and Sanitization
Input validation ensures that only properly formatted data enters the application, while sanitization removes or encodes potentially dangerous characters.

**Example Input Validation:**
```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const sanitizeInput = (input) => {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim();
};
```

### 5.4 SQL Injection Prevention
SQL injection occurs when untrusted data is used in database queries without proper validation or parameterization.

**Vulnerable Code:**
```javascript
// DON'T DO THIS
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
```

**Secure Code:**
```javascript
// DO THIS - Use parameterized queries
const query = 'SELECT * FROM users WHERE email = ?';
const result = await sequelize.query(query, {
  replacements: [userInput],
  type: sequelize.QueryTypes.SELECT
});

// Or use Sequelize models
const user = await User.findOne({
  where: { email: userInput }
});
```

### 5.5 Cross-Site Scripting (XSS) Prevention
XSS attacks inject malicious scripts into web pages viewed by other users.

**Types of XSS:**
- **Reflected XSS:** Malicious script is reflected off the web server.
- **Stored XSS:** Malicious script is stored in the database.
- **DOM-based XSS:** Malicious script modifies the DOM environment.

**Prevention Techniques:**
```javascript
// Content Security Policy (CSP)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  next();
});

// Input sanitization
const sanitizeHtml = require('sanitize-html');
const cleanHtml = sanitizeHtml(userInput, {
  allowedTags: ['b', 'i', 'em', 'strong', 'a'],
  allowedAttributes: { 'a': ['href'] }
});

// Output encoding
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
```

### 5.6 Authentication Security
Strong authentication mechanisms are crucial for protecting user accounts and sensitive data.

**Password Security:**
```javascript
const bcrypt = require('bcryptjs');

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Password validation
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
};
```

**JWT Security:**
```javascript
const jwt = require('jsonwebtoken');

// Generate token with expiration
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Token refresh
const refreshToken = (token) => {
  const decoded = jwt.decode(token);
  if (decoded && decoded.exp > Date.now() / 1000) {
    return generateToken(decoded.userId, decoded.role);
  }
  throw new Error('Token cannot be refreshed');
};
```

### 5.7 Authorization and Access Control
Authorization determines what resources users can access and what actions they can perform.

**Role-Based Access Control (RBAC):**
```javascript
const checkPermission = (user, resource, action) => {
  const permissions = {
    'TDP': ['read:own_contracts', 'write:own_contracts', 'read:own_datasets'],
    'TDC': ['read:available_contracts', 'write:own_contracts'],
    'CCRP': ['read:all_contracts', 'write:contract_approvals']
  };
  
  const userPermissions = permissions[user.role] || [];
  const requiredPermission = `${action}:${resource}`;
  
  return userPermissions.includes(requiredPermission);
};

// Middleware for route protection
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!checkPermission(req.user, resource, action)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### 5.8 HTTPS and Transport Security
HTTPS encrypts data in transit, preventing man-in-the-middle attacks and data interception.

**HTTPS Configuration:**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem'),
  ca: fs.readFileSync('path/to/ca-bundle.crt')
};

https.createServer(options, app).listen(443);
```

**Security Headers:**
```javascript
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
});
```

### 5.9 Rate Limiting and DDoS Protection
Rate limiting prevents abuse by limiting the number of requests per user or IP address.

**Rate Limiting Implementation:**
```javascript
const rateLimit = require('express-rate-limit');

// General rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Specific endpoint rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/auth/login', authLimiter);
```

### 5.10 Security Monitoring and Logging
Comprehensive logging and monitoring help detect and respond to security incidents.

**Security Logging:**
```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// Log security events
const logSecurityEvent = (event, details) => {
  securityLogger.info({
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
};

// Log failed login attempts
app.post('/api/auth/login', async (req, res) => {
  try {
    // Authentication logic
    if (!authenticated) {
      logSecurityEvent('failed_login', { email: req.body.email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    logSecurityEvent('login_error', { error: error.message });
  }
});
```

### 5.11 Security Testing
Regular security testing helps identify vulnerabilities before they can be exploited.

**Types of Security Testing:**
- **Static Application Security Testing (SAST):** Analyzing source code for vulnerabilities.
- **Dynamic Application Security Testing (DAST):** Testing running applications for vulnerabilities.
- **Penetration Testing:** Simulating real-world attacks to identify security weaknesses.
- **Vulnerability Scanning:** Automated scanning for known vulnerabilities.

**Example Security Test:**
```javascript
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: maliciousInput,
        password: 'Password123'
      });
    
    expect(response.status).toBe(400);
  });
  
  it('should prevent XSS attacks', async () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/api/contracts')
      .send({
        termsAndConditions: maliciousInput
      });
    
    // Should sanitize input or reject it
    expect(response.status).toBe(400);
  });
});
```

### 5.12 Incident Response
Having a plan for responding to security incidents is crucial for minimizing damage and recovery time.

**Incident Response Plan:**
1. **Detection:** Identify and confirm security incidents.
2. **Analysis:** Assess the scope and impact of the incident.
3. **Containment:** Isolate affected systems to prevent further damage.
4. **Eradication:** Remove the threat from the environment.
5. **Recovery:** Restore systems to normal operation.
6. **Lessons Learned:** Document lessons and improve security measures.

---

## References (Security)

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- NIST Digital Identity Guidelines: https://pages.nist.gov/800-63-3/
- OWASP Application Security Verification Standard: https://owasp.org/www-project-application-security-verification-standard/
- SANS Top 20 Critical Security Controls: https://www.sans.org/top20/
- CWE/SANS Top 25 Most Dangerous Software Weaknesses: https://cwe.mitre.org/top25/
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- Security Headers: https://securityheaders.com/
- Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- JWT Security Best Practices: https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/
- Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- SQL Injection Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

---

## 6. Testing

### 6.1 Testing Fundamentals
Testing is a systematic process of evaluating software to ensure it meets specified requirements and works as expected. It helps identify defects, verify functionality, and ensure quality throughout the development lifecycle.

**Testing Principles:**
- **Early Testing:** Start testing as early as possible in the development cycle.
- **Defect Clustering:** Most defects are found in a small number of modules.
- **Pesticide Paradox:** Running the same tests repeatedly will eventually stop finding new defects.
- **Absence of Errors Fallacy:** Finding and fixing defects doesn't help if the system doesn't meet user needs.
- **Testing is Context Dependent:** Testing approaches depend on the context of the software being developed.

**Testing Levels:**
1. **Unit Testing:** Testing individual components in isolation.
2. **Integration Testing:** Testing the interaction between components.
3. **System Testing:** Testing the complete system as a whole.
4. **Acceptance Testing:** Testing to determine if the system meets business requirements.

### 6.2 Unit Testing
Unit testing focuses on testing individual functions, methods, or classes in isolation. It's the foundation of a robust testing strategy.

**Unit Testing Best Practices:**
- Test one thing at a time
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern
- Keep tests independent and isolated
- Test both happy path and edge cases

**Example Unit Tests:**
```javascript
// User model unit tests
describe('User Model', () => {
  beforeEach(async () => {
    await User.sync({ force: true });
  });

  describe('Validation', () => {
    it('should create a valid user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        role: 'TDP',
        organization: 'Test Org'
      };

      const user = await User.create(userData);
      
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.organization).toBe(userData.organization);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should require email', async () => {
      const userData = {
        password: 'Password123!',
        role: 'TDP'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require unique email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        role: 'TDP'
      };

      await User.create(userData);
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const password = 'Password123!';
      const user = await User.create({
        email: 'test@example.com',
        password,
        role: 'TDP'
      });

      expect(user.password).not.toBe(password);
      expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/);
    });

    it('should verify password correctly', async () => {
      const password = 'Password123!';
      const user = await User.create({
        email: 'test@example.com',
        password,
        role: 'TDP'
      });

      const isValid = await user.verifyPassword(password);
      expect(isValid).toBe(true);
    });
  });
});
```

**Service Layer Unit Tests:**
```javascript
// DID service unit tests
describe('DID Service', () => {
  let didService;
  let mockAxios;

  beforeEach(() => {
    mockAxios = {
      get: jest.fn(),
      post: jest.fn()
    };
    didService = new DIDService();
    didService.axios = mockAxios;
  });

  describe('fetchPublicKey', () => {
    it('should fetch public key from DID document', async () => {
      const did = 'did:web:example.com:user:123';
      const mockResponse = {
        data: {
          verificationMethod: [{
            id: `${did}#key-1`,
            type: 'Ed25519VerificationKey2020',
            publicKeyJwk: {
              kty: 'OKP',
              crv: 'Ed25519',
              x: 'test-public-key'
            }
          }]
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await didService.fetchPublicKey(did);

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://example.com/.well-known/did.json'
      );
      expect(result).toBe('test-public-key');
    });

    it('should handle DID resolution errors', async () => {
      const did = 'did:web:invalid.com:user:123';
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(didService.fetchPublicKey(did)).rejects.toThrow('Network error');
    });

    it('should handle missing verification method', async () => {
      const did = 'did:web:example.com:user:123';
      const mockResponse = {
        data: {
          verificationMethod: []
        }
      };

      mockAxios.get.mockResolvedValue(mockResponse);

      await expect(didService.fetchPublicKey(did)).rejects.toThrow('No verification method found');
    });
  });
});
```

### 6.3 Integration Testing
Integration testing verifies that different components work together correctly. It focuses on the interfaces between components and their interactions.

**API Integration Tests:**
```javascript
// Contract API integration tests
describe('Contract API Integration', () => {
  let server;
  let authToken;

  beforeAll(async () => {
    server = app.listen(0);
    const port = server.address().port;
    baseURL = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    // Setup test database
    await sequelize.sync({ force: true });
    
    // Create test user and get auth token
    const user = await User.create({
      email: 'test@example.com',
      password: 'Password123!',
      role: 'TDP'
    });
    
    const response = await request(baseURL)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });
    
    authToken = response.body.token;
  });

  describe('POST /api/contracts', () => {
    it('should create a new contract', async () => {
      const contractData = {
        title: 'Test Contract',
        description: 'Test Description',
        termsAndConditions: 'Test Terms',
        datasetId: 1
      };

      const response = await request(baseURL)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(contractData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(contractData.title);
      expect(response.body.status).toBe('DRAFT');
      expect(response.body.createdBy).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(baseURL)
        .post('/api/contracts')
        .send({ title: 'Test Contract' });

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(baseURL)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/contracts', () => {
    beforeEach(async () => {
      // Create test contracts
      await Contract.bulkCreate([
        {
          title: 'Contract 1',
          description: 'Description 1',
          termsAndConditions: 'Terms 1',
          status: 'DRAFT',
          createdBy: 1
        },
        {
          title: 'Contract 2',
          description: 'Description 2',
          termsAndConditions: 'Terms 2',
          status: 'ACTIVE',
          createdBy: 1
        }
      ]);
    });

    it('should return contracts for authenticated user', async () => {
      const response = await request(baseURL)
        .get('/api/contracts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBeDefined();
    });

    it('should filter contracts by status', async () => {
      const response = await request(baseURL)
        .get('/api/contracts?status=DRAFT')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('DRAFT');
    });
  });
});
```

### 6.4 End-to-End Testing
End-to-end testing verifies that the entire application works correctly from the user's perspective. It tests complete user workflows.

**E2E Test Example:**
```javascript
// Contract creation workflow E2E test
describe('Contract Creation Workflow', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });

  afterEach(async () => {
    await page.close();
  });

  it('should create a contract successfully', async () => {
    // Login
    await page.click('[data-testid="login-button"]');
    await page.type('[data-testid="email-input"]', 'test@example.com');
    await page.type('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="submit-login"]');
    
    await page.waitForSelector('[data-testid="dashboard"]');

    // Navigate to create contract
    await page.click('[data-testid="create-contract-button"]');
    await page.waitForSelector('[data-testid="contract-form"]');

    // Fill contract form
    await page.type('[data-testid="contract-title"]', 'Test Contract');
    await page.type('[data-testid="contract-description"]', 'Test Description');
    await page.type('[data-testid="contract-terms"]', 'Test Terms and Conditions');
    
    // Select dataset
    await page.select('[data-testid="dataset-select"]', '1');
    
    // Submit form
    await page.click('[data-testid="submit-contract"]');
    
    // Verify success
    await page.waitForSelector('[data-testid="success-message"]');
    const successMessage = await page.$eval(
      '[data-testid="success-message"]',
      el => el.textContent
    );
    
    expect(successMessage).toContain('Contract created successfully');
  });

  it('should handle form validation errors', async () => {
    // Login and navigate to create contract
    await page.click('[data-testid="login-button"]');
    await page.type('[data-testid="email-input"]', 'test@example.com');
    await page.type('[data-testid="password-input"]', 'Password123!');
    await page.click('[data-testid="submit-login"]');
    
    await page.waitForSelector('[data-testid="dashboard"]');
    await page.click('[data-testid="create-contract-button"]');
    await page.waitForSelector('[data-testid="contract-form"]');

    // Submit empty form
    await page.click('[data-testid="submit-contract"]');
    
    // Verify validation errors
    await page.waitForSelector('[data-testid="error-message"]');
    const errorMessage = await page.$eval(
      '[data-testid="error-message"]',
      el => el.textContent
    );
    
    expect(errorMessage).toContain('Title is required');
  });
});
```

### 6.5 Test-Driven Development (TDD)
TDD is a development methodology where tests are written before the actual code. It follows the Red-Green-Refactor cycle.

**TDD Example:**
```javascript
// Step 1: Write failing test (Red)
describe('Contract Signature Verification', () => {
  it('should verify valid signature', () => {
    const contract = {
      id: 1,
      termsAndConditions: 'Test terms',
      hash: 'abc123'
    };
    
    const signature = 'valid-signature';
    const publicKey = 'user-public-key';
    
    const result = verifyContractSignature(contract, signature, publicKey);
    
    expect(result).toBe(true);
  });
});

// Step 2: Write minimal code to pass test (Green)
const verifyContractSignature = (contract, signature, publicKey) => {
  // Minimal implementation to make test pass
  return true;
};

// Step 3: Refactor code (Refactor)
const verifyContractSignature = (contract, signature, publicKey) => {
  try {
    const message = `${contract.id}:${contract.hash}`;
    const signatureBuffer = Buffer.from(signature, 'base64');
    const publicKeyBuffer = Buffer.from(publicKey, 'base64');
    
    return crypto.verify(
      'sha256',
      Buffer.from(message),
      publicKeyBuffer,
      signatureBuffer
    );
  } catch (error) {
    return false;
  }
};
```

### 6.6 Performance Testing
Performance testing evaluates how the system performs under various conditions, including load, stress, and scalability testing.

**Load Testing Example:**
```javascript
// Load testing with Artillery
const loadTestConfig = {
  config: {
    target: 'http://localhost:5001',
    phases: [
      { duration: 60, arrivalRate: 10 }, // Ramp up
      { duration: 300, arrivalRate: 50 }, // Sustained load
      { duration: 60, arrivalRate: 100 }  // Peak load
    ]
  },
  scenarios: [
    {
      name: 'Contract API Load Test',
      weight: 1,
      flow: [
        {
          post: {
            url: '/api/auth/login',
            json: {
              email: 'test@example.com',
              password: 'Password123!'
            }
          }
        },
        {
          get: {
            url: '/api/contracts'
          }
        },
        {
          post: {
            url: '/api/contracts',
            json: {
              title: 'Load Test Contract',
              description: 'Test Description',
              termsAndConditions: 'Test Terms'
            }
          }
        }
      ]
    }
  ]
};
```

### 6.7 Security Testing
Security testing identifies vulnerabilities and ensures the application is secure against various attacks.

**Security Test Examples:**
```javascript
describe('Security Tests', () => {
  it('should prevent SQL injection in contract search', async () => {
    const maliciousQuery = "'; DROP TABLE contracts; --";
    
    const response = await request(app)
      .get(`/api/contracts?search=${encodeURIComponent(maliciousQuery)}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Should not crash and should return empty results
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should prevent XSS in contract creation', async () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: maliciousInput,
        description: 'Test Description',
        termsAndConditions: 'Test Terms'
      });
    
    // Should sanitize input or reject it
    expect(response.status).toBe(400);
  });

  it('should enforce authentication on protected routes', async () => {
    const response = await request(app)
      .get('/api/contracts');
    
    expect(response.status).toBe(401);
  });

  it('should enforce authorization based on user role', async () => {
    // Create user with limited role
    const limitedUser = await User.create({
      email: 'limited@example.com',
      password: 'Password123!',
      role: 'TDC'
    });
    
    const limitedToken = jwt.sign(
      { userId: limitedUser.id, role: limitedUser.role },
      process.env.JWT_SECRET
    );
    
    // Try to access admin-only endpoint
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${limitedToken}`);
    
    expect(response.status).toBe(403);
  });
});
```

### 6.8 Test Automation and CI/CD
Automated testing integrated into the CI/CD pipeline ensures code quality and prevents regressions.

**GitHub Actions Example:**
```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      ***REMOVED-DB_PASSWORD***:
        image: ***REMOVED-DB_PASSWORD***:14
        env:
          POSTGRES_PASSWORD: ***REMOVED-DB_PASSWORD***
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
        cd ../frontend && npm ci
    
    - name: Run backend tests
      run: |
        cd backend
        npm test
      env:
        DATABASE_URL: ***REMOVED-DB_PASSWORD***ql://***REMOVED-DB_PASSWORD***:***REMOVED-DB_PASSWORD***@localhost:5432/test_db
        JWT_SECRET: test-secret
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
    
    - name: Run E2E tests
      run: |
        npm run test:e2e
      env:
        DATABASE_URL: ***REMOVED-DB_PASSWORD***ql://***REMOVED-DB_PASSWORD***:***REMOVED-DB_PASSWORD***@localhost:5432/test_db
        JWT_SECRET: test-secret
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### 6.9 Test Data Management
Proper test data management ensures tests are reliable and maintainable.

**Test Data Factory:**
```javascript
// Test data factory
class TestDataFactory {
  static createUser(overrides = {}) {
    return {
      email: `test-${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'TDP',
      organization: 'Test Organization',
      ...overrides
    };
  }

  static createContract(overrides = {}) {
    return {
      title: `Test Contract ${Date.now()}`,
      description: 'Test Description',
      termsAndConditions: 'Test Terms and Conditions',
      status: 'DRAFT',
      ...overrides
    };
  }

  static createDataset(overrides = {}) {
    return {
      name: `Test Dataset ${Date.now()}`,
      description: 'Test Dataset Description',
      dataType: 'STRUCTURED',
      ...overrides
    };
  }
}

// Test database setup
const setupTestDatabase = async () => {
  await sequelize.sync({ force: true });
  
  // Create test users
  const users = await Promise.all([
    User.create(TestDataFactory.createUser({ role: 'TDP' })),
    User.create(TestDataFactory.createUser({ role: 'TDC' })),
    User.create(TestDataFactory.createUser({ role: 'CCRP' }))
  ]);
  
  // Create test datasets
  const datasets = await Promise.all([
    Dataset.create(TestDataFactory.createDataset()),
    Dataset.create(TestDataFactory.createDataset())
  ]);
  
  return { users, datasets };
};
```

---

## References (Testing)

- Jest Testing Framework: https://jestjs.io/
- Supertest for API Testing: https://github.com/visionmedia/supertest
- Puppeteer for E2E Testing: https://pptr.dev/
- Playwright for E2E Testing: https://playwright.dev/
- Artillery for Load Testing: https://www.artillery.io/
- Test-Driven Development: https://en.wikipedia.org/wiki/Test-driven_development
- Testing Pyramid: https://martinfowler.com/articles/practical-test-pyramid.html
- Behavior-Driven Development: https://cucumber.io/docs/bdd/
- Test Coverage: https://en.wikipedia.org/wiki/Code_coverage
- Continuous Integration: https://en.wikipedia.org/wiki/Continuous_integration
- GitHub Actions: https://docs.github.com/en/actions
- Testing Best Practices: https://github.com/goldbergyoni/javascript-testing-best-practices
- API Testing Guide: https://www.postman.com/collection/guide-to-api-testing/
- Performance Testing Guide: https://k6.io/docs/testing-guides/
- Security Testing Guide: https://owasp.org/www-project-web-security-testing-guide/

---

## 7. Architecture Diagrams and Advanced Technical Concepts

### 7.1 System Architecture Overview
The diagram below illustrates how the Contract Management System components interact across tiers—from the client browser through the backend and identity provider to the blockchain network.

```mermaid
graph TD
    subgraph ClientTier
        A[Browser-SPA]
    end
    subgraph EdgeTier
        B[NGINX-Proxy]
    end
    subgraph AppTier
        C[ReactFrontend]
        D[ExpressBackend]
    end
    subgraph Services
        E[KeycloakIAM]
        F[PostgreSQLDB]
        G[BlockchainNode]
    end
    A --> B --> C
    C -->|HTTPS / REST| D
    D --> F
    D --> E
    D --> G
```

*Key Points*
1. **Zero-Trust Edge** – All traffic terminates at the reverse proxy where HTTPS is enforced.
2. **Stateless Frontend** – React bundles are served over CDN / edge cache for scalability.
3. **Backend Orchestration** – Express coordinates persistence, IAM, and optional blockchain calls.
4. **Decoupled Services** – Each service (DB, IAM, Blockchain) can scale independently.

---

### 7.2 Backend Request Flow
A sequence diagram that follows a typical "Create Contract" request from the user interface down to the blockchain.

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant API as Express API
    participant Service
    participant DB as PostgreSQL
    participant BC as Blockchain

    User->>UI: Click "Create Contract"
    UI->>API: POST /api/contracts
    API->>Service: Validate & process
    Service->>DB: Begin TX & persist
    Service-->>BC: Store on-chain hash (optional)
    BC-->>Service: Tx receipt
    Service-->>DB: Commit TX
    API-->>UI: 201 Created + contractId
```

*Highlights*
- **Transactional Consistency** – Database commit only after blockchain confirmation to prevent orphaned records.
- **Service Layer** – Centralizes business rules (pricing, role checks, notifications).
- **Scalable I/O** – Non-blocking I/O in Node.js handles high concurrency.

---

### 7.3 Frontend Component Architecture
The component tree shows React's modular structure, emphasising separation of concerns.

```mermaid
graph LR
    App --> Layout
    Layout --> Header
    Layout --> Sidebar
    Layout --> Router
    Router --> Dashboard
    Router --> Contracts
    Router --> ContractDetail
    Router --> Datasets
    Router --> Notifications
    Router --> UserRegistration
```

*Design Notes*
- **Presentational vs Container Components** – UI-focused components are isolated from data-fetching logic.
- **Lazy Loading** – Routes are code-split to improve initial load times.
- **Context Providers** – Global state (auth token, theme) is injected at `App` level.

---

### 7.4 IAM Authentication Flow
OpenID Connect (OIDC) authorization-code flow implemented with Keycloak.

```mermaid
sequenceDiagram
    participant User
    participant UI as SPA
    participant KC as Keycloak
    participant API as Backend

    User->>UI: Enter credentials
    UI->>KC: OIDC AuthN Request
    KC-->>UI: AuthZ Code
    UI->>KC: Code + Client Secret
    KC-->>UI: ID & Access Tokens
    UI->>API: Bearer ACCESS_TOKEN
    API->>KC: Introspect_JWKS
    KC-->>API: Token valid
    API-->>UI: Protected resource
```

*Security Considerations*
- **Short-Lived Tokens** – Access tokens expire quickly; refresh tokens renew sessions without re-authentication.
- **Spectre Mitigation** – Tokens stored in memory (not localStorage) to minimise XSS impact.

---

### 7.5 Contract Signing Lifecycle
The high-level workflow covering draft creation, multi-party signatures, and activation.

```mermaid
sequenceDiagram
    participant TDP as Trusted Data Provider
    participant Backend
    participant BC as Blockchain
    participant CCRP as Contract Counterparty

    TDP->>Backend: Submit draft
    Backend->>BC: Record hash + metadata
    BC-->>Backend: Tx receipt
    Backend-->>TDP: Draft ID

    CCRP->>Backend: Review & sign
    Backend->>BC: Append CCRP signature
    BC-->>Backend: Confirmed block
    Backend-->>CCRP: Contract active
```

*Lifecycle States*
1. **DRAFT** – Editable by creator.
2. **PENDING_SIGNATURES** – Waiting for counterparty.
3. **ACTIVE** – Fully signed and enforceable.
4. **ARCHIVED** – Immutable record retained for audit.

---

### 7.6 Defense-in-Depth Security Layers

```mermaid
graph LR
    A[Network Firewall] --> B[HTTPS / TLS]
    B --> C[Keycloak IAM]
    C --> D[API Input Validation]
    D --> E[Business Authorization]
    E --> F[Encrypted Storage]
    F --> G[Monitoring & Alerting]
```

*Layered Approach*
- **Perimeter Guard** – Only ports 443/80 exposed.
- **Strong Identity** – Centralised IAM enforces MFA & RBAC.
- **Sanitisation & Validation** – Prevents injection attacks at earliest point.
- **Observability** – Structured logs feed SIEM for anomaly detection.

---

### 7.7 Testing Pyramid & Quality Gates

```mermaid
graph TD
    %% Testing pyramid
    subgraph Pyramid
        UT[UnitTests] --> IT[IntegrationTests] --> E2E[E2ETests]
    end
    %% Continuous quality checks
    subgraph Quality
        LINT[StaticAnalysis] --> COV[Coverage] --> PERF[Performance] --> SEC[SecurityScans]
    end
    E2E --> LINT
```

*Guidelines*
- **Broad Base** – Fast unit tests catch regressions early.
- **Middle Layer** – Integration tests validate service contracts.
- **Thin Top** – E2E focuses on critical user journeys only.

---

### 7.8 CI/CD Pipeline Overview

```mermaid
graph LR
    Code[Git Push] --> CI[GitHub Actions]
    CI --> TestSuite[Automated Tests]
    TestSuite --> Build[Docker Build & Tag]
    Build --> Scan[Security Scan / SCA]
    Scan --> Registry[OCI Registry]
    Registry --> Deploy[Helm / Terraform]
    Deploy --> K8s[Kubernetes Cluster]
```

*Pipeline Stages*
1. **Continuous Integration** – Every commit triggers the unified test suite and static checks.
2. **Immutable Artifacts** – Docker images are versioned and signed.
3. **Policy-As-Code** – Terraform plans reviewed via pull requests before apply.
4. **Progressive Delivery** – Canary or blue/green strategies minimise downtime.

---

## 8. DevSecOps & Continuous Security

DevSecOps integrates security practices at every phase of the software delivery lifecycle—**from code to cloud**—turning security into a shared responsibility across development, operations, and security teams.

### 8.1 Shift-Left Security Principles
1. **Early Detection** – Identify vulnerabilities during coding and build stages, when fixes are cheapest.
2. **Automated Enforcement** – Embed security controls in CI/CD pipelines rather than manual gates.
3. **Continuous Feedback** – Provide actionable insights to developers within minutes of a commit.
4. **Reproducibility** – Infrastructure and policies versioned in code, auditable and repeatable.

### 8.2 DevSecOps Toolchain

```mermaid
graph LR
    SRC[SourceCode] --> SAST[SAST_CodeQL]
    SRC --> SCA[DepScan_Snyk]
    SAST --> TESTS[UnitIntegrationTests]
    SCA --> TESTS
    TESTS --> BUILD[ContainerBuild]
    BUILD --> IMGSCAN[ImageScan_Trivy]
    IMGSCAN --> IAC[IaCScan_tfsec]
    IAC --> POLICY[OPA_Policy]
    POLICY --> DEPLOY[K8sDeploy]
    DEPLOY --> RUNTIME[RuntimeSec_Falco]
```

*Highlights*
- **Static Application Security Testing (SAST)** – CodeQL runs on every PR; blocks merges on high-severity findings.
- **Software Composition Analysis (SCA)** – Dependency scanning prevents known-vulnerable packages from entering the build.
- **Container Image Scanning** – Trivy checks OS packages and language deps; fails pipeline on CVSS ≥7.
- **Infrastructure as Code (IaC) Scanning** – tfsec validates Terraform against CIS benchmarks.
- **Policy-as-Code** – OPA Gatekeeper enforces Kubernetes admission control (e.g., no privileged pods).
- **Runtime Threat Detection** – Falco watches syscalls for crypto-miners, reverse shells.

### 8.3 Security Gates & Quality Thresholds
| Pipeline Stage              | Tool           | Blocking Condition                       |
|-----------------------------|----------------|-----------------------------------------|
| SAST                        | CodeQL         | `severity: error` findings               |
| Dependency Scan             | Snyk           | CVSS ≥ 7                                 |
| Container Scan              | Trivy          | Critical vulnerabilities                 |
| IaC Scan                    | tfsec          | High-severity rule failures              |
| Unit Test Coverage          | Jest           | < 90 % blocks merge                      |
| License Compliance          | OSS Review     | Non-approved licenses                    |

### 8.4 Secrets Management
- **Pre-Commit Hooks** (`git-secrets`, `detect-secrets`) to detect keys before pushing.  
- **Vault-Backed CI** – GitHub OIDC → HashiCorp Vault issues short-lived tokens at build time.  
- **Kubernetes Secrets** – SealedSecrets or External Secrets Operator decrypt at runtime only inside cluster.

### 8.5 Continuous Compliance & Audit
- **Automated Evidence Collection** – Pipeline artifacts (scan reports) stored in immutable S3 bucket for auditors.
- **Compliance as Code** – Regula / InSpec profiles validate AWS, Kubernetes, and Terraform against SOC2, ISO 27001.
- **Attestation & SBOM** – Cosign signs images; SPDX SBOM embedded for supply-chain transparency.

---

*Next: 9. Deployment, Observability, and Scalability sections will be added in upcoming revisions.* 

### 4.11 DID:web Integration for Contract Signing
... existing text ...

### 4.12 Role-Based User Journeys

| Role | Primary Goals | Key Screens | APIs Touched | On-Chain Actions |
|------|---------------|-------------|--------------|------------------|
| **TDP** (Trusted Data Provider) | Publish datasets, draft contracts, sign & activate | Dashboard, Datasets, Create Contract, Contract Detail | `POST /api/datasets`, `POST /api/contracts`, `POST /api/contracts/:id/sign` | Draft hash recorded, first signature stored |
| **TDC** (Trusted Data Consumer) | Browse datasets, negotiate & sign contracts, access purchased data | Browse Datasets, Contract Detail | `GET /api/datasets`, `GET/POST /api/contracts/:id/sign` | Counter-signature transaction |
| **CCRP** (Compliance & Contract Review Panel) | Review contracts, approve or reject, audit signing history | Contract Review Queue | `PATCH /api/contracts/:id/approve`, `GET /api/audit` | Emits approval event |

#### 4.12.1 Onboarding & Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant UI
    participant KC as Keycloak
    participant API
    User->>UI: Register (role, org, did:web)
    UI->>KC: CreateAccount
    KC-->>UI: ConfirmEmailLink
    User->>KC: Verify email
    KC-->>User: AccountReady
    User->>UI: Login
    UI->>KC: OAuthCode
    KC-->>UI: AccessToken
    UI->>API: Bearer Token
    API-->>UI: Role-scoped dashboard
```
*RBAC Enforcement* – After token introspection, backend attaches `req.user.role`. Route middlewares like `requirePermission('contracts','write')` gate access.

#### 4.12.2 Contract Lifecycle Swim-Lane
```mermaid
sequenceDiagram
    participant TDP
    participant API
    participant TDC
    participant CCRP
    participant SC as SmartContract

    TDP->>API: Create Draft
    API-->>SC: storeHash(draft)
    API-->>TDP: draftId

    TDP->>API: Sign Draft
    API-->>SC: sign(draftId, TDP)

    TDC->>API: Counter-Sign
    API-->>SC: sign(draftId, TDC)

    CCRP->>API: Approve
    API-->>SC: approve(draftId)

    SC-->>API: status=ACTIVE
    API-->>All: Notify via WebSocket / email
```
States: `DRAFT → SIGNED_TDP → SIGNED_TDC → PENDING_CCRP → ACTIVE → ARCHIVED`.

> **Design Note**: each transition triggers `notificationService` which writes to `notification` table and pushes real-time update to the frontend.

---

## 9. Multi-Cloud Deployment Playbook

Below we outline **production-ready blueprints** for Oracle Cloud Infrastructure (OCI), Google Cloud Platform (GCP) and Microsoft Azure.  Each cloud follows the same high-level pattern—Terraform → Kubernetes → Helm—but differs in managed services and IAM specifics.

### 9.1 Common Deployment Stack
| Layer | Tool | Purpose |
|-------|------|---------|
| IaC   | Terraform modules (`deployment/*/terraform`) | Provision VCN/VPC, managed DB, Container registry, K8s cluster |
| Images| GitHub Actions → Docker | Build & push version-tagged images |
| Helm  | Helm charts (`deployment/helm/`) | Declare K8s objects (Deployments, Services, Ingress) |
| Secrets| External Secrets Operator | Pulls secrets from cloud vault at runtime |
| GitOps | ArgoCD / Flux (optional) | Reconcile cluster state from Git branch |

### 9.2 Oracle Cloud Infrastructure (OCI)
*Directory:* `deployment/oci/terraform/`
1. **OKE Cluster** – Module `oke/` spins up Oracle Kubernetes Engine with three worker nodes.
2. **Autonomous DB** – Module `database/` provisions an Autonomous Postgres instance; connection string passed to Helm via Terraform outputs.
3. **Secrets** – Use **OCI Vault**; Terraform creates secret objects for `DB_PASSWORD`, `JWT_SECRET`.
4. **Ingress** – OCI Load Balancer with TLS; certificate managed by OCI Certificate Service.
5. **Push Pipeline** – `docker login iad.ocir.io/...` then `docker push`; imagePullSecrets injected via Helm values.

```mermaid
graph TD
    git[GitHub Actions] --> ocir[OCIRegistry]
    ocir --> oke[OKECluster]
    oke --> pods[CMS Pods]
    pods --> adb[AutonomousPostgres]
```

### 9.3 Google Cloud Platform (GCP)
*Modules live in* `deployment/gcp/terraform/` (create when adopting).
1. **GKE Standard** – Regional cluster with Workload Identity.
2. **Cloud SQL Postgres** – Private Service Connect; Cloud SQL Auth Proxy side-car added via Helm.
3. **Artifact Registry** – `gcloud auth configure-docker` then push.
4. **Secret Manager** – External Secrets Operator pulls secrets.
5. **Load Balancer** – Cloud Load Balancer + Cloud Armor (WAF).
6. **Observability** – Cloud Logging & Cloud Monitoring scraped via Prometheus side-car.

### 9.4 Microsoft Azure
*Modules directory to add:* `deployment/azure/terraform/`
1. **AKS** – Azure Kubernetes Service with AAD integration.
2. **Azure Database for PostgreSQL Flexible Server** – VNet-integrated.
3. **ACR** – Azure Container Registry; `az acr login` push.
4. **Key Vault** – CSI driver mounts secrets directly to pods.
5. **Ingress** – Application Gateway Ingress Controller (AGIC) offers native WAF + TLS.
6. **Scaling** – AKS Cluster Autoscaler + KEDA for job spikes.

### 9.5 Deployment Steps (CI Job Snippet)
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      - name: Terraform Init & Apply
        working-directory: deployment/oci/terraform   # swap for gcp/ azure/
        run: |
          terraform init -backend-config="bucket=$TF_BUCKET"
          terraform apply -auto-approve -var "image_tag=${{ github.sha }}"
      - name: Helm Upgrade
        run: |
          helm upgrade --install cms-deploy deployment/helm \
            --set image.tag=${{ github.sha }}
```

### 9.6 Zero-Downtime Release Strategy
1. **Blue/Green** – Helm sets `color` label; traffic switch via Ingress annotation.
2. **Canary (Argo Rollouts)** – 10-50-100% weight progression with automated metrics check (p95 latency < 300 ms).
3. **Rollback** – `helm rollback cms-deploy <previous>` or `argo rollouts undo`.

### 9.7 Cloud-Specific Cost Tips
* **OCI** – Use *Burstable* node shapes for lower dev cost; enable Autonomous DB auto-scaling.
* **GCP** – Preemptible nodes for CI runners; committed use discounts for Cloud SQL.
* **Azure** – Reserved Instances for Postgres; spot node pools for batch jobs.

---

Course continues with Observability & Scalability best-practices.

---

## Advanced Training Modules

### Module 2: Security & Compliance Engineering

#### 2.1 Defense-in-Depth Architecture
```mermaid
graph TD
    CDN[Cloudflare CDN] --> WAF[WAF Rules]
    WAF --> LB[Load Balancer]
    LB --> API[API Gateway]
    API --> AUTH[Keycloak Auth]
    AUTH --> APP[Application Layer]
    APP --> DB[(Database)]
    APP --> BC[Blockchain]
    
    subgraph "Security Layers"
        WAF
        AUTH
        APP
        DB
        BC
    end
```

**Security Controls:**
- **Network Layer**: TLS 1.3, rate limiting, DDoS protection
- **Application Layer**: Input validation, SQL injection prevention, XSS protection
- **Data Layer**: Encryption at rest, field-level encryption, audit logging
- **Blockchain Layer**: Smart contract security, signature verification

#### 2.2 Smart Contract Security Patterns

**Reentrancy Protection:**
```solidity
// Secure pattern for contract interactions
modifier nonReentrant() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
}

function secureWithdraw() external nonReentrant {
    // Withdrawal logic
}
```

**Access Control:**
```solidity
contract ContractManager {
    mapping(address => bool) public authorizedSigners;
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier onlyAuthorizedSigner() {
        require(authorizedSigners[msg.sender], "Not authorized signer");
        _;
    }
}
```

#### 2.3 DID:web Security Implementation

**DID Resolution with Security:**
```javascript
class DIDWebResolver {
    async resolveDID(did) {
        // Validate DID format
        if (!did.startsWith('did:web:')) {
            throw new Error('Invalid DID format');
        }
        
        // Fetch DID document with timeout and retry
        const didDoc = await this.fetchWithRetry(did);
        
        // Verify DID document integrity
        await this.verifyDIDDocument(didDoc);
        
        return didDoc;
    }
    
    async verifySignature(message, signature, publicKey) {
        // Implement cryptographic verification
        const verifier = crypto.createVerify('SHA256');
        verifier.update(message);
        return verifier.verify(publicKey, signature, 'base64');
    }
}
```

#### 2.4 Compliance & Audit Framework

**GDPR Compliance:**
```javascript
class DataPrivacyService {
    async anonymizeUserData(userId) {
        // Implement data anonymization
        const user = await User.findByPk(userId);
        user.email = this.hashEmail(user.email);
        user.personalData = null;
        await user.save();
        
        // Log anonymization event
        await this.auditLog('DATA_ANONYMIZED', { userId });
    }
    
    async exportUserData(userId) {
        // GDPR data export
        const userData = await this.gatherUserData(userId);
        return this.formatForExport(userData);
    }
}
```

**Audit Logging:**
```javascript
class AuditService {
    async logEvent(eventType, data, userId) {
        const auditEntry = {
            eventType,
            data: JSON.stringify(data),
            userId,
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        };
        
        await AuditLog.create(auditEntry);
        
        // Blockchain audit trail
        await this.blockchainService.recordAuditEvent(auditEntry);
    }
}
```

### Module 3: Governance & Access Control

#### 3.1 Role-Based Access Control (RBAC)

**Advanced RBAC Implementation:**
```javascript
class RBACService {
    constructor() {
        this.permissions = {
            'contracts': {
                'read': ['TDP', 'TDC', 'CCRP', 'ADMIN'],
                'write': ['TDP', 'ADMIN'],
                'approve': ['CCRP', 'ADMIN'],
                'delete': ['ADMIN']
            },
            'datasets': {
                'read': ['TDP', 'TDC', 'CCRP', 'ADMIN'],
                'write': ['TDP', 'ADMIN'],
                'publish': ['TDP', 'ADMIN']
            }
        };
    }
    
    hasPermission(userRole, resource, action) {
        const allowedRoles = this.permissions[resource]?.[action] || [];
        return allowedRoles.includes(userRole);
    }
    
    async enforcePermission(req, res, next) {
        const { resource, action } = req.params;
        const userRole = req.user.role;
        
        if (!this.hasPermission(userRole, resource, action)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        
        next();
    }
}
```

#### 3.2 Multi-Party Contract Governance

**Contract State Machine:**
```javascript
class ContractStateMachine {
    constructor() {
        this.states = {
            DRAFT: {
                allowedActions: ['SIGN_TDP', 'MODIFY', 'DELETE'],
                nextStates: ['SIGNED_TDP', 'DELETED']
            },
            SIGNED_TDP: {
                allowedActions: ['SIGN_TDC', 'MODIFY'],
                nextStates: ['SIGNED_TDC', 'DRAFT']
            },
            SIGNED_TDC: {
                allowedActions: ['APPROVE_CCRP', 'MODIFY'],
                nextStates: ['PENDING_CCRP', 'DRAFT']
            },
            PENDING_CCRP: {
                allowedActions: ['APPROVE', 'REJECT'],
                nextStates: ['ACTIVE', 'REJECTED']
            },
            ACTIVE: {
                allowedActions: ['AMEND', 'TERMINATE'],
                nextStates: ['AMENDED', 'TERMINATED']
            }
        };
    }
    
    canTransition(currentState, action, userRole) {
        const state = this.states[currentState];
        return state.allowedActions.includes(action);
    }
    
    async transitionContract(contractId, action, userId) {
        const contract = await Contract.findByPk(contractId);
        const currentState = contract.status;
        
        if (!this.canTransition(currentState, action, req.user.role)) {
            throw new Error('Invalid state transition');
        }
        
        // Update contract state
        contract.status = this.states[currentState].nextStates[0];
        await contract.save();
        
        // Record state change
        await this.auditService.logEvent('STATE_CHANGE', {
            contractId,
            fromState: currentState,
            toState: contract.status,
            action,
            userId
        });
    }
}
```

### Module 4: Performance & Scalability

#### 4.1 Database Optimization

**Connection Pooling:**
```javascript
// backend/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, // Maximum number of clients
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

**Query Optimization:**
```javascript
class OptimizedContractService {
    async getContractsWithPagination(page = 1, limit = 10, filters = {}) {
        const offset = (page - 1) * limit;
        
        // Use indexed queries
        const whereClause = this.buildWhereClause(filters);
        
        const contracts = await Contract.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: Dataset, as: 'dataset', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        
        return contracts;
    }
    
    buildWhereClause(filters) {
        const where = {};
        
        if (filters.status) where.status = filters.status;
        if (filters.creatorId) where.creatorId = filters.creatorId;
        if (filters.datasetId) where.datasetId = filters.datasetId;
        
        return where;
    }
}
```

#### 4.2 Caching Strategy

**Redis Caching:**
```javascript
const redis = require('redis');
const client = redis.createClient();

class CacheService {
    async getCachedData(key) {
        try {
            const cached = await client.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    
    async setCachedData(key, data, ttl = 3600) {
        try {
            await client.setex(key, ttl, JSON.stringify(data));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }
    
    async invalidatePattern(pattern) {
        try {
            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(keys);
            }
        } catch (error) {
            console.error('Cache invalidation error:', error);
        }
    }
}
```

#### 4.3 API Rate Limiting

**Advanced Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const createRateLimiter = (windowMs, max, keyGenerator) => {
    return rateLimit({
        store: new RedisStore({
            client: redisClient,
            prefix: 'rate_limit:'
        }),
        windowMs,
        max,
        keyGenerator,
        message: {
            error: 'Too many requests, please try again later.',
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false
    });
};

// Apply different limits for different endpoints
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, (req) => req.ip);
const apiLimiter = createRateLimiter(60 * 1000, 100, (req) => req.user?.id || req.ip);
```

### Module 5: UX & Frontend Engineering

#### 5.1 Advanced React Patterns

**Custom Hooks for Contract Management:**
```javascript
// frontend/src/hooks/useContracts.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useContracts = (filters = {}) => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        hasMore: true
    });

    const fetchContracts = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const response = await api.get('/contracts', {
                params: { page, ...filters }
            });
            
            if (page === 1) {
                setContracts(response.data.contracts);
            } else {
                setContracts(prev => [...prev, ...response.data.contracts]);
            }
            
            setPagination({
                page,
                total: response.data.total,
                hasMore: response.data.contracts.length > 0
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const loadMore = useCallback(() => {
        if (pagination.hasMore && !loading) {
            fetchContracts(pagination.page + 1);
        }
    }, [pagination, loading, fetchContracts]);

    useEffect(() => {
        fetchContracts(1);
    }, [fetchContracts]);

    return {
        contracts,
        loading,
        error,
        pagination,
        loadMore,
        refetch: () => fetchContracts(1)
    };
};
```

**Real-time Updates with WebSocket:**
```javascript
// frontend/src/hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url, onMessage) => {
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);

    const connect = useCallback(() => {
        ws.current = new WebSocket(url);
        
        ws.current.onopen = () => {
            console.log('WebSocket connected');
        };
        
        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onMessage(data);
        };
        
        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
            // Reconnect after 5 seconds
            reconnectTimeout.current = setTimeout(connect, 5000);
        };
        
        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }, [url, onMessage]);

    useEffect(() => {
        connect();
        
        return () => {
            if (ws.current) {
                ws.current.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, [connect]);

    const sendMessage = useCallback((message) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        }
    }, []);

    return { sendMessage };
};
```

#### 5.2 Advanced UI Components

**Contract Status Workflow Component:**
```javascript
// frontend/src/components/ContractWorkflow.js
import React from 'react';
import { Box, Stepper, Step, StepLabel, StepContent } from '@mui/material';

const ContractWorkflow = ({ contract, userRole }) => {
    const steps = [
        {
            label: 'Draft Created',
            description: 'Contract draft has been created',
            status: 'completed'
        },
        {
            label: 'TDP Signed',
            description: 'Trusted Data Provider has signed',
            status: contract.status === 'SIGNED_TDP' || contract.status === 'SIGNED_TDC' || contract.status === 'PENDING_CCRP' || contract.status === 'ACTIVE' ? 'completed' : 'pending'
        },
        {
            label: 'TDC Signed',
            description: 'Trusted Data Consumer has signed',
            status: contract.status === 'SIGNED_TDC' || contract.status === 'PENDING_CCRP' || contract.status === 'ACTIVE' ? 'completed' : 'pending'
        },
        {
            label: 'CCRP Approval',
            description: 'Compliance review pending',
            status: contract.status === 'ACTIVE' ? 'completed' : contract.status === 'PENDING_CCRP' ? 'active' : 'pending'
        },
        {
            label: 'Active',
            description: 'Contract is now active',
            status: contract.status === 'ACTIVE' ? 'completed' : 'pending'
        }
    ];

    return (
        <Box sx={{ maxWidth: 400 }}>
            <Stepper orientation="vertical">
                {steps.map((step, index) => (
                    <Step key={step.label} active={step.status === 'active'} completed={step.status === 'completed'}>
                        <StepLabel>{step.label}</StepLabel>
                        <StepContent>
                            <Box sx={{ mb: 2 }}>
                                <div>{step.description}</div>
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
        </Box>
    );
};

export default ContractWorkflow;
```

### Module 6: DevSecOps & CI/CD

#### 6.1 GitHub Actions Pipeline

**Complete CI/CD Pipeline:**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run SAST
        uses: github/codeql-action/init@v2
        with:
          languages: javascript
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
      
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  test:
    needs: security-scan
    runs-on: ubuntu-latest
    services:
      ***REMOVED-DB_PASSWORD***:
        image: ***REMOVED-DB_PASSWORD***:15
        env:
          POSTGRES_PASSWORD: ***REMOVED-DB_PASSWORD***
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run backend tests
        run: |
          cd backend
          npm test -- --coverage --watchAll=false
        env:
          DATABASE_URL: ***REMOVED-DB_PASSWORD***ql://***REMOVED-DB_PASSWORD***:***REMOVED-DB_PASSWORD***@localhost:5432/test_db
      
      - name: Run frontend tests
        run: |
          cd frontend
          npm test -- --coverage --watchAll=false

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build and push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
      
      - name: Deploy to OCI
        working-directory: deployment/oci/terraform
        run: |
          terraform init
          terraform apply -auto-approve \
            -var="image_tag=${{ github.sha }}" \
            -var="environment=production"
```

#### 6.2 Infrastructure as Code

**Terraform Modules:**
```hcl
# deployment/oci/terraform/modules/kubernetes/main.tf
resource "oci_container_engine_cluster" "cms_cluster" {
  compartment_id     = var.compartment_id
  kubernetes_version = "v1.28.2"
  name               = "cms-cluster"
  vcn_id             = var.vcn_id

  options {
    service_lb_subnet_ids = [var.lb_subnet_id]
    kubernetes_network_config {
      pods_cidr     = "10.244.0.0/16"
      services_cidr = "10.96.0.0/16"
    }
  }
}

resource "oci_container_engine_node_pool" "cms_node_pool" {
  cluster_id         = oci_container_engine_cluster.cms_cluster.id
  compartment_id     = var.compartment_id
  kubernetes_version = "v1.28.2"
  name               = "cms-node-pool"
  node_shape         = "VM.Standard.E4.Flex"

  node_config_details {
    placement_configs {
      availability_domain = var.availability_domain
      subnet_id           = var.node_subnet_id
    }
    size = 3
  }

  initial_node_labels {
    key   = "app"
    value = "cms"
  }
}
```

### Module 7: Multi-Cloud Operations

#### 7.1 Cloud-Native Monitoring

**Prometheus Configuration:**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'cms-backend'
    static_configs:
      - targets: ['cms-backend:5001']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'cms-frontend'
    static_configs:
      - targets: ['cms-frontend:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: '***REMOVED-DB_PASSWORD***'
    static_configs:
      - targets: ['***REMOVED-DB_PASSWORD***-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

**Grafana Dashboard:**
```json
{
  "dashboard": {
    "title": "CMS Dashboard",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Active Contracts",
        "type": "stat",
        "targets": [
          {
            "expr": "cms_active_contracts_total"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends"
          }
        ]
      }
    ]
  }
}
```

#### 7.2 Disaster Recovery

**Backup Strategy:**
```javascript
// scripts/backup.js
const { exec } = require('child_process');
const AWS = require('aws-sdk');

class BackupService {
    constructor() {
        this.s3 = new AWS.S3();
        this.backupBucket = process.env.BACKUP_BUCKET;
    }

    async createDatabaseBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `cms-backup-${timestamp}.sql`;
        
        // Create PostgreSQL backup
        const backupCommand = `pg_dump $DATABASE_URL > /tmp/${filename}`;
        
        return new Promise((resolve, reject) => {
            exec(backupCommand, async (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                // Upload to S3
                try {
                    await this.s3.upload({
                        Bucket: this.backupBucket,
                        Key: `database/${filename}`,
                        Body: require('fs').createReadStream(`/tmp/${filename}`)
                    }).promise();
                    
                    resolve(filename);
                } catch (uploadError) {
                    reject(uploadError);
                }
            });
        });
    }

    async restoreDatabase(backupFile) {
        const downloadCommand = `aws s3 cp s3://${this.backupBucket}/database/${backupFile} /tmp/`;
        const restoreCommand = `psql $DATABASE_URL < /tmp/${backupFile}`;
        
        return new Promise((resolve, reject) => {
            exec(`${downloadCommand} && ${restoreCommand}`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve('Database restored successfully');
                }
            });
        });
    }
}
```

### Module 8: Capstone Project

#### 8.1 Production-Ready Implementation

**Complete System Architecture:**
```mermaid
graph TB
    subgraph "Frontend Layer"
        SPA[React SPA]
        CDN[Cloudflare CDN]
    end
    
    subgraph "API Gateway"
        KONG[Kong Gateway]
        RATE[Rate Limiting]
        AUTH[Authentication]
    end
    
    subgraph "Application Layer"
        API[Express API]
        CACHE[Redis Cache]
        QUEUE[Message Queue]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        BACKUP[S3 Backup]
        AUDIT[Audit Logs]
    end
    
    subgraph "Blockchain Layer"
        ETH[Ethereum Network]
        SC[Smart Contracts]
        DID[DID:web Resolver]
    end
    
    subgraph "Monitoring"
        PROM[Prometheus]
        GRAF[Grafana]
        ALERT[Alert Manager]
    end
    
    CDN --> KONG
    KONG --> API
    API --> CACHE
    API --> DB
    API --> ETH
    DB --> BACKUP
    API --> AUDIT
    API --> PROM
    PROM --> GRAF
    GRAF --> ALERT
```

#### 8.2 Performance Optimization

**Database Indexing Strategy:**
```sql
-- Performance indexes for common queries
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_creator ON contracts(creator_id);
CREATE INDEX idx_contracts_created ON contracts(created_at DESC);
CREATE INDEX idx_contracts_dataset ON contracts(dataset_id);

-- Composite indexes for complex queries
CREATE INDEX idx_contracts_status_creator ON contracts(status, creator_id);
CREATE INDEX idx_contracts_dataset_status ON contracts(dataset_id, status);

-- Partial indexes for active contracts
CREATE INDEX idx_contracts_active ON contracts(id) WHERE status = 'ACTIVE';
```

**API Response Optimization:**
```javascript
// backend/middleware/responseOptimizer.js
const responseOptimizer = (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
        // Compress large responses
        if (data && data.length > 1024) {
            res.setHeader('Content-Encoding', 'gzip');
            data = require('zlib').gzipSync(data);
        }
        
        // Add cache headers for GET requests
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', 'public, max-age=300');
        }
        
        return originalSend.call(this, data);
    };
    
    next();
};
```

#### 8.3 Security Hardening

**Advanced Security Middleware:**
```javascript
// backend/middleware/security.js
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const securityMiddleware = (app) => {
    // Security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));
    
    // CORS configuration
    app.use(cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP'
    });
    
    app.use('/api/', limiter);
    
    // Request validation
    app.use((req, res, next) => {
        // Validate content type
        if (req.method === 'POST' || req.method === 'PUT') {
            if (!req.is('application/json')) {
                return res.status(400).json({ error: 'Content-Type must be application/json' });
            }
        }
        
        // Sanitize input
        if (req.body) {
            req.body = sanitizeInput(req.body);
        }
        
        next();
    });
};

const sanitizeInput = (obj) => {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = value.replace(/[<>]/g, '');
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeInput(value);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
};
```

#### 8.4 Deployment Automation

**Kubernetes Deployment:**
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cms-backend
  labels:
    app: cms-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cms-backend
  template:
    metadata:
      labels:
        app: cms-backend
    spec:
      containers:
      - name: cms-backend
        image: ghcr.io/your-org/cms-backend:latest
        ports:
        - containerPort: 5001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cms-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: cms-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 5001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: cms-backend-service
spec:
  selector:
    app: cms-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5001
  type: ClusterIP
```

#### 8.5 Testing Strategy

**End-to-End Testing:**
```javascript
// tests/e2e/contract-workflow.test.js
const { test, expect } = require('@playwright/test');

test.describe('Contract Management Workflow', () => {
    test('Complete contract lifecycle', async ({ page }) => {
        // Login as TDP
        await page.goto('/login');
        await page.fill('[data-testid="email"]', 'tdp@example.com');
        await page.fill('[data-testid="password"]', 'password123');
        await page.click('[data-testid="login-button"]');
        
        // Create contract
        await page.goto('/contracts/create');
        await page.fill('[data-testid="contract-title"]', 'Test Contract');
        await page.fill('[data-testid="contract-description"]', 'Test Description');
        await page.selectOption('[data-testid="dataset-select"]', 'test-dataset');
        await page.click('[data-testid="create-contract"]');
        
        // Verify contract created
        await expect(page.locator('[data-testid="contract-status"]')).toHaveText('DRAFT');
        
        // Sign contract
        await page.click('[data-testid="sign-contract"]');
        await expect(page.locator('[data-testid="contract-status"]')).toHaveText('SIGNED_TDP');
        
        // Switch to TDC user
        await page.goto('/logout');
        await page.goto('/login');
        await page.fill('[data-testid="email"]', 'tdc@example.com');
        await page.fill('[data-testid="password"]', 'password123');
        await page.click('[data-testid="login-button"]');
        
        // Counter-sign contract
        await page.goto('/contracts');
        await page.click('[data-testid="contract-item"]');
        await page.click('[data-testid="sign-contract"]');
        await expect(page.locator('[data-testid="contract-status"]')).toHaveText('SIGNED_TDC');
    });
});
```

---

## Course Completion & Next Steps

Congratulations! You've completed the comprehensive Contract Management System training course. Here's what you've learned and where to go next:

### 🎯 What You've Accomplished

1. **Complete System Understanding** - From business requirements to production deployment
2. **Security-First Architecture** - Defense-in-depth with blockchain integration
3. **Modern Development Practices** - DevSecOps, testing, and monitoring
4. **Multi-Cloud Deployment** - Production-ready infrastructure as code
5. **Real-World Implementation** - Practical, battle-tested patterns

### 🚀 Next Steps

1. **Implement Your Own CMS** - Use this repository as a starting point
2. **Customize for Your Domain** - Adapt the patterns to your specific use case
3. **Contribute Back** - Share improvements and new features
4. **Stay Updated** - Follow blockchain and web3 security best practices

### 📚 Additional Resources

- **Blockchain Security**: [Consensys Security Best Practices](https://consensys.net/blog/developers/smart-contract-security-best-practices/)
- **Web3 Development**: [Ethereum Developer Resources](https://ethereum.org/en/developers/)
- **DevSecOps**: [OWASP DevSecOps Guidelines](https://owasp.org/www-project-devsecops-guideline/)
- **DID Standards**: [W3C DID Specification](https://www.w3.org/TR/did-core/)

---

**Happy Building! 🚀**

*This course represents real-world patterns and practices used in production systems. The code examples, architecture decisions, and security measures are based on actual implementations and industry best practices.*