import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/services/user.service';
import { StockService } from '../../stock/services/stock.service';
import { WalletService } from '../../wallet/services/wallet.service';
import { OrderService } from '../../order/services/order.service';
import { TradeService } from '../../trade/services/trade.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';

@Injectable()
export class SeederService {
  constructor(
    private readonly userService: UserService,
    private readonly stockService: StockService,
    private readonly walletService: WalletService,
    private readonly orderService: OrderService,
    private readonly tradeService: TradeService,
    private readonly portfolioService: PortfolioService,
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

    return { users, stocks, wallets, orders, trades };
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
