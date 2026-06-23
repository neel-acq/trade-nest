import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../../order/services/order.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { TradeService } from '../../trade/services/trade.service';
import { UserService } from '../../user/services/user.service';
import { WalletService } from '../../wallet/services/wallet.service';
import { DashboardService } from '../services/dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const walletService = {
    getMyWallet: jest.fn().mockResolvedValue({
      balance: 900000,
      lockedBalance: 50000,
      availableBalance: 850000,
    }),
  };

  const portfolioService = {
    getMySummary: jest.fn().mockResolvedValue({
      holdingsCount: 2,
      totalInvested: 100000,
      totalCurrentValue: 110000,
      totalUnrealizedPnL: 10000,
      totalRealizedPnL: 2000,
      totalPnL: 12000,
      totalPnLPercent: 12,
    }),
    listHoldings: jest.fn().mockResolvedValue({
      data: [
        {
          symbol: 'RELIANCE',
          companyName: 'Reliance',
          currentValue: 70000,
        },
        {
          symbol: 'TCS',
          companyName: 'TCS',
          currentValue: 40000,
        },
      ],
      meta: { total: 2, page: 1, limit: 5, totalPages: 1 },
    }),
  };

  const orderService = {
    getOrderStats: jest.fn().mockResolvedValue({
      open: 1,
      partial: 0,
      filled: 3,
      cancelled: 1,
      rejected: 0,
      total: 5,
    }),
    getRecentOrders: jest.fn().mockResolvedValue([]),
    getPlatformOrderStats: jest.fn().mockResolvedValue({ totalOrders: 100 }),
  };

  const tradeService = {
    getTradeStats: jest.fn().mockResolvedValue({ totalTrades: 4, totalTurnover: 250000 }),
    getRecentTrades: jest.fn().mockResolvedValue([]),
    getPlatformTradeStats: jest.fn().mockResolvedValue({ totalTrades: 50, totalTurnover: 5000000 }),
    getRecentPlatformTrades: jest.fn().mockResolvedValue([]),
  };

  const userService = {
    getPlatformUserStats: jest.fn().mockResolvedValue({ total: 62, traders: 60, admins: 2 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: WalletService, useValue: walletService },
        { provide: PortfolioService, useValue: portfolioService },
        { provide: OrderService, useValue: orderService },
        { provide: TradeService, useValue: tradeService },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('aggregates trader dashboard overview', async () => {
    const overview = await service.getTraderOverview('user-1');

    expect(overview.netWorth).toBe(1010000);
    expect(overview.orders.total).toBe(5);
    expect(overview.trades.totalTrades).toBe(4);
    expect(overview.allocation).toHaveLength(2);
    expect(overview.allocation[0].weight).toBeCloseTo(63.64, 1);
    expect(overview.topHoldings).toHaveLength(2);
  });

  it('aggregates admin dashboard overview', async () => {
    const overview = await service.getAdminOverview();

    expect(overview.users.total).toBe(62);
    expect(overview.platform.totalOrders).toBe(100);
    expect(overview.platform.totalTrades).toBe(50);
  });
});
