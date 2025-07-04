# Contract Management System - OCI Terraform Deployment

This directory contains the Terraform configuration for deploying the Contract Management System to Oracle Cloud Infrastructure (OCI).

## 🏗️ Architecture Overview

The deployment creates a complete infrastructure including:

- **VCN (Virtual Cloud Network)** with public and private subnets
- **OKE (Oracle Container Engine for Kubernetes)** cluster
- **Autonomous Database** for application data
- **Load Balancer** for traffic distribution
- **Container Registry** for Docker images
- **Kubernetes Resources** for application deployment

## 📋 Prerequisites

### Required Tools
- [Terraform](https://www.terraform.io/downloads.html) (>= 1.0)
- [OCI CLI](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Docker](https://docs.docker.com/get-docker/)

### OCI Requirements
- OCI Tenancy with appropriate permissions
- Compartment for resource organization
- API key configured for authentication
- Sufficient quota for resources

## 🚀 Quick Start

### 1. Configure OCI Authentication

```bash
# Install OCI CLI
curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh > install.sh
chmod +x install.sh
./install.sh

# Configure OCI CLI
oci setup config
```

### 2. Generate API Key

```bash
# Generate private key
openssl genrsa -out ~/.oci/oci_api_key.pem 2048

# Generate public key
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem

# Get fingerprint
openssl rsa -pubout -outform DER -in ~/.oci/oci_api_key.pem | openssl dgst -sha256 -hex
```

### 3. Configure Variables

```bash
# Copy example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit configuration with your values
nano terraform.tfvars
```

### 4. Deploy Infrastructure

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## 📁 File Structure

```
terraform/
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output values
├── terraform.tfvars.example   # Example variable values
├── deploy.sh                  # Deployment script
├── README.md                  # This file
└── modules/                   # Terraform modules
    ├── networking/            # VCN and networking resources
    ├── oke/                   # Kubernetes cluster
    ├── database/              # Autonomous database
    ├── load_balancer/         # Load balancer configuration
    ├── container_registry/    # Container registry
    └── kubernetes_resources/  # Application deployment
```

## 🔧 Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `tenancy_ocid` | OCI Tenancy OCID | `ocid1.tenancy.oc1..example` |
| `user_ocid` | User OCID | `ocid1.user.oc1..example` |
| `fingerprint` | API key fingerprint | `xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx` |
| `private_key_path` | Path to private key | `~/.oci/oci_api_key.pem` |
| `compartment_id` | Compartment OCID | `ocid1.compartment.oc1..example` |
| `db_password` | Database password | `your-secure-password` |
| `keycloak_admin_password` | Keycloak admin password | `your-secure-password` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `region` | `us-ashburn-1` | OCI region |
| `vcn_cidr` | `10.0.0.0/16` | VCN CIDR block |
| `node_pool_size` | `3` | Number of OKE nodes |
| `node_shape` | `VM.Standard.E4.Flex` | Compute instance shape |
| `db_size` | `1` | Database size in TB |
| `app_domain` | `contract-management.example.com` | Application domain |

## 🏗️ Infrastructure Components

### Networking
- **VCN**: Virtual Cloud Network with CIDR `10.0.0.0/16`
- **Public Subnets**: For load balancer (2 subnets across ADs)
- **Private Subnet**: For OKE nodes and database
- **Internet Gateway**: For public internet access
- **NAT Gateway**: For private subnet internet access
- **Service Gateway**: For OCI service access

### OKE Cluster
- **Kubernetes Version**: v1.28.2
- **Node Pool**: 3 nodes with VM.Standard.E4.Flex shape
- **Network Policy**: Calico
- **Pod CIDR**: `10.244.0.0/16`
- **Service CIDR**: `10.96.0.0/16`

### Database
- **Type**: Autonomous Database (OLTP)
- **CPU**: 1 OCPU
- **Storage**: 1 TB
- **Workload**: OLTP
- **License**: Included

### Load Balancer
- **Shape**: Flexible (10-100 Mbps)
- **Backend Sets**: Frontend, Backend API, Keycloak
- **Health Checks**: HTTP-based with 10s intervals

### Container Registry
- **Repository**: Private repository
- **Immutable Tags**: Disabled
- **Public Access**: Disabled

## 🚀 Application Deployment

### Kubernetes Resources
- **Namespace**: `contract-management`
- **ConfigMaps**: Application configuration
- **Secrets**: Database and Keycloak credentials
- **Persistent Volumes**: For Keycloak DB and Redis
- **Deployments**: Backend, Frontend, Keycloak, Redis
- **Services**: LoadBalancer type for external access

### Application Components
1. **Keycloak Database**: PostgreSQL 15 with persistent storage
2. **Keycloak**: Identity and Access Management
3. **Redis**: Session management and caching
4. **Backend API**: Node.js/Express application
5. **Frontend**: React application served by Nginx

## 🔒 Security Features

### Network Security
- Private subnets for sensitive resources
- Security lists with minimal required access
- NAT gateway for controlled internet access

### Application Security
- Non-root containers
- Health checks for all services
- Secrets management for sensitive data
- Security headers in frontend

### Database Security
- Autonomous Database with automatic security updates
- Private subnet placement
- Encrypted storage and connections

## 📊 Monitoring and Logging

### Health Checks
- Load balancer health checks for all services
- Kubernetes liveness and readiness probes
- Application-level health endpoints

### Logging
- Nginx access and error logs
- Application logs via Kubernetes
- Database audit logs (Autonomous Database)

## 🔄 Deployment Process

1. **Infrastructure Provisioning**
   - VCN and networking resources
   - OKE cluster and node pool
   - Database and load balancer
   - Container registry

2. **Application Deployment**
   - Build and push Docker images
   - Deploy Kubernetes resources
   - Configure services and ingress

3. **Post-Deployment**
   - Configure DNS
   - Set up Keycloak realm
   - Test application endpoints

## 🛠️ Management Commands

### Terraform Commands
```bash
# Initialize
terraform init

# Plan deployment
terraform plan

# Apply changes
terraform apply

# Destroy infrastructure
terraform destroy

# Show outputs
terraform output
```

### Kubernetes Commands
```bash
# Get cluster info
kubectl cluster-info

# List namespaces
kubectl get namespaces

# List pods
kubectl get pods -n contract-management

# View logs
kubectl logs -f deployment/backend -n contract-management

# Port forward
kubectl port-forward service/frontend-service 3000:3000 -n contract-management
```

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify API key and fingerprint
   - Check private key permissions
   - Ensure user has required permissions

2. **Network Issues**
   - Verify VCN CIDR doesn't conflict
   - Check security list rules
   - Ensure subnets are in correct ADs

3. **Database Connection Issues**
   - Verify database is running
   - Check connection string format
   - Ensure network access is configured

4. **Kubernetes Issues**
   - Check node pool status
   - Verify pod scheduling
   - Review resource limits

### Debug Commands
```bash
# Check Terraform state
terraform show

# Validate configuration
terraform validate

# Check OCI resources
oci compute instance list --compartment-id $COMPARTMENT_ID

# Check Kubernetes resources
kubectl get all -n contract-management
kubectl describe pod <pod-name> -n contract-management
```

## 📈 Scaling

### Horizontal Scaling
- Increase `node_pool_size` for more compute resources
- Adjust deployment replicas in Kubernetes
- Scale load balancer bandwidth

### Vertical Scaling
- Change `node_shape` for larger instances
- Increase database CPU and storage
- Adjust resource limits in deployments

## 💰 Cost Optimization

### Resource Optimization
- Use appropriate instance shapes
- Right-size database resources
- Implement auto-scaling policies

### Cost Monitoring
- Set up budget alerts
- Monitor resource usage
- Use OCI cost analysis tools

## 🔄 Updates and Maintenance

### Infrastructure Updates
```bash
# Update Terraform configuration
git pull origin main

# Plan and apply updates
terraform plan
terraform apply
```

### Application Updates
```bash
# Build new images
docker build -t registry/backend:latest backend/
docker build -t registry/frontend:latest frontend/

# Push to registry
docker push registry/backend:latest
docker push registry/frontend:latest

# Update deployments
kubectl rollout restart deployment/backend -n contract-management
kubectl rollout restart deployment/frontend -n contract-management
```

## 📚 Additional Resources

- [OCI Documentation](https://docs.oracle.com/en-us/iaas/)
- [Terraform OCI Provider](https://registry.terraform.io/providers/oracle/oci/latest/docs)
- [OKE Documentation](https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section
2. Review OCI and Terraform documentation
3. Check application logs and health status
4. Contact the development team 