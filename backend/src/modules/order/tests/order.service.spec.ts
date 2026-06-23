import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, OrderType } from '@prisma/client';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { StockService } from '../../stock/services/stock.service';
import { UserService } from '../../user/services/user.service';
import { WalletService } from '../../wallet/services/wallet.service';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrderRepository } from '../repositories/order.repository';
import { OrderService } from '../services/order.service';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: jest.Mocked<
    Pick<OrderRepository, 'create' | 'findById' | 'updateStatus' | 'countSystemGenerated'>
  >;
  let stockService: jest.Mocked<Pick<StockService, 'getStockById'>>;
  let walletService: jest.Mocked<Pick<WalletService, 'lockFunds' | 'unlockFunds'>>;
  let portfolioService: jest.Mocked<Pick<PortfolioService, 'getHoldingQuantity'>>;
  let eventBus: jest.Mocked<Pick<DomainEventBus, 'publish'>>;

  const mockStock = {
    id: 'stock-1',
    symbol: 'RELIANCE',
    companyName: 'Reliance',
    currentPrice: 2500,
  };

  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    stockId: 'stock-1',
    type: OrderType.LIMIT_BUY,
    status: OrderStatus.OPEN,
    quantity: 10,
    filledQuantity: 0,
    price: 2450,
    isSystemGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    stock: { symbol: 'RELIANCE', companyName: 'Reliance', currentPrice: 2500 },
  };

  beforeEach(async () => {
    orderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      countSystemGenerated: jest.fn(),
    };
    stockService = { getStockById: jest.fn() };
    walletService = { lockFunds: jest.fn(), unlockFunds: jest.fn() };
    portfolioService = { getHoldingQuantity: jest.fn() };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: OrderRepository, useValue: orderRepository },
        { provide: StockService, useValue: stockService },
        { provide: UserService, useValue: {} },
        { provide: WalletService, useValue: walletService },
        { provide: PortfolioService, useValue: portfolioService },
        { provide: DomainEventBus, useValue: eventBus },
      ],
    }).compile();

    service = module.get(OrderService);
  });

  it('creates buy order and locks wallet funds', async () => {
    stockService.getStockById.mockResolvedValue(mockStock as never);
    orderRepository.create.mockResolvedValue(mockOrder as never);
    orderRepository.findById.mockResolvedValue(mockOrder as never);

    await service.createOrder('user-1', {
      stockId: 'stock-1',
      type: OrderType.LIMIT_BUY,
      quantity: 10,
      price: 2450,
    });

    expect(walletService.lockFunds).toHaveBeenCalledWith('user-1', 24500, expect.any(String));
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(OrderCreatedEvent));
  });

  it('rejects sell order when insufficient holdings', async () => {
    stockService.getStockById.mockResolvedValue(mockStock as never);
    portfolioService.getHoldingQuantity.mockResolvedValue(2);

    await expect(
      service.createOrder('user-1', {
        stockId: 'stock-1',
        type: OrderType.LIMIT_SELL,
        quantity: 10,
        price: 2550,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('cancels buy order and unlocks remaining funds', async () => {
    orderRepository.findById
      .mockResolvedValueOnce(mockOrder as never)
      .mockResolvedValueOnce({ ...mockOrder, status: OrderStatus.CANCELLED } as never);
    orderRepository.updateStatus.mockResolvedValue(mockOrder as never);

    await service.cancelOrder('order-1', 'user-1', 'TRADER' as never);

    expect(walletService.unlockFunds).toHaveBeenCalledWith('user-1', 24500, expect.any(String));
  });

  it('denies cancel for non-owner trader', async () => {
    orderRepository.findById.mockResolvedValue(mockOrder as never);

    await expect(
      service.cancelOrder('order-1', 'other-user', 'TRADER' as never),
    ).rejects.toThrow(ForbiddenException);
  });
});
