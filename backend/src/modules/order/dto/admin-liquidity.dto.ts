import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class AdminLiquidityPairDto {
  @IsString()
  @IsNotEmpty()
  stockId!: string;

  @IsString()
  @IsNotEmpty()
  sellerUserId!: string;

  @IsString()
  @IsNotEmpty()
  buyerUserId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  grantSellerShares?: boolean = true;
}

export class AdminMarketDepthDto {
  @IsString()
  @IsNotEmpty()
  stockId!: string;

  @IsString()
  @IsNotEmpty()
  sellerUserId!: string;

  @IsString()
  @IsNotEmpty()
  buyerUserId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  sellPrice!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  buyPrice!: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  grantSellerShares?: boolean = true;
}
