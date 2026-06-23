import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryStocksDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @Max(100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minChangePercentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxChangePercentage?: number;

  @IsOptional()
  @IsIn([
    'symbol',
    'companyName',
    'currentPrice',
    'currentVolume',
    'changePercentage',
    'changePrice',
    'createdAt',
  ])
  sortBy?:
    | 'symbol'
    | 'companyName'
    | 'currentPrice'
    | 'currentVolume'
    | 'changePercentage'
    | 'changePrice'
    | 'createdAt' = 'symbol';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
