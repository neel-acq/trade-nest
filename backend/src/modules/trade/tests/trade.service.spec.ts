import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { OrderService } from '../../order/services/order.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { StockService } from '../../stock/services/stock.service';
import { TradeRepository } from '../repositories/trade.repository';
import { TradeService } from '../services/trade.service';

describe('TradeService', () => {
  let service: TradeService;
  let tradeRepository: jest.Mocked<
    Pick<TradeRepository, 'findManyPaginated' | 'findByTradeId' | 'findById'>
  >;
  let stockService: jest.Mocked<Pick<StockService, 'findBySymbol'>>;

  const mockTrade = {
    id: 'trade-1',
    tradeId: 'TRD-TEST-001',
    stockId: 'stock-1',
    buyOrderId: 'buy-1',
    sellOrderId: 'sell-1',
    quantity: 10,
    price: 100,
    executedAt: new Date(),
    isSystemGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    stock: { symbol: 'RELIANCE', companyName: 'Reliance' },
    buyOrder: {
      id: 'buy-1',
      userId: 'buyer',
      type: 'LIMIT_BUY',
      user: { username: 'trader_01', fullName: 'Trader One' },
    },
    sellOrder: {
      id: 'sell-1',
      userId: 'seller',
      type: 'LIMIT_SELL',
      user: { username: 'trader_02', fullName: 'Trader Two' },
    },
  };

  beforeEach(async () => {
    tradeRepository = {
      findManyPaginated: jest.fn(),
      findByTradeId: jest.fn(),
      findById: jest.fn(),
    };
    stockService = { findBySymbol: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeService,
        { provide: TradeRepository, useValue: tradeRepository },
        { provide: OrderService, useValue: {} },
        { provide: PortfolioService, useValue: {} },
        { provide: StockService, useValue: stockService },
        { provide: DomainEventBus, useValue: { publish: jest.fn() } },
      ],
    }).compile();

    service = module.get(TradeService);
  });

  it('lists trades for the authenticated user with side annotation', async () => {
    tradeRepository.findManyPaginated.mockResolvedValue({
      total: 1,
      trades: [mockTrade],
    });

    const result = await service.listTrades({}, 'buyer', UserRole.TRADER);

    expect(tradeRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'buyer' }),
    );
    expect(result.data[0].side).toBe('BUY');
    expect(result.data[0].tradeId).toBe('TRD-TEST-001');
  });

  it('allows admin to filter by userId', async () => {
    tradeRepository.findManyPaginated.mockResolvedValue({ total: 0, trades: [] });

    await service.listTrades({ userId: 'seller' }, 'admin', UserRole.ADMIN);

    expect(tradeRepository.findManyPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'seller' }),
    );
  });

  it('returns public trades for a stock symbol', async () => {
    stockService.findBySymbol.mockResolvedValue({
      id: 'stock-1',
      symbol: 'RELIANCE',
    } as never);
    tradeRepository.findManyPaginated.mockResolvedValue({
      total: 1,
      trades: [mockTrade],
    });

    const result = await service.listTradesBySymbol('RELIANCE', {});

    expect(result.data).toHaveLength(1);
    expect(result.data[0].symbol).toBe('RELIANCE');
  });

  it('denies trade detail for non-participants', async () => {
    tradeRepository.findByTradeId.mockResolvedValue(mockTrade);
    tradeRepository.findById.mockResolvedValue(null);

    await expect(
      service.getTradeById('TRD-TEST-001', 'other-user', UserRole.TRADER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns trade detail for participants', async () => {
    tradeRepository.findByTradeId.mockResolvedValue(mockTrade);

    const result = await service.getTradeById('TRD-TEST-001', 'seller', UserRole.TRADER);

    expect(result.side).toBe('SELL');
    expect(result.totalValue).toBe(1000);
  });

  it('throws when stock symbol not found', async () => {
    stockService.findBySymbol.mockResolvedValue(null);

    await expect(service.listTradesBySymbol('UNKNOWN', {})).rejects.toThrow(NotFoundException);
  });
});
