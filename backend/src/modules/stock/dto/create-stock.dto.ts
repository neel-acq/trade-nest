import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  @Matches(/^[A-Z0-9&.-]+$/, { message: 'Symbol must be uppercase letters, numbers, or & . -' })
  symbol!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  companyName!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  currentPrice!: number;

  @IsInt()
  @Min(0)
  currentVolume!: number;
}
