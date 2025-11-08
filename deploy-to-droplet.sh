#!/bin/bash

# Cyber Khana CTF Platform - Complete One-Command Deployment Script
# For Digital Ocean Droplet
# Run this on your droplet: curl -sSL https://raw.githubusercontent.com/3aboshe/Cyber-Khana/master/deploy-to-droplet.sh | bash

set -e

echo "========================================="
echo "Cyber Khana CTF Platform Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Update system
echo -e "${YELLOW}Step 1/10: Updating system packages...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt update -qq && apt upgrade -yqq
echo -e "${GREEN}✓ System updated${NC}"
echo ""

# Step 2: Install Node.js
echo -e "${YELLOW}Step 2/10: Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
apt-get install -yqq nodejs > /dev/null 2>&1
echo -e "${GREEN}✓ Node.js $(node -v) installed${NC}"
echo ""

# Step 3: Install PM2
echo -e "${YELLOW}Step 3/10: Installing PM2...${NC}"
npm install -g pm2 > /dev/null 2>&1
echo -e "${GREEN}✓ PM2 installed${NC}"
echo ""

# Step 4: Install and configure MongoDB
echo -e "${YELLOW}Step 4/10: Installing MongoDB...${NC}"
if ! command -v mongod &> /dev/null; then
    apt-get install -yqq mongodb > /dev/null 2>&1
    systemctl start mongodb > /dev/null 2>&1
    systemctl enable mongodb > /dev/null 2>&1
    echo -e "${GREEN}✓ MongoDB installed and running${NC}"
else
    echo -e "${GREEN}✓ MongoDB already installed${NC}"
    systemctl start mongodb > /dev/null 2>&1
    systemctl enable mongodb > /dev/null 2>&1
fi
echo ""

# Step 5: Install and configure Nginx
echo -e "${YELLOW}Step 5/10: Installing Nginx...${NC}"
apt-get install -yqq nginx > /dev/null 2>&1
systemctl start nginx > /dev/null 2>&1
systemctl enable nginx > /dev/null 2>&1
echo -e "${GREEN}✓ Nginx installed and running${NC}"
echo ""

# Step 6: Clone or update repository
echo -e "${YELLOW}Step 6/10: Cloning/updating repository...${NC}"
if [ -d "/root/cyber-khana" ]; then
    cd /root/cyber-khana
    git pull origin master > /dev/null 2>&1
    echo -e "${GREEN}✓ Repository updated${NC}"
else
    cd /root
    git clone https://github.com/3aboshe/Cyber-Khana.git cyber-khana > /dev/null 2>&1
    cd cyber-khana
    echo -e "${GREEN}✓ Repository cloned${NC}"
fi
echo ""

# Step 7: Install dependencies
echo -e "${YELLOW}Step 7/10: Installing dependencies...${NC}"
npm install --silent > /dev/null 2>&1
cd backend && npm install --silent > /dev/null 2>&1 && cd ..
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 8: Build project
echo -e "${YELLOW}Step 8/10: Building project...${NC}"
npm run build --silent > /dev/null 2>&1
cd backend && npm run build --silent > /dev/null 2>&1 && cd ..
echo -e "${GREEN}✓ Project built${NC}"
echo ""

# Step 9: Configure environment and services
echo -e "${YELLOW}Step 9/10: Configuring environment and services...${NC}"

# Create .env file
cat > backend/.env << EOF
MONGODB_URI=mongodb://localhost:27017/cyber-khana
JWT_SECRET=cyberkhana2024productiondeploy
PORT=5001
NODE_ENV=production
EOF

# Initialize database
cd backend && npm run setup-db > /dev/null 2>&1 && cd ..

# Configure Nginx
DROPLET_IP=$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null || echo "")
if [ -z "$DROPLET_IP" ]; then
    # If can't get from metadata, get from hostname
    DROPLET_IP=$(hostname -I | awk '{print $1}')
fi

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

# Start backend with PM2
pm2 start /root/cyber-khana/ecosystem.config.js > /dev/null 2>&1
pm2 save > /dev/null 2>&1
pm2 startup | tail -1 | bash > /dev/null 2>&1

echo -e "${GREEN}✓ Environment and services configured${NC}"
echo ""

# Step 10: Configure firewall
echo -e "${YELLOW}Step 10/10: Configuring firewall...${NC}"
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
echo "y" | ufw enable > /dev/null 2>&1
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

# Final summary
echo "========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "========================================="
echo ""
echo -e "${BLUE}Access your application at:${NC}"
echo -e "${GREEN}http://$DROPLET_IP${NC}"
echo ""
echo -e "${BLUE}Login credentials:${NC}"
echo "  Username: ${YELLOW}admin${NC}"
echo "  Password: ${YELLOW}OurSecurePlatform@d0mv6p${NC}"
echo ""
echo -e "${BLUE}Super Admin Features:${NC}"
echo "  1. Create universities"
echo "  2. Copy challenges between universities"
echo "  3. Promote users to university admin"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  View status:    ${YELLOW}pm2 status${NC}"
echo "  View logs:      ${YELLOW}pm2 logs${NC}"
echo "  Restart:        ${YELLOW}pm2 restart cyber-khana-backend${NC}"
echo "  Stop:           ${YELLOW}pm2 stop cyber-khana-backend${NC}"
echo ""
echo -e "${BLUE}To update in the future, simply run:${NC}"
echo -e "${YELLOW}cd /root/cyber-khana && git pull origin master && pm2 restart cyber-khana-backend${NC}"
echo ""
