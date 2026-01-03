#!/bin/bash

# ============================================================
# RabbitMQ Installation Script for Ubuntu/Debian
# ============================================================
# This script installs RabbitMQ with management plugin
# ============================================================

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       RABBITMQ INSTALLATION SCRIPT                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run this script with sudo${NC}"
    exit 1
fi

echo -e "${CYAN}Step 1: Adding RabbitMQ signing key and repository...${NC}"

# Add RabbitMQ signing key
curl -1sLf "https://keys.openpgp.org/vks/v1/by-fingerprint/0A9AF2115F4687BD29803A206B73A36E6026DFCA" | gpg --dearmor | tee /usr/share/keyrings/com.rabbitmq.team.gpg > /dev/null

# Add Erlang repository signing key
curl -1sLf "https://ppa.launchpadcontent.net/rabbitmq/rabbitmq-erlang/ubuntu/pool/main/r/rabbitmq-erlang/rabbitmq-erlang_1%3A26.2.5.2-1rmq2ppa~noble1_amd64.deb" 2>/dev/null || true

# Add repository
echo "deb [signed-by=/usr/share/keyrings/com.rabbitmq.team.gpg] https://ppa1.novemberain.com/rabbitmq/rabbitmq-erlang/deb/ubuntu $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/rabbitmq-erlang.list
echo "deb [signed-by=/usr/share/keyrings/com.rabbitmq.team.gpg] https://ppa1.novemberain.com/rabbitmq/rabbitmq-server/deb/ubuntu $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/rabbitmq.list

echo -e "${GREEN}✓ Repository added${NC}"

echo -e "${CYAN}Step 2: Updating package list...${NC}"
apt-get update -qq

echo -e "${CYAN}Step 3: Installing Erlang and RabbitMQ...${NC}"
apt-get install -y erlang-base \
                   erlang-asn1 erlang-crypto erlang-eldap erlang-ftp erlang-inets \
                   erlang-mnesia erlang-os-mon erlang-parsetools erlang-public-key \
                   erlang-runtime-tools erlang-snmp erlang-ssl \
                   erlang-syntax-tools erlang-tftp erlang-tools erlang-xmerl

apt-get install rabbitmq-server -y --fix-missing

echo -e "${GREEN}✓ RabbitMQ installed${NC}"

echo -e "${CYAN}Step 4: Enabling RabbitMQ management plugin...${NC}"
rabbitmq-plugins enable rabbitmq_management

echo -e "${CYAN}Step 5: Starting RabbitMQ service...${NC}"
systemctl start rabbitmq-server
systemctl enable rabbitmq-server

echo -e "${CYAN}Step 6: Creating admin user...${NC}"
# Delete default guest user for security
rabbitmqctl delete_user guest 2>/dev/null || true

# Create admin user
rabbitmqctl add_user admin admin123 2>/dev/null || rabbitmqctl change_password admin admin123
rabbitmqctl set_user_tags admin administrator
rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"

echo -e "${GREEN}✓ Admin user created${NC}"

echo ""
echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${GREEN}RabbitMQ installation complete!${NC}"
echo ""
echo "Access Information:"
echo "  - AMQP URL: amqp://admin:admin123@localhost:5672"
echo "  - Management UI: http://localhost:15672"
echo "  - Username: admin"
echo "  - Password: admin123"
echo ""
echo -e "${YELLOW}⚠ IMPORTANT: Change the default password in production!${NC}"
echo ""

