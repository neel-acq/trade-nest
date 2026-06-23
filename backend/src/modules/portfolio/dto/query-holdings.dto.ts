import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryHoldingsDto {
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
  search?: string;

  @IsOptional()
  @IsIn(['symbol', 'quantity', 'investedAmount', 'currentValue', 'unrealizedPnL', 'updatedAt'])
  sortBy?:
    | 'symbol'
    | 'quantity'
    | 'investedAmount'
    | 'currentValue'
    | 'unrealizedPnL'
    | 'updatedAt' = 'symbol';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
