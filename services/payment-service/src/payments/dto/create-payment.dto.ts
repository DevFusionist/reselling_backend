import { IsString, IsNumber, Min, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { PaymentMethod } from '../../../generated/prisma';

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsString()
  userId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

