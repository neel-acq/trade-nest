import { Injectable } from '@nestjs/common';
import { LogType } from '@prisma/client';
import { UserService } from '../../user/services/user.service';
import { StockService } from '../../stock/services/stock.service';
import { WalletService } from '../../wallet/services/wallet.service';
import { OrderService } from '../../order/services/order.service';
import { TradeService } from '../../trade/services/trade.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { AuditService } from '../../audit/services/audit.service';
import { SystemService } from '../../system/services/system.service';
import { SEED_STOCKS } from '../../../../prisma/data/stocks.data';
import { SEED_USERS } from '../../../../prisma/data/users.data';
import { INITIAL_WALLET_BALANCE } from '../../../../prisma/data/constants';

@Injectable()
export class SeederService {
  constructor(
    private readonly userService: UserService,
    private readonly stockService: StockService,
    private readonly walletService: WalletService,
    private readonly orderService: OrderService,
    private readonly tradeService: TradeService,
    private readonly portfolioService: PortfolioService,
    private readonly auditService: AuditService,
    private readonly systemService: SystemService,
  ) {}

  getStatus() {
    return { module: 'seeder', status: 'active', phase: 3 };
  }

  seedUsers() {
    return this.userService.seedSystemUsers();
  }

  seedStocks() {
    return this.stockService.seedSystemStocks();
  }

  seedWallets() {
    return this.walletService.seedSystemWallets();
  }

  seedOrders() {
    return this.orderService.seedSystemOrders();
  }

  seedTrades() {
    return this.tradeService.seedSystemTrades();
  }

  async seedAll() {
    const users = await this.seedUsers();
    const stocks = await this.seedStocks();
    const wallets = await this.seedWallets();
    const orders = await this.seedOrders();
    const trades = await this.seedTrades();
    const priceHistory = await this.stockService.seedAllPriceHistory();
    const logs = await this.seedBootstrapLogs();

    return { users, stocks, wallets, orders, trades, priceHistory, logs };
  }

  async seedBootstrapLogs() {
    const existing = await this.auditService.listLogs({ page: 1, limit: 1 });
    if (existing.meta.total > 0) {
      return { created: 0, message: 'Logs already exist' };
    }

    const users = await this.userService.findSystemUsers();
    const admin = users.find((user) => user.username === 'admin_01');
    const trader = users.find((user) => user.username === 'trader_01');
    const stock = await this.stockService.findBySymbol('RELIANCE');

    await this.auditService.record({
      userId: admin?.id,
      action: 'PLATFORM_INITIALIZED',
      entityType: 'System',
      logType: LogType.INFO,
      metadata: { message: 'TradeNest demo environment bootstrapped' },
    });
    await this.auditService.record({
      userId: admin?.id,
      action: 'STOCKS_SEEDED',
      entityType: 'Stock',
      entityId: stock?.id,
      logType: LogType.AUDIT,
      metadata: { count: SEED_STOCKS.length },
    });
    await this.auditService.record({
      userId: trader?.id,
      action: 'WALLET_CREDITED',
      entityType: 'Wallet',
      entityId: trader?.id,
      logType: LogType.SUCCESS,
      metadata: { amount: INITIAL_WALLET_BALANCE, reason: 'Initial demo balance' },
    });
    await this.auditService.record({
      userId: trader?.id,
      action: 'TRADE_EXECUTED',
      entityType: 'Trade',
      entityId: 'TRD-SEED-0001',
      logType: LogType.SUCCESS,
      metadata: { symbol: 'RELIANCE', quantity: 10 },
    });

    await this.systemService.info(
      'TradeNest platform started successfully',
      'system.bootstrap',
      { version: '1.0.0' },
    );
    await this.systemService.info('Matching engine initialized', 'matching.engine');
    await this.systemService.info(
      'Demo stocks and wallets loaded',
      'seed.bootstrap',
      { stocks: SEED_STOCKS.length, users: SEED_USERS.length },
    );
    await this.systemService.record({
      message: 'WebSocket realtime gateway ready',
      context: 'realtime.gateway',
      logType: LogType.INFO,
    });

    return { created: 9, message: 'Bootstrap logs created' };
  }

  seedPriceHistory() {
    return this.stockService.seedAllPriceHistory();
  }

  async deleteTrades() {
    await this.portfolioService.deleteSystemHoldings();
    return this.tradeService.deleteSystemTrades();
  }

  async deleteOrders() {
    await this.deleteTrades();
    return this.orderService.deleteSystemOrders();
  }

  async deleteWallets() {
    return this.walletService.deleteSystemWallets();
  }

  async deleteStocks() {
    await this.deleteOrders();
    return this.stockService.deleteSystemStocks();
  }

  async deleteUsers() {
    await this.deleteWallets();
    return this.userService.deleteSystemUsers();
  }
}
