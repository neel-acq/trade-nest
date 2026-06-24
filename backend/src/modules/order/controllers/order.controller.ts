import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { AdminCreateOrderDto } from '../dto/admin-create-order.dto';
import { AdminLiquidityPairDto, AdminMarketDepthDto } from '../dto/admin-liquidity.dto';
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

  @Roles(UserRole.ADMIN)
  @Post('admin')
  createOrderAsAdmin(@CurrentUser() admin: AuthenticatedUser, @Body() dto: AdminCreateOrderDto) {
    return this.orderService.createOrderAsAdmin(admin.id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/liquidity-pair')
  createLiquidityPair(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: AdminLiquidityPairDto,
  ) {
    return this.orderService.createLiquidityPair(admin.id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/market-depth')
  createMarketDepth(
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: AdminMarketDepthDto,
  ) {
    return this.orderService.createMarketDepth(admin.id, dto);
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
