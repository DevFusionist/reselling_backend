import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  verifyToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    const tokens = await this.generateTokens(user.id, user.email, user.roles.map(ur => ur.role.name));
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    
    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.roles.map(ur => ur.role.name);
    const tokens = await this.generateTokens(user.id, user.email, roles);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async refresh(refreshDto: RefreshDto) {
    // Hash the incoming token to match against stored hash
    const hashedToken = this.hashToken(refreshDto.refreshToken);

    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!refreshToken || refreshToken.isRevoked || refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!refreshToken.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Get user roles
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: refreshToken.userId },
      include: { role: true },
    });

    const roles = userRoles.map(ur => ur.role.name);
    const tokens = await this.generateTokens(refreshToken.userId, refreshToken.user.email, roles);

    // Revoke old token and save new one
    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { isRevoked: true },
    });

    await this.saveRefreshToken(refreshToken.userId, tokens.refreshToken);

    return tokens;
  }

  async getProfile(userId: string) {
    if (!userId) {
      throw new NotFoundException('User ID is required');
    }
    return this.usersService.findById(userId);
  }

  private async generateTokens(userId: string, email: string, roles: string[]) {
    const payload = { sub: userId, email, roles };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '15m',
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Hash a token using SHA256 for secure storage
   * This ensures tokens are not stored in plain text in the database
   */
  private hashToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Hash the token before storing for security
    const hashedToken = this.hashToken(token);

    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        expiresAt,
      },
    });
  }
}

