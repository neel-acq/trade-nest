import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { WalletModule } from '../wallet/wallet.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { OrderModule } from '../order/order.module';
import { TradeModule } from '../trade/trade.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [WalletModule, PortfolioModule, OrderModule, TradeModule, UserModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
