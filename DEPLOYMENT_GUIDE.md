# 🚀 Complete Deployment Guide - Reseller Backend

This guide covers deploying your microservices e-commerce backend to production on the internet.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [Server Setup](#server-setup)
4. [Database Setup (Neon DB)](#database-setup-neon-db)
5. [RabbitMQ Setup](#rabbitmq-setup)
6. [Application Deployment](#application-deployment)
7. [Reverse Proxy (Nginx)](#reverse-proxy-nginx)
8. [SSL/HTTPS Setup](#sslhttps-setup)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts & Services

1. **Server/VPS Provider** (choose one):
   - DigitalOcean Droplet (recommended: $12-24/month)
   - AWS EC2 (t3.small or larger)
   - Google Cloud Compute Engine
   - Azure Virtual Machine
   - Linode
   - Vultr

2. **Database Provider**:
   - Neon DB account ([neon.tech](https://neon.tech)) - Already configured
   - Or self-hosted PostgreSQL (advanced)

3. **Domain Name** (optional but recommended):
   - Namecheap, GoDaddy, Cloudflare, etc.

4. **Payment Gateway**:
   - Razorpay account ([razorpay.com](https://razorpay.com))

5. **Email Service** (for notifications):
   - SendGrid, Mailgun, AWS SES, or SMTP server

### Server Requirements

**Minimum Specifications:**
- **CPU**: 2 cores
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB SSD
- **OS**: Ubuntu 22.04 LTS (recommended)
- **Network**: Public IP address

**Recommended for Production:**
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 40GB+ SSD
- **OS**: Ubuntu 22.04 LTS

---

## Deployment Options

### Option 1: Single Server Deployment (Recommended for Start)
- All services on one server
- Simple setup and management
- Cost-effective
- Good for small to medium traffic
- **Uses PM2 for process management**

### Option 2: Docker Deployment
- Containerized services
- Easy scaling
- Better isolation
- Requires Docker knowledge
- **See [Docker Deployment](#docker-deployment) section below**

### Option 3: Kubernetes Deployment (Advanced)
- Auto-scaling
- High availability
- Complex setup
- For large-scale production

**This guide focuses on Option 1 (Single Server) with PM2, which is the simplest and most cost-effective.**

### Quick Deployment Script

For automated deployment, use the provided script:

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run deployment script
./scripts/deploy.sh
```

The script will:
- Check prerequisites
- Install dependencies
- Generate Prisma clients
- Run migrations (with confirmation)
- Build all services
- Start services with PM2
- Run health checks

---

## Server Setup

### Step 1: Initial Server Configuration

#### 1.1 Connect to Your Server

```bash
# SSH into your server
ssh root@your-server-ip

# Or if using a non-root user
ssh your-user@your-server-ip
```

#### 1.2 Update System

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

#### 1.3 Create Deployment User (Recommended)

```bash
# Create a new user for deployment
sudo adduser deploy
sudo usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

#### 1.4 Install Node.js 18+

```bash
# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x or higher
npm --version
```

#### 1.5 Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on system boot
pm2 startup systemd
# Follow the instructions shown (usually run a sudo command)
```

#### 1.6 Install RabbitMQ

```bash
# Add RabbitMQ repository
curl -fsSL https://github.com/rabbitmq/signing-keys/releases/download/3.0/cloudsmith.rabbitmq-erlang.E495BB49CC4BBE5B.key | sudo apt-key add -
echo 'deb https://ppa1.novemberain.com/rabbitmq/rabbitmq-erlang/ubuntu jammy main' | sudo tee /etc/apt/sources.list.d/rabbitmq.list
echo 'deb https://ppa1.novemberain.com/rabbitmq/rabbitmq-server/ubuntu jammy main' | sudo tee -a /etc/apt/sources.list.d/rabbitmq.list

# Update and install
sudo apt update
sudo apt install -y rabbitmq-server

# Enable RabbitMQ management plugin
sudo rabbitmq-plugins enable rabbitmq_management

# Start RabbitMQ
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server

# Create admin user (change password!)
sudo rabbitmqctl add_user admin YOUR_SECURE_PASSWORD
sudo rabbitmqctl set_user_tags admin administrator
sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"

# Remove default guest user (security)
sudo rabbitmqctl delete_user guest
```

**RabbitMQ Management UI**: `http://your-server-ip:15672`
- Username: `admin`
- Password: `YOUR_SECURE_PASSWORD`

#### 1.7 Install Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

#### 1.8 Configure Firewall

```bash
# Install UFW if not installed
sudo apt install -y ufw

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow RabbitMQ management (optional, can be restricted later)
sudo ufw allow 15672/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Database Setup (Neon DB)

### Step 2: Configure Neon Databases

Since you're using Neon DB (serverless PostgreSQL), you need to:

1. **Log in to Neon Console**: [console.neon.tech](https://console.neon.tech)

2. **Create Databases for Each Service**:
   - Create 8 separate databases (one per service):
     - `auth_db`
     - `product_db`
     - `pricing_db`
     - `order_db`
     - `payment_db`
     - `wallet_db`
     - `share_link_db`
     - `notification_db`

3. **Get Connection Strings**:
   - For each database, copy the connection string
   - Format: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`

4. **Note**: Neon DB is serverless, so no server setup needed!

---

## RabbitMQ Setup

### Step 3: Configure RabbitMQ for Production

```bash
# Edit RabbitMQ configuration
sudo nano /etc/rabbitmq/rabbitmq.conf
```

Add these settings:

```conf
# Listen on all interfaces (or specific IP)
listeners.tcp.default = 5672

# Management plugin
management.tcp.port = 15672
management.tcp.ip = 0.0.0.0

# Memory and disk limits
vm_memory_high_watermark.relative = 0.6
disk_free_limit.absolute = 2GB

# Logging
log.console = true
log.console.level = info
```

Restart RabbitMQ:

```bash
sudo systemctl restart rabbitmq-server
```

### Secure RabbitMQ Management UI

Create Nginx reverse proxy for RabbitMQ (optional but recommended):

```bash
sudo nano /etc/nginx/sites-available/rabbitmq
```

```nginx
server {
    listen 80;
    server_name rabbitmq.yourdomain.com;  # Or use IP

    location / {
        proxy_pass http://localhost:15672;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/rabbitmq /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Application Deployment

### Step 4: Deploy Your Application

#### 4.1 Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/your-org/reseller-backend.git
cd reseller-backend

# Or if using SSH
git clone git@github.com:your-org/reseller-backend.git
cd reseller-backend
```

#### 4.2 Install Dependencies

```bash
# Install root dependencies
npm install

# Install all service dependencies
npm run install:all
```

#### 4.3 Setup Environment Variables

```bash
# Run setup script
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh
```

Now edit each service's `.env` file:

**For each service** (`services/*/env.template` or `.env`), configure:

```bash
# Example: services/auth-service/.env
DATABASE_URL=postgresql://user:password@host.neon.tech/auth_db?sslmode=require
RABBITMQ_URL=amqp://admin:YOUR_SECURE_PASSWORD@localhost:5672
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
LOG_LEVEL=error,warn,log
```

**Key Environment Variables by Service:**

**API Gateway** (`services/api-gateway/.env`):
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
LOG_LEVEL=error,warn,log

# Service URLs (internal)
AUTH_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
PRICING_SERVICE_URL=http://localhost:3003
ORDER_SERVICE_URL=http://localhost:3004
PAYMENT_SERVICE_URL=http://localhost:3005
WALLET_SERVICE_URL=http://localhost:3006
SHARE_LINK_SERVICE_URL=http://localhost:3007
NOTIFICATION_SERVICE_URL=http://localhost:3008
```

**Auth Service** (`services/auth-service/.env`):
```env
DATABASE_URL=postgresql://user:password@host.neon.tech/auth_db?sslmode=require
RABBITMQ_URL=amqp://admin:YOUR_SECURE_PASSWORD@localhost:5672
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
```

**Product Service** (`services/product-service/.env`):
```env
DATABASE_URL=postgresql://user:password@host.neon.tech/product_db?sslmode=require
RABBITMQ_URL=amqp://admin:YOUR_SECURE_PASSWORD@localhost:5672
PORT=3002
NODE_ENV=production
```

**Pricing Service** (`services/pricing-service/.env`):
```env
DATABASE_URL=postgresql://user:password@host.neon.tech/pricing_db?sslmode=require
RABBITMQ_URL=amqp://admin:YOUR_SECURE_PASSWORD@localhost:5672
PORT=3003
NODE_ENV=production
```

**Order Service** (`services/order-service/.env`):
```env
DATABASE_URL=postgresql://user:password@host.neon.tech/order_db?sslmode=require
RABBITMQ_URL=amqp://admin:YOUR_SECURE_PASSWORD@localhost:5672
PRICING_SERVICE_URL=http://localhost:3003
PORT=3004
NODE_ENV=production
```

**Payment Service** (`services/payment-service/.env`):
```env
DATABASE_URL=postgresql://user:password@host.neon.tech/payment_db?sslmode=require
RABBITMQ_URL=amqp://admin:YOUR_SECURE_PASSWORD@localhost:5672
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
PORT=3005
NODE_ENV=production
```

**Wallet Service** (`services/wallet-service/.env`):
```env
DATABASE_URL=postgresql://user:password@host.neon.tech/wallet_db?sslmode=require
RABBITMQ_URL=amqp://admin:YOUR_SECURE_PASSWORD@localhost:5672
PORT=3006
NODE_ENV=production
```

**Share-Link Service** (`services/share-link-service/.env`):
```env
DATABASE_URL=postgresql://user:password@host.neon.tech/share_link_db?sslmode=require
RABBITMQ_URL=amqp://admin:YOUR_SECURE_PASSWORD@localhost:5672
PRICING_SERVICE_URL=http://localhost:3003
PORT=3007
NODE_ENV=production
```

**Notification Service** (`services/notification-service/.env`):
```env
DATABASE_URL=postgresql://user:password@host.neon.tech/notification_db?sslmode=require
RABBITMQ_URL=amqp://admin:YOUR_SECURE_PASSWORD@localhost:5672
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@yourdomain.com
PORT=3008
NODE_ENV=production
```

#### 4.4 Generate Prisma Clients

```bash
npm run prisma:generate
```

#### 4.5 Run Database Migrations

```bash
# Run migrations for all services
npm run prisma:migrate
```

#### 4.6 Build All Services

```bash
npm run build
```

#### 4.7 Start Services with PM2

```bash
# Start all services
npm run start:prod

# Or manually
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Save PM2 configuration
pm2 save
```

#### 4.8 Verify Services are Running

```bash
# Check health of all services
npm run health:check

# Or manually check each service
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
# ... etc
```

---

## Reverse Proxy (Nginx)

### Step 5: Configure Nginx as Reverse Proxy

Create Nginx configuration for your API:

```bash
sudo nano /etc/nginx/sites-available/reseller-backend
```

```nginx
# Upstream definitions for load balancing (optional)
upstream api_gateway {
    least_conn;
    server localhost:3000 max_fails=3 fail_timeout=30s;
    # Add more instances if running in cluster mode
    # server localhost:3001 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your domain or IP

    # Logging
    access_log /var/log/nginx/reseller-backend-access.log;
    error_log /var/log/nginx/reseller-backend-error.log;

    # Client body size limit (for file uploads)
    client_max_body_size 10M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Main API location
    location / {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support (if needed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # Health check endpoint (optional - can be public)
    location /health {
        proxy_pass http://api_gateway/health;
        access_log off;
    }

    # Rate limiting (optional)
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    
    location / {
        limit_req zone=api_limit burst=20 nodelay;
        # ... rest of proxy config
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/reseller-backend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## SSL/HTTPS Setup

### Step 6: Setup SSL Certificate with Let's Encrypt

#### 6.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 6.2 Obtain SSL Certificate

```bash
# Replace with your domain
sudo certbot --nginx -d api.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

#### 6.3 Auto-Renewal

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

#### 6.4 Update Nginx Configuration (if needed)

Certbot automatically updates your Nginx config, but you can manually edit:

```bash
sudo nano /etc/nginx/sites-available/reseller-backend
```

The configuration should now include SSL settings:

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # ... rest of config
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

### Update Razorpay Webhook URL

After setting up HTTPS, update your Razorpay webhook URL:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Update webhook URL to: `https://api.yourdomain.com/payments/webhook`
3. Verify the webhook secret matches your `RAZORPAY_WEBHOOK_SECRET`

---

## Monitoring & Maintenance

### Step 7: Setup Monitoring

#### 7.1 PM2 Monitoring

```bash
# View real-time monitoring
pm2 monit

# View logs
pm2 logs

# View specific service logs
pm2 logs api-gateway

# Restart services
pm2 restart all
pm2 restart api-gateway

# Stop services
pm2 stop all

# Delete services
pm2 delete all
```

#### 7.2 Setup Log Rotation

Create logrotate configuration:

```bash
sudo nano /etc/logrotate.d/reseller-backend
```

```conf
/home/deploy/reseller-backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### 7.3 Health Check Script

Create a cron job for automated health checks:

```bash
crontab -e
```

Add:

```cron
# Health check every 5 minutes
*/5 * * * * cd /home/deploy/reseller-backend && npm run health:check >> /var/log/reseller-health.log 2>&1
```

#### 7.4 Setup Uptime Monitoring (Optional)

Use external services:
- **UptimeRobot** (free): [uptimerobot.com](https://uptimerobot.com)
- **Pingdom**: [pingdom.com](https://pingdom.com)
- **StatusCake**: [statuscake.com](https://statuscake.com)

Monitor: `https://api.yourdomain.com/health`

---

## Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check PM2 logs
pm2 logs

# Check service-specific logs
pm2 logs auth-service --lines 100

# Check if ports are in use
sudo netstat -tulpn | grep :3000

# Restart a specific service
pm2 restart auth-service
```

#### Database Connection Issues

```bash
# Test database connection
cd services/auth-service
npx prisma db pull

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

#### RabbitMQ Connection Issues

```bash
# Check RabbitMQ status
sudo systemctl status rabbitmq-server

# Check RabbitMQ logs
sudo tail -f /var/log/rabbitmq/rabbit@*.log

# Test connection
sudo rabbitmqctl status
```

#### Nginx Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

#### High Memory Usage

```bash
# Check memory usage
free -h
pm2 monit

# Restart services to free memory
pm2 restart all
```

#### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Server provisioned and configured
- [ ] Node.js 18+ installed
- [ ] PM2 installed and configured
- [ ] RabbitMQ installed and running
- [ ] Nginx installed and configured
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Domain name configured (DNS A record pointing to server IP)

### Database Setup

- [ ] Neon DB account created
- [ ] 8 databases created (one per service)
- [ ] Connection strings copied
- [ ] Database URLs added to `.env` files

### Application Setup

- [ ] Repository cloned
- [ ] Dependencies installed (`npm run install:all`)
- [ ] Environment variables configured for all services
- [ ] Prisma clients generated (`npm run prisma:generate`)
- [ ] Database migrations run (`npm run prisma:migrate`)
- [ ] Services built (`npm run build`)
- [ ] Services started with PM2 (`npm run start:prod`)
- [ ] Health checks passing (`npm run health:check`)

### Production Configuration

- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] HTTPS working
- [ ] CORS configured correctly
- [ ] Razorpay webhook URL updated
- [ ] Log rotation configured
- [ ] Monitoring setup

### Security

- [ ] Strong passwords set (RabbitMQ, databases)
- [ ] JWT secret is secure (32+ characters)
- [ ] Environment variables secured (not in git)
- [ ] Firewall enabled
- [ ] SSH key authentication (disable password auth)
- [ ] Rate limiting configured
- [ ] CORS origins restricted

---

## Docker Deployment (Alternative)

### Prerequisites for Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Add user to docker group (logout/login required)
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

### Docker Setup

**Note**: Docker setup is optional. The project currently uses PM2 for deployment. If you want to use Docker, you'll need to:

1. Create Dockerfiles for each service
2. Create a `docker-compose.yml` file
3. Configure environment variables in Docker Compose

**Benefits of Docker:**
- Isolated environments
- Easy scaling
- Consistent deployments
- Better resource management

**When to use Docker:**
- Multiple environments (dev/staging/prod)
- Need for easy scaling
- Team deployments
- CI/CD pipelines

**When to use PM2 (current setup):**
- Single server deployment
- Simpler setup
- Lower resource overhead
- Faster startup times

For now, **PM2 deployment is recommended** as it's simpler and more resource-efficient for single-server deployments.

---

## Quick Reference Commands

```bash
# Start all services
pm2 start ecosystem.config.js

# Stop all services
pm2 stop all

# Restart all services
pm2 restart all

# View logs
pm2 logs

# View status
pm2 status

# Health check
npm run health:check

# Rebuild and restart
npm run build && pm2 restart all

# Run migrations
npm run prisma:migrate

# Nginx reload
sudo systemctl reload nginx

# Check service health
curl https://api.yourdomain.com/health
```

---

## Next Steps

1. **Setup CI/CD**: Automate deployments with GitHub Actions or GitLab CI
2. **Add Monitoring**: Integrate with services like Datadog, New Relic, or Grafana
3. **Setup Backups**: Automate database backups
4. **Scale Horizontally**: Add more servers and use load balancer
5. **Add CDN**: Use Cloudflare or AWS CloudFront for static assets
6. **Implement Caching**: Add Redis for caching frequently accessed data

---

## Support & Resources

- **NestJS Documentation**: [docs.nestjs.com](https://docs.nestjs.com)
- **PM2 Documentation**: [pm2.keymetrics.io](https://pm2.keymetrics.io)
- **Nginx Documentation**: [nginx.org](https://nginx.org)
- **Let's Encrypt**: [letsencrypt.org](https://letsencrypt.org)
- **Neon DB Docs**: [neon.tech/docs](https://neon.tech/docs)

---

**Congratulations! Your microservices backend is now deployed and accessible on the internet! 🎉**

