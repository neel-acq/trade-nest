import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryStockHistoryDto {
  @IsOptional()
  @IsIn(['1d', '1h'])
  interval?: '1d' | '1h' = '1d';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(365)
  limit?: number = 90;
}
