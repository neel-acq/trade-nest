import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, OrderType, UserRole } from '@prisma/client';
import { buildPaginationMeta, PaginatedResult } from '@/common/dto/pagination.dto';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { StockService } from '../../stock/services/stock.service';
import { UserService } from '../../user/services/user.service';
import { WalletService } from '../../wallet/services/wallet.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { QueryOrdersDto } from '../dto/query-orders.dto';
import {
  isBuyOrder,
  isLimitOrder,
  isMarketOrder,
  isSellOrder,
  SafeOrder,
  toSafeOrder,
} from '../entities/order.entity';
import { OrderCancelledEvent } from '../events/order-cancelled.event';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrderRepository } from '../repositories/order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly stockService: StockService,
    private readonly userService: UserService,
    private readonly walletService: WalletService,
    private readonly portfolioService: PortfolioService,
    private readonly eventBus: DomainEventBus,
  ) {}

  getStatus() {
    return { module: 'order', status: 'active', phase: 7 };
  }

  async createOrder(userId: string, dto: CreateOrderDto): Promise<SafeOrder> {
    const stock = await this.stockService.getStockById(dto.stockId);
    const orderPrice = this.resolveOrderPrice(dto.type, dto.price, stock.currentPrice);
    let lockedAmount = 0;

    if (isLimitOrder(dto.type) && (!dto.price || dto.price <= 0)) {
      throw new BadRequestException('Limit orders require a positive price');
    }

    if (isBuyOrder(dto.type)) {
      lockedAmount = Number((orderPrice * dto.quantity).toFixed(2));
      await this.walletService.lockFunds(userId, lockedAmount, `order_lock:${dto.type}`);
    }

    if (isSellOrder(dto.type)) {
      const holdingQty = await this.portfolioService.getHoldingQuantity(userId, dto.stockId);
      if (holdingQty < dto.quantity) {
        throw new BadRequestException(
          `Insufficient holdings. Available: ${holdingQty}, requested: ${dto.quantity}`,
        );
      }
    }

    let order;
    try {
      order = await this.orderRepository.create({
        userId,
        stockId: dto.stockId,
        type: dto.type,
        status: OrderStatus.OPEN,
        quantity: dto.quantity,
        price: orderPrice,
        createdBy: userId,
      });
    } catch (error) {
      if (isBuyOrder(dto.type) && lockedAmount > 0) {
        await this.walletService.unlockFunds(userId, lockedAmount, 'order_create_rollback');
      }
      throw error;
    }

    const withRelations = await this.orderRepository.findById(order.id);
    if (!withRelations) {
      throw new NotFoundException('Order not found after creation');
    }

    this.eventBus.publish(
      new OrderCreatedEvent({
        orderId: order.id,
        userId: order.userId,
        stockId: order.stockId,
        type: order.type,
        quantity: order.quantity,
        price: orderPrice,
      }),
    );

    return toSafeOrder(withRelations);
  }

  async cancelOrder(
    orderId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<SafeOrder> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole !== UserRole.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (order.status !== OrderStatus.OPEN && order.status !== OrderStatus.PARTIAL) {
      throw new BadRequestException(`Cannot cancel order with status ${order.status}`);
    }

    const remainingQty = order.quantity - order.filledQuantity;
    const price = Number(order.price ?? 0);

    if (isBuyOrder(order.type) && remainingQty > 0 && price > 0) {
      const unlockAmount = Number((price * remainingQty).toFixed(2));
      await this.walletService.unlockFunds(order.userId, unlockAmount, `order_cancel:${orderId}`);
    }

    await this.orderRepository.updateStatus(orderId, OrderStatus.CANCELLED, userId);

    const updated = await this.orderRepository.findById(orderId);
    if (!updated) {
      throw new NotFoundException('Order not found after cancel');
    }

    this.eventBus.publish(
      new OrderCancelledEvent({
        orderId: order.id,
        userId: order.userId,
        stockId: order.stockId,
        type: order.type,
        quantity: order.quantity,
        filledQuantity: order.filledQuantity,
      }),
    );

    return toSafeOrder(updated);
  }

  async getOrderById(orderId: string, userId: string, userRole: UserRole): Promise<SafeOrder> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (userRole !== UserRole.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return toSafeOrder(order);
  }

  async listOrders(
    query: QueryOrdersDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PaginatedResult<SafeOrder>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filterUserId =
      userRole === UserRole.ADMIN ? query.userId : userId;

    const { total, orders } = await this.orderRepository.findManyPaginated({
      page,
      limit,
      userId: filterUserId,
      stockId: query.stockId,
      status: query.status,
      type: query.type,
      search: query.search,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return {
      data: orders.map(toSafeOrder),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getOrderStats(userId: string) {
    const grouped = await this.orderRepository.countByUserGrouped(userId);
    const stats = {
      open: 0,
      partial: 0,
      filled: 0,
      cancelled: 0,
      rejected: 0,
      total: 0,
    };

    for (const row of grouped) {
      const count = row._count._all;
      stats.total += count;
      if (row.status === OrderStatus.OPEN) stats.open = count;
      if (row.status === OrderStatus.PARTIAL) stats.partial = count;
      if (row.status === OrderStatus.FILLED) stats.filled = count;
      if (row.status === OrderStatus.CANCELLED) stats.cancelled = count;
      if (row.status === OrderStatus.REJECTED) stats.rejected = count;
    }

    return stats;
  }

  async getRecentOrders(userId: string, limit = 5) {
    const orders = await this.orderRepository.findRecentByUser(userId, limit);
    return orders.map(toSafeOrder);
  }

  async getPlatformOrderStats() {
    const total = await this.orderRepository.countAll();
    return { totalOrders: total };
  }

  async seedSystemOrders() {
    const existing = await this.orderRepository.countSystemGenerated();
    if (existing > 0) {
      return { created: 0, skipped: existing, message: 'System orders already seeded' };
    }

    const buyer = await this.userService.findTraderByUsername('trader_01');
    const seller = await this.userService.findTraderByUsername('trader_02');
    const stock = await this.stockService.findBySymbol('RELIANCE');

    if (!buyer || !seller || !stock) {
      return {
        created: 0,
        skipped: 0,
        message: 'Seed users and stocks before orders',
      };
    }

    const buyOrder = await this.orderRepository.create({
      userId: buyer.id,
      stockId: stock.id,
      type: OrderType.LIMIT_BUY,
      status: OrderStatus.OPEN,
      quantity: 10,
      price: Number(stock.currentPrice) - 5,
      isSystemGenerated: true,
    });

    const sellOrder = await this.orderRepository.create({
      userId: seller.id,
      stockId: stock.id,
      type: OrderType.LIMIT_SELL,
      status: OrderStatus.OPEN,
      quantity: 10,
      price: Number(stock.currentPrice) + 5,
      isSystemGenerated: true,
    });

    for (const order of [buyOrder, sellOrder]) {
      this.eventBus.publish(
        new OrderCreatedEvent({
          orderId: order.id,
          userId: order.userId,
          stockId: order.stockId,
          type: order.type,
          quantity: order.quantity,
          price: Number(order.price),
        }),
      );
    }

    return { created: 2, orders: [buyOrder.id, sellOrder.id] };
  }
  async deleteSystemOrders() {
    const deleted = await this.orderRepository.deleteSystemGenerated();
    return { deleted: deleted.count };
  }

  async findSystemOrders() {
    const orders = await this.orderRepository.findSystemGenerated();
    return orders;
  }

  private resolveOrderPrice(type: OrderType, limitPrice: number | undefined, marketPrice: number) {
    if (isMarketOrder(type)) {
      return marketPrice;
    }
    if (!limitPrice || limitPrice <= 0) {
      throw new BadRequestException('Limit orders require a positive price');
    }
    return limitPrice;
  }
}
