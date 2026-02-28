# 🚀 Quick Start Deployment Guide

This is a condensed version of the full deployment guide. For detailed instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## Prerequisites Checklist

- [ ] VPS/Server (Ubuntu 22.04 LTS recommended)
  - Minimum: 2 CPU, 4GB RAM, 20GB SSD
  - Recommended: 4 CPU, 8GB RAM, 40GB SSD
- [ ] Domain name (optional but recommended)
- [ ] Neon DB account with 8 databases created
- [ ] Razorpay account (for payments)
- [ ] Email service account (SendGrid/Mailgun for notifications)

## Step-by-Step Deployment

### 1. Server Initial Setup (5-10 minutes)

```bash
# Connect to your server
ssh root@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -y pm2
pm2 startup systemd  # Follow the instructions

# Install RabbitMQ
curl -fsSL https://github.com/rabbitmq/signing-keys/releases/download/3.0/cloudsmith.rabbitmq-erlang.E495BB49CC4BBE5B.key | sudo apt-key add -
echo 'deb https://ppa1.novemberain.com/rabbitmq/rabbitmq-erlang/ubuntu jammy main' | sudo tee /etc/apt/sources.list.d/rabbitmq.list
echo 'deb https://ppa1.novemberain.com/rabbitmq/rabbitmq-server/ubuntu jammy main' | sudo tee -a /etc/apt/sources.list.d/rabbitmq.list
sudo apt update
sudo apt install -y rabbitmq-server
sudo rabbitmq-plugins enable rabbitmq_management
sudo systemctl start rabbitmq-server
sudo rabbitmqctl add_user admin YOUR_SECURE_PASSWORD
sudo rabbitmqctl set_user_tags admin administrator
sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"

# Install Nginx
sudo apt install -y nginx

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Clone and Setup Application (5 minutes)

```bash
# Clone repository
cd ~
git clone https://github.com/your-org/reseller-backend.git
cd reseller-backend

# Setup environment files
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh

# Edit .env files for each service with your credentials
# See DEPLOYMENT_GUIDE.md for required variables
```

### 3. Configure Environment Variables

**Critical variables to set in each service's `.env` file:**

1. **Database URLs** (from Neon DB):
   ```env
   DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require
   ```

2. **RabbitMQ URL**:
   ```env
   RABBITMQ_URL=amqp://admin:YOUR_SECURE_PASSWORD@localhost:5672
   ```

3. **JWT Secret** (API Gateway & Auth Service):
   ```env
   JWT_SECRET=your-super-secret-key-min-32-characters-long
   ```

4. **Razorpay Keys** (Payment Service):
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_secret_key
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

5. **CORS Origin** (API Gateway):
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

### 4. Deploy Application (5 minutes)

**Option A: Automated Script**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Option B: Manual Steps**
```bash
# Install dependencies
npm run install:all

# Generate Prisma clients
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Build services
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save

# Check status
pm2 status
npm run health:check
```

### 5. Configure Nginx Reverse Proxy (5 minutes)

```bash
sudo nano /etc/nginx/sites-available/reseller-backend
```

Paste this configuration (replace `api.yourdomain.com` with your domain or IP):

```nginx
upstream api_gateway {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/reseller-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Setup SSL Certificate (5 minutes)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 7. Update Razorpay Webhook

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://api.yourdomain.com/payments/webhook`
3. Copy webhook secret to `services/payment-service/.env`

### 8. Verify Deployment

```bash
# Check all services
npm run health:check

# Test API endpoint
curl https://api.yourdomain.com/health

# View logs
pm2 logs

# Monitor services
pm2 monit
```

## Common Issues & Quick Fixes

### Services Not Starting
```bash
pm2 logs                    # Check logs
pm2 restart all             # Restart all
pm2 delete all && pm2 start ecosystem.config.js  # Clean restart
```

### Database Connection Error
```bash
# Verify DATABASE_URL in .env
cat services/auth-service/.env | grep DATABASE_URL

# Test connection
cd services/auth-service
npx prisma db pull
```

### RabbitMQ Connection Error
```bash
sudo systemctl status rabbitmq-server
sudo systemctl restart rabbitmq-server
sudo rabbitmqctl status
```

### Nginx 502 Bad Gateway
```bash
# Check if services are running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart all
```

## Post-Deployment Checklist

- [ ] All services running (`pm2 status` shows all green)
- [ ] Health check passing (`npm run health:check`)
- [ ] HTTPS working (`curl https://api.yourdomain.com/health`)
- [ ] Razorpay webhook configured
- [ ] CORS configured correctly
- [ ] Logs directory exists and writable
- [ ] PM2 auto-start configured (`pm2 save`)
- [ ] SSL certificate auto-renewal working
- [ ] Firewall configured (ports 22, 80, 443 only)

## Monitoring Commands

```bash
# Service status
pm2 status

# Real-time monitoring
pm2 monit

# View logs
pm2 logs
pm2 logs api-gateway --lines 100

# Health check
npm run health:check

# System resources
htop
df -h
free -h
```

## Useful Links

- **Full Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **API Documentation**: [README.md](./README.md)
- **PM2 Docs**: https://pm2.keymetrics.io
- **Nginx Docs**: https://nginx.org
- **Let's Encrypt**: https://letsencrypt.org

## Support

If you encounter issues:
1. Check service logs: `pm2 logs <service-name>`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify environment variables are set correctly
4. Ensure all prerequisites are installed
5. Review the full deployment guide for detailed troubleshooting

---

**Total Deployment Time: ~30-45 minutes**

**Congratulations! Your backend is now live! 🎉**

