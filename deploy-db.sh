#!/bin/bash

# Cyber Citadel CTF Platform - MongoDB Deployment Script
# Run this script on your MongoDB DigitalOcean Droplet

set -e  # Exit on error

echo "=================================="
echo "CTF Platform - MongoDB Setup"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
print_info "Updating system packages..."
apt update && apt upgrade -y

# Install MongoDB
print_info "Installing MongoDB 6.0..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt update
    apt install -y mongodb-org
fi

# Start and enable MongoDB
print_info "Starting MongoDB..."
systemctl start mongod
systemctl enable mongod

# Verify installation
if systemctl is-active --quiet mongod; then
    print_info "MongoDB is running"
else
    print_error "MongoDB failed to start"
    exit 1
fi

# Configure MongoDB for external connections
print_info "Configuring MongoDB to accept external connections..."
sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/g' /etc/mongod.conf
systemctl restart mongod

# Setup firewall
print_info "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 27017/tcp
ufw --force enable

# Secure MongoDB
print_info "=================================="
print_info "MongoDB Security Setup"
print_info "=================================="
print_warn "We will now create an admin user for MongoDB"
print_info ""

# Create admin user
mongosh << 'EOF'
use admin

db.createUser({
  user: "admin",
  pwd: "CHANGE_THIS_PASSWORD",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" }
  ]
})

db.auth("admin", "CHANGE_THIS_PASSWORD")
EOF

# Update MongoDB config to require authentication
print_info "Enabling authentication in MongoDB..."
sed -i 's/#security:/security:\n  authorization: enabled/g' /etc/mongod.conf
systemctl restart mongod

# Create database and user for CTF platform
print_info "Creating CTF platform database and user..."
read -sp "Enter a password for the ctfplatform database user: " CTF_DB_PASSWORD
echo ""

mongosh << EOF
use admin
db.auth("admin", "CHANGE_THIS_PASSWORD")

use ctf-platform
db.createUser({
  user: "ctfplatform",
  pwd: "$CTF_DB_PASSWORD",
  roles: [
    { role: "readWrite", db: "ctf-platform" },
    { role: "dbAdmin", db: "ctf-platform" }
  ]
})

db.auth("ctfplatform", "$CTF_DB_PASSWORD")
EOF

# Create backup script
print_info "Creating backup script..."
cat > /root/mongodb-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/mongodb-backups"
DATE=$(date +%Y%m%d_%H%M%S)
ADMIN_USER="admin"
ADMIN_PASSWORD="CHANGE_THIS_PASSWORD"

mkdir -p $BACKUP_DIR

# Create backup
mongodump --host localhost --username $ADMIN_USER --password $ADMIN_PASSWORD --authenticationDatabase admin --out $BACKUP_DIR/backup_$DATE

# Compress backup
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/mongodb-backup.sh

# Add to crontab for daily backups
(crontab -l 2>/dev/null; echo "0 3 * * * /root/mongodb-backup.sh") | crontab -

# Test connection
print_info "Testing database connection..."
mongosh --eval "db.adminCommand('ismaster')" --username admin --password CHANGE_THIS_PASSWORD --authenticationDatabase admin

print_info "=================================="
print_info "MongoDB Setup Complete!"
print_info "=================================="
print_info ""
print_info "Important Information:"
print_info "1. Admin username: admin"
print_info "2. Admin password: CHANGE_THIS_PASSWORD (change this!)"
print_info "3. Database name: ctf-platform"
print_info "4. Database username: ctfplatform"
print_info "5. Database password: $CTF_DB_PASSWORD"
print_info ""
print_warn "IMPORTANT: Please note down the database password!"
print_warn "IMPORTANT: Update the backup script with your admin password!"
print_info ""
print_info "On your Main Platform, update the .env file with:"
print_info "MONGODB_URI=mongodb://ctfplatform:$CTF_DB_PASSWORD@YOUR_DB_DROPLET_IP:27017/ctf-platform"
print_info ""
print_info "Useful commands:"
print_info "  - Connect: mongosh"
print_info "  - View logs: tail -f /var/log/mongodb/mongod.log"
print_info "  - Status: systemctl status mongod"
print_info "  - Backup: /root/mongodb-backup.sh"
print_info "  - Restore: mongorestore --host localhost --username admin --password PASSWORD --authenticationDatabase admin /path/to/backup"
print_info ""
