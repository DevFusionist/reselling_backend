import { IsEnum, IsString, IsOptional } from 'class-validator';
import { PayoutStatus } from '../../../generated/prisma';

export class UpdatePayoutStatusDto {
  @IsEnum(PayoutStatus)
  status: PayoutStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

