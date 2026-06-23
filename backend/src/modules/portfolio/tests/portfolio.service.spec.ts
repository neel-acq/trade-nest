import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { StockService } from '../../stock/services/stock.service';
import { UserService } from '../../user/services/user.service';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { PortfolioService } from '../services/portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let portfolioRepository: jest.Mocked<
    Pick<
      PortfolioRepository,
      'findAllByUserId' | 'findManyPaginated' | 'findHolding'
    >
  >;
  let stockService: jest.Mocked<Pick<StockService, 'getStockBySymbol'>>;
  let userService: jest.Mocked<Pick<UserService, 'findById'>>;

  const mockHolding = {
    id: 'holding-1',
    userId: 'user-1',
    stockId: 'stock-1',
    quantity: 10,
    averageBuyPrice: 100,
    investedAmount: 1000,
    realizedPnL: 50,
    isSystemGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: null,
    updatedBy: null,
    stock: {
      symbol: 'RELIANCE',
      companyName: 'Reliance',
      currentPrice: 110,
    },
  };

  beforeEach(async () => {
    portfolioRepository = {
      findAllByUserId: jest.fn(),
      findManyPaginated: jest.fn(),
      findHolding: jest.fn(),
    };
    stockService = { getStockBySymbol: jest.fn() };
    userService = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: PortfolioRepository, useValue: portfolioRepository },
        { provide: StockService, useValue: stockService },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get(PortfolioService);
  });

  it('builds portfolio summary with unrealized and realized PnL', async () => {
    portfolioRepository.findAllByUserId.mockResolvedValue([mockHolding]);

    const summary = await service.getMySummary('user-1');

    expect(summary.holdingsCount).toBe(1);
    expect(summary.totalInvested).toBe(1000);
    expect(summary.totalCurrentValue).toBe(1100);
    expect(summary.totalUnrealizedPnL).toBe(100);
    expect(summary.totalRealizedPnL).toBe(50);
    expect(summary.totalPnL).toBe(150);
  });

  it('returns holding by symbol', async () => {
    stockService.getStockBySymbol.mockResolvedValue({
      id: 'stock-1',
      symbol: 'RELIANCE',
      currentPrice: 110,
    } as never);
    portfolioRepository.findHolding.mockResolvedValue(mockHolding);

    const holding = await service.getHoldingBySymbol('user-1', 'RELIANCE', UserRole.TRADER);

    expect(holding.symbol).toBe('RELIANCE');
    expect(holding.currentValue).toBe(1100);
    expect(holding.unrealizedPnL).toBe(100);
  });

  it('throws when holding not found', async () => {
    stockService.getStockBySymbol.mockResolvedValue({
      id: 'stock-1',
      symbol: 'RELIANCE',
      currentPrice: 110,
    } as never);
    portfolioRepository.findHolding.mockResolvedValue(null);

    await expect(
      service.getHoldingBySymbol('user-1', 'RELIANCE', UserRole.TRADER),
    ).rejects.toThrow(NotFoundException);
  });

  it('denies traders from viewing another user portfolio', async () => {
    await expect(
      service.listHoldings('user-1', {}, UserRole.TRADER, 'user-2'),
    ).rejects.toThrow(ForbiddenException);
  });
});
