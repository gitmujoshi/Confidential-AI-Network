# Ubuntu VM Deployment Guide for Contract Management System

## 🚀 Overview

This guide provides step-by-step instructions for deploying the Contract Management System to a new Ubuntu VM, including:
- System requirements and preparation
- Docker and Docker Compose installation
- HTTPS setup with Let's Encrypt
- Keycloak IAM configuration
- SCITT CCF integration
- Application deployment and startup

## 📋 Prerequisites

### VM Requirements
- **OS**: Ubuntu 22.04 LTS or 24.04 LTS
- **CPU**: 4+ cores recommended
- **RAM**: 8GB+ recommended
- **Storage**: 50GB+ available space
- **Network**: Public IP address with ports 80, 443, 5001, 3000 accessible

### Domain Requirements
- A domain name pointing to your VM's public IP
- DNS records configured (A record for your domain)

## 🔧 Step 1: VM Setup and System Preparation

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git jq software-properties-common
```

### 1.2 Install Docker
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

### 1.3 Install Node.js and npm
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.4 Install Nginx and Certbot
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

## 🌐 Step 2: Domain and SSL Setup

### 2.1 Configure Nginx
```bash
# Create nginx configuration
sudo tee /etc/nginx/sites-available/contract-management <<EOF
server {
    listen 80;
    server_name YOUR_DOMAIN.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/contract-management /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 2.2 Get SSL Certificate
```bash
# Replace YOUR_DOMAIN.com with your actual domain
sudo certbot --nginx -d YOUR_DOMAIN.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 📁 Step 3: Application Deployment

### 3.1 Clone Repository
```bash
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/ContractManagement.git
sudo chown -R $USER:$USER ContractManagement
cd ContractManagement
```

### 3.2 Configure Environment
```bash
# Copy and edit environment file
cp env.example config.env

# Edit config.env with your domain and settings
nano config.env
```

**Required config.env changes:**
```bash
# Update these values for production
KEYCLOAK_URL=https://YOUR_DOMAIN.com:8443
FRONTEND_URL=https://YOUR_DOMAIN.com
BACKEND_URL=https://YOUR_DOMAIN.com

# Generate strong passwords
KEYCLOAK_ADMIN_PASSWORD=your_strong_admin_password
POSTGRES_PASSWORD=your_strong_db_password
JWT_SECRET=your_very_long_random_jwt_secret
```

### 3.3 Create Production Docker Compose
```bash
# Create production docker-compose
cp docker-compose.main.yml docker-compose.prod.yml

# Edit for production settings
nano docker-compose.prod.yml
```

**Production docker-compose.prod.yml changes:**
```yaml
version: '3.8'
services:
  postgres-app:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_app_data:/var/lib/postgresql/data
    restart: unless-stopped

  postgres-keycloak:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_keycloak_data:/var/lib/postgresql/data
    restart: unless-stopped

  keycloak:
    environment:
      KC_HOSTNAME: YOUR_DOMAIN.com
      KC_HOSTNAME_PORT: 8443
      KC_HOSTNAME_STRICT: true
      KC_HOSTNAME_STRICT_HTTPS: true
    restart: unless-stopped

  backend:
    environment:
      NODE_ENV: production
      FRONTEND_URL: ${FRONTEND_URL}
    restart: unless-stopped

  frontend:
    environment:
      REACT_APP_API_URL: ${BACKEND_URL}
      REACT_APP_KEYCLOAK_URL: ${KEYCLOAK_URL}
    restart: unless-stopped

volumes:
  postgres_app_data:
  postgres_keycloak_data:
  keycloak_data:
```

## 🔐 Step 4: Keycloak HTTPS Configuration

### 4.1 Generate SSL Certificates for Keycloak
```bash
# Create directory for Keycloak certificates
mkdir -p deployment/keycloak-certs

# Generate self-signed certificate for Keycloak (or use Let's Encrypt)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deployment/keycloak-certs/keycloak.key \
  -out deployment/keycloak-certs/keycloak.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=YOUR_DOMAIN.com"

# Set permissions
sudo chown -R $USER:$USER deployment/keycloak-certs
chmod 600 deployment/keycloak-certs/keycloak.key
chmod 644 deployment/keycloak-certs/keycloak.crt
```

### 4.2 Update Keycloak Configuration
```bash
# Create production Keycloak configuration script
nano deployment/configure-keycloak-production.js
```

**Production Keycloak configuration:**
```javascript
const axios = require('axios');
const https = require('https');

const config = {
  keycloakUrl: 'https://YOUR_DOMAIN.com:8443',
  adminUser: 'admin',
  adminPassword: 'your_strong_admin_password',
  realm: 'contract-management',
  clientId: 'contract-management-backend',
  clientSecret: 'your_client_secret'
};

// ... rest of configuration script
```

## 🚀 Step 5: Deploy and Start Services

### 5.1 Install Dependencies
```bash
# Backend dependencies
cd backend
npm install --production

# Frontend dependencies
cd ../frontend
npm install --production
npm run build
```

### 5.2 Start Services
```bash
# Start all services
cd /opt/ContractManagement
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

### 5.3 Initialize Keycloak
```bash
# Wait for Keycloak to start (check logs)
docker-compose -f docker-compose.prod.yml logs keycloak

# Run Keycloak configuration
cd deployment
node configure-keycloak-production.js
```

## 🧪 Step 6: Testing and Verification

### 6.1 Health Checks
```bash
# Test backend
curl -k https://YOUR_DOMAIN.com/api/health

# Test frontend
curl -k https://YOUR_DOMAIN.com

# Test Keycloak
curl -k https://YOUR_DOMAIN.com:8443/health
```

### 6.2 Create Test Data
```bash
# Run test data creation script
cd /opt/ContractManagement
./deployment/create-test-data.sh
```

### 6.3 Test User Login
```bash
# Test authentication
./deployment/test-user-login-all-types.sh
```

## 🔧 Step 7: Production Optimizations

### 7.1 Security Hardening
```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8443/tcp
sudo ufw enable

# Disable root login
sudo passwd -l root
```

### 7.2 Monitoring and Logging
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Set up log rotation
sudo tee /etc/logrotate.d/docker <<EOF
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
EOF
```

### 7.3 Backup Strategy
```bash
# Create backup script
nano /opt/backup-contract-management.sh
```

**Backup script:**
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup databases
docker exec postgres-app pg_dump -U postgres contract_management > $BACKUP_DIR/app_db.sql
docker exec postgres-keycloak pg_dump -U postgres keycloak > $BACKUP_DIR/keycloak_db.sql

# Backup Keycloak data
docker cp keycloak:/opt/keycloak/data $BACKUP_DIR/keycloak_data

# Compress backup
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports are already in use
   ```bash
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :443
   ```

2. **SSL certificate issues**: Verify certificate paths and permissions
   ```bash
   sudo certbot certificates
   sudo nginx -t
   ```

3. **Keycloak not starting**: Check logs and database connectivity
   ```bash
   docker-compose logs keycloak
   docker exec postgres-keycloak psql -U postgres -c "\l"
   ```

4. **Database connection errors**: Verify environment variables and database status
   ```bash
   docker exec postgres-app psql -U postgres -c "SELECT version();"
   ```

### Log Locations
- **Application logs**: `docker-compose logs -f [service-name]`
- **Nginx logs**: `/var/log/nginx/`
- **System logs**: `journalctl -u docker`

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)

## 🎯 Next Steps

After successful deployment:
1. Set up monitoring and alerting
2. Configure automated backups
3. Implement CI/CD pipeline
4. Set up staging environment
5. Document operational procedures

---

**Note**: Replace `YOUR_DOMAIN.com` with your actual domain name throughout this guide.
