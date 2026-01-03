import { IsString, IsOptional, IsNumber, Min, IsDateString, IsUUID } from 'class-validator';

export class CreateShareLinkDto {
  @IsString()
  sellerId: string;

  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sellerPrice?: number;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

