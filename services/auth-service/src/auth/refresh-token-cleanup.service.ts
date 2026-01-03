import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenCleanupService implements OnModuleInit {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);
  private readonly revokedTokenTTLDays: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Get TTL from config or default to 7 days
    this.revokedTokenTTLDays = parseInt(
      this.configService.get<string>('REVOKED_TOKEN_TTL_DAYS') || '7',
      10,
    );
  }

  async onModuleInit() {
    this.logger.log(
      `Refresh token cleanup service initialized. Revoked tokens will be deleted after ${this.revokedTokenTTLDays} days.`,
    );
    // Run cleanup on startup (with a small delay to ensure DB is ready)
    setTimeout(() => this.cleanupRevokedTokens(), 5000);
  }

  /**
   * Cleanup revoked refresh tokens that are older than the TTL
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupRevokedTokens() {
    this.logger.log('Starting cleanup of revoked refresh tokens...');

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.revokedTokenTTLDays);

      const result = await this.prisma.refreshToken.deleteMany({
        where: {
          isRevoked: true,
          updatedAt: {
            lt: cutoffDate, // Delete tokens revoked before the cutoff date
          },
        },
      });

      this.logger.log(
        `Cleanup completed. Deleted ${result.count} revoked refresh token(s) older than ${this.revokedTokenTTLDays} days.`,
      );
    } catch (error) {
      this.logger.error(
        `Error during refresh token cleanup: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (error instanceof Error && error.stack) {
        this.logger.debug(error.stack);
      }
    }
  }

  /**
   * Manual cleanup method that can be called on demand
   */
  async cleanupNow(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.revokedTokenTTLDays);

    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        isRevoked: true,
        updatedAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(
      `Manual cleanup completed. Deleted ${result.count} revoked refresh token(s).`,
    );

    return result.count;
  }
}

