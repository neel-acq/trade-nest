import { OrderType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  stockId!: string;

  @IsEnum(OrderType)
  type!: OrderType;

  @IsInt()
  @Min(1)
  quantity!: number;

  @ValidateIf((o: CreateOrderDto) =>
    o.type === OrderType.LIMIT_BUY || o.type === OrderType.LIMIT_SELL,
  )
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;
}
