import { Module } from '@nestjs/common';
import { TradeController } from './controllers/trade.controller';
import { TradeService } from './services/trade.service';
import { TradeRepository } from './repositories/trade.repository';
import { OrderModule } from '../order/order.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [OrderModule, PortfolioModule, StockModule],
  controllers: [TradeController],
  providers: [TradeService, TradeRepository],
  exports: [TradeService, TradeRepository],
})
export class TradeModule {}
