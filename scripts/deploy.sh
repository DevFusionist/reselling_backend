#!/bin/bash

# ============================================================
# Deployment Script for Reseller Backend
# ============================================================
# This script automates the deployment process on a server
# Usage: ./scripts/deploy.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       RESELLER BACKEND - DEPLOYMENT SCRIPT                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}✗${NC} Please do not run as root. Use a regular user with sudo privileges."
   exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗${NC} Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗${NC} Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js version: $(node -v)"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} PM2 is not installed. Installing PM2..."
    sudo npm install -g pm2
    pm2 startup systemd
    echo -e "${GREEN}✓${NC} PM2 installed"
else
    echo -e "${GREEN}✓${NC} PM2 is installed"
fi

# Navigate to project root
cd "$ROOT_DIR"

# Check if .env files exist
echo ""
echo -e "${CYAN}Checking environment files...${NC}"
MISSING_ENV=0

for service_dir in services/*/; do
    service_name=$(basename "$service_dir")
    if [ ! -f "$service_dir/.env" ]; then
        echo -e "${YELLOW}⚠${NC}  $service_name - .env file missing"
        MISSING_ENV=1
    else
        echo -e "${GREEN}✓${NC}  $service_name - .env exists"
    fi
done

if [ $MISSING_ENV -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}⚠${NC}  Some .env files are missing. Running setup script..."
    chmod +x "$SCRIPT_DIR/setup-env.sh"
    "$SCRIPT_DIR/setup-env.sh"
    echo ""
    echo -e "${YELLOW}⚠${NC}  Please edit the .env files with your actual values before continuing."
    echo -e "${YELLOW}⚠${NC}  Press Enter when ready, or Ctrl+C to cancel..."
    read
fi

# Install dependencies
echo ""
echo -e "${CYAN}Installing dependencies...${NC}"
npm install
npm run install:all

# Generate Prisma clients
echo ""
echo -e "${CYAN}Generating Prisma clients...${NC}"
npm run prisma:generate

# Run migrations
echo ""
echo -e "${CYAN}Running database migrations...${NC}"
read -p "Do you want to run migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run prisma:migrate
    echo -e "${GREEN}✓${NC} Migrations completed"
else
    echo -e "${YELLOW}⚠${NC} Skipping migrations"
fi

# Build services
echo ""
echo -e "${CYAN}Building services...${NC}"
npm run build
echo -e "${GREEN}✓${NC} Build completed"

# Stop existing PM2 processes
echo ""
echo -e "${CYAN}Stopping existing services...${NC}"
pm2 delete all 2>/dev/null || true
echo -e "${GREEN}✓${NC} Existing services stopped"

# Start services with PM2
echo ""
echo -e "${CYAN}Starting services with PM2...${NC}"
pm2 start ecosystem.config.js
pm2 save

echo ""
echo -e "${GREEN}✓${NC} Services started"

# Wait a bit for services to initialize
echo ""
echo -e "${CYAN}Waiting for services to initialize...${NC}"
sleep 5

# Health check
echo ""
echo -e "${CYAN}Running health check...${NC}"
if command -v npm &> /dev/null; then
    npm run health:check || echo -e "${YELLOW}⚠${NC} Some services may not be healthy yet. Check logs with: pm2 logs"
else
    echo -e "${YELLOW}⚠${NC} Health check script not available"
fi

# Display status
echo ""
echo -e "${CYAN}Service Status:${NC}"
pm2 status

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Deployment completed!${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 status          - View service status"
echo "  pm2 logs            - View all logs"
echo "  pm2 logs <service>  - View specific service logs"
echo "  pm2 monit           - Real-time monitoring"
echo "  pm2 restart all     - Restart all services"
echo "  npm run health:check - Check service health"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

