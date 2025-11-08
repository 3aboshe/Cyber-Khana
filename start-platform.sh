#!/bin/bash

# Cyber Khana CTF Platform - Quick Start Script
# Configures environment, firewall, and starts the platform

set -e

echo "========================================="
echo "Cyber Khana CTF Platform - Quick Start"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get droplet IP
echo -e "${YELLOW}Getting droplet IP address...${NC}"
DROPLET_IP=$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null || echo "")
if [ -z "$DROPLET_IP" ]; then
    DROPLET_IP=$(hostname -I | awk '{print $1}')
fi
echo -e "${GREEN}✓ Detected IP: $DROPLET_IP${NC}"
echo ""

# Step 1: Configure .env file
echo -e "${YELLOW}Step 1/4: Configuring environment variables...${NC}"
cat > /root/cyber-khana/backend/.env << EOF
MONGODB_URI=mongodb://localhost:27017/cyber-khana
JWT_SECRET=cyberkhana2024productiondeploy
PORT=5001
NODE_ENV=production
EOF
echo -e "${GREEN}✓ .env file created${NC}"
echo ""

# Step 2: Configure Nginx
echo -e "${YELLOW}Step 2/4: Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/cyber-khana << EOF
server {
    listen 80;
    server_name $DROPLET_IP;

    # Serve static frontend files
    location / {
        root /root/cyber-khana/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/cyber-khana /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t > /dev/null 2>&1
systemctl reload nginx
echo -e "${GREEN}✓ Nginx configured${NC}"
echo ""

# Step 3: Configure Firewall
echo -e "${YELLOW}Step 3/4: Configuring firewall...${NC}"
ufw allow 22/tcp > /dev/null 2>&1 || true
ufw allow 80/tcp > /dev/null 2>&1 || true
ufw allow 443/tcp > /dev/null 2>&1 || true
echo "y" | ufw enable > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

# Step 4: Start application
echo -e "${YELLOW}Step 4/4: Starting application...${NC}"
cd /root/cyber-khana

# Start MongoDB
systemctl start mongodb > /dev/null 2>&1 || true
systemctl enable mongodb > /dev/null 2>&1 || true

# Stop existing PM2 processes if any
pm2 stop cyber-khana-backend > /dev/null 2>&1 || true
pm2 delete cyber-khana-backend > /dev/null 2>&1 || true

# Start with PM2
pm2 start ecosystem.config.js > /dev/null 2>&1
pm2 save > /dev/null 2>&1
pm2 startup | tail -1 | bash > /dev/null 2>&1 || true

# Wait a moment for services to start
sleep 3

echo -e "${GREEN}✓ Application started${NC}"
echo ""

# Final summary
echo "========================================="
echo -e "${GREEN}Platform Started Successfully!${NC}"
echo "========================================="
echo ""
echo -e "${BLUE}Access your application at:${NC}"
echo -e "${GREEN}http://$DROPLET_IP${NC}"
echo ""
echo -e "${BLUE}Login credentials:${NC}"
echo "  Username: ${YELLOW}admin${NC}"
echo "  Password: ${YELLOW}OurSecurePlatform@d0mv6p${NC}"
echo ""
echo -e "${BLUE}Service Status:${NC}"
pm2 status
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  View status:    ${YELLOW}pm2 status${NC}"
echo "  View logs:      ${YELLOW}pm2 logs${NC}"
echo "  Restart:        ${YELLOW}pm2 restart cyber-khana-backend${NC}"
echo "  Stop:           ${YELLOW}pm2 stop cyber-khana-backend${NC}"
echo ""
