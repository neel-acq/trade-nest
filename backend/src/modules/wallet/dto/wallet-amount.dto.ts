import { IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class WalletAmountDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
