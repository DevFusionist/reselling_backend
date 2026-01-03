import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export enum Role {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  RESELLER = 'RESELLER',
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(Role, { message: 'Role must be ADMIN, CUSTOMER, or RESELLER' })
  @IsOptional()
  role?: Role;
}

