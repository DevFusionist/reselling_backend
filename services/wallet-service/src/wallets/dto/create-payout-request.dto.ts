import { IsNumber, Min, IsString, IsOptional } from 'class-validator';

export class CreatePayoutRequestDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  bankAccount?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

