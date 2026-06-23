import { Module } from '@nestjs/common';
import { MatchingController } from './controllers/matching.controller';
import { OrderCreatedMatchingListener } from './listeners/order-created.listener';
import { MatchingEngineService } from './services/matching-engine.service';
import { OrderBookService } from './services/order-book.service';
import { OrderModule } from '../order/order.module';
import { TradeModule } from '../trade/trade.module';
import { WalletModule } from '../wallet/wallet.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [OrderModule, TradeModule, WalletModule, PortfolioModule, StockModule],
  controllers: [MatchingController],
  providers: [MatchingEngineService, OrderBookService, OrderCreatedMatchingListener],
  exports: [MatchingEngineService, OrderBookService],
})
export class MatchingModule {}
