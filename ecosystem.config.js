/**
 * PM2 Ecosystem Configuration for Reseller Backend Microservices
 * 
 * Production-grade process management with:
 * - Cluster mode for multi-core utilization (where applicable)
 * - Automatic restarts and error handling
 * - Log management with rotation
 * - Memory limits and monitoring
 * - Graceful shutdown handling
 * 
 * Usage:
 *   pm2 start ecosystem.config.js          # Start all services
 *   pm2 start ecosystem.config.js --only api-gateway  # Start specific service
 *   pm2 logs                               # View all logs
 *   pm2 monit                              # Monitor dashboard
 *   pm2 reload ecosystem.config.js         # Zero-downtime reload
 */

module.exports = {
  apps: [
    // ===========================================
    // AUTH SERVICE
    // ===========================================
    {
      name: 'auth-service',
      script: 'dist/main.js',
      cwd: './services/auth-service',
      instances: 1, // Single instance for RabbitMQ queue consumption
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_file: './services/auth-service/.env',
      error_file: './logs/auth-service-error.log',
      out_file: './logs/auth-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
    },

    // ===========================================
    // PRODUCT SERVICE
    // ===========================================
    {
      name: 'product-service',
      script: 'dist/main.js',
      cwd: './services/product-service',
      instances: 'max', // Cluster mode - scale to CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      env_file: './services/product-service/.env',
      error_file: './logs/product-service-error.log',
      out_file: './logs/product-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
    },

    // ===========================================
    // PRICING SERVICE
    // ===========================================
    {
      name: 'pricing-service',
      script: 'dist/main.js',
      cwd: './services/pricing-service',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      env_file: './services/pricing-service/.env',
      error_file: './logs/pricing-service-error.log',
      out_file: './logs/pricing-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
    },

    // ===========================================
    // ORDER SERVICE
    // ===========================================
    {
      name: 'order-service',
      script: 'dist/main.js',
      cwd: './services/order-service',
      instances: 1, // Single instance for RabbitMQ event publishing consistency
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
      env_file: './services/order-service/.env',
      error_file: './logs/order-service-error.log',
      out_file: './logs/order-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
    },

    // ===========================================
    // PAYMENT SERVICE
    // ===========================================
    {
      name: 'payment-service',
      script: 'dist/main.js',
      cwd: './services/payment-service',
      instances: 1, // Single instance for webhook handling consistency
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
      env_file: './services/payment-service/.env',
      error_file: './logs/payment-service-error.log',
      out_file: './logs/payment-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
    },

    // ===========================================
    // WALLET SERVICE
    // ===========================================
    {
      name: 'wallet-service',
      script: 'dist/main.js',
      cwd: './services/wallet-service',
      instances: 1, // Single instance for event consumption
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3006,
      },
      env_file: './services/wallet-service/.env',
      error_file: './logs/wallet-service-error.log',
      out_file: './logs/wallet-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
    },

    // ===========================================
    // SHARE-LINK SERVICE
    // ===========================================
    {
      name: 'share-link-service',
      script: 'dist/main.js',
      cwd: './services/share-link-service',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3007,
      },
      env_file: './services/share-link-service/.env',
      error_file: './logs/share-link-service-error.log',
      out_file: './logs/share-link-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
    },

    // ===========================================
    // NOTIFICATION SERVICE
    // ===========================================
    {
      name: 'notification-service',
      script: 'dist/main.js',
      cwd: './services/notification-service',
      instances: 1, // Single instance for event consumption
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
      },
      env_file: './services/notification-service/.env',
      error_file: './logs/notification-service-error.log',
      out_file: './logs/notification-service-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
    },

    // ===========================================
    // API GATEWAY (Entry Point)
    // ===========================================
    {
      name: 'api-gateway',
      script: 'dist/main.js',
      cwd: './services/api-gateway',
      instances: 'max', // Cluster mode for high availability
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G', // Gateway handles more traffic
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: './services/api-gateway/.env',
      error_file: './logs/api-gateway-error.log',
      out_file: './logs/api-gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/reseller-backend.git',
      path: '/var/www/reseller-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm run install:all && npm run build && npm run prisma:migrate && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};

