# Local Ubuntu VM Quick Start Guide

## 🚀 **Quick Start: Local VM Setup in 10 Minutes**

This guide will get you up and running with a local Ubuntu VM running the Contract Management System in under 10 minutes.

## 📋 **Prerequisites**

- **Host OS**: Windows 10/11, macOS, or Linux
- **RAM**: 16GB+ recommended (8GB minimum)
- **Storage**: 100GB+ free space
- **Virtualization**: VirtualBox (free) or VMware

## ⚡ **Option 1: VirtualBox (Fastest Setup)**

### **Step 1: Install VirtualBox**
```bash
# Download and install from: https://www.virtualbox.org/wiki/Downloads
# This takes 2-3 minutes
```

### **Step 2: Download Ubuntu Server**
```bash
# Download Ubuntu 22.04 LTS Server from: https://ubuntu.com/download/server
# Choose "Server" version (smaller, faster)
# This takes 1-2 minutes
```

### **Step 3: Create VM (2 minutes)**
1. **Open VirtualBox** → Click "New"
2. **Name**: `ContractManagement-VM`
3. **Type**: Linux
4. **Version**: Ubuntu (64-bit)
5. **Memory**: 8192 MB (8GB)
6. **Hard disk**: Create virtual hard disk now
7. **File type**: VDI
8. **Storage**: Dynamically allocated
9. **Size**: 50 GB

### **Step 4: Configure VM (1 minute)**
1. **Select VM** → Click "Settings"
2. **System** → **Processor**: 4 processors
3. **Network** → **Adapter 1**: Bridged Adapter
4. **Storage** → **Empty** → **Choose Virtual Optical Disk File** → Select Ubuntu ISO

### **Step 5: Install Ubuntu (5 minutes)**
1. **Start VM**
2. **Language**: English
3. **Installation type**: Erase disk and install Ubuntu
4. **User setup**: 
   - **Name**: `admin`
   - **Username**: `admin`
   - **Password**: `admin123`
5. **Wait for installation** (5 minutes)

## 🚀 **Option 2: One-Click Deployment (5 minutes)**

### **Step 1: Access VM**
```bash
# SSH into VM (if using bridged network)
ssh admin@vm-ip-address

# Or use VM console directly
```

### **Step 2: Clone and Deploy**
```bash
# Clone your repository
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/ContractManagement.git
sudo chown -R $USER:$USER ContractManagement
cd ContractManagement

# Run the local deployment script
./deployment/deploy-to-local-vm.sh
```

**What the script does automatically:**
- ✅ Updates system packages
- ✅ Installs Docker and Node.js
- ✅ Configures local environment
- ✅ Creates local Docker Compose
- ✅ Generates SSL certificates
- ✅ Installs dependencies
- ✅ Starts all services
- ✅ Configures Keycloak IAM
- ✅ Creates test data
- ✅ Tests deployment

## 🌐 **Access Your Local App**

### **Local Access (from VM)**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api
- **Keycloak**: https://localhost:8443

### **Network Access (from host/other devices)**
- **Frontend**: http://vm-ip-address:3000
- **Backend API**: http://vm-ip-address:5001/api
- **Keycloak**: https://vm-ip-address:8443

## 🔐 **Default Credentials**

- **Keycloak Admin**: `admin` / `admin123`
- **PostgreSQL**: `postgres` / `postgres123`
- **Test Users**: Created automatically by the script

## 🧪 **Test Your Deployment**

### **Quick Health Check**
```bash
# Test backend
curl http://localhost:5001/api/health

# Test frontend
curl http://localhost:3000

# Test Keycloak
curl -k https://localhost:8443/health
```

### **Test User Login**
```bash
# Test authentication
./deployment/test-user-login-all-types.sh
```

### **Test Contract Creation**
```bash
# Test end-to-end workflow
./deployment/test-contract-creation-end-to-end.sh
```

## 🔧 **Management Commands**

### **Service Management**
```bash
# Check status
docker-compose -f docker-compose.local.yml ps

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Restart services
docker-compose -f docker-compose.local.yml restart

# Stop services
docker-compose -f docker-compose.local.yml down

# Start services
docker-compose -f docker-compose.local.yml up -d
```

### **Database Access**
```bash
# Access application database
docker exec -it postgres-app psql -U postgres -d contract_management

# Access Keycloak database
docker exec -it postgres-keycloak psql -U postgres -d keycloak
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **VM not accessible from host**
   - Check network adapter settings (use Bridged)
   - Verify firewall settings
   - Check VM IP address

2. **Port conflicts**
   ```bash
   # Check if ports are in use
   sudo netstat -tlnp | grep :3000
   sudo netstat -tlnp | grep :5001
   sudo netstat -tlnp | grep :8443
   ```

3. **Services not starting**
   ```bash
   # Check Docker status
   sudo systemctl status docker
   
   # Check service logs
   docker-compose -f docker-compose.local.yml logs -f
   ```

### **Performance Tips**

1. **Increase VM resources** if possible:
   - RAM: 12-16 GB
   - CPU: 6-8 cores
   - Storage: SSD recommended

2. **Use bridged networking** for better performance

## 🎯 **Next Steps**

### **After Local Setup**
1. **Test all functionality**:
   - User registration and login
   - Contract creation
   - Dataset management
   - AI model selection

2. **Development workflow**:
   - Make code changes
   - Test in local VM
   - Deploy to production when ready

3. **Production deployment**:
   - Use the Ubuntu VM deployment scripts
   - Configure real domain and SSL
   - Set up monitoring and backup

## 📚 **Full Documentation**

- **Complete Local VM Guide**: `deployment/LOCAL_VM_SETUP_GUIDE.md`
- **Ubuntu Production Deployment**: `deployment/UBUNTU_VM_DEPLOYMENT_GUIDE.md`
- **Deployment Summary**: `deployment/UBUNTU_DEPLOYMENT_SUMMARY.md`

---

**Total Time**: 10 minutes for basic setup, 15 minutes for full deployment
**Difficulty**: Beginner-friendly
**Result**: Fully functional Contract Management System running locally
