import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * OPTIMIZATION: CDN Service for product images
 * Provides CDN URLs for product images to reduce server load and improve performance
 */
@Injectable()
export class CdnService {
  private readonly cdnBaseUrl: string | null;

  constructor(private configService: ConfigService) {
    this.cdnBaseUrl = this.configService.get<string>('CDN_BASE_URL') || null;
  }

  /**
   * Get CDN URL for an image
   * @param imageUrl - Original image URL (relative or absolute)
   * @returns CDN URL if configured, otherwise returns original URL
   */
  getImageUrl(imageUrl: string): string {
    if (!this.cdnBaseUrl || !imageUrl) {
      return imageUrl;
    }

    // If imageUrl is already absolute, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // If imageUrl is relative, prepend CDN base URL
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${this.cdnBaseUrl}${cleanPath}`;
  }

  /**
   * Get CDN URLs for multiple images
   */
  getImageUrls(imageUrls: string[]): string[] {
    return imageUrls.map((url) => this.getImageUrl(url));
  }

  /**
   * Check if CDN is configured
   */
  isConfigured(): boolean {
    return !!this.cdnBaseUrl;
  }
}

