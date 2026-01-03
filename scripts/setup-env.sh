#!/bin/bash

# ============================================================
# Environment Setup Script for Reseller Backend
# ============================================================
# This script copies env.template files to .env files
# for all services that don't already have a .env file.
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SERVICES_DIR="$ROOT_DIR/services"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       RESELLER BACKEND - ENVIRONMENT SETUP                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

setup_service_env() {
    local service_dir=$1
    local service_name=$(basename "$service_dir")
    
    if [ -f "$service_dir/.env" ]; then
        echo -e "  ${YELLOW}⏭${NC}  $service_name - .env already exists, skipping"
        return 0
    fi
    
    if [ -f "$service_dir/env.template" ]; then
        cp "$service_dir/env.template" "$service_dir/.env"
        echo -e "  ${GREEN}✓${NC}  $service_name - .env created from template"
        return 0
    fi
    
    echo -e "  ${RED}✗${NC}  $service_name - No env.template found"
    return 1
}

# Setup each service
echo -e "${CYAN}Setting up environment files for services:${NC}"
echo ""

for service_dir in "$SERVICES_DIR"/*/; do
    if [ -d "$service_dir" ]; then
        setup_service_env "$service_dir"
    fi
done

echo ""
echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${GREEN}Environment setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit each service's .env file with your actual values"
echo "  2. Configure your Neon database URLs"
echo "  3. Set up RabbitMQ credentials"
echo "  4. Run 'npm run install:all' to install dependencies"
echo "  5. Run 'npm run prisma:generate' to generate Prisma clients"
echo "  6. Run 'npm run dev' to start all services in development mode"
echo ""

