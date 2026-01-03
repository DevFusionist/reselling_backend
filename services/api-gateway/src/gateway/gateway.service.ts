import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout } from 'rxjs';
import { CircuitBreakerService } from '../common/circuit-breaker/circuit-breaker.service';
import { DeduplicationService } from '../common/deduplication/deduplication.service';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private readonly serviceUrls: Record<string, string>;
  
  // Cache TTLs for different endpoints (in seconds)
  private readonly cacheTTLs: Record<string, number> = {
    'products': 900,      // 15 minutes
    'categories': 1800,   // 30 minutes
    'pricing': 600,      // 10 minutes
  };

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private circuitBreaker: CircuitBreakerService,
    private deduplicationService: DeduplicationService,
  ) {
    this.serviceUrls = {
      auth: this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:3001',
      product: this.configService.get<string>('PRODUCT_SERVICE_URL') || 'http://localhost:3002',
      pricing: this.configService.get<string>('PRICING_SERVICE_URL') || 'http://localhost:3003',
      order: this.configService.get<string>('ORDER_SERVICE_URL') || 'http://localhost:3004',
      payment: this.configService.get<string>('PAYMENT_SERVICE_URL') || 'http://localhost:3005',
      wallet: this.configService.get<string>('WALLET_SERVICE_URL') || 'http://localhost:3006',
      'share-link': this.configService.get<string>('SHARE_LINK_SERVICE_URL') || 'http://localhost:3007',
      notification: this.configService.get<string>('NOTIFICATION_SERVICE_URL') || 'http://localhost:3008',
    };
  }

  async proxyRequest(service: string, path: string, method: string, body?: any, headers?: any) {
    const serviceUrl = this.serviceUrls[service];

    if (!serviceUrl) {
      throw new HttpException(`Service ${service} not found`, HttpStatus.BAD_GATEWAY);
    }

    const url = `${serviceUrl}${path}`;

    // OPTIMIZATION: Request deduplication for mutating operations
    // Prevents duplicate orders, payments, etc. from being processed
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      const userId = headers?.['x-user-id'] || headers?.['user-id'];
      const isDuplicate = await this.deduplicationService.isDuplicate(
        method,
        `${service}:${path}`,
        body,
        userId,
        60, // 60 seconds TTL
      );

      if (isDuplicate) {
        throw new HttpException(
          'Duplicate request detected. Please wait before retrying.',
          HttpStatus.CONFLICT,
        );
      }
    }

    // OPTIMIZATION: Cache GET requests for cacheable endpoints
    if (method === 'GET' && this.isCacheable(service, path)) {
      try {
        const cacheKey = `gateway:${service}:${path}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
          this.logger.debug(`Cache HIT: ${method} ${url}`);
          return cached;
        }
      } catch (error) {
        // Cache unavailable - continue without cache
        this.logger.warn(`Cache unavailable for ${url}, continuing without cache:`, error.message);
      }
    }

    this.logger.log(`Proxying ${method} ${url}`);

    // OPTIMIZATION: Use circuit breaker to prevent cascading failures
    try {
      const responseData = await this.circuitBreaker.execute(
        service,
        async () => {
          // Only forward safe headers, remove hop-by-hop headers that cause issues
          const hopByHopHeaders = [
            'host',
            'connection',
            'keep-alive',
            'proxy-authenticate',
            'proxy-authorization',
            'te',
            'trailer',
            'transfer-encoding',
            'upgrade',
            'content-length', // Let axios calculate this
          ];
          
          const cleanedHeaders: Record<string, string> = {};
          if (headers) {
            for (const [key, value] of Object.entries(headers)) {
              if (!hopByHopHeaders.includes(key.toLowerCase()) && typeof value === 'string') {
                cleanedHeaders[key] = value;
              }
            }
          }
          
          const config: any = {
            method,
            url,
            timeout: 30000, // 30 seconds timeout per request
            headers: {
              ...cleanedHeaders,
              'Content-Type': 'application/json',
            },
          };

          if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.data = body;
          }
          
          this.logger.debug(`Request config:`, { method, url, hasBody: !!body });

          const response = await firstValueFrom(
            this.httpService.request(config).pipe(
              timeout(35000), // 35 seconds timeout (slightly longer than axios timeout)
            ),
          );
          
          return response.data;
        },
        {
          failureThreshold: parseInt(this.configService.get<string>('CIRCUIT_BREAKER_FAILURE_THRESHOLD') || '5', 10),
          successThreshold: parseInt(this.configService.get<string>('CIRCUIT_BREAKER_SUCCESS_THRESHOLD') || '2', 10),
          timeout: parseInt(this.configService.get<string>('CIRCUIT_BREAKER_TIMEOUT') || '30000', 10),
          resetTimeout: parseInt(this.configService.get<string>('CIRCUIT_BREAKER_RESET_TIMEOUT') || '60000', 10),
        },
      );
      
      // OPTIMIZATION: Cache successful GET responses
      if (method === 'GET' && this.isCacheable(service, path)) {
        try {
          const cacheKey = `gateway:${service}:${path}`;
          const ttl = this.getCacheTTL(service, path);
          await this.cacheManager.set(cacheKey, responseData, ttl);
          this.logger.debug(`Cached response: ${method} ${url} (TTL: ${ttl}s)`);
        } catch (error) {
          // Cache unavailable - continue without caching
          this.logger.warn(`Failed to cache response for ${url}:`, error.message);
        }
      }
      
      return responseData;
    } catch (error: any) {
      this.logger.error(`Error proxying to ${service}:`, error.message);
      this.logger.error(`Error details:`, {
        url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
      });
      
      if (error.response) {
        throw new HttpException(
          error.response.data || error.message,
          error.response.status || HttpStatus.BAD_GATEWAY,
        );
      }

      // Handle circuit breaker errors
      if (error.message?.includes('Circuit breaker is OPEN')) {
        throw new HttpException(
          `Service ${service} is currently unavailable (circuit breaker open)`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Handle timeout specifically
      if (
        error.code === 'ECONNABORTED' ||
        error.name === 'TimeoutError' ||
        error.message?.includes('timeout') ||
        error.message?.includes('Timeout')
      ) {
        throw new HttpException(
          `Service ${service} timeout - service may be unavailable or slow`,
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      throw new HttpException(
        `Service ${service} unavailable: ${error.message || 'Unknown error'}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Check if a request is cacheable
   */
  private isCacheable(service: string, path: string): boolean {
    // Cache product listings and details
    if (service === 'product' && (path.startsWith('/products') || path.startsWith('/categories'))) {
      return true;
    }
    // Cache pricing (but not calculations)
    if (service === 'pricing' && path.startsWith('/pricing') && !path.includes('/calculate')) {
      return true;
    }
    // Don't cache auth, orders, payments, wallets, notifications
    return false;
  }

  /**
   * Get cache TTL for a specific service and path
   */
  private getCacheTTL(service: string, path: string): number {
    if (service === 'product') {
      if (path.startsWith('/categories')) {
        return this.cacheTTLs['categories'];
      }
      return this.cacheTTLs['products'];
    }
    if (service === 'pricing') {
      return this.cacheTTLs['pricing'];
    }
    return 300; // Default 5 minutes
  }
}

