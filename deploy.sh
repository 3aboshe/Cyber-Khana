#!/bin/bash

# Cyber Khana CTF Platform - Deployment Script
# This script updates and deploys the latest changes to your Digital Ocean droplet

echo "========================================="
echo "Cyber Khana CTF - Deployment Script"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to project directory
cd /root/cyber-khana || exit 1

echo -e "${YELLOW}Step 1/6: Pulling latest changes from Git...${NC}"
git pull origin master || {
    echo -e "${RED}Failed to pull from git${NC}"
    exit 1
}
echo -e "${GREEN}✓ Git pull completed${NC}"
echo ""

echo -e "${YELLOW}Step 2/6: Rebuilding frontend...${NC}"
echo "Removing old build files..."
rm -rf /root/cyber-khana/dist
echo "Building frontend..."
npm run build || {
    echo -e "${RED}Frontend build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

echo -e "${YELLOW}Step 3/6: Copying files to web server...${NC}"
cp -r /root/cyber-khana/dist/* /var/www/cyber-khana/
chown -R www-data:www-data /var/www/cyber-khana
echo -e "${GREEN}✓ Files copied to /var/www/cyber-khana${NC}"
echo ""

echo -e "${YELLOW}Step 4/6: Rebuilding backend...${NC}"
cd /root/cyber-khana/backend
npm run build || {
    echo -e "${RED}Backend build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Backend built successfully${NC}"
echo ""

echo -e "${YELLOW}Step 5/6: Restarting PM2...${NC}"
pm2 restart cyber-khana-backend || {
    echo -e "${RED}Failed to restart PM2${NC}"
    exit 1
}
echo -e "${GREEN}✓ PM2 restarted${NC}"
echo ""

echo -e "${YELLOW}Step 6/6: Verifying deployment...${NC}"
echo "Checking PM2 status..."
pm2 status | grep "cyber-khana-backend"

echo ""
echo -e "${BLUE}Testing API...${NC}"
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"OurSecurePlatform@d0mv6p"}' \
  -s -o /dev/null -w "API Status: %{http_code}\n"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment completed successfully! 🎉${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Your Cyber Khana CTF Platform is now updated!"
echo "Access it at: http://164.92.186.62"
echo ""
