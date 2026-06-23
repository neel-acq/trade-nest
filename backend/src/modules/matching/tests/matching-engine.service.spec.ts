import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, OrderType } from '@prisma/client';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { OrderRepository } from '../../order/repositories/order.repository';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { StockService } from '../../stock/services/stock.service';
import { TradeExecutedEvent } from '../../trade/events/trade-executed.event';
import { TradeRepository } from '../../trade/repositories/trade.repository';
import { WalletService } from '../../wallet/services/wallet.service';
import { MatchingEngineService } from '../services/matching-engine.service';

describe('MatchingEngineService', () => {
  let service: MatchingEngineService;
  let orderRepository: jest.Mocked<
    Pick<
      OrderRepository,
      | 'findByIdForUpdate'
      | 'findOpenSellOrders'
      | 'findOpenBuyOrders'
      | 'updateFill'
    >
  >;
  let tradeRepository: jest.Mocked<Pick<TradeRepository, 'create'>>;
  let walletService: jest.Mocked<Pick<WalletService, 'settleBuy' | 'credit' | 'unlockFunds'>>;
  let portfolioService: jest.Mocked<
    Pick<PortfolioService, 'getHoldingQuantity' | 'applyBuyTrade' | 'applySellTrade'>
  >;
  let stockService: jest.Mocked<Pick<StockService, 'recordTrade'>>;
  let eventBus: jest.Mocked<Pick<DomainEventBus, 'publish'>>;

  const buyOrder = {
    id: 'buy-1',
    userId: 'buyer',
    stockId: 'stock-1',
    type: OrderType.LIMIT_BUY,
    status: OrderStatus.OPEN,
    quantity: 10,
    filledQuantity: 0,
    price: 100,
    isSystemGenerated: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  const sellOrder = {
    id: 'sell-1',
    userId: 'seller',
    stockId: 'stock-1',
    type: OrderType.LIMIT_SELL,
    status: OrderStatus.OPEN,
    quantity: 10,
    filledQuantity: 0,
    price: 95,
    isSystemGenerated: false,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(async () => {
    orderRepository = {
      findByIdForUpdate: jest.fn(),
      findOpenSellOrders: jest.fn(),
      findOpenBuyOrders: jest.fn(),
      updateFill: jest.fn(),
    };
    tradeRepository = { create: jest.fn().mockResolvedValue({ tradeId: 'TRD-TEST' }) };
    walletService = {
      settleBuy: jest.fn().mockResolvedValue({}),
      credit: jest.fn().mockResolvedValue({}),
      unlockFunds: jest.fn().mockResolvedValue({}),
    };
    portfolioService = {
      getHoldingQuantity: jest.fn().mockResolvedValue(100),
      applyBuyTrade: jest.fn().mockResolvedValue({}),
      applySellTrade: jest.fn().mockResolvedValue({}),
    };
    stockService = { recordTrade: jest.fn().mockResolvedValue({}) };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingEngineService,
        { provide: OrderRepository, useValue: orderRepository },
        { provide: TradeRepository, useValue: tradeRepository },
        { provide: WalletService, useValue: walletService },
        { provide: PortfolioService, useValue: portfolioService },
        { provide: StockService, useValue: stockService },
        { provide: DomainEventBus, useValue: eventBus },
      ],
    }).compile();

    service = module.get(MatchingEngineService);
  });

  it('matches incoming buy with resting sell at sell price (price-time priority)', async () => {
    orderRepository.findByIdForUpdate
      .mockResolvedValueOnce(buyOrder)
      .mockResolvedValueOnce(buyOrder)
      .mockResolvedValueOnce(sellOrder);
    orderRepository.findOpenSellOrders.mockResolvedValue([sellOrder]);
    orderRepository.updateFill.mockResolvedValue(buyOrder);

    const result = await service.processOrder('buy-1');

    expect(result.tradesExecuted).toBe(1);
    expect(result.totalQuantityFilled).toBe(10);
    expect(tradeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        buyOrderId: 'buy-1',
        sellOrderId: 'sell-1',
        quantity: 10,
        price: 95,
      }),
    );
    expect(walletService.settleBuy).toHaveBeenCalledWith('buyer', 950, expect.any(String));
    expect(walletService.credit).toHaveBeenCalledWith('seller', 950, expect.any(String));
    expect(walletService.unlockFunds).toHaveBeenCalledWith('buyer', 50, expect.any(String));
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(TradeExecutedEvent));
  });

  it('does not match when buy limit is below sell limit', async () => {
    const lowBuy = { ...buyOrder, price: 90 };
    orderRepository.findByIdForUpdate.mockResolvedValue(lowBuy);
    orderRepository.findOpenSellOrders.mockResolvedValue([sellOrder]);

    const result = await service.processOrder('buy-1');

    expect(result.tradesExecuted).toBe(0);
    expect(tradeRepository.create).not.toHaveBeenCalled();
  });

  it('skips self-trade between same user', async () => {
    const selfSell = { ...sellOrder, userId: 'buyer' };
    orderRepository.findByIdForUpdate
      .mockResolvedValueOnce(buyOrder)
      .mockResolvedValueOnce(buyOrder);
    orderRepository.findOpenSellOrders.mockResolvedValue([selfSell]);

    const result = await service.processOrder('buy-1');

    expect(result.tradesExecuted).toBe(0);
    expect(tradeRepository.create).not.toHaveBeenCalled();
  });
});
