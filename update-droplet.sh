#!/bin/bash

# Quick update script for Cyber Khana CTF Platform
# Run this on your droplet to update to the latest version

echo "========================================="
echo "Updating Cyber Khana CTF Platform"
echo "========================================="

cd /root/cyber-khana

# Pull latest changes
echo "Pulling latest changes from GitHub..."
git pull origin master

# Rebuild if needed
echo "Rebuilding project..."
npm run build --silent > /dev/null 2>&1
cd backend && npm run build --silent > /dev/null 2>&1 && cd ..

# Restart backend
echo "Restarting backend..."
pm2 restart cyber-khana-backend

# Reload Nginx
echo "Reloading Nginx..."
systemctl reload nginx

echo ""
echo "✓ Update complete!"
echo "========================================="
