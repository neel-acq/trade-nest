import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../user/services/user.service';
import { StockService } from '../../stock/services/stock.service';
import { WalletService } from '../../wallet/services/wallet.service';
import { OrderService } from '../../order/services/order.service';
import { TradeService } from '../../trade/services/trade.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { SeederService } from '../services/seeder.service';

describe('SeederService idempotency', () => {
  let seederService: SeederService;
  let userService: jest.Mocked<Pick<UserService, 'seedSystemUsers' | 'deleteSystemUsers'>>;
  let stockService: jest.Mocked<Pick<StockService, 'seedSystemStocks' | 'deleteSystemStocks'>>;
  let walletService: jest.Mocked<Pick<WalletService, 'seedSystemWallets' | 'deleteSystemWallets'>>;
  let orderService: jest.Mocked<
    Pick<OrderService, 'seedSystemOrders' | 'deleteSystemOrders'>
  >;
  let tradeService: jest.Mocked<Pick<TradeService, 'seedSystemTrades' | 'deleteSystemTrades'>>;
  let portfolioService: jest.Mocked<Pick<PortfolioService, 'deleteSystemHoldings'>>;

  beforeEach(async () => {
    userService = {
      seedSystemUsers: jest.fn().mockResolvedValue({ created: 0, skipped: 62 }),
      deleteSystemUsers: jest.fn().mockResolvedValue({ deleted: 62 }),
    };
    stockService = {
      seedSystemStocks: jest.fn().mockResolvedValue({ created: 0, skipped: 55 }),
      deleteSystemStocks: jest.fn().mockResolvedValue({ deleted: 55 }),
    };
    walletService = {
      seedSystemWallets: jest.fn().mockResolvedValue({ created: 0, skipped: 62 }),
      deleteSystemWallets: jest.fn().mockResolvedValue({ deleted: 62 }),
    };
    orderService = {
      seedSystemOrders: jest.fn().mockResolvedValue({ created: 0, skipped: 2 }),
      deleteSystemOrders: jest.fn().mockResolvedValue({ deleted: 2 }),
    };
    tradeService = {
      seedSystemTrades: jest.fn().mockResolvedValue({ created: 0, skipped: 1 }),
      deleteSystemTrades: jest.fn().mockResolvedValue({ deleted: 1 }),
    };
    portfolioService = {
      deleteSystemHoldings: jest.fn().mockResolvedValue({ deleted: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeederService,
        { provide: UserService, useValue: userService },
        { provide: StockService, useValue: stockService },
        { provide: WalletService, useValue: walletService },
        { provide: OrderService, useValue: orderService },
        { provide: TradeService, useValue: tradeService },
        { provide: PortfolioService, useValue: portfolioService },
      ],
    }).compile();

    seederService = module.get(SeederService);
  });

  it('delegates seedAll to module services in order', async () => {
    const result = await seederService.seedAll();

    expect(userService.seedSystemUsers).toHaveBeenCalled();
    expect(stockService.seedSystemStocks).toHaveBeenCalled();
    expect(walletService.seedSystemWallets).toHaveBeenCalled();
    expect(orderService.seedSystemOrders).toHaveBeenCalled();
    expect(tradeService.seedSystemTrades).toHaveBeenCalled();
    expect(result.users.skipped).toBe(62);
  });

  it('deletes users after wallets only', async () => {
    await seederService.deleteUsers();

    expect(walletService.deleteSystemWallets).toHaveBeenCalled();
    expect(userService.deleteSystemUsers).toHaveBeenCalled();
    expect(tradeService.deleteSystemTrades).not.toHaveBeenCalled();
  });
});
