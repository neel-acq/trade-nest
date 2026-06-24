import { IsNotEmpty, IsString } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

export class AdminCreateOrderDto extends CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
