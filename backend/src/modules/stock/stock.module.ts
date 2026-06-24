import { Module } from '@nestjs/common';
import { StockController } from './controllers/stock.controller';
import { StockService } from './services/stock.service';
import { StockRepository } from './repositories/stock.repository';
import { StockPriceHistoryRepository } from './repositories/stock-price-history.repository';

@Module({
  controllers: [StockController],
  providers: [StockService, StockRepository, StockPriceHistoryRepository],
  exports: [StockService],
})
export class StockModule {}
