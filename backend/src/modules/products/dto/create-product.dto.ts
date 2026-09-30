import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  @IsIn(['Frs CFA', 'EUR', 'USD', 'GBP'])
  currency?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsMongoId()
  categoryId: string;
}
