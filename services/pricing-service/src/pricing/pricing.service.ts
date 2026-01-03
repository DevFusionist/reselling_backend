import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../common/prisma/prisma.service';
import { ValidateMarginDto } from './dto/validate-margin.dto';
import { CalculateDto } from './dto/calculate.dto';

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateMargin(validateMarginDto: ValidateMarginDto) {
    // OPTIMIZATION: Use select to fetch only required fields
    const pricing = await this.prisma.productPricing.findUnique({
      where: { productId: validateMarginDto.productId },
      select: {
        productId: true,
        basePrice: true,
        resellerPrice: true,
        minMargin: true,
      },
    });

    if (!pricing) {
      throw new NotFoundException(`Pricing not found for product ${validateMarginDto.productId}`);
    }

    const basePrice = Number(pricing.basePrice);
    const sellerPrice = validateMarginDto.sellerPrice;

    // Calculate margin percentage
    const margin = ((sellerPrice - basePrice) / basePrice) * 100;

    // Check minimum margin if set
    if (pricing.minMargin !== null) {
      const minMargin = Number(pricing.minMargin);
      if (margin < minMargin) {
        return {
          valid: false,
          margin,
          minMargin,
          message: `Margin ${margin.toFixed(2)}% is below minimum required ${minMargin}%`,
        };
      }
    }

    // Seller price must be greater than base price
    if (sellerPrice <= basePrice) {
      return {
        valid: false,
        margin,
        message: 'Seller price must be greater than base price',
      };
    }

    return {
      valid: true,
      margin: Number(margin.toFixed(2)),
      basePrice,
      sellerPrice,
      resellerPrice: Number(pricing.resellerPrice),
    };
  }

  async calculate(calculateDto: CalculateDto) {
    // OPTIMIZATION: Batch fetch all pricing data in one query instead of sequential queries
    const productIds = calculateDto.items.map((item) => item.productId);
    
    // OPTIMIZATION: Fetch only required fields
    const pricings = await this.prisma.productPricing.findMany({
      where: { productId: { in: productIds } },
      select: {
        productId: true,
        basePrice: true,
        resellerPrice: true,
        commissionRate: true,
        minMargin: true,
      },
    });

    // Create a map for O(1) lookup
    const pricingMap = new Map(pricings.map((p) => [p.productId, p]));

    // Validate all products exist
    const missingProducts = productIds.filter((id) => !pricingMap.has(id));
    if (missingProducts.length > 0) {
      throw new NotFoundException(
        `Pricing not found for products: ${missingProducts.join(', ')}`,
      );
    }

    // Process all items in parallel
    const itemPromises = calculateDto.items.map(async (item) => {
      const pricing = pricingMap.get(item.productId)!;

      // Validate margin for this item
      const marginValidation = await this.validateMargin({
        productId: item.productId,
        sellerPrice: item.sellerPrice,
      });

      if (!marginValidation.valid) {
        throw new BadRequestException(
          `Invalid margin for product ${item.productId}: ${marginValidation.message}`,
        );
      }

      const basePrice = Number(pricing.basePrice);
      const sellerPrice = item.sellerPrice;
      const itemTotal = sellerPrice * item.quantity;
      const commissionRate = Number(pricing.commissionRate);
      const commission = (itemTotal * commissionRate) / 100;

      return {
        productId: item.productId,
        quantity: item.quantity,
        basePrice,
        sellerPrice,
        itemTotal,
        commissionRate,
        commission,
      };
    });

    // Wait for all validations and calculations to complete
    const items = await Promise.all(itemPromises);

    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + item.itemTotal, 0);
    const totalCommission = items.reduce((sum, item) => sum + item.commission, 0);

    return {
      items,
      summary: {
        totalAmount: Number(totalAmount.toFixed(2)),
        totalCommission: Number(totalCommission.toFixed(2)),
        netAmount: Number((totalAmount - totalCommission).toFixed(2)),
        sellerId: calculateDto.sellerId,
      },
    };
  }

  async getProductPricing(productId: string) {
    // OPTIMIZATION: Check cache first
    const cacheKey = `pricing:${productId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // OPTIMIZATION: Use select to fetch only required fields
    const pricing = await this.prisma.productPricing.findUnique({
      where: { productId },
      select: {
        productId: true,
        basePrice: true,
        resellerPrice: true,
        commissionRate: true,
        minMargin: true,
      },
    });

    if (!pricing) {
      throw new NotFoundException(`Pricing not found for product ${productId}`);
    }

    const result = {
      productId: pricing.productId,
      basePrice: Number(pricing.basePrice),
      resellerPrice: Number(pricing.resellerPrice),
      commissionRate: Number(pricing.commissionRate),
      minMargin: pricing.minMargin ? Number(pricing.minMargin) : null,
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600);
    return result;
  }
}

