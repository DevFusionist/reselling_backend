import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../common/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ShareLinksService {
  private readonly logger = new Logger(ShareLinksService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createShareLinkDto: CreateShareLinkDto) {
    // If sellerPrice is provided, validate margin using Pricing Service
    if (createShareLinkDto.productId && createShareLinkDto.sellerPrice) {
      // Use localhost as default for local development
      const pricingServiceUrl = this.configService.get<string>('PRICING_SERVICE_URL') || 'http://localhost:3003';

      try {
        const response = await firstValueFrom(
          this.httpService.post(`${pricingServiceUrl}/pricing/validate-margin`, {
            productId: createShareLinkDto.productId,
            sellerPrice: createShareLinkDto.sellerPrice,
          }),
        );

        if (!response.data.valid) {
          throw new BadRequestException(`Invalid margin: ${response.data.message}`);
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        this.logger.error('Error validating margin:', error);
        throw new BadRequestException('Failed to validate margin');
      }
    }

    // Generate unique code
    const code = this.generateUniqueCode();

    // Check expiration
    const expiresAt = createShareLinkDto.expiresAt ? new Date(createShareLinkDto.expiresAt) : null;

    const shareLink = await this.prisma.shareLink.create({
      data: {
        code,
        sellerId: createShareLinkDto.sellerId,
        productId: createShareLinkDto.productId,
        sellerPrice: createShareLinkDto.sellerPrice,
        expiresAt,
        isActive: true,
      },
    });

    return shareLink;
  }

  async findByCode(code: string, ipAddress?: string, userAgent?: string, referer?: string) {
    // OPTIMIZATION: Check cache first
    const cacheKey = `share-link:${code}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      // Track click asynchronously (fire and forget)
      this.prisma.linkClick.create({
        data: {
          shareLinkId: (cached as any).id,
          ipAddress,
          userAgent,
          referer,
        },
      }).catch(err => this.logger.error('Failed to track click', err));
      return cached;
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        sellerId: true,
        productId: true,
        sellerPrice: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            ipAddress: true,
            userAgent: true,
            referer: true,
            createdAt: true,
          },
        },
      },
    });

    if (!shareLink) {
      throw new NotFoundException(`Share link with code ${code} not found`);
    }

    if (!shareLink.isActive) {
      throw new BadRequestException('Share link is inactive');
    }

    // Check expiration
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      throw new BadRequestException('Share link has expired');
    }

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, shareLink, 300);

    // Track click asynchronously (fire and forget) for better performance
    this.prisma.linkClick.create({
      data: {
        shareLinkId: shareLink.id,
        ipAddress,
        userAgent,
        referer,
      },
    }).catch(err => this.logger.error('Failed to track click', err));

    return shareLink;
  }

  async findBySeller(sellerId: string, skip = 0, take = 20) {
    // OPTIMIZATION: Enforce max page size and use select
    const MAX_PAGE_SIZE = 100;
    const limitedTake = Math.min(take || 20, MAX_PAGE_SIZE);

    const [data, total] = await Promise.all([
      this.prisma.shareLink.findMany({
        where: { sellerId },
        skip,
        take: limitedTake,
        select: {
          id: true,
          code: true,
          sellerId: true,
          productId: true,
          sellerPrice: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { clicks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shareLink.count({ where: { sellerId } }),
    ]);

    return { data, total, skip, take: limitedTake };
  }

  async getStats(code: string) {
    // OPTIMIZATION: Use select to fetch only required fields
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { code },
      select: {
        code: true,
        isActive: true,
        createdAt: true,
        expiresAt: true,
        _count: {
          select: { clicks: true },
        },
      },
    });

    if (!shareLink) {
      throw new NotFoundException(`Share link with code ${code} not found`);
    }

    // Get conversion stats (orders associated with this link)
    // This would require querying Order Service in a real implementation

    return {
      code: shareLink.code,
      clicks: shareLink._count.clicks,
      createdAt: shareLink.createdAt,
      expiresAt: shareLink.expiresAt,
      isActive: shareLink.isActive,
    };
  }

  private generateUniqueCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

