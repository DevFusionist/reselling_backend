import { IsString, IsNumber, Min } from 'class-validator';

export class ValidateMarginDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  sellerPrice: number;
}

