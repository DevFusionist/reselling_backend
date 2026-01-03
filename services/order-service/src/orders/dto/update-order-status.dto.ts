import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../../generated/prisma';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

