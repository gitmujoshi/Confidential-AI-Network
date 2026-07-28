# Setup and Deployment Guide

## Overview

This comprehensive guide provides step-by-step instructions for setting up and deploying the Contract Management System. The guide covers local development setup, production deployment, configuration management, and operational procedures.

## Prerequisites

### System Requirements

Before setting up the Contract Management System, ensure your system meets the following requirements:

**Hardware Requirements:**
- Minimum 8GB RAM for development, 16GB+ for production
- At least 50GB available disk space
- Multi-core processor (4+ cores recommended)
- Stable internet connection for package downloads and blockchain access

**Software Requirements:**
- Node.js version 18 or higher
- PostgreSQL version 13 or higher
- Docker and Docker Compose
- Git for version control
- Modern web browser for frontend access

**Operating System Support:**
- Linux (Ubuntu 20.04+ recommended)
- macOS (10.15+)
- Windows 10/11 with WSL2

### Development Tools

Essential development tools for working with the system:

**Code Editor**: Visual Studio Code with recommended extensions for JavaScript, React, and Solidity development.

**Database Management**: pgAdmin or DBeaver for PostgreSQL database management and administration.

**API Testing**: Postman or Insomnia for testing REST APIs and authentication flows.

**Blockchain Tools**: MetaMask browser extension for Ethereum wallet management and transaction signing.

**Version Control**: Git with proper configuration for secure repository access and collaboration.

## 🌍 Multi-Deployment Configuration

### Overview

The Contract Management System supports multi-deployment global uniqueness across different countries and jurisdictions. This enables cross-border operations while maintaining regulatory compliance and data residency requirements.

### Supported Deployments

| Deployment | Region | Country | Jurisdiction | Compliance | Data Residency |
|------------|--------|---------|--------------|------------|----------------|
| **LOCAL** | `local` | `Unknown` | `LOCAL` | None | Local |
| **US-EAST** | `us-east-1` | `United States` | `US-Federal` | GDPR, CCPA, HIPAA, SOX, FedRAMP | US |
| **US-WEST** | `us-west-2` | `United States` | `US-Federal` | GDPR, CCPA, HIPAA, SOX, FedRAMP | US |
| **EU-WEST** | `eu-west-1` | `Germany` | `EU-GDPR` | GDPR, ISO-27001 | EU |
| **EU-NORTH** | `eu-north-1` | `Sweden` | `EU-GDPR` | GDPR, ISO-27001 | EU |
| **AP-SOUTH** | `ap-southeast-1` | `Singapore` | `AP-Singapore` | PDPA, ISO-27001 | Singapore |
| **CA-CENTRAL** | `ca-central-1` | `Canada` | `CA-Federal` | PIPEDA, ISO-27001 | Canada |
| **AU-SOUTH** | `ap-southeast-2` | `Australia` | `AU-Federal` | APP, ISO-27001 | Australia |

### Global DEPA ID System

The system implements a global DEPA ID system (DEPA-aligned entity IDs inspired by India’s iSPIRT Data Empowerment and Protection Architecture) for ensuring uniqueness across all deployments:

```
[DEPLOYMENT_PREFIX]-[ENTITY_TYPE]-[GUID]
Examples:
- US-EAST-TDC-8f4e2a1b-3c4d-5e6f-7a8b-9c0d1e2f3a4b
- EU-WEST-TDP-9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d
- AP-SOUTH-CCRP-1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e
```

### Deployment Configuration

#### Environment Variables

Configure deployment-specific settings using environment variables:

**Backend Configuration** (`backend/config.env`):
```env
# Multi-Deployment Configuration
DEPLOYMENT_ID=LOCAL                    # Current deployment ID
DEPLOYMENT_PREFIX=LOCAL                # Deployment prefix for DEPA IDs
DEPLOYMENT_REGION=local                # Geographic region
DEPLOYMENT_COUNTRY=Unknown             # Country
DEPLOYMENT_JURISDICTION=LOCAL          # Jurisdiction code
DEPLOYMENT_DATA_RESIDENCY=LOCAL        # Data residency requirements
DEPLOYMENT_REGULATORY_FRAMEWORK=       # Comma-separated regulatory frameworks
DEPLOYMENT_TIMEZONE=UTC                # Timezone
DEPLOYMENT_CURRENCY=USD                # Currency
DEPLOYMENT_LANGUAGE=en-US              # Language
```

**Frontend Configuration** (`.env`):
```env
# Multi-Deployment Configuration
REACT_APP_DEPLOYMENT_ID=LOCAL          # Same as backend
REACT_APP_DEPLOYMENT_PREFIX=LOCAL      # Same as backend
REACT_APP_DEPLOYMENT_REGION=local      # Same as backend
REACT_APP_DEPLOYMENT_COUNTRY=Unknown   # Same as backend
REACT_APP_DEPLOYMENT_JURISDICTION=LOCAL # Same as backend
REACT_APP_DEPLOYMENT_DATA_RESIDENCY=LOCAL # Same as backend
REACT_APP_DEPLOYMENT_REGULATORY_FRAMEWORK= # Same as backend
REACT_APP_DEPLOYMENT_TIMEZONE=UTC      # Same as backend
REACT_APP_DEPLOYMENT_CURRENCY=USD      # Same as backend
REACT_APP_DEPLOYMENT_LANGUAGE=en-US    # Same as backend
```

#### Example Configurations

**US East Coast Deployment**:
```env
# Backend
DEPLOYMENT_ID=US-EAST
DEPLOYMENT_PREFIX=US-EAST
DEPLOYMENT_REGION=us-east-1
DEPLOYMENT_COUNTRY=United States
DEPLOYMENT_JURISDICTION=US-Federal
DEPLOYMENT_DATA_RESIDENCY=US
DEPLOYMENT_REGULATORY_FRAMEWORK=GDPR,CCPA,HIPAA,SOX,FedRAMP
DEPLOYMENT_TIMEZONE=America/New_York
DEPLOYMENT_CURRENCY=USD
DEPLOYMENT_LANGUAGE=en-US

# Frontend
REACT_APP_DEPLOYMENT_ID=US-EAST
REACT_APP_DEPLOYMENT_PREFIX=US-EAST
REACT_APP_DEPLOYMENT_REGION=us-east-1
REACT_APP_DEPLOYMENT_COUNTRY=United States
REACT_APP_DEPLOYMENT_JURISDICTION=US-Federal
REACT_APP_DEPLOYMENT_DATA_RESIDENCY=US
REACT_APP_DEPLOYMENT_REGULATORY_FRAMEWORK=GDPR,CCPA,HIPAA,SOX,FedRAMP
REACT_APP_DEPLOYMENT_TIMEZONE=America/New_York
REACT_APP_DEPLOYMENT_CURRENCY=USD
REACT_APP_DEPLOYMENT_LANGUAGE=en-US
```

**EU GDPR Deployment**:
```env
# Backend
DEPLOYMENT_ID=EU-WEST
DEPLOYMENT_PREFIX=EU-WEST
DEPLOYMENT_REGION=eu-west-1
DEPLOYMENT_COUNTRY=Germany
DEPLOYMENT_JURISDICTION=EU-GDPR
DEPLOYMENT_DATA_RESIDENCY=EU
DEPLOYMENT_REGULATORY_FRAMEWORK=GDPR,ISO-27001
DEPLOYMENT_TIMEZONE=Europe/Berlin
DEPLOYMENT_CURRENCY=EUR
DEPLOYMENT_LANGUAGE=de-DE

# Frontend
REACT_APP_DEPLOYMENT_ID=EU-WEST
REACT_APP_DEPLOYMENT_PREFIX=EU-WEST
REACT_APP_DEPLOYMENT_REGION=eu-west-1
REACT_APP_DEPLOYMENT_COUNTRY=Germany
REACT_APP_DEPLOYMENT_JURISDICTION=EU-GDPR
REACT_APP_DEPLOYMENT_DATA_RESIDENCY=EU
REACT_APP_DEPLOYMENT_REGULATORY_FRAMEWORK=GDPR,ISO-27001
REACT_APP_DEPLOYMENT_TIMEZONE=Europe/Berlin
REACT_APP_DEPLOYMENT_CURRENCY=EUR
REACT_APP_DEPLOYMENT_LANGUAGE=de-DE
```

### Deployment Management

#### Global Deployment Management UI

Access the Global Deployment Management interface at:
```
http://localhost:3000/admin/global-deployment
```

**Features**:
- View current deployment status
- Register new deployments
- Generate global DEPA IDs
- Verify global uniqueness
- Test jurisdiction compliance
- Manage deployment registry

#### API Endpoints

**Global Deployment Management**:
- `GET /api/global-deployment/status` - Get current deployment status
- `POST /api/global-deployment/register` - Register new deployment (admin)
- `POST /api/global-deployment/generate` - Generate global DEPA ID
- `POST /api/global-deployment/verify` - Verify global uniqueness
- `GET /api/global-deployment/jurisdictions` - Get available jurisdictions
- `POST /api/global-deployment/convert` - Convert standard to global DEPA ID
- `GET /api/global-deployment/test` - Test generation (admin)
- `GET /api/global-deployment/deployments` - Get all deployments (admin)

#### Runtime Deployment Registration

Register new deployments at runtime using the API:

```bash
# Register US East deployment
curl -X POST http://localhost:5001/api/global-deployment/register \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deploymentId": "US-EAST",
    "prefix": "US-EAST",
    "region": "us-east-1",
    "country": "United States",
    "jurisdiction": "US-Federal",
    "dataResidency": "US",
    "regulatoryFramework": ["GDPR", "CCPA", "HIPAA"],
    "timezone": "America/New_York",
    "currency": "USD",
    "language": "en-US"
  }'

# Register EU West deployment
curl -X POST http://localhost:5001/api/global-deployment/register \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deploymentId": "EU-WEST",
    "prefix": "EU-WEST",
    "region": "eu-west-1",
    "country": "Germany",
    "jurisdiction": "EU-GDPR",
    "dataResidency": "EU",
    "regulatoryFramework": ["GDPR", "ISO-27001"],
    "timezone": "Europe/Berlin",
    "currency": "EUR",
    "language": "de-DE"
  }'
```

### Jurisdiction Compliance

Each jurisdiction has specific compliance requirements:

#### US Federal Compliance
- **Data Residency**: Data must be stored in United States
- **Encryption Standards**: AES-256, FIPS-140-2
- **Audit Requirements**: SOX, FedRAMP
- **Privacy Laws**: CCPA, HIPAA

#### EU GDPR Compliance
- **Data Residency**: Data must be stored in European Union
- **Encryption Standards**: AES-256, GDPR-Article-32
- **Audit Requirements**: GDPR, ISO-27001
- **Privacy Laws**: GDPR

#### AP Singapore Compliance
- **Data Residency**: Data must be stored in Singapore
- **Encryption Standards**: AES-256, MAS-TRM
- **Audit Requirements**: PDPA, ISO-27001
- **Privacy Laws**: PDPA

#### CA Federal Compliance
- **Data Residency**: Data must be stored in Canada
- **Encryption Standards**: AES-256, FIPS-140-2
- **Audit Requirements**: PIPEDA, ISO-27001
- **Privacy Laws**: PIPEDA

#### AU Federal Compliance
- **Data Residency**: Data must be stored in Australia
- **Encryption Standards**: AES-256, ISO-27001
- **Audit Requirements**: APP, ISO-27001
- **Privacy Laws**: Australian Privacy Principles

### Cross-Border Operations

The system supports cross-border operations through:

#### Global DEPA ID Registry
- Centralized registry of all deployments
- Global uniqueness verification
- Cross-deployment entity references
- Compliance validation

#### Cross-Border Contracts
- Contracts can reference entities across deployments
- Global DEPA IDs ensure uniqueness
- Jurisdiction-specific compliance validation
- Data transfer agreement support

#### Security and Compliance
- Secure communication between deployments
- Jurisdiction-specific security requirements
- Audit trail across all deployments
- Regulatory compliance monitoring

## Local Development Setup

### Environment Preparation

Setting up the local development environment involves several steps to ensure proper system configuration:

**Repository Cloning**: Clone the Contract Management System repository from the Git repository with proper authentication and access permissions.

**Environment Configuration**: Set up environment variables and configuration files for local development with appropriate settings for database, blockchain, and external services.

**Dependency Installation**: Install all required dependencies for backend, frontend, and blockchain components using package managers and proper version management.

**Database Setup**: Configure and initialize the PostgreSQL database with proper schema, indexes, and initial data for development and testing.

### Backend Setup

The backend setup process involves configuring the Node.js/Express application with all necessary services:

**Application Configuration**: Configure the backend application with appropriate settings for development, including database connections, authentication providers, and external service integrations.

**Database Initialization**: Set up the database schema with all required tables, relationships, and constraints for user management, contract management, and audit logging.

**Service Configuration**: Configure all backend services including authentication, notification, blockchain integration, and DID management with proper settings and credentials.

**Development Server**: Start the development server with hot reloading and debugging capabilities for efficient development workflow.

### Frontend Setup

Setting up the React frontend application for development:

**Application Configuration**: Configure the React application with appropriate settings for development, including API endpoints, authentication providers, and external service integrations.

**Dependency Management**: Install and configure all frontend dependencies including React, routing, state management, and UI component libraries.

**Development Server**: Start the development server with hot reloading and debugging capabilities for efficient frontend development.

**Build Configuration**: Configure build processes and optimization settings for development and production environments.

### Blockchain Setup

Configuring the blockchain environment for smart contract development and testing:

**Hardhat Configuration**: Set up Hardhat development environment with proper network configuration, compiler settings, and deployment scripts.

**Smart Contract Compilation**: Compile all smart contracts with proper optimization settings and generate artifacts for deployment and testing.

**Local Network Setup**: Configure and start local blockchain network for development and testing with proper accounts and initial balance.

**Contract Deployment**: Deploy smart contracts to local network with proper configuration and verification for development testing.

### Keycloak IAM Setup

Setting up Keycloak for identity and access management:

**Keycloak Installation**: Install and configure Keycloak with appropriate database and security settings for development environment.

**Realm Configuration**: Create and configure Keycloak realm with proper settings for user management, authentication, and authorization.

**Client Configuration**: Configure Keycloak clients for frontend and backend applications with proper redirect URIs and security settings.

**User Management**: Set up initial users and roles for development and testing with appropriate permissions and access controls.

## Production Deployment

### Infrastructure Planning

Planning the production infrastructure for optimal performance and reliability:

**Resource Requirements**: Determine appropriate resource allocation for production deployment including CPU, memory, storage, and network bandwidth.

**Scalability Planning**: Plan for system scalability with load balancing, horizontal scaling, and performance optimization strategies.

**Security Planning**: Implement comprehensive security measures including network security, access controls, and data protection.

**Monitoring Planning**: Set up comprehensive monitoring and alerting systems for production environment health and performance tracking.

### Containerization

Containerizing the application for consistent deployment across different environments:

**Docker Configuration**: Create Docker configurations for all system components including backend, frontend, database, and supporting services.

**Multi-Stage Builds**: Implement multi-stage Docker builds for optimization and security with proper layer caching and minimal image sizes.

**Environment Configuration**: Configure environment-specific settings for different deployment stages including development, staging, and production.

**Security Hardening**: Implement security best practices in Docker configurations including non-root users, minimal base images, and security scanning.

### Kubernetes Deployment

Deploying the system on Kubernetes for production-grade orchestration and management:

**Cluster Configuration**: Configure Kubernetes cluster with appropriate resources, networking, and security policies for production deployment.

**Application Deployment**: Deploy all system components using Kubernetes manifests with proper resource allocation and scaling policies.

**Service Configuration**: Configure Kubernetes services for load balancing, service discovery, and external access with proper security measures.

**Storage Configuration**: Set up persistent storage for database and file storage with appropriate backup and recovery procedures.

### Database Deployment

Setting up production database with high availability and performance:

**Database Configuration**: Configure PostgreSQL database with production-grade settings including connection pooling, query optimization, and security hardening.

**High Availability Setup**: Implement database high availability with replication, failover, and backup procedures for data protection and system reliability.

**Performance Optimization**: Optimize database performance with proper indexing, query optimization, and resource allocation for production workloads.

**Backup and Recovery**: Implement comprehensive backup and recovery procedures with automated scheduling and testing for data protection.

### Monitoring and Logging

Setting up comprehensive monitoring and logging for production operations:

**Application Monitoring**: Implement application performance monitoring with metrics collection, alerting, and visualization for system health tracking.

**Infrastructure Monitoring**: Set up infrastructure monitoring for servers, containers, and network components with proper alerting and notification.

**Log Management**: Implement centralized log management with log aggregation, search, and analysis capabilities for troubleshooting and compliance.

**Alerting Configuration**: Configure alerting and notification systems for critical events and performance issues with appropriate escalation procedures.

## Configuration Management

### Environment Configuration

Managing configuration across different environments and deployment stages:

**Configuration Hierarchy**: Implement configuration hierarchy with environment-specific settings, defaults, and overrides for flexible deployment management.

**Secret Management**: Implement secure secret management for sensitive configuration including API keys, database credentials, and cryptographic keys.

**Configuration Validation**: Implement configuration validation to ensure proper settings and prevent deployment issues due to configuration errors.

**Configuration Documentation**: Maintain comprehensive documentation of all configuration options and their impact on system behavior.

### Security Configuration

Configuring security settings for production deployment:

**Authentication Configuration**: Configure authentication settings including multi-factor authentication, session management, and password policies.

**Authorization Configuration**: Set up authorization policies and role-based access controls with proper permission management and audit logging.

**Network Security**: Configure network security including firewall rules, SSL/TLS certificates, and secure communication protocols.

**Data Protection**: Implement data protection measures including encryption, access controls, and privacy compliance settings.

### Performance Configuration

Optimizing system performance through configuration management:

**Database Configuration**: Optimize database configuration for performance including connection pooling, query optimization, and resource allocation.

**Application Configuration**: Configure application settings for optimal performance including caching, session management, and resource utilization.

**Network Configuration**: Optimize network configuration for performance including load balancing, CDN integration, and bandwidth management.

**Monitoring Configuration**: Configure monitoring and alerting thresholds for performance tracking and optimization.

## Operational Procedures

### Deployment Procedures

Standardized procedures for deploying system updates and new releases:

**Pre-Deployment Checklist**: Comprehensive checklist for pre-deployment activities including testing, validation, and approval procedures.

**Deployment Process**: Step-by-step deployment process with rollback procedures and monitoring for successful deployment completion.

**Post-Deployment Validation**: Validation procedures to ensure successful deployment including health checks, functionality testing, and performance monitoring.

**Rollback Procedures**: Procedures for rolling back deployments in case of issues or failures with minimal service disruption.

### Backup and Recovery

Comprehensive backup and recovery procedures for data protection:

**Backup Procedures**: Automated backup procedures for database, configuration, and application data with proper scheduling and retention policies.

**Recovery Procedures**: Step-by-step recovery procedures for different types of failures including database corruption, system failures, and data loss scenarios.

**Testing Procedures**: Regular testing of backup and recovery procedures to ensure effectiveness and reliability of data protection measures.

**Documentation**: Comprehensive documentation of backup and recovery procedures for operational reference and training.

### Monitoring and Alerting

Setting up monitoring and alerting for operational visibility:

**System Monitoring**: Comprehensive system monitoring including application performance, infrastructure health, and business metrics tracking.

**Alert Configuration**: Configure alerts for critical events and performance thresholds with appropriate notification and escalation procedures.

**Dashboard Configuration**: Set up operational dashboards for real-time visibility into system health, performance, and business metrics.

**Incident Response**: Define incident response procedures for different types of issues with proper escalation and resolution workflows.

### Maintenance Procedures

Regular maintenance procedures for system health and performance:

**Scheduled Maintenance**: Regular maintenance activities including updates, patches, and configuration changes with minimal service disruption.

**Performance Optimization**: Ongoing performance optimization activities including database tuning, application optimization, and resource management.

**Security Updates**: Regular security updates and patches to address vulnerabilities and maintain security posture.

**Capacity Planning**: Ongoing capacity planning and resource management to ensure system scalability and performance.

## Troubleshooting Guide

### Common Issues

Troubleshooting common deployment and operational issues:

**Deployment Failures**: Common causes and solutions for deployment failures including configuration errors, resource constraints, and network issues.

**Performance Issues**: Identifying and resolving performance problems including database bottlenecks, application issues, and infrastructure constraints.

**Security Issues**: Troubleshooting security-related problems including authentication failures, authorization issues, and data protection concerns.

**Integration Issues**: Common issues with system integration including API failures, service communication problems, and external service dependencies.

### Diagnostic Procedures

Procedures for diagnosing and resolving system issues:

**Log Analysis**: Procedures for analyzing system logs to identify root causes of issues and performance problems.

**Performance Analysis**: Tools and procedures for analyzing system performance including profiling, monitoring, and optimization techniques.

**Network Diagnostics**: Procedures for diagnosing network-related issues including connectivity, latency, and bandwidth problems.

**Database Diagnostics**: Procedures for diagnosing database issues including query performance, connection problems, and data integrity issues.

### Recovery Procedures

Procedures for recovering from various types of failures:

**System Recovery**: Procedures for recovering from system failures including server crashes, service failures, and infrastructure issues.

**Data Recovery**: Procedures for recovering from data loss including database corruption, backup failures, and accidental deletions.

**Service Recovery**: Procedures for recovering individual services and components with minimal impact on overall system availability.

**Disaster Recovery**: Comprehensive disaster recovery procedures for major failures and catastrophic events.

## Summary

The Setup and Deployment Guide provides comprehensive instructions for setting up and deploying the Contract Management System in various environments. The guide covers all aspects of deployment including local development, production deployment, configuration management, and operational procedures.

The guide emphasizes best practices for security, performance, and reliability while providing practical procedures for day-to-day operations. The comprehensive troubleshooting and recovery procedures ensure successful deployment and ongoing system operation.

The guide is designed to be practical and actionable, providing clear instructions and procedures for successful system deployment and operation in enterprise environments. 