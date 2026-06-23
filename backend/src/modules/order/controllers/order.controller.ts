import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateOrderDto } from '../dto/create-order.dto';
import { QueryOrdersDto } from '../dto/query-orders.dto';
import { OrderService } from '../services/order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Public()
  @Get('status')
  getStatus() {
    return this.orderService.getStatus();
  }

  @Post()
  createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(user.id, dto);
  }

  @Get()
  listOrders(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryOrdersDto) {
    return this.orderService.listOrders(query, user.id, user.role);
  }

  @Get(':id')
  getOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.orderService.getOrderById(id, user.id, user.role);
  }

  @Post(':id/cancel')
  cancelOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.orderService.cancelOrder(id, user.id, user.role);
  }
}
