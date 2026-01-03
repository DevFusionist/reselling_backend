#!/usr/bin/env node

/**
 * Health Check Script for Reseller Backend Microservices
 * 
 * Checks the health status of all microservices and provides
 * a comprehensive status report.
 * 
 * Usage:
 *   node scripts/health-check.js
 *   npm run health:check
 */

const http = require('http');

const services = [
  { name: 'API Gateway', url: 'http://localhost:3000/health', port: 3000 },
  { name: 'Auth Service', url: 'http://localhost:3001/health', port: 3001 },
  { name: 'Product Service', url: 'http://localhost:3002/health', port: 3002 },
  { name: 'Pricing Service', url: 'http://localhost:3003/health', port: 3003 },
  { name: 'Order Service', url: 'http://localhost:3004/health', port: 3004 },
  { name: 'Payment Service', url: 'http://localhost:3005/health', port: 3005 },
  { name: 'Wallet Service', url: 'http://localhost:3006/health', port: 3006 },
  { name: 'Share-Link Service', url: 'http://localhost:3007/health', port: 3007 },
  { name: 'Notification Service', url: 'http://localhost:3008/health', port: 3008 },
];

const TIMEOUT_MS = 5000;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function checkHealth(service) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const req = http.get(service.url, { timeout: TIMEOUT_MS }, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          ...service,
          status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
          statusCode: res.statusCode,
          responseTime,
          response: data ? JSON.parse(data) : null,
        });
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        ...service,
        status: 'down',
        statusCode: null,
        responseTime,
        error: error.code || error.message,
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      resolve({
        ...service,
        status: 'timeout',
        statusCode: null,
        responseTime,
        error: 'Request timeout',
      });
    });
  });
}

function getStatusIcon(status) {
  switch (status) {
    case 'healthy':
      return `${colors.green}✓${colors.reset}`;
    case 'unhealthy':
      return `${colors.yellow}!${colors.reset}`;
    case 'down':
    case 'timeout':
      return `${colors.red}✗${colors.reset}`;
    default:
      return '?';
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'healthy':
      return colors.green;
    case 'unhealthy':
      return colors.yellow;
    case 'down':
    case 'timeout':
      return colors.red;
    default:
      return colors.reset;
  }
}

async function main() {
  console.log('\n');
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}       RESELLER BACKEND - SERVICE HEALTH CHECK${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log('\n');

  const startTime = Date.now();
  const results = await Promise.all(services.map(checkHealth));
  const totalTime = Date.now() - startTime;

  // Display results
  console.log(`${colors.bright}Service Status:${colors.reset}\n`);
  
  const maxNameLength = Math.max(...services.map(s => s.name.length));
  
  results.forEach((result) => {
    const icon = getStatusIcon(result.status);
    const statusColor = getStatusColor(result.status);
    const paddedName = result.name.padEnd(maxNameLength);
    const responseTimeStr = `${result.responseTime}ms`.padStart(7);
    
    let statusDetails = '';
    if (result.status === 'healthy') {
      statusDetails = `${statusColor}${result.status.toUpperCase()}${colors.reset}`;
    } else if (result.error) {
      statusDetails = `${statusColor}${result.status.toUpperCase()} (${result.error})${colors.reset}`;
    } else {
      statusDetails = `${statusColor}${result.status.toUpperCase()} (HTTP ${result.statusCode})${colors.reset}`;
    }
    
    console.log(`  ${icon} ${colors.bright}${paddedName}${colors.reset} [${colors.cyan}:${result.port}${colors.reset}] ${responseTimeStr} - ${statusDetails}`);
  });

  // Summary
  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const totalCount = results.length;
  
  console.log('\n');
  console.log(`${colors.bright}${colors.cyan}───────────────────────────────────────────────────────────${colors.reset}`);
  console.log(`${colors.bright}Summary:${colors.reset}`);
  
  const summaryColor = healthyCount === totalCount ? colors.green : 
                       healthyCount > 0 ? colors.yellow : colors.red;
  
  console.log(`  ${summaryColor}${healthyCount}/${totalCount} services healthy${colors.reset}`);
  console.log(`  Total check time: ${totalTime}ms`);
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log(`${colors.bright}${colors.cyan}───────────────────────────────────────────────────────────${colors.reset}`);
  console.log('\n');

  // Exit with appropriate code
  process.exit(healthyCount === totalCount ? 0 : 1);
}

main().catch((error) => {
  console.error(`${colors.red}Health check failed:${colors.reset}`, error);
  process.exit(1);
});

