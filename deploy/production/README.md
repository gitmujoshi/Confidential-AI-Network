# Production Deployment Guide

This directory contains production deployment configurations and scripts for the Contract Management System.

## Overview

The production deployment is designed for high availability, scalability, and security across multiple cloud providers with separate VMs for each service.

## Architecture

### Multi-VM Architecture
- **Load Balancer VM**: Nginx reverse proxy and SSL termination
- **Frontend VM**: React application
- **Backend VM**: Node.js API server and Redis cache
- **Keycloak VM**: Identity and Access Management
- **Database VM**: Main application PostgreSQL database
- **Keycloak DB VM**: Keycloak PostgreSQL database
- **SCITT VM**: SCITT CCF blockchain services
- **SCITT DB VM**: SCITT CCF PostgreSQL database

### Network Configuration
- **Internal Network**: 172.20.0.0/16
- **Service Subnet**: 172.20.1.0/24
- **Load Balancer**: 172.20.1.10
- **Frontend**: 172.20.1.20
- **Backend**: 172.20.1.30
- **Keycloak**: 172.20.1.40
- **Database**: 172.20.1.50
- **Keycloak DB**: 172.20.1.60
- **SCITT**: 172.20.1.70
- **SCITT DB**: 172.20.1.80

## Files

### Core Files
- `docker-compose.prod.yml` - Production Docker Compose configuration
- `deploy-multi-vm.sh` - Multi-VM deployment script
- `architecture.md` - Detailed architecture documentation

### Cloud Provider Scripts
- `../oci/deploy-oci.sh` - Oracle Cloud Infrastructure deployment
- `../azure/deploy-azure.sh` - Microsoft Azure deployment
- `../gcp/deploy-gcp.sh` - Google Cloud Platform deployment

## Quick Start

### Prerequisites
1. Install cloud provider CLI tools
2. Configure authentication
3. Set required environment variables

### Environment Variables

#### AWS
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

#### Azure
```bash
export AZURE_RESOURCE_GROUP=contract-management-rg
export AZURE_LOCATION=eastus
```

#### GCP
```bash
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=us-central1
```

#### OCI
```bash
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..xxxxx
export OCI_REGION=us-ashburn-1
```

### Deployment

#### Single Cloud Provider
```bash
# AWS
./deploy/aws/deploy-aws.sh

# Azure
./deploy/azure/deploy-azure.sh

# GCP
./deploy/gcp/deploy-gcp.sh

# OCI
./deploy/oci/deploy-oci.sh
```

#### Multi-VM Deployment
```bash
# Set cloud provider
export CLOUD_PROVIDER=aws  # or azure, gcp, oci

# Deploy
./deploy/production/deploy-multi-vm.sh
```

## Configuration

### Database Configuration
```bash
# Main Database
DB_HOST=172.20.1.50
DB_PORT=5432
DB_NAME=contract_management
DB_USER=***REMOVED-DB_PASSWORD***
DB_PASSWORD=secure_password

# Keycloak Database
KEYCLOAK_DB_HOST=172.20.1.60
KEYCLOAK_DB_PASSWORD=***REMOVED-KEYCLOAK_DB_PASSWORD***_password

# SCITT Database
SCITT_DB_PASSWORD=scitt_password
```

### Keycloak Configuration
```bash
KEYCLOAK_URL=http://172.20.1.40:8080
KEYCLOAK_REALM=contract-management
KEYCLOAK_CLIENT_ID=contract-management-client
KEYCLOAK_CLIENT_SECRET=client_secret
KEYCLOAK_ADMIN_PASSWORD=secure_admin_password
```

### SCITT CCF Configuration
```bash
SCITT_CCF_ENABLED=true
SCITT_CCF_NODE_URL=http://172.20.1.70:8000
SCITT_CCF_PLATFORM=virtual  # or snp for TEE
```

### SSL Configuration
```bash
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

## Security

### Network Security
- Private networks for internal communication
- Security groups with minimal required access
- SSL/TLS encryption for all external communication

### Application Security
- Strong passwords and secrets
- Regular security updates
- Access controls and authentication
- Audit logging

### Data Security
- Encrypted data at rest
- Encrypted data in transit
- Regular backups
- Access controls

## Monitoring

### Health Checks
- Application health endpoints
- Database connectivity checks
- Service availability monitoring

### Logging
- Centralized log aggregation
- Application logs
- System logs
- Security logs

### Alerting
- Service failure alerts
- Performance degradation alerts
- Security incident alerts

## Backup and Recovery

### Database Backups
- Daily automated backups
- Point-in-time recovery
- Cross-region backup replication

### Configuration Backups
- Infrastructure as Code
- Configuration versioning
- Disaster recovery procedures

## Scaling

### Horizontal Scaling
- Load balancer configuration
- Multiple backend instances
- Database read replicas

### Vertical Scaling
- VM resource scaling
- Database performance tuning
- Caching strategies

## Troubleshooting

### Common Issues
1. **Service not starting**: Check logs and dependencies
2. **Database connection issues**: Verify network and credentials
3. **SSL certificate issues**: Check certificate validity and paths
4. **Performance issues**: Monitor resources and optimize

### Debug Commands
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service]

# Check network connectivity
docker network ls
docker network inspect cms-prod-network

# Check resource usage
docker stats
```

## Maintenance

### Regular Tasks
- Security updates
- Performance monitoring
- Backup verification
- Log rotation
- Certificate renewal

### Updates
- Application updates
- Infrastructure updates
- Security patches
- Feature releases

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs and monitoring
3. Consult the architecture documentation
4. Contact the development team

## License

This deployment configuration is part of the Contract Management System project.
