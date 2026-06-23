import { Module } from '@nestjs/common';
import { SeederController } from './controllers/seeder.controller';
import { SeederService } from './services/seeder.service';
import { UserModule } from '../user/user.module';
import { StockModule } from '../stock/stock.module';
import { WalletModule } from '../wallet/wallet.module';
import { OrderModule } from '../order/order.module';
import { TradeModule } from '../trade/trade.module';
import { PortfolioModule } from '../portfolio/portfolio.module';

@Module({
  imports: [UserModule, StockModule, WalletModule, OrderModule, TradeModule, PortfolioModule],
  controllers: [SeederController],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
