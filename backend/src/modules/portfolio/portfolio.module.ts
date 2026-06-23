import { Module } from '@nestjs/common';
import { PortfolioController } from './controllers/portfolio.controller';
import { PortfolioService } from './services/portfolio.service';
import { PortfolioRepository } from './repositories/portfolio.repository';
import { StockModule } from '../stock/stock.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [StockModule, UserModule],
  controllers: [PortfolioController],
  providers: [PortfolioService, PortfolioRepository],
  exports: [PortfolioService],
})
export class PortfolioModule {}
