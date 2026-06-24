import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, OrderType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
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
      | 'findById'
      | 'findOpenOrdersByStock'
      | 'updateFill'
    >
  >;
  let tradeRepository: jest.Mocked<Pick<TradeRepository, 'create'>>;
  let walletService: jest.Mocked<Pick<WalletService, 'settleBuy' | 'credit' | 'unlockFunds'>>;
  let portfolioService: jest.Mocked<
    Pick<PortfolioService, 'getHoldingQuantity' | 'applyBuyTrade' | 'applySellTrade'>
  >;
  let stockService: jest.Mocked<Pick<StockService, 'recordTrade' | 'getAllStocks' | 'getStockById'>>;
  let eventBus: jest.Mocked<Pick<DomainEventBus, 'publish'>>;

  const stock1 = { id: 'stock-1', symbol: 'TEST' };

  const buyOrder = {
    id: 'buy-1',
    userId: 'buyer',
    stockId: 'stock-1',
    type: OrderType.LIMIT_BUY,
    status: OrderStatus.OPEN,
    quantity: 10,
    filledQuantity: 0,
    price: new Decimal(100),
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
    price: new Decimal(95),
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
      findById: jest.fn(),
      findOpenOrdersByStock: jest.fn(),
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
    stockService = { 
        recordTrade: jest.fn().mockResolvedValue({}),
        getAllStocks: jest.fn().mockResolvedValue([stock1]),
        getStockById: jest.fn().mockResolvedValue(stock1)
    };
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
    orderRepository.findOpenOrdersByStock.mockResolvedValue([sellOrder as any]);
    await service.onModuleInit();

    orderRepository.findByIdForUpdate
      .mockResolvedValueOnce(buyOrder as any) // The incoming order
      .mockResolvedValueOnce(sellOrder as any); // During persist trade (sell)
      
    orderRepository.updateFill.mockResolvedValue(buyOrder as any);

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
    expect(walletService.unlockFunds).toHaveBeenCalledWith('buyer', 50, expect.any(String)); // price improvement 100 - 95 = 5 * 10 = 50
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(TradeExecutedEvent));
  });

  it('does not match when buy limit is below sell limit', async () => {
    orderRepository.findOpenOrdersByStock.mockResolvedValue([sellOrder as any]);
    await service.onModuleInit();

    const lowBuy = { ...buyOrder, price: new Decimal(90) };
    orderRepository.findByIdForUpdate.mockResolvedValue(lowBuy as any);

    const result = await service.processOrder('buy-1');

    expect(result.tradesExecuted).toBe(0);
    expect(tradeRepository.create).not.toHaveBeenCalled();
  });

  it('skips self-trade between same user', async () => {
    const selfSell = { ...sellOrder, userId: 'buyer' };
    orderRepository.findOpenOrdersByStock.mockResolvedValue([selfSell as any]);
    await service.onModuleInit();

    orderRepository.findByIdForUpdate.mockResolvedValue(buyOrder as any);

    const result = await service.processOrder('buy-1');

    expect(result.tradesExecuted).toBe(0);
    expect(tradeRepository.create).not.toHaveBeenCalled();
  });
});
