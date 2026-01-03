import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO for creating variant option values (e.g., "Red", "Blue" for Color option)
export class CreateVariantOptionValueDto {
  @IsString()
  value: string; // "Red", "Large", "Round"

  @IsNumber()
  @IsOptional()
  position?: number;
}

// DTO for creating variant options (e.g., "Color", "Size")
export class CreateVariantOptionDto {
  @IsString()
  name: string; // "Color", "Size", "Shape"

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantOptionValueDto)
  @ArrayMinSize(1)
  values: CreateVariantOptionValueDto[]; // ["Red", "Blue", "Green"]
}

// DTO for specifying which option values a variant has
export class VariantOptionValueRefDto {
  @IsString()
  optionName: string; // "Color"

  @IsString()
  value: string; // "Red"
}

// DTO for creating product variants with option values
export class CreateProductVariantDto {
  @IsString()
  @IsOptional()
  name?: string; // Auto-generated if not provided: "Red / Large"

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantOptionValueRefDto)
  @IsOptional()
  optionValues?: VariantOptionValueRefDto[];
  // Example: [{ optionName: "Color", value: "Red" }, { optionName: "Size", value: "L" }]
}

export class CreateProductImageDto {
  @IsString()
  url: string;

  @IsString()
  @IsOptional()
  alt?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Define variant options for this product (Color, Size, etc.)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantOptionDto)
  @IsOptional()
  options?: CreateVariantOptionDto[];

  // Product variants with their option value combinations
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @IsOptional()
  variants?: CreateProductVariantDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  @IsOptional()
  images?: CreateProductImageDto[];
}
