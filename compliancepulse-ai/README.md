# CompliancePulse AI

**Zero-Trust Governance for Autonomous AI Agents in Enterprise SecOps**

## Open-Core positioning

CompliancePulse AI is the **commercial / enterprise layer** of the G-MASE stack.

| Layer | Path | License / intent |
| --- | --- | --- |
| **Open-GMASE Core** (community) | [`../open-gmase-core`](../open-gmase-core) | Apache 2.0 — SPIFFE/OPA/BAML blueprints, starter agents, local Compose |
| **CompliancePulse AI** (this directory) | `.` | SaaS control plane, multi-tenant UI/API, enterprise integrations roadmap |

**Research seam with CAN:** when Confidential AI Network sets `COMPLIANCEPULSE_INGEST_URL`, Open-GMASE decisions are forwarded to `POST /api/v1/audit/ingest`. That is an ingest stub—not a finished multi-tenant SaaS product.

Start with Open-GMASE for sandboxes and policy packs; use CompliancePulse when you need the product control plane. Details: [`../open-gmase-core/OPEN_CORE.md`](../open-gmase-core/OPEN_CORE.md).

---

## Overview

CompliancePulse AI is an enterprise-grade SaaS platform that secures autonomous AI agent execution through deterministic policy enforcement, cryptographic workload identity, and immutable audit trails. Built for regulated industries requiring SOC 2, ISO 27001, and HIPAA compliance.

## Architecture

### Core Components

#### 1. CompliancePulse AI Platform
The execution-layer security platform that intercepts and governs all AI agent tool invocations:

- **Cryptographic Workload Identity (SPIFFE/SPIRE)**: Short-lived X.509 SVID certificates with automatic rotation
- **Policy-as-Code Enforcement (OPA/Rego)**: Deterministic policy evaluation independent of LLM prompts
- **Type-Safety Schema Parsing (BAML)**: Strongly typed schemas preventing injection attacks
- **Context Compression**: Local telemetry hashing to minimize context window costs
- **Immutable Audit Trails**: Cryptographically verifiable execution logs

#### 2. G-MASE (Governed Multi-Agent SecOps Environment)
Autonomous security operations framework with specialized digital workers:

- **Orchestrator Agent**: Swarm coordination and Human-in-the-Loop dispatch
- **Triage Agent**: SIEM/XDR feed interrogation and telemetry compression
- **Forensic Agent**: Code, network, and system log inspection
- **Remediation Agent**: Automated fix generation with Git PR workflows

## Key Features

### Security & Compliance
- ✅ Zero-trust architecture with continuous verification
- ✅ Cryptographic non-human identity management
- ✅ Deterministic policy enforcement (no prompt injection bypass)
- ✅ Immutable audit trails for regulatory compliance
- ✅ SOC 2, ISO 27001, HIPAA-ready logging

### AI Agent Governance
- ✅ Real-time tool invocation interception
- ✅ Financial rate limits and circuit breakers
- ✅ Confidence threshold enforcement
- ✅ Anti-loop detection
- ✅ Schema-validated outputs (no string injection)

### Enterprise Integration
- ✅ Compatible with LangChain, AutoGen, LlamaIndex
- ✅ Model Context Protocol (MCP) support
- ✅ SIEM/XDR integration (Splunk, Sentinel, Chronicle)
- ✅ Git-based remediation workflows
- ✅ Human-in-the-Loop (HITL) escalation

## Technology Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ with Row-Level Security
- **Identity**: SPIFFE/SPIRE (X.509 SVID)
- **Policy Engine**: Open Policy Agent (OPA/Rego)
- **Schema Parsing**: BAML (Boundary-Aware Model Language)
- **Agent Protocol**: Model Context Protocol (MCP)

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context + React Query
- **Visualization**: Recharts for audit dashboards

### Infrastructure
- **Cloud**: GCP (Cloud Run, BigQuery, Cloud SQL)
- **Orchestration**: Docker Compose (dev), Kubernetes (prod)
- **Secrets**: Cloud KMS with Customer-Managed Encryption Keys
- **Monitoring**: Cloud Logging + BigQuery analytics

## Quick Start

### Prerequisites
```bash
node >= 20.0.0
docker >= 24.0.0
docker-compose >= 2.20.0
postgresql >= 15.0
```

### Local Development Setup

1. **Clone and install dependencies**
```bash
cd compliancepulse-ai
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start infrastructure services**
```bash
docker-compose up -d postgres spire-server opa-server
```

4. **Initialize database**
```bash
npm run db:migrate
npm run db:seed
```

5. **Start backend and agents**
```bash
npm run start:backend
npm run start:agents
```

6. **Start frontend**
```bash
npm run start:frontend
```

Access the platform at `http://localhost:3000`

## Project Structure

```
compliancepulse-ai/
├── backend/                  # Core platform backend
│   ├── src/
│   │   ├── api/             # REST API endpoints
│   │   ├── spiffe/          # SPIFFE/SPIRE integration
│   │   ├── opa/             # OPA policy engine
│   │   ├── baml/            # BAML schema parsing
│   │   ├── audit/           # Audit trail management
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   └── middleware/      # Express middleware
│   └── tests/               # Unit and integration tests
├── agents/                   # G-MASE agents
│   ├── orchestrator/        # Swarm coordination
│   ├── triage/              # SIEM/XDR processing
│   ├── forensic/            # Investigation tasks
│   ├── remediation/         # Automated fixes
│   └── shared/              # Common utilities
├── frontend/                 # React web application
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Page components
│       ├── services/        # API clients
│       └── hooks/           # Custom React hooks
├── infrastructure/           # Deployment configs
│   ├── docker/              # Docker configs
│   ├── k8s/                 # Kubernetes manifests
│   └── terraform/           # Infrastructure as Code
└── docs/                     # Documentation
    ├── architecture/        # Architecture diagrams
    ├── api/                 # API documentation
    └── guides/              # User guides
```

## API Documentation

API documentation is available at `http://localhost:3001/api/docs` when running locally.

### Key Endpoints

- `POST /api/v1/agents/register` - Register a new AI agent
- `POST /api/v1/policy/evaluate` - Evaluate tool invocation against policies
- `POST /api/v1/identity/issue` - Issue SPIFFE SVID
- `GET /api/v1/audit/trail` - Query audit logs
- `POST /api/v1/swarm/investigate` - Trigger G-MASE investigation

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/compliancepulse

# SPIFFE/SPIRE
SPIRE_SERVER_ADDRESS=unix:///tmp/spire-server/socket
SPIRE_TRUST_DOMAIN=compliancepulse.ai

# OPA Policy Server
OPA_SERVER_URL=http://localhost:8181

# Authentication
JWT_SECRET=CHANGE_ME_IN_PRODUCTION
JWT_EXPIRY=1h

# Monitoring
GCP_PROJECT_ID=your-project
BIGQUERY_DATASET=audit_logs
```

### Policy Configuration

Policies are defined in Rego and stored in `backend/src/opa/policies/`. Example:

```rego
package compliancepulse.tools

# Deny database drops in production
deny[msg] {
    input.tool_name == "execute_sql"
    contains(input.parameters.query, "DROP TABLE")
    input.environment == "production"
    msg := "DROP TABLE operations not allowed in production"
}

# Rate limit expensive operations
deny[msg] {
    input.tool_name == "llm_inference"
    input.cost_estimate_usd > 100
    msg := "Operation exceeds cost threshold of $100"
}
```

## Security Considerations

### Threat Model
- ✅ Prompt injection attacks → Mitigated by OPA policy layer
- ✅ Model hallucinations → Type-safe schema validation
- ✅ Credential compromise → Short-lived SVIDs with rotation
- ✅ Unauthorized tool execution → Cryptographic workload identity
- ✅ Audit trail tampering → Immutable append-only logs

### Compliance Features
- **SOC 2 Type II**: Immutable audit trails with cryptographic integrity
- **ISO 27001**: Access control and identity management
- **HIPAA**: Encryption at rest and in transit, audit logging
- **GDPR**: Data retention policies and right to deletion

## Testing

```bash
# Run all tests
npm test

# Backend unit tests
npm run test:backend

# Agent integration tests
npm run test:agents

# Frontend tests
npm run test:frontend

# E2E tests
npm run test:e2e
```

## Deployment

### Docker Compose (Development)
```bash
docker-compose up -d
```

### Kubernetes (Production)
```bash
kubectl apply -f infrastructure/k8s/
```

### Terraform (GCP Infrastructure)
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [docs/](docs/)
- Issues: GitHub Issues
- Email: support@compliancepulse.ai

## Acknowledgments

This platform integrates open-source standards and frameworks:
- SPIFFE/SPIRE (CNCF) - Apache 2.0
- Open Policy Agent (CNCF) - Apache 2.0
- BAML (Boundary) - Apache 2.0
- Model Context Protocol (Anthropic) - MIT

---

*Built for enterprises that need AI automation with zero compromise on security and compliance.*
