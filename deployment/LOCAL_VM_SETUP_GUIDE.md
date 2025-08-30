# Local Ubuntu VM Setup and Deployment Guide

## 🖥️ **Local VM Setup Options**

This guide covers setting up a local Ubuntu VM and deploying the Contract Management System to it.

## 📋 **Prerequisites**

### **System Requirements**
- **Host OS**: Windows 10/11, macOS, or Linux
- **RAM**: 16GB+ recommended (8GB minimum)
- **Storage**: 100GB+ free space
- **CPU**: 4+ cores recommended

### **Software Requirements**
- Virtualization software (VirtualBox, VMware, etc.)
- Git client
- SSH client (optional)

## 🔧 **Option 1: VirtualBox Setup (Recommended for Beginners)**

### **Step 1: Install VirtualBox**
```bash
# Download from: https://www.virtualbox.org/wiki/Downloads
# Install the appropriate version for your OS
```

### **Step 2: Download Ubuntu ISO**
```bash
# Download Ubuntu 22.04 LTS from: https://ubuntu.com/download/server
# Choose the server version for smaller size
```

### **Step 3: Create VM**
1. **Open VirtualBox** → Click "New"
2. **Name**: `ContractManagement-VM`
3. **Type**: Linux
4. **Version**: Ubuntu (64-bit)
5. **Memory**: 8192 MB (8GB)
6. **Hard disk**: Create a virtual hard disk now
7. **Hard disk file type**: VDI
8. **Storage**: Dynamically allocated
9. **File location and size**: 50 GB

### **Step 4: Configure VM Settings**
1. **Select VM** → Click "Settings"
2. **System** → **Processor**: 4 processors
3. **Display** → **Video Memory**: 128 MB
4. **Network** → **Adapter 1**: Bridged Adapter
5. **Storage** → **Controller: IDE** → **Empty** → **Choose Virtual Optical Disk File** → Select Ubuntu ISO

### **Step 5: Install Ubuntu**
1. **Start VM**
2. **Language**: English
3. **Installation type**: Erase disk and install Ubuntu
4. **User setup**: Create admin user
5. **Wait for installation** (15-30 minutes)

## 🔧 **Option 2: VMware Workstation Setup**

### **Step 1: Install VMware**
```bash
# Download from: https://www.vmware.com/products/workstation-pro/workstation-pro-evaluation.html
# Install VMware Workstation Pro or Player
```

### **Step 2: Create VM**
1. **File** → **New Virtual Machine**
2. **Typical** configuration
3. **Guest OS**: Ubuntu 64-bit
4. **VM name**: `ContractManagement-VM`
5. **Disk capacity**: 50 GB
6. **Customize hardware**:
   - **Memory**: 8 GB
   - **Processors**: 4
   - **Network adapter**: Bridged

### **Step 3: Install Ubuntu**
1. **Power on VM**
2. **Select Ubuntu ISO**
3. **Follow installation steps** (same as VirtualBox)

## 🔧 **Option 3: Hyper-V Setup (Windows)**

### **Step 1: Enable Hyper-V**
```powershell
# Run as Administrator
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
# Restart required
```

### **Step 2: Create VM**
```powershell
# Open Hyper-V Manager
# Quick Create → Ubuntu 22.04 LTS
# VM name: ContractManagement-VM
# Memory: 8 GB
# Network: Default Switch
```

## 🔧 **Option 4: UTM Setup (macOS)**

### **Step 1: Install UTM**
```bash
# Download from: https://mac.getutm.app/
# Or install via Homebrew: brew install --cask utm
```

### **Step 2: Create VM**
1. **Create** → **Virtualize**
2. **Linux** → **Ubuntu**
3. **System**: ARM64 or x86_64
4. **Memory**: 8 GB
5. **Storage**: 50 GB

## 🌐 **Network Configuration**

### **Bridged Network (Recommended)**
- VM gets its own IP on your local network
- Accessible from other devices on network
- Can use real domain names (if you have them)

### **NAT Network**
- VM shares host's IP
- Good for development
- Limited external access

### **Host-Only Network**
- VM only accessible from host
- Most secure
- Limited functionality

## 🚀 **Deploying to Local VM**

### **Step 1: Access VM**
```bash
# SSH into VM (if using bridged network)
ssh username@vm-ip-address

# Or use VM console directly
```

### **Step 2: Update VM**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git jq software-properties-common
```

### **Step 3: Install Docker**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### **Step 4: Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### **Step 5: Clone Repository**
```bash
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/ContractManagement.git
sudo chown -R $USER:$USER ContractManagement
cd ContractManagement
```

### **Step 6: Configure Environment**
```bash
# Copy and edit environment file
cp env.example config.env

# Edit config.env for local development
nano config.env
```

**Local config.env settings:**
```bash
# Use localhost for local VM
KEYCLOAK_URL=https://localhost:8443
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5001

# Generate strong passwords
KEYCLOAK_ADMIN_PASSWORD=admin123
POSTGRES_PASSWORD=postgres123
JWT_SECRET=your_local_jwt_secret_here
```

### **Step 7: Create Local Docker Compose**
```bash
# Copy main compose file
cp docker-compose.main.yml docker-compose.local.yml

# Edit for local settings
nano docker-compose.local.yml
```

**Local docker-compose.local.yml changes:**
```yaml
version: '3.8'
services:
  postgres-app:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"  # Expose PostgreSQL port
    volumes:
      - postgres_app_data:/var/lib/postgresql/data
    restart: unless-stopped

  postgres-keycloak:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5433:5432"  # Different port for Keycloak DB
    volumes:
      - postgres_keycloak_data:/var/lib/postgresql/data
    restart: unless-stopped

  keycloak:
    environment:
      KC_HOSTNAME: localhost
      KC_HOSTNAME_PORT: 8443
      KC_HOSTNAME_STRICT: false  # Allow localhost
      KC_HOSTNAME_STRICT_HTTPS: false  # Allow HTTP for local
    ports:
      - "8443:8443"  # Expose Keycloak port
    restart: unless-stopped

  backend:
    environment:
      NODE_ENV: development
      FRONTEND_URL: ${FRONTEND_URL}
    ports:
      - "5001:5001"  # Expose backend port
    restart: unless-stopped

  frontend:
    environment:
      REACT_APP_API_URL: ${BACKEND_URL}
      REACT_APP_KEYCLOAK_URL: ${KEYCLOAK_URL}
    ports:
      - "3000:3000"  # Expose frontend port
    restart: unless-stopped

volumes:
  postgres_app_data:
  postgres_keycloak_data:
  keycloak_data:
```

### **Step 8: Generate Keycloak Certificates**
```bash
# Create directory for Keycloak certificates
mkdir -p deployment/keycloak-certs

# Generate self-signed certificate for localhost
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deployment/keycloak-certs/keycloak.key \
  -out deployment/keycloak-certs/keycloak.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Set permissions
sudo chown -R $USER:$USER deployment/keycloak-certs
chmod 600 deployment/keycloak-certs/keycloak.key
chmod 644 deployment/keycloak-certs/keycloak.crt
```

### **Step 9: Install Dependencies**
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
npm run build

cd ..
```

### **Step 10: Start Services**
```bash
# Start all services
docker-compose -f docker-compose.local.yml up -d

# Check service status
docker-compose -f docker-compose.local.yml ps
docker-compose -f docker-compose.local.yml logs -f
```

### **Step 11: Configure Keycloak**
```bash
# Wait for Keycloak to start (check logs)
docker-compose -f docker-compose.local.yml logs keycloak

# Run Keycloak configuration
cd deployment
if [ -f "configure-keycloak-https.js" ]; then
    # Update for localhost
    sed -i "s|https://localhost:8443|https://localhost:8443|g" configure-keycloak-https.js
    sed -i "s|admin123|admin123|g" configure-keycloak-https.js
    node configure-keycloak-https.js
fi
cd ..
```

### **Step 12: Create Test Data**
```bash
# Run test data creation script
./deployment/create-test-data.sh
```

## 🧪 **Testing Local Deployment**

### **Health Checks**
```bash
# Test backend
curl http://localhost:5001/api/health

# Test frontend
curl http://localhost:3000

# Test Keycloak
curl -k https://localhost:8443/health
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

## 🌐 **Access URLs**

### **Local Access**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api
- **Keycloak**: https://localhost:8443
- **PostgreSQL (App)**: localhost:5432
- **PostgreSQL (Keycloak)**: localhost:5433

### **Network Access (if using bridged network)**
- **Frontend**: http://vm-ip-address:3000
- **Backend API**: http://vm-ip-address:5001/api
- **Keycloak**: https://vm-ip-address:8443

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

1. **Port conflicts on host**
   ```bash
   # Check if ports are in use
   sudo netstat -tlnp | grep :3000
   sudo netstat -tlnp | grep :5001
   sudo netstat -tlnp | grep :8443
   ```

2. **VM not accessible from host**
   - Check network adapter settings
   - Verify firewall settings
   - Try different network modes

3. **Keycloak SSL issues**
   ```bash
   # Check Keycloak logs
   docker-compose -f docker-compose.local.yml logs keycloak
   
   # Verify certificates
   ls -la deployment/keycloak-certs/
   ```

4. **Database connection errors**
   ```bash
   # Check database status
   docker exec postgres-app psql -U postgres -c "SELECT version();"
   docker exec postgres-keycloak psql -U postgres -c "SELECT version();"
   ```

### **Performance Optimization**

1. **Increase VM resources** if possible:
   - RAM: 12-16 GB
   - CPU: 6-8 cores
   - Storage: SSD recommended

2. **Docker optimization**:
   ```bash
   # Increase Docker memory limit
   # Edit /etc/docker/daemon.json
   {
     "default-shm-size": "2G"
   }
   ```

## 🎯 **Next Steps**

### **After Local Deployment**
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

---

**Note**: This local setup is perfect for development and testing. For production use, follow the Ubuntu VM deployment guide with proper domain configuration and SSL certificates.
