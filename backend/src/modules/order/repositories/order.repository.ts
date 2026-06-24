import { Injectable } from '@nestjs/common';
import { Order, OrderStatus, OrderType, Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { OrderWithRelations } from '../entities/order.entity';

export interface CreateOrderData {
  userId: string;
  stockId: string;
  type: OrderType;
  status?: OrderStatus;
  quantity: number;
  filledQuantity?: number;
  price?: number | null;
  isSystemGenerated?: boolean;
  createdBy?: string;
}

export interface FindOrdersParams {
  page: number;
  limit: number;
  userId?: string;
  stockId?: string;
  status?: OrderStatus;
  type?: OrderType;
  search?: string;
  sortBy: 'createdAt' | 'quantity' | 'price' | 'status';
  sortOrder: 'asc' | 'desc';
}

const stockSelect = { symbol: true, companyName: true, currentPrice: true } as const;
const userSelect = { username: true, fullName: true } as const;

const openStatuses: OrderStatus[] = [OrderStatus.OPEN, OrderStatus.PARTIAL];

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  countSystemGenerated() {
    return this.prisma.order.count({
      where: { isSystemGenerated: true, deletedAt: null },
    });
  }

  create(data: CreateOrderData): Promise<Order> {
    return this.prisma.order.create({
      data: {
        userId: data.userId,
        stockId: data.stockId,
        type: data.type,
        status: data.status ?? OrderStatus.OPEN,
        quantity: data.quantity,
        filledQuantity: data.filledQuantity ?? 0,
        price: data.price ?? null,
        isSystemGenerated: data.isSystemGenerated ?? false,
        createdBy: data.createdBy,
      },
    });
  }

  findById(id: string): Promise<OrderWithRelations | null> {
    return this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: { stock: { select: stockSelect }, user: { select: userSelect } },
    });
  }

  findByIdForUpdate(id: string): Promise<Order | null> {
    return this.prisma.order.findFirst({
      where: { id, deletedAt: null },
    });
  }

  updateStatus(
    id: string,
    status: OrderStatus,
    updatedBy?: string,
    filledQuantity?: number,
  ): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(filledQuantity !== undefined ? { filledQuantity } : {}),
        updatedBy,
        updatedAt: new Date(),
      },
    });
  }

  updateFill(id: string, filledQuantity: number, status: OrderStatus): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data: { filledQuantity, status, updatedAt: new Date() },
    });
  }

  findOpenBuyOrders(stockId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        stockId,
        deletedAt: null,
        status: { in: openStatuses },
        type: { in: [OrderType.LIMIT_BUY, OrderType.MARKET_BUY] },
      },
      orderBy: [{ price: 'desc' }, { createdAt: 'asc' }],
    });
  }

  findOpenSellOrders(stockId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        stockId,
        deletedAt: null,
        status: { in: openStatuses },
        type: { in: [OrderType.LIMIT_SELL, OrderType.MARKET_SELL] },
      },
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async sumOpenSellQuantity(userId: string, stockId: string): Promise<number> {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        stockId,
        deletedAt: null,
        status: { in: openStatuses },
        type: { in: [OrderType.LIMIT_SELL, OrderType.MARKET_SELL] },
      },
      select: { quantity: true, filledQuantity: true },
    });

    return orders.reduce((sum, order) => sum + (order.quantity - order.filledQuantity), 0);
  }

  async estimateMarketBuyLockAmount(
    stockId: string,
    quantity: number,
    fallbackPrice: number,
  ): Promise<number> {
    const sellOrders = await this.findOpenSellOrders(stockId);
    let remaining = quantity;
    let totalCost = 0;

    for (const sellOrder of sellOrders) {
      if (remaining <= 0) break;

      const sellRemaining = sellOrder.quantity - sellOrder.filledQuantity;
      if (sellRemaining <= 0) continue;

      const take = Math.min(remaining, sellRemaining);
      const price = Number(sellOrder.price ?? fallbackPrice);
      totalCost += take * price;
      remaining -= take;
    }

    if (remaining > 0) {
      totalCost += remaining * fallbackPrice;
    }

    return Number(totalCost.toFixed(2));
  }

  findOpenOrdersByStock(stockId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: {
        stockId,
        deletedAt: null,
        status: { in: openStatuses },
      },
      orderBy: [{ createdAt: 'asc' }],
    });
  }

  deleteSystemGenerated() {
    return this.prisma.order.deleteMany({
      where: { isSystemGenerated: true },
    });
  }

  findSystemGenerated(): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { isSystemGenerated: true, deletedAt: null },
    });
  }

  async findManyPaginated(params: FindOrdersParams) {
    const { page, limit, userId, stockId, status, type, search, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(userId ? { userId } : {}),
      ...(stockId ? { stockId } : {}),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(search
        ? {
            stock: {
              OR: [
                { symbol: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const orderBy: Prisma.OrderOrderByWithRelationInput =
      sortBy === 'createdAt' ? { createdAt: sortOrder } : { [sortBy]: sortOrder };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { stock: { select: stockSelect }, user: { select: userSelect } },
      }),
    ]);

    return { total, orders: orders as OrderWithRelations[] };
  }

  countAll() {
    return this.prisma.order.count({
      where: { deletedAt: null },
    });
  }

  countByUserGrouped(userId: string) {
    return this.prisma.order.groupBy({
      by: ['status'],
      where: { userId, deletedAt: null },
      _count: { _all: true },
    });
  }

  findRecentByUser(userId: string, limit: number): Promise<OrderWithRelations[]> {
    return this.prisma.order.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { stock: { select: stockSelect }, user: { select: userSelect } },
    }) as Promise<OrderWithRelations[]>;
  }
}
