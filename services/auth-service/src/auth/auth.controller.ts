import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
    console.log('[AuthController] Controller initialized - MessagePattern handlers should be registered');
  }

  // HTTP endpoints (for direct access if needed)
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    console.log("request is comming here ---------------------------->");
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: ExpressRequest & { user: { sub: string } }) {
    return this.authService.getProfile(req.user.sub);
  }

  // RabbitMQ message patterns
  @MessagePattern({ cmd: 'auth.register' })
  async handleRegister(@Payload() data: RegisterDto) {
    console.log('[RabbitMQ] ✅ Received auth.register command at', new Date().toISOString());
    console.log('[RabbitMQ] Payload:', JSON.stringify(data, null, 2));
    try {
      const result = await this.authService.register(data);
      console.log('[RabbitMQ] ✅ auth.register completed successfully at', new Date().toISOString());
      return result;
    } catch (error: any) {
      console.error('[RabbitMQ] ❌ auth.register error:', error.message);
      console.error('[RabbitMQ] Error stack:', error.stack);
      // Return serializable error object for RabbitMQ
      return {
        error: true,
        statusCode: error.status || error.statusCode || 500,
        message: error.message || 'Registration failed',
      };
    }
  }

  @MessagePattern({ cmd: 'auth.login' })
  async handleLogin(@Payload() data: LoginDto) {
    console.log('[RabbitMQ] ✅ Received auth.login command at', new Date().toISOString());
    console.log('[RabbitMQ] Payload:', JSON.stringify(data, null, 2));
    try {
      const result = await this.authService.login(data);
      console.log('[RabbitMQ] ✅ auth.login completed successfully at', new Date().toISOString());
      return result;
    } catch (error: any) {
      console.error('[RabbitMQ] ❌ auth.login error:', error.message);
      console.error('[RabbitMQ] Error stack:', error.stack);
      // Return serializable error object for RabbitMQ
      return {
        error: true,
        statusCode: error.status || error.statusCode || 500,
        message: error.message || 'Login failed',
      };
    }
  }

  @MessagePattern({ cmd: 'auth.refresh' })
  async handleRefresh(@Payload() data: RefreshDto) {
    console.log('[RabbitMQ] ✅ Received auth.refresh command at', new Date().toISOString());
    console.log('[RabbitMQ] Payload:', JSON.stringify({ refreshToken: data.refreshToken ? '[REDACTED]' : undefined }, null, 2));
    try {
      const result = await this.authService.refresh(data);
      console.log('[RabbitMQ] ✅ auth.refresh completed successfully at', new Date().toISOString());
      return result;
    } catch (error: any) {
      console.error('[RabbitMQ] ❌ auth.refresh error:', error.message);
      console.error('[RabbitMQ] Error stack:', error.stack);
      // Return serializable error object for RabbitMQ
      return {
        error: true,
        statusCode: error.status || error.statusCode || 500,
        message: error.message || 'Token refresh failed',
      };
    }
  }

  @MessagePattern({ cmd: 'auth.getProfile' })
  async handleGetProfile(@Payload() data: { userId: string }) {
    console.log('[RabbitMQ] ✅ Received auth.getProfile command at', new Date().toISOString());
    console.log('[RabbitMQ] Payload:', JSON.stringify(data, null, 2));
    try {
      const result = await this.authService.getProfile(data.userId);
      console.log('[RabbitMQ] ✅ auth.getProfile completed successfully at', new Date().toISOString());
      return result;
    } catch (error: any) {
      console.error('[RabbitMQ] ❌ auth.getProfile error:', error.message);
      console.error('[RabbitMQ] Error stack:', error.stack);
      // Return serializable error object for RabbitMQ
      return {
        error: true,
        statusCode: error.status || error.statusCode || 500,
        message: error.message || 'Failed to get profile',
      };
    }
  }

  @MessagePattern({ cmd: 'auth.validateToken' })
  async handleValidateToken(@Payload() data: { token: string }) {
    console.log('[RabbitMQ] ✅ Received auth.validateToken command at', new Date().toISOString());
    try {
      const decoded = this.authService.verifyToken(data.token);
      console.log('[RabbitMQ] ✅ Token validation successful at', new Date().toISOString());
      return { valid: true, user: decoded };
    } catch (error: any) {
      console.log('[RabbitMQ] ❌ Token validation failed:', error.message);
      return { valid: false, error: error.message };
    }
  }
}

