import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { ValidateMarginDto } from './dto/validate-margin.dto';
import { CalculateDto } from './dto/calculate.dto';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('validate-margin')
  async validateMargin(@Body() validateMarginDto: ValidateMarginDto) {
    return this.pricingService.validateMargin(validateMarginDto);
  }

  @Post('calculate')
  async calculate(@Body() calculateDto: CalculateDto) {
    return this.pricingService.calculate(calculateDto);
  }

  @Get('product/:productId')
  async getProductPricing(@Param('productId') productId: string) {
    return this.pricingService.getProductPricing(productId);
  }
}

