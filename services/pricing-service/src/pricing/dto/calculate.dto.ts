import { IsString, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  sellerPrice: number;
}

export class CalculateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculateItemDto)
  items: CalculateItemDto[];

  @IsString()
  sellerId: string;
}

