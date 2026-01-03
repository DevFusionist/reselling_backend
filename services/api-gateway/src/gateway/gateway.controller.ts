import { Controller, Req, Body, All, HttpException, HttpStatus, Inject, Logger, OnModuleInit } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController implements OnModuleInit {
  private readonly logger = new Logger(GatewayController.name);
  // Service routing configuration
  private readonly serviceRoutes: Record<string, { service: string; requiresAuth: boolean; useRabbitMQ: boolean }> = {
    'auth': { service: 'auth', requiresAuth: false, useRabbitMQ: true },
    'products': { service: 'product', requiresAuth: false, useRabbitMQ: false },
    'categories': { service: 'product', requiresAuth: true, useRabbitMQ: false },
    'pricing': { service: 'pricing', requiresAuth: false, useRabbitMQ: false },
    'orders': { service: 'order', requiresAuth: true, useRabbitMQ: false },
    'payments': { service: 'payment', requiresAuth: true, useRabbitMQ: false },
    'wallets': { service: 'wallet', requiresAuth: true, useRabbitMQ: false },
    'share-links': { service: 'share-link', requiresAuth: false, useRabbitMQ: false },
    'notifications': { service: 'notification', requiresAuth: true, useRabbitMQ: false },
  };

  // Public endpoints (no auth required)
  private readonly publicEndpoints = [
    '/auth/register',
    '/auth/login',
    '/auth/refresh',
    '/payments/webhook',
    '/categories',
  ];

  // Protected endpoints that require auth even if the service doesn't require auth by default
  private readonly protectedEndpoints = [
    '/auth/me',
    // for categories route only making the creating, updating and deleting categories to be protected
    '/categories/create',
    '/categories/update/:id',
    '/categories/delete/:id',
  ];

  constructor(
    @Inject('AUTH_SERVICE') private authClient: ClientProxy,
    private gatewayService: GatewayService,
  ) {}

  async onModuleInit() {
    try {
      await this.authClient.connect();
      this.logger.log('✅ RabbitMQ client connected to AUTH_SERVICE');
      
      // Verify connection by checking if client is connected
      const isConnected = this.authClient instanceof Object && 'connected' in this.authClient;
      this.logger.log(`RabbitMQ client connection status: ${isConnected ? 'Connected' : 'Unknown'}`);
    } catch (error) {
      this.logger.error('❌ Failed to connect RabbitMQ client to AUTH_SERVICE:', error);
      this.logger.error('Error details:', JSON.stringify(error, null, 2));
    }
  }

  // Catch-all for dynamic routes - register multiple patterns
  // @All('auth')
  // @All('auth/*')
  // @All('products')
  // @All('products/*')
  // @All('pricing')
  // @All('pricing/*')
  // @All('orders')
  // @All('orders/*')
  // @All('payments')
  // @All('payments/*')
  // @All('wallets')
  // @All('wallets/*')
  // @All('share-links')
  // @All('share-links/*')
  // @All('notifications')
  // @All('notifications/*')
  @All('*')
  async handleRequest(@Req() req: Request, @Body() body: any) {
    const path = req.url;
    const method = req.method;

    // Log request details for debugging
    this.logger.debug(`[${method}] ${path}`);
    this.logger.debug('Request body:', JSON.stringify(body, null, 2));

    // Extract the base route (e.g., 'auth' from '/auth/login')
    const baseRoute = path.split('/')[1].split('?')[0]; // Remove query params

    this.logger.debug('baseRoute', baseRoute);
    this.logger.debug('serviceRoutes', this.serviceRoutes);
    
    // Check if this is a public endpoint
    const isPublic = this.publicEndpoints.some(endpoint => path.startsWith(endpoint));
    
    // Check if this is a protected endpoint (requires auth even if service doesn't)
    const isProtected = this.protectedEndpoints.some(endpoint => path.startsWith(endpoint));

    // Get service configuration
    const routeConfig = this.serviceRoutes[baseRoute];
    this.logger.debug('routeConfig', routeConfig);
    if (!routeConfig) {
      throw new HttpException(`Service route not found for: ${baseRoute}`, HttpStatus.NOT_FOUND);
    }

    // Handle authentication - required if service requires auth OR endpoint is protected
    if ((routeConfig.requiresAuth || isProtected) && !isPublic) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HttpException('Unauthorized - Missing or invalid token', HttpStatus.UNAUTHORIZED);
      }

      const token = authHeader.substring(7);
      
      try {
        const validation: any = await firstValueFrom(
          this.authClient.send({ cmd: 'auth.validateToken' }, { token }).pipe(
            timeout(5000),
            catchError((error) => {
              this.logger.error('Auth service error:', error);
              throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
            }),
          ),
        );

        if (!validation.valid) {
          throw new HttpException('Unauthorized - Invalid token', HttpStatus.UNAUTHORIZED);
        }

        // Attach user info to request for downstream services
        (req as any).user = validation.user;
      } catch (error: any) {
        this.logger.error('Authentication error:', error);
        throw new HttpException(
          error.message || 'Authentication failed',
          error.status || HttpStatus.UNAUTHORIZED,
        );
      }
    }

    // Handle RabbitMQ-based services (auth service)
    if (routeConfig.useRabbitMQ) {
      return this.handleRabbitMQRequest(req, path, method, body);
    }

    // Handle HTTP-based services (all other services)
    // Attach user info to headers if authenticated (for downstream services)
    const headersToForward = { ...req.headers };
    if ((req as any).user) {
      headersToForward['x-user-info'] = JSON.stringify((req as any).user);
    }
    
    return this.gatewayService.proxyRequest(
      routeConfig.service,
      path,
      method,
      body,
      headersToForward,
    );
  }

  private async handleRabbitMQRequest(req: Request, path: string, method: string, body: any) {
    // Normalize path by removing query parameters
    const normalizedPath = path.split('?')[0];
    
    this.logger.debug(`Handling RabbitMQ request: ${method} ${normalizedPath}`);
    this.logger.debug(`Request body: ${JSON.stringify(body)}`);

    // Map HTTP paths to RabbitMQ commands
    const commandMap: Record<string, string> = {
      'POST /auth/register': 'auth.register',
      'POST /auth/login': 'auth.login',
      'POST /auth/refresh': 'auth.refresh',
      'GET /auth/me': 'auth.getProfile',
    };

    const commandKey = `${method} ${normalizedPath}`;
    const command = commandMap[commandKey];

    this.logger.debug('RabbitMQ command:', command);

    if (!command) {
      this.logger.error(`Command not found for: ${commandKey}`);
      throw new HttpException(`Command not found for: ${commandKey}`, HttpStatus.NOT_FOUND);
    }

    // Prepare payload based on command
    let payload: any = body;
    
    // For /auth/me, extract userId from the authenticated user
    if (command === 'auth.getProfile') {
      const user = (req as any).user;
      if (!user || !user.sub) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }
      payload = { userId: user.sub };
      this.logger.debug(`Extracted userId for /auth/me: ${user.sub}`);
    }

    this.logger.debug(`Sending RabbitMQ command: ${command} with payload: ${JSON.stringify(payload)}`);

    // Verify client is connected before sending
    try {
      // Ensure client is connected
      if (!this.authClient) {
        throw new Error('RabbitMQ client not initialized');
      }
      
      this.logger.debug(`RabbitMQ client ready, sending message...`);
      
      const result = await firstValueFrom(
        this.authClient.send({ cmd: command }, payload).pipe(
          timeout(10000), // Increased timeout to 10 seconds
          catchError((error) => {
            this.logger.error(`RabbitMQ error for command ${command}:`, error);
            this.logger.error(`Error name: ${error.name}, message: ${error.message}`);
            if (error.name === 'TimeoutError' || error.message?.includes('Timeout')) {
              throw new HttpException(
                'Auth service timeout - service may be unavailable or not listening on queue',
                HttpStatus.SERVICE_UNAVAILABLE,
              );
            }
            throw new HttpException(
              error.message || 'Service unavailable',
              error.status || HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        ),
      );
      
      this.logger.debug(`RabbitMQ response received for command ${command}:`, JSON.stringify(result));
      
      // Handle error responses from auth service
      if (result && result.error === true) {
        throw new HttpException(
          result.message || 'Auth service error',
          result.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to process RabbitMQ request:`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Request failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}