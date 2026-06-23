import { Module } from '@nestjs/common';
import { StockController } from './controllers/stock.controller';
import { StockService } from './services/stock.service';
import { StockRepository } from './repositories/stock.repository';

@Module({
  controllers: [StockController],
  providers: [StockService, StockRepository, StockPriceHistoryRepository],
  exports: [StockService],
})
export class StockModule {}
