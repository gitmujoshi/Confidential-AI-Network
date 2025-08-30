#!/bin/bash

# Quick Ubuntu VM Deployment Script
# Simple one-command deployment for experienced users

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Ubuntu VM Deployment${NC}"
echo "================================"

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <your-domain.com>"
    echo "Example: $0 example.com"
    exit 1
fi

DOMAIN=$1

echo -e "${GREEN}Deploying to domain: $DOMAIN${NC}"

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git jq docker.io docker-compose nginx certbot python3-certbot-nginx

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Configure Nginx
sudo tee /etc/nginx/sites-available/contract-management <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    
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

sudo ln -s /etc/nginx/sites-available/contract-management /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Get SSL certificate
echo "Getting SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Clone and setup application
cd /opt
sudo git clone https://github.com/YOUR_USERNAME/ContractManagement.git
sudo chown -R $USER:$USER ContractManagement
cd ContractManagement

# Generate passwords
KEYCLOAK_PASS=$(openssl rand -hex 16)
POSTGRES_PASS=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 64)

# Configure environment
cp env.example config.env
sed -i "s|KEYCLOAK_URL=.*|KEYCLOAK_URL=https://$DOMAIN:8443|g" config.env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" config.env
sed -i "s|BACKEND_URL=.*|BACKEND_URL=https://$DOMAIN|g" config.env
sed -i "s|KEYCLOAK_ADMIN_PASSWORD=.*|KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_PASS|g" config.env
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASS|g" config.env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" config.env

# Create production compose
cp docker-compose.main.yml docker-compose.prod.yml
sed -i "s|KC_HOSTNAME:.*|KC_HOSTNAME: $DOMAIN|g" docker-compose.prod.yml
sed -i "s|restart:.*|restart: unless-stopped|g" docker-compose.prod.yml

# Generate Keycloak certs
mkdir -p deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/***REMOVED-KEYCLOAK_DB_PASSWORD***.key \
  -out deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/***REMOVED-KEYCLOAK_DB_PASSWORD***.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
sudo chown -R $USER:$USER deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs
chmod 600 deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/***REMOVED-KEYCLOAK_DB_PASSWORD***.key
chmod 644 deployment/***REMOVED-KEYCLOAK_DB_PASSWORD***-certs/***REMOVED-KEYCLOAK_DB_PASSWORD***.crt

# Install dependencies
cd backend && npm install --production && cd ..
cd frontend && npm install --production && npm run build && cd ..

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Wait and configure Keycloak
echo "Waiting for Keycloak to start..."
sleep 60

cd deployment
if [ -f "configure-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.js" ]; then
    sed -i "s|https://localhost:8443|https://$DOMAIN:8443|g" configure-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.js
    sed -i "s|***REMOVED-KEYCLOAK_ADMIN_PASSWORD***|$KEYCLOAK_PASS|g" configure-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.js
    node configure-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.js
fi
cd ..

# Setup firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8443/tcp
sudo ufw --force enable

echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================"
echo "Frontend: https://$DOMAIN"
echo "Backend: https://$DOMAIN/api"
echo "Keycloak: https://$DOMAIN:8443"
echo "Keycloak Admin: admin / $KEYCLOAK_PASS"
echo "PostgreSQL: ***REMOVED-DB_PASSWORD*** / $POSTGRES_PASS"
echo ""
echo "Check services: docker-compose -f docker-compose.prod.yml ps"
echo "View logs: docker-compose -f docker-compose.prod.yml logs -f"
