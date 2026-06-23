import { IsInt, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateStockDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  companyName?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  currentPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentVolume?: number;
}
