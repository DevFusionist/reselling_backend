import { IsString, IsArray, ValidateNested, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  sellerPrice: number;
}

export class CreateOrderDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  sellerId?: string;

  @IsUUID()
  @IsOptional()
  shareLinkId?: string;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

