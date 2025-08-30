# Ubuntu VM Deployment Summary

## 🚀 **Deployment Options for Contract Management System**

This document provides an overview of the deployment options available for deploying the Contract Management System to a new Ubuntu VM.

## 📋 **Prerequisites**

### **VM Requirements**
- **OS**: Ubuntu 22.04 LTS or 24.04 LTS
- **CPU**: 4+ cores recommended
- **RAM**: 8GB+ recommended  
- **Storage**: 50GB+ available space
- **Network**: Public IP address with ports 80, 443, 5001, 3000 accessible

### **Domain Requirements**
- A domain name pointing to your VM's public IP
- DNS records configured (A record for your domain)

## 🔧 **Deployment Methods**

### **Method 1: Interactive Deployment (Recommended for First-Time Users)**

**Script**: `deployment/deploy-to-ubuntu-vm.sh`

**Features**:
- ✅ Interactive configuration with user prompts
- ✅ Comprehensive error checking and validation
- ✅ Step-by-step progress reporting
- ✅ Automatic password generation
- ✅ Complete setup including firewall and backup
- ✅ Detailed final instructions

**Usage**:
```bash
# Copy script to your Ubuntu VM
wget https://raw.githubusercontent.com/YOUR_USERNAME/ContractManagement/main/deployment/deploy-to-ubuntu-vm.sh

# Make executable and run
chmod +x deploy-to-ubuntu-vm.sh
./deploy-to-ubuntu-vm.sh
```

**What it does**:
1. Updates system packages
2. Installs Docker, Node.js, Nginx, Certbot
3. Configures Nginx reverse proxy
4. Gets SSL certificate from Let's Encrypt
5. Clones your repository
6. Configures environment variables
7. Creates production Docker Compose
8. Generates Keycloak SSL certificates
9. Installs dependencies
10. Starts all services
11. Configures Keycloak IAM
12. Creates test data
13. Tests deployment
14. Sets up firewall
15. Creates backup script

### **Method 2: Quick Deployment (For Experienced Users)**

**Script**: `deployment/quick-deploy-ubuntu.sh`

**Features**:
- ✅ One-command deployment
- ✅ Automatic password generation
- ✅ Minimal user interaction
- ✅ Fast deployment process

**Usage**:
```bash
# Copy script to your Ubuntu VM
wget https://raw.githubusercontent.com/YOUR_USERNAME/ContractManagement/main/deployment/quick-deploy-ubuntu.sh

# Make executable and run with your domain
chmod +x quick-deploy-ubuntu.sh
./quick-deploy-ubuntu.sh yourdomain.com
```

**What it does**:
1. Installs all required software
2. Configures Nginx and SSL
3. Clones and configures application
4. Generates secure passwords
5. Starts services
6. Configures Keycloak
7. Sets up firewall

## 📚 **Manual Deployment Guide**

**Document**: `deployment/UBUNTU_VM_DEPLOYMENT_GUIDE.md`

**Features**:
- ✅ Step-by-step manual instructions
- ✅ Detailed explanations for each step
- ✅ Troubleshooting section
- ✅ Security hardening recommendations
- ✅ Monitoring and backup setup

**Use when**:
- You prefer manual control
- You want to understand each step
- You need to customize the deployment
- You're learning the system architecture

## 🔐 **Security Features**

### **HTTPS/SSL**
- Let's Encrypt SSL certificates for main domain
- Self-signed certificates for Keycloak (port 8443)
- Automatic SSL renewal

### **Firewall Configuration**
- UFW firewall enabled
- Only necessary ports open (22, 80, 443, 8443)
- SSH access maintained

### **Authentication**
- Keycloak IAM integration
- JWT-based authentication
- Role-based access control (TDP, TDC, CCRP, AppAdmin)

## 🌐 **Network Architecture**

```
Internet → Nginx (80/443) → Frontend (3000) / Backend (5001)
                    ↓
              Keycloak (8443)
```

- **Port 80**: HTTP (redirects to HTTPS)
- **Port 443**: HTTPS (main application)
- **Port 8443**: HTTPS (Keycloak IAM)
- **Port 3000**: Frontend React app
- **Port 5001**: Backend API

## 📊 **Service Dependencies**

```
PostgreSQL (App) → Backend → Frontend
PostgreSQL (Keycloak) → Keycloak → Backend
```

## 🧪 **Post-Deployment Testing**

### **Health Checks**
```bash
# Test backend
curl -k https://yourdomain.com/api/health

# Test frontend  
curl -k https://yourdomain.com

# Test Keycloak
curl -k https://yourdomain.com:8443/health
```

### **User Authentication Test**
```bash
# Test user login
./deployment/test-user-login-all-types.sh
```

### **Contract Creation Test**
```bash
# Test end-to-end contract creation
./deployment/test-contract-creation-end-to-end.sh
```

## 🔧 **Management Commands**

### **Service Management**
```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### **Backup and Restore**
```bash
# Create backup
sudo /opt/backup-contract-management.sh

# Restore from backup (manual process)
# 1. Stop services
# 2. Restore database dumps
# 3. Restore Keycloak data
# 4. Restart services
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Port conflicts**
   ```bash
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :443
   ```

2. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

3. **Keycloak not starting**
   ```bash
   docker-compose logs ***REMOVED-KEYCLOAK_DB_PASSWORD***
   docker exec ***REMOVED-DB_PASSWORD***-***REMOVED-KEYCLOAK_DB_PASSWORD*** psql -U ***REMOVED-DB_PASSWORD*** -c "\l"
   ```

4. **Database connection errors**
   ```bash
   docker exec ***REMOVED-DB_PASSWORD***-app psql -U ***REMOVED-DB_PASSWORD*** -c "SELECT version();"
   ```

### **Log Locations**
- **Application logs**: `docker-compose logs -f [service-name]`
- **Nginx logs**: `/var/log/nginx/`
- **System logs**: `journalctl -u docker`

## 🎯 **Recommendations**

### **For Production Use**
1. **Use Method 1** (Interactive Deployment) for first deployment
2. **Set up monitoring** (Prometheus, Grafana)
3. **Configure automated backups** (cron jobs)
4. **Set up log aggregation** (ELK stack)
5. **Implement CI/CD pipeline**

### **For Development/Testing**
1. **Use Method 2** (Quick Deployment) for fast setup
2. **Use local development** for active development
3. **Use staging environment** for testing

## 📞 **Support**

### **Documentation**
- **Deployment Guide**: `deployment/UBUNTU_VM_DEPLOYMENT_GUIDE.md`
- **API Documentation**: `COMPLETE_API_SPECIFICATIONS.md`
- **Troubleshooting**: `SETUP_TROUBLESHOOTING_GUIDE.md`

### **Scripts Location**
- **Interactive Deployment**: `deployment/deploy-to-ubuntu-vm.sh`
- **Quick Deployment**: `deployment/quick-deploy-ubuntu.sh`
- **Test Scripts**: `deployment/test-*.sh`

---

**Next Steps**: Choose your deployment method and follow the corresponding guide or script!
