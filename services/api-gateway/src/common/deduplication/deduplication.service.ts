import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';

/**
 * OPTIMIZATION: Request Deduplication Service
 * Prevents duplicate requests from being processed multiple times
 * Useful for preventing duplicate orders, payments, etc.
 */
@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);
  private readonly defaultTTL = 60; // 60 seconds default TTL

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Generate a unique key for a request based on method, path, and body
   */
  private generateRequestKey(
    method: string,
    path: string,
    body?: any,
    userId?: string,
  ): string {
    const bodyHash = body ? crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex') : '';
    const userPart = userId ? `:${userId}` : '';
    return `dedup:${method}:${path}:${bodyHash}${userPart}`;
  }

  /**
   * Check if a request is a duplicate and mark it as processed
   * @param method - HTTP method
   * @param path - Request path
   * @param body - Request body (optional)
   * @param userId - User ID (optional, for user-specific deduplication)
   * @param ttl - Time to live in seconds (default: 60)
   * @returns true if duplicate, false if new request
   */
  async isDuplicate(
    method: string,
    path: string,
    body?: any,
    userId?: string,
    ttl: number = this.defaultTTL,
  ): Promise<boolean> {
    // Only deduplicate POST, PUT, PATCH requests (mutating operations)
    if (!['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      return false;
    }

    try {
      const key = this.generateRequestKey(method, path, body, userId);
      const existing = await this.cacheManager.get(key);

      if (existing) {
        this.logger.debug(`Duplicate request detected: ${method} ${path}`);
        return true;
      }

      // Mark request as processed
      await this.cacheManager.set(key, { timestamp: Date.now() }, ttl);
      return false;
    } catch (error) {
      // Cache unavailable - allow request to proceed (no deduplication)
      this.logger.warn(`Cache unavailable for deduplication, allowing request: ${method} ${path}`, error.message);
      return false;
    }
  }

  /**
   * Manually mark a request as processed (useful for idempotency)
   */
  async markAsProcessed(
    method: string,
    path: string,
    body?: any,
    userId?: string,
    ttl: number = this.defaultTTL,
  ): Promise<void> {
    try {
      const key = this.generateRequestKey(method, path, body, userId);
      await this.cacheManager.set(key, { timestamp: Date.now() }, ttl);
    } catch (error) {
      // Cache unavailable - log warning but don't throw
      this.logger.warn(`Failed to mark request as processed: ${method} ${path}`, error.message);
    }
  }

  /**
   * Clear deduplication cache for a specific request
   */
  async clear(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      // Cache unavailable - log warning but don't throw
      this.logger.warn(`Failed to clear deduplication cache for key: ${key}`, error.message);
    }
  }
}

