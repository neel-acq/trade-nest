import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OrderService } from '../../order/services/order.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { TradeService } from '../../trade/services/trade.service';
import { UserService } from '../../user/services/user.service';
import { WalletService } from '../../wallet/services/wallet.service';
import {
  AdminDashboardOverview,
  AllocationSlice,
  TraderDashboardOverview,
} from '../entities/dashboard.entity';

@Injectable()
export class DashboardService {
  constructor(
    private readonly walletService: WalletService,
    private readonly portfolioService: PortfolioService,
    private readonly orderService: OrderService,
    private readonly tradeService: TradeService,
    private readonly userService: UserService,
  ) {}

  getStatus() {
    return { module: 'dashboard', status: 'active', phase: 11 };
  }

  async getTraderOverview(userId: string): Promise<TraderDashboardOverview> {
    const [wallet, portfolio, orders, trades, recentOrders, recentTrades, holdingsResult] =
      await Promise.all([
        this.walletService.getMyWallet(userId),
        this.portfolioService.getMySummary(userId),
        this.orderService.getOrderStats(userId),
        this.tradeService.getTradeStats(userId),
        this.orderService.getRecentOrders(userId, 5),
        this.tradeService.getRecentTrades(userId, 5),
        this.portfolioService.listHoldings(
          userId,
          { page: 1, limit: 100, sortBy: 'currentValue', sortOrder: 'desc' },
          UserRole.TRADER,
        ),
      ]);

    const allHoldings = holdingsResult.data;
    const topHoldings = allHoldings.slice(0, 5);
    const allocation = this.buildAllocation(allHoldings, portfolio.totalCurrentValue);
    const netWorth = Number((wallet.balance + portfolio.totalCurrentValue).toFixed(2));

    return {
      wallet,
      portfolio,
      netWorth,
      orders,
      trades,
      topHoldings,
      allocation,
      recentOrders,
      recentTrades,
    };
  }

  async getAdminOverview(): Promise<AdminDashboardOverview> {
    const [users, orderStats, tradeStats, recentTrades] = await Promise.all([
      this.userService.getPlatformUserStats(),
      this.orderService.getPlatformOrderStats(),
      this.tradeService.getPlatformTradeStats(),
      this.tradeService.getRecentPlatformTrades(10),
    ]);

    return {
      users,
      platform: {
        totalOrders: orderStats.totalOrders,
        totalTrades: tradeStats.totalTrades,
        totalTurnover: tradeStats.totalTurnover,
      },
      recentTrades,
    };
  }

  private buildAllocation(
    holdings: { symbol: string; companyName: string; currentValue: number }[],
    totalCurrentValue: number,
  ): AllocationSlice[] {
    if (totalCurrentValue <= 0 || holdings.length === 0) {
      return [];
    }

    return holdings.map((holding) => ({
      symbol: holding.symbol,
      companyName: holding.companyName,
      currentValue: holding.currentValue,
      weight: Number(((holding.currentValue / totalCurrentValue) * 100).toFixed(2)),
    }));
  }
}
